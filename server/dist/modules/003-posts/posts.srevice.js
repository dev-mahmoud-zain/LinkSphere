"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostService = exports.postAvailability = void 0;
const succses_response_1 = require("../../utils/response/succses.response");
const repository_1 = require("../../DataBase/repository");
const post_model_1 = require("../../DataBase/models/post.model");
const user_model_1 = require("../../DataBase/models/user.model");
const error_response_1 = require("../../utils/response/error.response");
const uuid_1 = require("uuid");
const s3_config_1 = require("../../utils/multer/s3.config");
const mongoose_1 = require("mongoose");
const postAvailability = (req) => {
    return [
        { availability: post_model_1.AvailabilityEnum.public },
        { availability: post_model_1.AvailabilityEnum.onlyMe, createdBy: req.user?._id },
        {
            availability: post_model_1.AvailabilityEnum.friends,
            createdBy: { $in: [...(req.user?.friends || []), req.user?._id] }
        },
        {
            availability: { $ne: post_model_1.AvailabilityEnum.onlyMe },
            tags: { $in: req.user?._id }
        }
    ];
};
exports.postAvailability = postAvailability;
class PostService {
    postModel = new repository_1.PostRepository(post_model_1.PostModel);
    userModel = new repository_1.UserRepository(user_model_1.UserModel);
    constructor() { }
    createPost = async (req, res) => {
        const { tags, attachments } = req.body;
        const userId = req.tokenDecoded?._id;
        if (tags?.length && (await this.userModel.find({
            filter: {
                _id: { $in: tags }
            }
        })).data.length !== tags.length) {
            throw new error_response_1.NotFoundException("Some Mentions Users Not Exist");
        }
        if (tags?.includes(userId)) {
            throw new error_response_1.BadRequestException("User Cannot Mention Himself");
        }
        let attachmentsKeys = [];
        const assetsFolderId = (0, uuid_1.v4)();
        if (attachments?.length) {
            attachmentsKeys = await (0, s3_config_1.uploadFiles)({
                files: attachments,
                path: `users/${userId}/posts/${assetsFolderId}`
            });
        }
        const [post] = await this.postModel.create({
            data: [{
                    ...req.body,
                    attachments: attachmentsKeys,
                    assetsFolderId,
                    createdBy: userId
                }]
        }) || [];
        if (!post) {
            if (attachments?.length) {
                await (0, s3_config_1.deleteFiles)({ urls: attachmentsKeys });
            }
            throw new error_response_1.BadRequestException("Fail To Create Post");
        }
        return (0, succses_response_1.succsesResponse)({
            res, statusCode: 201,
            info: "Post Created Succses", data: {
                postId: post._id
            }
        });
    };
    updatePost = async (req, res) => {
        const postId = req.params.postId;
        const userId = req.tokenDecoded?._id;
        const post = await this.postModel.findOne({
            filter: {
                _id: postId,
                createdBy: userId
            }
        });
        if (!post) {
            throw new error_response_1.NotFoundException("Post Not Found");
        }
        let duplicatedData = [];
        if (req.body.availability && req.body.availability === post.availability) {
            duplicatedData.push({
                path: "availability", data: post.availability
            });
        }
        if (req.body.content && req.body.content === post.content) {
            duplicatedData.push({
                path: "content", data: post.content
            });
        }
        if (duplicatedData.length) {
            throw new error_response_1.BadRequestException("Some Duplicated Data In Update Request", {
                issues: duplicatedData
            });
        }
        if (req.body.tags) {
            if ((await this.userModel.find({
                filter: { _id: { $in: req.body.tags } }
            })).data.length !== req.body.tags.length)
                throw new error_response_1.BadRequestException("Some Tagged Users Are Not Exists");
            if (req.body.tags.includes(req.user?._id.toString()))
                throw new error_response_1.BadRequestException("Post Createor Cannot Mention Himself");
            if ((req.body.removedTags && (req.body.tags.length - req.body.removedTags.length) > 10)
                || (req.body.tags.length > 10)) {
                throw new error_response_1.BadRequestException("Cannot Mention More Than 10 Users In Post");
            }
        }
        let attachmentsKeys = [];
        if (req.body.attachments?.length) {
            if (!req.body.removedAttachments?.length) {
                throw new error_response_1.BadRequestException("Cannot Add New Attachments Without Removing Existing Ones");
            }
            let notExsitsKeys = [];
            req.body.removedAttachments.forEach((key, index) => {
                if (!post.attachments?.includes(key)) {
                    notExsitsKeys.push({ index, key });
                }
            });
            if (notExsitsKeys.length) {
                throw new error_response_1.BadRequestException("Wrong Attachments Keys", {
                    issues: {
                        path: "removedAttachments",
                        notExsitsKeys
                    }
                });
            }
            attachmentsKeys = await (0, s3_config_1.uploadFiles)({
                files: req.files,
                path: `users/${userId}/posts/${post.assetsFolderId}`
            });
        }
        const updatedPost = await this.postModel.updateOne({
            _id: postId,
        }, [
            {
                $set: {
                    content: req.body.content || post.content,
                    allowComments: req.body.allowComments || post.allowComments,
                    availability: req.body.availability || post.availability,
                    attachments: {
                        $setUnion: [
                            {
                                $setDifference: ["$attachments", req.body.removedAttachments || []],
                            },
                            attachmentsKeys
                        ]
                    },
                    tags: {
                        $setUnion: [
                            {
                                $setDifference: ["$tags", (req.body.removedTags || []).map((tag) => {
                                        return mongoose_1.Types.ObjectId.createFromHexString(tag);
                                    })],
                            },
                            (req.body.tags || []).map((tag) => {
                                return mongoose_1.Types.ObjectId.createFromHexString(tag);
                            })
                        ]
                    }
                }
            }
        ]);
        if (!updatedPost) {
            if (attachmentsKeys.length) {
                await (0, s3_config_1.deleteFiles)({ urls: attachmentsKeys });
            }
            throw new error_response_1.BadRequestException("Fail To Update Post");
        }
        else {
            if (req.body.removedAttachments) {
                await (0, s3_config_1.deleteFiles)({ urls: req.body.removedAttachments });
            }
        }
        return (0, succses_response_1.succsesResponse)({
            res, statusCode: 200,
            info: "Post Updated Succses"
        });
    };
    getPosts = async (req, res) => {
        let { page, limit } = req.query;
        const posts = await this.postModel.find({
            filter: {
                $or: (0, exports.postAvailability)(req)
            },
            page: page,
            limit
        });
        return (0, succses_response_1.succsesResponse)({
            res,
            data: {
                ...(page && posts.pagination),
                count: posts.data.length,
                posts: posts.data,
            }
        });
    };
    getPost = async (req, res) => {
        const post = await this.postModel.findOne({
            filter: {
                _id: req.params.postId
            }
        });
        if (!post) {
            throw new error_response_1.NotFoundException("Post Not Found!");
        }
        return (0, succses_response_1.succsesResponse)({
            res,
            data: {
                post
            }
        });
    };
    likePost = async (req, res) => {
        const { postId } = req.params;
        const userId = req.tokenDecoded?._id;
        const post = await this.postModel.findOne({
            filter: {
                _id: postId,
                $or: (0, exports.postAvailability)(req)
            }
        });
        if (!post) {
            throw new error_response_1.NotFoundException("Post Not Found!");
        }
        let updateData = {};
        let message = "";
        if (post.likes?.includes(userId)) {
            updateData = { $pull: { likes: userId } };
            message = "Post Unliked Succses";
        }
        else {
            updateData = { $addToSet: { likes: userId } };
            message = "Post liked Succses";
        }
        await this.postModel.findOneAndUpdate({
            filter: {
                _id: postId
            }, updateData
        });
        return (0, succses_response_1.succsesResponse)({
            res,
            message
        });
    };
}
exports.PostService = PostService;
