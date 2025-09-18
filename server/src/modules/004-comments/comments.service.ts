import { Request, Response } from "express";
import { succsesResponse } from "../../utils/response/succses.response";
import { PostRepository, UserRepository, CommentRepository } from "../../DataBase/repository";
import { UserModel, PostModel, CommentModel, AllowCommentsEnum, HPostDucment, CommentFlagEnum } from "../../DataBase/models";
import { BadRequestException, NotFoundException } from "../../utils/response/error.response";
import { I_CreateCommentInputs, I_ReplyOnCommentInputs } from "./comments.dto";
import { postAvailability } from "../003-posts";
import { deleteFile, uploadFile } from "../../utils/multer/s3.config";
import { Types } from "mongoose";




export class Comments {


    private userModel = new UserRepository(UserModel);
    private postModel = new PostRepository(PostModel);
    private commentModel = new CommentRepository(CommentModel);

    constructor() { }

    createComment = async (req: Request, res: Response): Promise<Response> => {

        const { tags, attachment }: I_CreateCommentInputs = req.body;

        const postId = req.params.postId as unknown as Types.ObjectId;

        const post = await this.postModel.findOne({
            filter: {
                _id: postId,
                allowcomments: AllowCommentsEnum.allow,
                $or: postAvailability(req)
            }
        });

        if (!post) {
            throw new NotFoundException("Post Not Found Or Cannot Create Comment")
        }

        if (
            tags?.length && (await this.userModel.find({
                filter: {
                    _id: { $in: tags }
                }
            })).data.length !== tags.length
        ) {
            throw new NotFoundException("Some Mentions Users Not Exist")
        }

        if (tags?.includes(req.tokenDecoded?._id)) {
            throw new BadRequestException("User Cannot Mention Himself")
        }

        let attachmentKey: string = "";

        if (attachment) {
            attachmentKey = await uploadFile({
                file: attachment as Express.Multer.File,
                path: `users/${post.createdBy}/posts/comments/${post.assetsFolderId}`
            });
        }

        const [comment] = await this.commentModel.create({
            data: [{
                flag: CommentFlagEnum.comment,
                ...req.body,
                postId,
                attachment: attachmentKey,
                createdBy: req.tokenDecoded?._id
            }]
        }) || []

        if (!comment) {
            if (attachment) {
                await deleteFile({ Key: attachmentKey })
            }
            throw new BadRequestException("Fail To Create Comment");
        }

        return succsesResponse({
            res, statusCode: 201,
            info: "Comment Created Succses",
            data: { commentId: comment._id }
        });

    }


    replyOnComment = async (req: Request, res: Response): Promise<Response> => {

        const { tags, attachment }: I_ReplyOnCommentInputs = req.body;

        const { postId, commentId } = req.params as unknown as {
            postId: Types.ObjectId,
            commentId: Types.ObjectId
        };

        const comment = await this.commentModel.findOne({
            filter: {
                _id: commentId,
            },
            options: {
                populate: [
                    {
                        path: "postId", match: {
                            $or: postAvailability(req),
                            allowcomments: AllowCommentsEnum.allow
                        }
                    }
                ]
            }
        });


        if (!comment?.postId) {
            throw new NotFoundException("Comment Not Found")
        }


        if (
            tags?.length && (await this.userModel.find({
                filter: {
                    _id: { $in: tags }
                }
            })).data.length !== tags.length
        ) {
            throw new NotFoundException("Some Mentions Users Not Exist")
        }

        if (tags?.includes(req.tokenDecoded?._id)) {
            throw new BadRequestException("User Cannot Mention Himself")
        }

        let attachmentKey: string = "";
        const post = comment.postId as Partial<HPostDucment>;

        if (attachment) {
            attachmentKey = await uploadFile({
                file: attachment as Express.Multer.File,
                path: `users/${post.createdBy}/posts/comments/${post.assetsFolderId}`
            });
        }

        const [reply] = await this.commentModel.create({
            data: [{
                ...req.body,
                flag: CommentFlagEnum.reply,
                postId,
                commentId,
                attachment: attachmentKey,
                createdBy: req.tokenDecoded?._id
            }]
        }) || []

        if (!reply) {
            if (attachment) {
                await deleteFile({ Key: attachmentKey })
            }
            throw new BadRequestException("Fail To Create Comment");
        }

        return succsesResponse({
            res, statusCode: 201,
            info: "Replyed Succses",
            data: { replyId: reply._id }
        });

    }

}





