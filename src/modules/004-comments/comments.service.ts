import { Request, Response } from "express";
import { successResponse } from "../../utils/response/success.response";
import {
  PostRepository,
  UserRepository,
  CommentRepository,
  FriendRequestRepository,
} from "../../DataBase/repository";
import {
  UserModel,
  PostModel,
  CommentModel,
  allowCommentsEnum,
  HPostDocument,
  CommentFlagEnum,
  IPost,
  FriendRequestModel,
} from "../../DataBase/models";
import {
  BadRequestException,
  NotFoundException,
} from "../../utils/response/error.response";
import {
  I_CreateCommentInputs,
  I_ReplyOnCommentInputs,
  I_UpdateCommentInputs,
} from "./comments.dto";
import { postAvailability } from "../003-posts";
import { Types } from "mongoose";
import {
  deleteFolderFromCloudinary,
  deleteImageFromCloudinary,
  uploadToCloudinary,
} from "../../utils/cloudinary";
import { IImage } from "../../utils/cloudinary/cloudinary.interface";

export class Comments {
  private userModel = new UserRepository(UserModel);
  private postModel = new PostRepository(PostModel);
  private commentModel = new CommentRepository(CommentModel);
    private friendRequestModel = new FriendRequestRepository(FriendRequestModel);

  

  constructor() {}

  private postExists = async (
    postId: Types.ObjectId,
    req: Request
  ): Promise<HPostDocument | Boolean> => {
    const post = await this.postModel.findOne({
      filter: {
        _id: postId,
        $or: postAvailability(req),
        allowComments: allowCommentsEnum.allow,
      },
    });
    if (!post) {
      return false;
    }
    return post;
  };

  createComment = async (req: Request, res: Response): Promise<Response> => {
    const { tags, attachment }: I_CreateCommentInputs = req.body;

    const postId = req.params.postId as unknown as Types.ObjectId;

    const post = (await this.postExists(postId, req)) as HPostDocument;

    if (!post) {
      throw new NotFoundException("Post Not Found Or Cannot Create Comment");
    }

    if (
      tags?.length &&
      (
        await this.userModel.find({
          filter: {
            _id: { $in: tags },
          },
        })
      ).data.length !== tags.length
    ) {
      throw new NotFoundException("Some Mentions Users Not Exist");
    }

    if (tags?.includes(req.tokenDecoded?._id)) {
      throw new BadRequestException("User Cannot Mention Himself");
    }

    let commentAttachment;

    if (attachment) {
      const { public_id, secure_url } = await uploadToCloudinary(
        attachment as Express.Multer.File,
        `LinkSphere/users/${post.createdBy}/posts/${post.assetsFolderId}/comments`
      );
      commentAttachment = { public_id, url: secure_url };
    }

    const [comment] =
      (await this.commentModel.create({
        data: [
          {
            flag: CommentFlagEnum.comment,
            ...req.body,
            postId,
            attachment: commentAttachment,
            createdBy: req.tokenDecoded?._id,
          },
        ],
      })) || [];

    if (!comment) {
      if (commentAttachment) {
        await deleteImageFromCloudinary(commentAttachment.public_id);
      }
      throw new BadRequestException("Fail To Create Comment");
    }

    post.commentsCount++;
    post.save();


    return successResponse({
      res,
      statusCode: 201,
      info: "Comment Created Success",
      data: { comment },
    });
  };

  getComment = async (req: Request, res: Response): Promise<Response> => {
    const { commentId, postId } = req.params as unknown as {
      commentId: Types.ObjectId;
      postId: Types.ObjectId;
    };

    if (!(await this.postExists(postId, req))) {
      throw new BadRequestException("Post Not Exist");
    }

    const comment = await this.commentModel.findOne({
      filter: { _id: commentId },
      options: {
        populate: [
          {
            path: "lastReply",
          },
        ],
      },
    });

    if (!comment) {
      throw new BadRequestException("Comment Not Exist");
    }

    return successResponse({
      res,
      statusCode: 200,
      data: { comment },
    });
  };

  getPostComments = async (req: Request, res: Response): Promise<Response> => {
    const { postId } = req.params as unknown as {
      postId: Types.ObjectId;
    };

    let { page, limit } = req.query as unknown as {
      page: string | number;
      limit: string | number;
    };

    if (!(await this.postExists(postId, req))) {
      throw new BadRequestException("Post Not Exist");
    }

    const comments = await this.commentModel.find({
      filter: {
        postId,
        flag: CommentFlagEnum.comment,
      },

      options: {
        populate: [
          {
            path: "lastReply",
          },
          {
            path: "author",
            select: "firstName lastName picture _id",
          },
        ],
      },
      page: page as number,
      limit: limit as number,
    });

    return successResponse({
      res,
      statusCode: 200,
      data: {
        comments: comments.data,
        pagination: comments.pagination,
      },
    });
  };

  getGetCommentReplies = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    const { postId, commentId } = req.params as unknown as {
      commentId: Types.ObjectId;
      postId: Types.ObjectId;
    };

    let { page, limit } = req.query as unknown as {
      page: string | number;
      limit: string | number;
    };

