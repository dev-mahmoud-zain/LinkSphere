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

        if (tags?.length && (await this.userModel.find({
            filter: {
                _id: { $in: tags }
            }
        })).data.length !== tags.length
        ) {
            throw new NotFoundException("Some Tagged Users Not Exsit")
        }

        if (tags?.includes(userId)) {
            throw new BadRequestException("User Cannot Tag Himself")
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

        // First Wrong Resolve 
        // if (req.body.removedAttachments?.length && post.attachments?.length) {
        //     post.attachments = post.attachments.filter((attachment: string) => {
        //         if (!req.body.removedAttachments.includes(attachment)) {
        //             return attachment
        //         }
        //         return
        //     })
        // }


        let attachmentsKeys: string[] = [];
        if (req.body.attachments?.length) {
            attachmentsKeys = await uploadFiles({
                files: req.files as Express.Multer.File[],
                path: `users/${userId}/posts/${post.assetsFolderId}`
            });

            // post.attachments = [...(post.attachments || []), ...attachmentsKeys]; 

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
            if (req.body.attachments) {
                await deleteFiles({ urls: req.body.removedAttachments });
            }
        }

        return succsesResponse({
            res, statusCode: 200,
            info: "Post Updated Succses", data: {
                updatedPost
            }
        });

    }


    getPost = async (req: Request, res: Response): Promise<Response> => {
        const { postId } = req.params;

        const post = await this.postModel.findOne({
            filter: {
                _id: postId
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