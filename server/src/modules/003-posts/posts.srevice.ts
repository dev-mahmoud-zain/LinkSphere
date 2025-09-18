import { Request, Response } from "express";
import { succsesResponse } from "../../utils/response/succses.response";
import { PostRepository, UserRepository } from "../../DataBase/repository";
import { AvailabilityEnum, PostModel } from "../../DataBase/models/post.model";
import { UserModel } from "../../DataBase/models/user.model";
import { BadRequestException, NotFoundException } from "../../utils/response/error.response";
import { I_CreatePostInputs } from "./dto/posts.dto";
import { v4 as uuid } from "uuid";
import { deleteFiles, uploadFiles } from "../../utils/multer/s3.config";
import { Types } from "mongoose";

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

        return succsesResponse({
            res, statusCode: 201,
            info: "Post Created Succses", data: {
                postId: post._id
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

            let notExsitsKeys: { index: number, key: string }[] = [];

            req.body.removedAttachments.forEach((key: string, index: number) => {
                if (!post.attachments?.includes(key)) {
                    notExsitsKeys.push({ index, key });
                }
            });

            if (notExsitsKeys.length) {
                throw new BadRequestException("Wrong Attachments Keys", {
                    issues: {
                        path: "removedAttachments",
                        notExsitsKeys
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

        return succsesResponse({
            res, statusCode: 200,
            info: "Post Updated Succses"
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
            page: page,
            limit
        });

        return succsesResponse({
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
                _id: req.params.postId
            }
        });
        if (!post) {
            throw new NotFoundException("Post Not Found!");
        }

        return succsesResponse({
            res,
            data: {
                post
            }
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
            message = "Post Unliked Succses"
        } else {
            updateData = { $addToSet: { likes: userId } };
            message = "Post liked Succses";
        }

        await this.postModel.findOneAndUpdate({
            filter: {
                _id: postId
            }, updateData
        });

        return succsesResponse({
            res,
            message
        });
    }

}