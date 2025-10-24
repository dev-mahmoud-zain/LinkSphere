import { Request, Response } from "express";
import { successResponse } from "../../utils/response/success.response";
import { CommentRepository, PostRepository, UserRepository } from "../../DataBase/repository";
import { AvailabilityEnum, HPostDocument, PostModel } from "../../DataBase/models/post.model";
import { UserModel } from "../../DataBase/models/user.model";
import { BadRequestException, NotFoundException } from "../../utils/response/error.response";
import { I_CreatePostInputs } from "./dto/posts.dto";
import { v4 as uuid } from "uuid";
import { deleteFiles, deleteFolderByPrefix, uploadFiles } from "../../utils/multer/s3.config";
import { Types } from "mongoose";
import { CommentFlagEnum, CommentModel } from "../../DataBase/models";
import { connectedSockets, getIo } from "../005-gateway";

export const postAvailability = (req: Request) => {
    return [
        { availability: AvailabilityEnum.public },
        { availability: AvailabilityEnum.onlyMe, createdBy: req.user?._id },
        {
            availability: AvailabilityEnum.friends,
            createdBy: { $in: [...(req.user?.friends || []), req.user?._id] }
        },
        {
            availability: { $ne: AvailabilityEnum.onlyMe },
            tags: { $in: req.user?._id }
        }
    ]
}

export class PostService {

    private postModel = new PostRepository(PostModel);
    private userModel = new UserRepository(UserModel);
    private commentModel = new CommentRepository(CommentModel);

    constructor() { }

