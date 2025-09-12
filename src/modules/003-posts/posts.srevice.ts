import { Request, Response } from "express";
import { succsesResponse } from "../../utils/response/succses.response";
import { PostRepository, UserRepository } from "../../DataBase/repository";
import { PostModel } from "../../DataBase/models/post.model";
import { UserModel } from "../../DataBase/models/user.model";
import { BadRequestException, NotFoundException } from "../../utils/response/error.response";
import { I_CreatePostInputs } from "./dto/posts.dto";
import { v4 as uuid } from "uuid";
import { deleteFiles, uploadFiles } from "../../utils/multer/s3.config";
export class PostService {

    private postModel = new PostRepository(PostModel);
    private userModel = new UserRepository(UserModel);

    constructor() { }

    createPotst = async (req: Request, res: Response): Promise<Response> => {
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
                _id: postId
            }, select: { likes: 1, _id: 0 }
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