    if (!(await this.postExists(postId, req))) {
      throw new BadRequestException("Post Not Exist");
    }

    const replies = await this.commentModel.find({
      filter: {
        postId,
        commentId,
        flag: CommentFlagEnum.reply,
      },
      options: {
        populate: [
          {
            path: "author",
            select: "firstName lastName picture _id",
          },
          {
            path: "lastReply",
            populate: [
              {
                path: "author",
                select: "firstName lastName picture _id",
              },
            ],
          },
        ],
      },
      page: page as number,
      limit: limit as number,
    });

    return successResponse({
      res,
      statusCode: 200,
      data: {
        replies: replies.data,
        pagination: replies.pagination,
      },
    });
  };


   getLikedUsers = async (req: Request, res: Response): Promise<Response> => {
      let { page, limit } = req.query as unknown as {
        page: number;
        limit: number;
      };
  
      const userFriends = req.user?.friends;
      let commentId = req.params.commentId;
  
      const comment = await this.commentModel.findOne({
        filter: {
          _id: commentId,
        },
        options: {
          populate: [
            {
              path: "likedUsers",
              select: "_id firstName lastName userName picture",
              options: {
                limit,
                skip: (page - 1) * limit,
              },
            },
          ],
          lean: { virtuals: true }
        },
      });
  
      if (!comment) {
        throw new NotFoundException("Post Not Exits");
      }
  
      if (comment && !comment.likedUsers?.length) {
        throw new BadRequestException("No Likes For This post");
      }
  
      const pagination = {
        page: new Number(page) || 1,
        totalPages: Math.ceil((comment.likes?.length as number) / (limit || 10)),
        limit: new Number(limit) || 10,
        total: comment.likedUsers?.length || 0,
      };
  
      const users: any[] = [];
  
      const processedUsers = await Promise.all(
        comment.likedUsers?.map(async (u) => {
          if (req.user!._id.toString() === u._id.toString()) {
            return { ...u, flag: "me" };
          }
  
          if (userFriends?.includes(u._id)) {
            return { ...u, flag: "isFriend" };
          }
  
          const request = await this.friendRequestModel.findOne({
            filter: {
              $or: [
                { sendBy: req.user?._id, sendTo: u._id },
                { sendBy: u._id, sendTo: req.user?._id },
              ],
            },
          });
  
          if (!request) return { ...u, flag: "notFriend" };
  
          if (request.sendBy.toString() === req.user!._id.toString()) {
            return { ...u, flag: "requestSent" };
          } else {
            return { ...u, flag: "requestReceived" };
          }
        }) || []
      );
  
      users.push(...processedUsers);
  
      return successResponse({
        res,
        data: {
          likedUsers: users,
          pagination,
        },
      });
    };

  updateComment = async (req: Request, res: Response): Promise<Response> => {
    const { tags, attachment, removeAttachment }: I_UpdateCommentInputs =
      req.body;
    const { postId, commentId } = req.params as unknown as {
      postId: Types.ObjectId;
      commentId: Types.ObjectId;
    };
    const userId = req.user?._id as unknown as Types.ObjectId;

    const post = (await this.postExists(postId, req)) as HPostDocument;

    if (!post) {
      throw new NotFoundException("Post Not Found Or Cannot Update Comment");
    }

    const comment = await this.commentModel.findOne({
      filter: {
        _id: commentId,
        postId,
      },
    });

    if (!comment) {
      throw new NotFoundException("Comment Not Found");
    }

    if (!comment.createdBy.equals(userId)) {
      throw new NotFoundException("Only Creator Can Edit This Comment");
    }

    if (
      tags?.length &&
      (
        await this.userModel.find({
          filter: {
            _id: { $in: tags },
          },
        })
      ).data.length !== tags.length
    ) {
      throw new NotFoundException("Some Mentions Users Not Exist");
    }

    if (tags?.includes(userId.toString())) {
      throw new BadRequestException("User Cannot Mention Himself");
    }

    let updatedComment;
    let attachmentKey;

    if (removeAttachment) {
      if (comment.attachment) {
        await deleteImageFromCloudinary(comment.attachment.public_id);
      } else {
        throw new BadRequestException("No Attachment For This Comment");
      }

      updatedComment = await this.commentModel.findOneAndUpdate({
        filter: {
          _id: commentId,
          createdBy: userId,
        },
        updateData: {
          ...req.body,
          tags,
          $unset: {
            attachment: 1,
          },
        },
      });
    } else {
      if (attachment) {
        if (comment.attachment) {
          await deleteImageFromCloudinary(comment.attachment.public_id);
        }
        attachmentKey = (await uploadToCloudinary(
          attachment as Express.Multer.File,
          `LinkSphere/users/${post.createdBy}/posts/${post.assetsFolderId}/comments`
        )) as IImage;
      }
      updatedComment = await this.commentModel.findOneAndUpdate({
        filter: {
          _id: commentId,
          createdBy: userId,
        },
        updateData: {
          ...req.body,
          attachment: attachmentKey,
          tags,
        },
      });
    }

    if (!updatedComment) {
      if (attachmentKey) {
        await deleteImageFromCloudinary(attachmentKey.public_id);
      }
      throw new BadRequestException("Fail To Create Comment");
    }

    return successResponse({
      res,
      statusCode: 201,
      info: "Comment Updated Success",
      data: { commentId: comment._id },
    });
  };

  replyOnComment = async (req: Request, res: Response): Promise<Response> => {
    const { tags, attachment }: I_ReplyOnCommentInputs = req.body;

    const { postId, commentId } = req.params as unknown as {
      postId: Types.ObjectId;
      commentId: Types.ObjectId;
    };

    const post = (await this.postExists(postId, req)) as HPostDocument;

    if (!post) {
      throw new BadRequestException("Post Not Found");
    }

    const comment = await this.commentModel.findOne({
      filter: {
        _id: commentId,
        postId: postId,
      },
    });

    if (!comment) {
      throw new NotFoundException("Comment Not Found");
    }

    if (
      tags?.length &&
      (
        await this.userModel.find({
          filter: {
            _id: { $in: tags },
          },
        })
      ).data.length !== tags.length
    ) {
      throw new NotFoundException("Some Mentions Users Not Exist");
    }

    if (tags?.includes(req.tokenDecoded?._id)) {
      throw new BadRequestException("User Cannot Mention Himself");
    }

    let replyAttachment;

    if (attachment) {
      const { public_id, secure_url } = await uploadToCloudinary(
        attachment as Express.Multer.File,
        `LinkSphere/users/${post.createdBy}/posts/${post.assetsFolderId}/comments/${comment.id}/replies`
      );
      replyAttachment = { public_id, url: secure_url };
    }

    const [reply] =
      (await this.commentModel.create({
        data: [
          {
            ...req.body,
            flag: CommentFlagEnum.reply,
            postId,
            commentId,
            attachment: replyAttachment,
            createdBy: req.tokenDecoded?._id,
          },
        ],
      })) || [];

    if (!reply) {
      if (replyAttachment) {
        await deleteImageFromCloudinary(replyAttachment.public_id);
      }
      throw new BadRequestException("Fail To Create Comment");
    }

    comment.repliesCount++;
    comment.save();

    return successResponse({
      res,
      statusCode: 201,
      info: "Replied Success",
      data: reply,
    });
  };

  likeComment = async (req: Request, res: Response): Promise<Response> => {
    const { postId, commentId } = req.params as unknown as {
      postId: Types.ObjectId;
      commentId: Types.ObjectId;
    };

    const userId = req.user?._id as unknown as Types.ObjectId;

    if (!(await this.postExists(postId, req))) {
      throw new BadRequestException("Post Not Found");
    }

    const comment = await this.commentModel.findOne({
      filter: {
        _id: commentId,
        postId,
      },
    });

    if (!comment) {
      throw new NotFoundException("Comment Not Found!");
    }

    let updateData = {};
    let message: string = "";

    if (comment.likes?.includes(userId)) {
      updateData = { $pull: { likes: userId }, $inc: { likesCount: -1 } };
      message = `${
        comment.flag === CommentFlagEnum.comment ? "Comment" : "Reply"
      } Unlinked Success`;
    } else {
      updateData = { $addToSet: { likes: userId }, $inc: { likesCount: 1 } };
      message = `${
        comment.flag === CommentFlagEnum.comment ? "Comment" : "Reply"
      } Liked Success`;
    }

    await this.commentModel.findOneAndUpdate({
      filter: {
        _id: commentId,
      },
      updateData,
    });

    return successResponse({
      res,
      message,
    });
  };

  deleteComment = async (req: Request, res: Response): Promise<Response> => {
    const { postId, commentId } = req.params as unknown as {
      postId: Types.ObjectId;
      commentId: Types.ObjectId;
    };

    const userId = req.user?._id as unknown as Types.ObjectId;

    const comment = await this.commentModel.findOneAndDelete({
      filter: {
        _id: commentId,
        postId,
        createdBy: userId,
      },
    });

    if (!comment) {
      throw new BadRequestException(
        "Comment Not Exist Or Not Authorized To Remove"
      );
    }

    const post = (await this.postModel.findOne({
      filter: {
        _id: comment.postId,
      },
      select: "_id createdBy assetsFolderId",
    })) as IPost;

    if (comment.flag === CommentFlagEnum.comment) {
      const { data } = await this.commentModel.find({
        filter: {
          postId,
          commentId,
          flag: CommentFlagEnum.reply,
          attachment: { $exists: true },
        },
      });

      // Delete Replies Attachments
      if (data.length) {
        try {
          deleteFolderFromCloudinary(
            `LinkSphere/users/${post?.createdBy}/posts/${post.assetsFolderId}/comments/${comment.id}`
          );
        } catch (error) {}
      }

      // Delete Replies
      await this.commentModel.deleteMany({
        postId,
        commentId,
        flag: CommentFlagEnum.reply,
      });

      this.postModel.updateOne(
        {
          _id: postId,
        },
        {
          $inc: { commentsCount: -1 },
        }
      );
    }



    return successResponse({
      res,
      message: "Comment Deleted Success",
    });
  };
}