"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Comments = void 0;
const succses_response_1 = require("../../utils/response/succses.response");
const repository_1 = require("../../DataBase/repository");
const models_1 = require("../../DataBase/models");
const error_response_1 = require("../../utils/response/error.response");
const _003_posts_1 = require("../003-posts");
const s3_config_1 = require("../../utils/multer/s3.config");
class Comments {
    userModel = new repository_1.UserRepository(models_1.UserModel);
    postModel = new repository_1.PostRepository(models_1.PostModel);
    commentModel = new repository_1.CommentRepository(models_1.CommentModel);
    constructor() { }
    createComment = async (req, res) => {
        const { tags, attachment } = req.body;
        const postId = req.params.postId;
        const post = await this.postModel.findOne({
            filter: {
                _id: postId,
                allowcomments: models_1.AllowCommentsEnum.allow,
                $or: (0, _003_posts_1.postAvailability)(req)
            }
        });
        if (!post) {
            throw new error_response_1.NotFoundException("Post Not Found Or Cannot Create Comment");
        }
        if (tags?.length && (await this.userModel.find({
            filter: {
                _id: { $in: tags }
            }
        })).data.length !== tags.length) {
            throw new error_response_1.NotFoundException("Some Mentions Users Not Exist");
        }
        if (tags?.includes(req.tokenDecoded?._id)) {
            throw new error_response_1.BadRequestException("User Cannot Mention Himself");
        }
        let attachmentKey = "";
        if (attachment) {
            attachmentKey = await (0, s3_config_1.uploadFile)({
                file: attachment,
                path: `users/${post.createdBy}/posts/comments/${post.assetsFolderId}`
            });
        }
        const [comment] = await this.commentModel.create({
            data: [{
                    flag: models_1.CommentFlagEnum.comment,
                    ...req.body,
                    postId,
                    attachment: attachmentKey,
                    createdBy: req.tokenDecoded?._id
                }]
        }) || [];
        if (!comment) {
            if (attachment) {
                await (0, s3_config_1.deleteFile)({ Key: attachmentKey });
            }
            throw new error_response_1.BadRequestException("Fail To Create Comment");
        }
        return (0, succses_response_1.succsesResponse)({
            res, statusCode: 201,
            info: "Comment Created Succses",
            data: { commentId: comment._id }
        });
    };
    replyOnComment = async (req, res) => {
        const { tags, attachment } = req.body;
        const { postId, commentId } = req.params;
        const comment = await this.commentModel.findOne({
            filter: {
                _id: commentId,
            },
            options: {
                populate: [
                    {
                        path: "postId", match: {
                            $or: (0, _003_posts_1.postAvailability)(req),
                            allowcomments: models_1.AllowCommentsEnum.allow
                        }
                    }
                ]
            }
        });
        if (!comment?.postId) {
            throw new error_response_1.NotFoundException("Comment Not Found");
        }
        if (tags?.length && (await this.userModel.find({
            filter: {
                _id: { $in: tags }
            }
        })).data.length !== tags.length) {
            throw new error_response_1.NotFoundException("Some Mentions Users Not Exist");
        }
        if (tags?.includes(req.tokenDecoded?._id)) {
            throw new error_response_1.BadRequestException("User Cannot Mention Himself");
        }
        let attachmentKey = "";
        const post = comment.postId;
        if (attachment) {
            attachmentKey = await (0, s3_config_1.uploadFile)({
                file: attachment,
                path: `users/${post.createdBy}/posts/comments/${post.assetsFolderId}`
            });
        }
        const [reply] = await this.commentModel.create({
            data: [{
                    ...req.body,
                    flag: models_1.CommentFlagEnum.reply,
                    postId,
                    commentId,
                    attachment: attachmentKey,
                    createdBy: req.tokenDecoded?._id
                }]
        }) || [];
        if (!reply) {
            if (attachment) {
                await (0, s3_config_1.deleteFile)({ Key: attachmentKey });
            }
            throw new error_response_1.BadRequestException("Fail To Create Comment");
        }
        return (0, succses_response_1.succsesResponse)({
            res, statusCode: 201,
            info: "Replyed Succses",
            data: { replyId: reply._id }
        });
    };
}
exports.Comments = Comments;