    createPost = async (req: Request, res: Response): Promise<Response> => {
        const { tags, attachments }: I_CreatePostInputs = req.body;
        const userId = req.tokenDecoded?._id;

        if (
            tags?.length && (await this.userModel.find({
                filter: {
                    _id: { $in: tags }
                }
            })).data.length !== tags.length
        ) {
            throw new NotFoundException("Some Mentions Users Not Exist")
        }

        if (tags?.includes(userId)) {
            throw new BadRequestException("User Cannot Mention Himself")
        }


        let attachmentsKeys: string[] = [];
        const assetsFolderId = uuid();

        if (attachments?.length) {
            attachmentsKeys = await uploadFiles({
                files: attachments as Express.Multer.File[],
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
        }) || []

        if (!post) {
            if (attachments?.length) {
                await deleteFiles({ urls: attachmentsKeys })
            }
            throw new BadRequestException("Fail To Create Post");
        }

        return successResponse({
            res, statusCode: 201,
            info: "Post Created Success", data: {
                postId: post._id,
                attachments: post.attachments
            }
        });

    }


    updatePost = async (req: Request, res: Response): Promise<Response> => {

        const postId = req.params.postId as unknown as { postId: Types.ObjectId };
        const userId = req.tokenDecoded?._id;

        const post = await this.postModel.findOne({
            filter: {
                _id: postId,
                createdBy: userId
            }
        })

        if (!post) {
            throw new NotFoundException("Post Not Found");
        }

        let duplicatedData: { path: String, data: String }[] = [];
        if (req.body.availability && req.body.availability === post.availability) {
            duplicatedData.push({
                path: "availability", data: post.availability as string
            })
        }
        if (req.body.content && req.body.content === post.content) {
            duplicatedData.push({
                path: "content", data: post.content as string
            })
        }

        if (duplicatedData.length) {
            throw new BadRequestException("Some Duplicated Data In Update Request", {
                issues: duplicatedData
            });
        }



        if (req.body.tags) {

            if ((await this.userModel.find({
                filter: { _id: { $in: req.body.tags } }
            })).data.length !== req.body.tags.length)
                throw new BadRequestException("Some Tagged Users Are Not Exists")

            if (req.body.tags.includes(req.user?._id.toString()))
                throw new BadRequestException("Post Createor Cannot Mention Himself")

            if (
                (req.body.removedTags && (req.body.tags.length - req.body.removedTags.length) > 10)
                || (req.body.tags.length > 10)
            ) {
                throw new BadRequestException("Cannot Mention More Than 10 Users In Post")

            }

        }

        let attachmentsKeys: string[] = [];
        if (req.body.attachments?.length) {

            if (!req.body.removedAttachments?.length) {
                throw new BadRequestException(
                    "Cannot Add New Attachments Without Removing Existing Ones"
                );
            }

            let notExistsKeys: { index: number, key: string }[] = [];

            req.body.removedAttachments.forEach((key: string, index: number) => {
                if (!post.attachments?.includes(key)) {
                    notExistsKeys.push({ index, key });
                }
            });

            if (notExistsKeys.length) {
                throw new BadRequestException("Wrong Attachments Keys", {
                    issues: {
                        path: "removedAttachments",
                        notExistsKeys
                    }
                });
            }

            attachmentsKeys = await uploadFiles({
                files: req.files as Express.Multer.File[],
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
                                $setDifference: ["$tags", (req.body.removedTags || []).map((tag: string) => {
                                    return Types.ObjectId.createFromHexString(tag)
                                })],
                            },
                            (req.body.tags || []).map((tag: string) => {
                                return Types.ObjectId.createFromHexString(tag)
                            })
                        ]
                    }
                }
            }
        ])

        if (!updatedPost) {
            if (attachmentsKeys.length) {
                await deleteFiles({ urls: attachmentsKeys })
            }
            throw new BadRequestException("Fail To Update Post")
        }

        else {
            if (req.body.removedAttachments) {
                await deleteFiles({ urls: req.body.removedAttachments });
            }
        }

        return successResponse({
            res, statusCode: 200,
            info: "Post Updated Success"
        });

    }

    getPosts = async (req: Request, res: Response): Promise<Response> => {

        let { page, limit } = req.query as unknown as {
            page: number,
            limit: number
        };

        const posts = await this.postModel.find({
            filter: {
                $or: postAvailability(req)
            },
            options: {
                populate: [
                    {
                        path: "author",
                        options: {
                            sort: { createdAt: -1 },
                            select: "firstName lastName slug email phone gender picture coverImages"
                        }
                    },
                    {
                        path: "lastComment",
                        match: { flag: CommentFlagEnum.comment },
                        options: {
                            sort: { createdAt: -1 },
                            select: "-id"
                        }, populate: [{
                            path: "lastReply",
                            match: { flag: CommentFlagEnum.reply },
                            options: {
                                sort: { createdAt: -1 }
                            },
                            select: "-id"
                        }]
                    }
                ]
            },
            page: page,
            limit
        });

        return successResponse({
            res,
            data: {
                ...(page && posts.pagination),
                count: posts.data.length,
                posts: posts.data,
            }
        });

    }

    getFreezedPosts = async (req: Request, res: Response): Promise<Response> => {

        let { page, limit } = req.query as unknown as {
            page: number,
            limit: number
        };
        const userId = req.user?._id;

        const posts = await this.postModel.find({
            filter: {
                createdBy: userId,
                freezeedAt: { $exists: true },
                pranoId: false
            },
            page: page,
            limit
        });

        return successResponse({
            res,
            data: {
                ...(page && posts.pagination),
                count: posts.data.length,
                posts: posts.data,
            }
        });

    }

    getMyPosts = async (req: Request, res: Response): Promise<Response> => {

        let { page, limit } = req.query as unknown as {
            page: number,
            limit: number
        };

        const userId = req.user?._id;

        const posts = await this.postModel.find({
            filter: {
                createdBy: userId,
            },
            options: {
                populate: [
                    {
                        path: "lastComment",
                        match: { flag: CommentFlagEnum.comment },
                        options: {
                            sort: { createdAt: -1 },
                            select: "-id"
                        }, populate: [{
                            path: "lastReply",
                            match: { flag: CommentFlagEnum.reply },
                            options: {
                                sort: { createdAt: -1 }
                            },
                            select: "-id"
                        }]
                    }
                ]
            },
            page: page,
            limit
        });

        return successResponse({
            res,
            data: {
                ...(page && posts.pagination),
                count: posts.data.length,
                posts: posts.data,
            }
        });

    }

    getUserPosts = async (req: Request, res: Response): Promise<Response> => {

        let { page, limit } = req.query as unknown as {
            page: number,
            limit: number
        };

        const userId = req.params.userId;

        const posts = await this.postModel.find({
            filter: {
                createdBy: userId,
                $or: postAvailability(req)
            },
            options: {
                populate: [
                    {
                        path: "lastComment",
                        match: { flag: CommentFlagEnum.comment },
                        options: {
                            sort: { createdAt: -1 },
                            select: "-id"
                        }, populate: [{
                            path: "lastReply",
                            match: { flag: CommentFlagEnum.reply },
                            options: {
                                sort: { createdAt: -1 }
                            },
                            select: "-id"
                        }]
                    }
                ]
            },
            page: page,
            limit
        });

        return successResponse({
            res,
            data: {
                ...(page && posts.pagination),
                count: posts.data.length,
                posts: posts.data,
            }
        });

    }

    getPost = async (req: Request, res: Response): Promise<Response> => {

        const post = await this.postModel.findOne({
            filter: {
                _id: req.params.postId,
                $or: postAvailability(req)
            },
            options: {
                populate: [
                    {
                        path: "author",
                        options: {
                            sort: { createdAt: -1 },
                            select: "firstName lastName picture"
                        }
                    },
                    {
                        path: "lastComment",
                        match: { flag: CommentFlagEnum.comment },
                        options: {
                            populate: [
                                {
                                    path: "author",
                                    options: {
                                        sort: { createdAt: -1 },
                                        select: "firstName lastName picture"
                                    }
                                },
                            ],
                            sort: { createdAt: -1 },
                            select: "-id"
                        }, populate: [{
                            path: "lastReply",
                            match: { flag: CommentFlagEnum.reply },
                            options: {
                                populate: [
                                    {
                                        path: "author",
                                        options: {
                                            sort: { createdAt: -1 },
                                            select: "firstName lastName picture"
                                        }
                                    },
                                ],
                                sort: { createdAt: -1 }
                            },
                            select: "-id"
                        }]
                    }
                ]
            }
        });

        if (!post) {
            throw new NotFoundException("Post Not Found!");
        }

        const postDoc = post as any;

        if (postDoc?.lastComment) {
            const comment = postDoc.lastComment.toObject?.() || postDoc.lastComment;

            postDoc.lastComment = {
                // بننقل كل الخصائص العادية ما عدا author و lastReply
                ...Object.fromEntries(
                    Object.entries(comment).filter(([key]) => key !== "author" && key !== "lastReply")
                ),

                // نحط author الأول
                author: comment.author,

                // بعدين lastReply تحته
                lastReply: comment.lastReply
            };
        }


        return successResponse({
            res,
            data:
                postDoc
        });

    }

    likePost = async (req: Request, res: Response): Promise<Response> => {

        const { postId } = req.params;
        const userId = req.tokenDecoded?._id;

        const post = await this.postModel.findOne({
            filter: {
                _id: postId,
                $or: postAvailability(req)
            }
        });

        if (!post) {
            throw new NotFoundException("Post Not Found!");
        }

        let updateData = {};
        let message: string = "";

        if (post.likes?.includes(userId)) {
            updateData = { $pull: { likes: userId } };
            message = "Post Unlike Success"
        } else {
            updateData = { $addToSet: { likes: userId } };
            message = "Post liked Success";
        }

        const action = await this.postModel.findOneAndUpdate({
            filter: {
                _id: postId
            }, updateData
        });

        if (!action) {
            throw new BadRequestException("Fail To Make This Action");
        }

        if (message === "Post liked Success") {
            getIo().to(connectedSockets.get(post.createdBy.toString()) as string[]).emit("likePost", { postId, userId })
        }

        return successResponse({
            res,
            message
        });
    }

    freezePost = async (req: Request, res: Response): Promise<Response> => {

        const { postId } = req.params;
        const userId = req.tokenDecoded?._id;

        const post = await this.postModel.findOneAndUpdate({
            filter: {
                _id: postId,
                freezeedAt: { $exists: false },
                freezeedBy: { $exists: false }
            }, updateData: {
                freezeedAt: new Date(),
                freezeedBy: userId
            }
        });

        if (!post) {
            throw new NotFoundException("Post Not Found");
        }


        await this.commentModel.updateMany({
            createdBy: userId,
            freezeedAt: { $exists: false },
            freezeedBy: { $exists: false },
        }, {
            $set: {
                freezeedAt: new Date(),
                freezeedBy: userId
            }
        });


        return successResponse({
            res,
            message: "Post freezeed Success"
        });
    }

    unfreezePost = async (req: Request, res: Response): Promise<Response> => {

        const { postId } = req.params;
        const userId = req.tokenDecoded?._id;

        const post = await this.postModel.findOneAndUpdate({
            filter: {
                _id: postId,
                freezeedAt: { $exists: true },
                freezeedBy: userId,
                pranoId: false
            }, updateData: {
                $set: {
                    restoredAt: new Date(),
                    restoredBy: userId
                },
                $unset: {
                    freezeedAt: "",
                    freezeedBy: ""
                }
            }
        });

        if (!post) {
            throw new NotFoundException("Post Not Found Or No Autherized To Unfreeze");
        }


        await this.commentModel.updateMany({
            createdBy: userId,
            freezeedAt: { $exists: true },
            freezeedBy: { $exists: true },
        }, {
            $set: {
                restoredAt: new Date(),
                restoredBy: userId
            },
            $unset: {
                freezeedAt: "",
                freezeedBy: ""
            }
        });

        return successResponse({
            res,
            message: "Post Un freezeed Success"
        });
    }

    deletePost = async (req: Request, res: Response): Promise<Response> => {

        const { postId } = req.params;
        const userId = req.tokenDecoded?._id;

        const post = await this.postModel.findOne({
            filter: {
                _id: postId,
                createdBy: userId
            }
        }) as unknown as HPostDocument;

        if (!post) {
            throw new NotFoundException("Post Not Found Or No Authorized To Remove");
        }

        await this.postModel.deleteOne({
            _id: postId
        })

        if (post.attachments?.length && post.assetsFolderId) {
            await deleteFolderByPrefix({ path: `users/${userId}/posts/${post.assetsFolderId}` });
        }


        return successResponse({
            res,
            message: "Post Deleted Success"
        });
    }


    // GQL 


    allPosts = async (args: { page: number, limit: number }, user: any) => {

        const posts = await this.postModel.find({
            filter: {
                $or: [
                    { availability: AvailabilityEnum.public },
                    { availability: AvailabilityEnum.onlyMe, createdBy: user._id },
                    {
                        availability: AvailabilityEnum.friends,
                        createdBy: { $in: [...(user?.friends || []), user._id] }
                    },
                    {
                        availability: { $ne: AvailabilityEnum.onlyMe },
                        tags: { $in: user?._id }
                    }
                ]
            },
            options: {
                populate: [{
                    path: "comments",
                    match: { flag: CommentFlagEnum.comment },
                    options: {
                        sort: { createdAt: -1 },
                        select: "-id",
                    }
                }
                ]
            },
            limit: args.limit,
            page: args.page
        });

        return {
            count: posts.data.length,
            page: posts.pagination.page,
            limit: posts.pagination.limit,
            posts: posts.data
        }
    }


    searchForPost = async (args: { key: string, page: number, limit: number }) => {

        const posts = await this.postModel.find({
            filter: {
                content: { $regex: args.key, $options: "i" }
            },
            limit: args.limit,
            page: args.page
        })

        return {
            count: posts.data.length,
            page: posts.pagination.page,
            limit: posts.pagination.limit,
            posts: posts.data
        }
    }


}