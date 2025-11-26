import { Request, Response } from "express";
import { successResponse } from "../../utils/response/success.response";
import {
  CommentRepository,
  FriendRequestRepository,
  PostRepository,
  UserRepository,
} from "../../DataBase/repository";
import {
  AvailabilityEnum,
  HPostDocument,
  PostModel,
} from "../../DataBase/models/post.model";
import { RoleEnum, UserModel } from "../../DataBase/models/user.model";
import {
  BadRequestException,
  NotFoundException,
} from "../../utils/response/error.response";
import { I_CreatePostInputs } from "./dto/posts.dto";
import { v4 as uuid } from "uuid";
import { Types } from "mongoose";
import {
  CommentFlagEnum,
  CommentModel,
  FriendRequestModel,
} from "../../DataBase/models";
import { connectedSockets, getIo } from "../005-gateway";
import {
  deleteFolderFromCloudinary,
  deleteMultiFromCloudinary,
  uploadMultiImagesToCloudinary,
} from "../../utils/cloudinary";
import { IImage } from "../../utils/cloudinary/cloudinary.interface";

export const postAvailability = (req: Request) => {
  return [
    { availability: AvailabilityEnum.public },
    { availability: AvailabilityEnum.onlyMe, createdBy: req.user?._id },
    {
      availability: AvailabilityEnum.friends,
      createdBy: { $in: [...(req.user?.friends || []), req.user?._id] },
    },
    {
      availability: { $ne: AvailabilityEnum.onlyMe },
      tags: { $in: req.user?._id },
    },
  ];
};

export class PostService {
  private postModel = new PostRepository(PostModel);
  private userModel = new UserRepository(UserModel);
  private commentModel = new CommentRepository(CommentModel);
  private friendRequestModel = new FriendRequestRepository(FriendRequestModel);

  constructor() {}

  createPost = async (req: Request, res: Response): Promise<Response> => {
    const { tags, attachments }: I_CreatePostInputs = req.body;
    const userId = req.tokenDecoded?._id;

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

    if (tags?.includes(userId)) {
      throw new BadRequestException("User Cannot Mention Himself");
    }

    let attachmentsKeys: IImage[] = [];
    const assetsFolderId = uuid();

    if (attachments?.length) {
      attachmentsKeys =
        (await uploadMultiImagesToCloudinary(
          attachments as Express.Multer.File[],
          `LinkSphere/users/${userId}/posts/${assetsFolderId}`
        )) || [];
    }

    const [post] =
      (await this.postModel.create({
        data: [
          {
            ...req.body,

            attachments: attachmentsKeys,
            assetsFolderId,
            createdBy: userId,
          },
        ],
      })) || [];

    if (!post) {
      if (attachments?.length) {
        await deleteFolderFromCloudinary(
          `LinkSphere/users/${userId}/posts/${assetsFolderId}`
        );
      }
      throw new BadRequestException("Fail To Create Post");
    }

    return successResponse({
      res,
      statusCode: 201,
      info: "Post Created Success",
      data: {
        postId: post._id,
        attachments: post.attachments,
      },
    });
  };

  updatePostContent = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    const postId = req.params.postId as unknown as { postId: Types.ObjectId };
    const userId = req.tokenDecoded?._id;

    const post = await this.postModel.findOne({
      filter: {
        _id: postId,
        createdBy: userId,
      },
    });

    if (!post) {
      throw new NotFoundException("Post Not Found");
    }

    const { content, availability, allowComments, addToTags, removeFromTags } =
      req.body.validData;

    const updatedData: string[] = [];

    if (content && post.content !== content) {
      post.content = content;
      updatedData.push("content");
    }

    if (availability && post.availability !== availability) {
      post.availability = availability;
      updatedData.push("availability");
    }

    if (allowComments && post.allowComments !== allowComments) {
      post.allowComments = allowComments;
      updatedData.push("allowComments");
    }

    if (addToTags) {
      const usersNotExists: { _id: Types.ObjectId; index: number }[] = [];
      const usersTagged: { _id: Types.ObjectId; index: number }[] = [];

      await Promise.all(
        addToTags.map(async (_id: Types.ObjectId, index: number) => {
          if (
            !(await this.userModel.findOne({
              filter: { _id },
            }))
          ) {
            usersNotExists.push({
              _id,
              index,
            });
          } else {
            if (post.tags?.includes(_id)) {
              usersTagged.push({
                _id,
                index,
              });
            }
          }
        })
      );

      if (usersNotExists.length) {
        throw new BadRequestException("Some Tagged Users Not Exists", {
          issus: {
            path: "addToTags",
            usersNotExists,
          },
        });
      }

      if (usersTagged.length) {
        throw new BadRequestException(
          "Some Tagged Users Already Tagged Before",
          {
            issus: {
              path: "addToTags",
              usersTagged,
            },
          }
        );
      }

      post.tags?.push(...addToTags);
      updatedData.push("addToTags");
    }

    if (removeFromTags) {
      const usersNotExists: { _id: Types.ObjectId; index: number }[] = [];

      removeFromTags.forEach((_id: Types.ObjectId, index: number) => {
        if (!post.tags?.includes(_id)) {
          usersNotExists.push({
            _id,
            index,
          });
        }
      });

      if (usersNotExists.length) {
        throw new BadRequestException("Some Users Not Exists In Tags", {
          issus: {
            path: "removeFromTags",
            usersNotExists,
          },
        });
      }

      const removeObjectIds = removeFromTags.map((id: string) =>
        typeof id === "string" ? new Types.ObjectId(id) : id
      );

      post.tags =
        post.tags?.filter(
          (tag) => !removeObjectIds.some((u: Types.ObjectId) => u.equals(tag))
        ) || [];

      updatedData.push("removeFromTags");
    }

    if (!updatedData.length) {
      throw new BadRequestException("Fail To Update Post");
    }

    await post.save();

    return successResponse({
      res,
      data: {
        updatedData,
        post,
      },
      statusCode: 200,
      info: "Post Updated Successfully",
    });
  };

  updatePostAttachments = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    const postId = req.params.postId as unknown as { postId: Types.ObjectId };
    const userId = req.tokenDecoded?._id;

    const post = await this.postModel.findOne({
      filter: {
        _id: postId,
        createdBy: userId,
      },
    });

    if (!post) {
      throw new NotFoundException("Post Not Found");
    }

    const updatedData: string[] = [];

    const uploadedFiles = (req.files as Express.Multer.File[]) || [];
    const existingAttachments = post.attachments || [];
    const removedAttachments = req.body.removeFromAttachments || [];

    const totalIfAdded =
      existingAttachments.length -
      removedAttachments.length +
      uploadedFiles.length;

    if (removedAttachments) {
      const imagesNotFound: { id: string; index: number }[] = [];

      const removedIndexes =
        post.attachments?.reduce((indexes: number[], image, index) => {
          const pos = removedAttachments.indexOf(image.public_id);
          if (pos !== -1) {
            indexes.push(index);
          }
          return indexes;
        }, []) || [];

      removedAttachments.forEach((id: string, index: number) => {
        if (!post.attachments?.some((img) => img.public_id === id)) {
          imagesNotFound.push({ id, index });
        }
      });

      if (imagesNotFound.length) {
        throw new BadRequestException("Some Attachments Not Found", {
          issues: [
            {
              path: "removedAttachments",
              message:
                "The following attachments could not be found in this post.",
              info: {
                notFoundIds: imagesNotFound,
                totalNotFound: imagesNotFound.length,
              },
            },
          ],
        });
      }

      if (removedIndexes.length) {
        post.attachments =
          post.attachments?.filter(
            (_, index) => !removedIndexes.includes(index)
          ) || [];

        deleteMultiFromCloudinary(removedAttachments);

        updatedData.push("removeFromAttachments");
      }
    }

    if (uploadedFiles.length) {
      if (totalIfAdded > 5) {
        throw new BadRequestException("Max Attachments Limit Exceeded", {
          issues: [
            {
              path: "addToAttachments",
              message:
                removedAttachments.length > 0
                  ? `After removing ${removedAttachments.length} file(s), you're trying to upload ${uploadedFiles.length} new file(s), which would make a total of ${totalIfAdded}. The maximum allowed is 5.`
                  : `You tried to upload ${uploadedFiles.length} new file(s) while you already have ${existingAttachments.length}. The maximum allowed is 5.`,
              info: {
                currentAttachments: existingAttachments.length,
                removedAttachments: removedAttachments.length,
                newUploads: uploadedFiles.length,
                totalIfAdded,
                limit: 5,
              },
            },
          ],
        });
      }

      const images =
        (await uploadMultiImagesToCloudinary(
          uploadedFiles,
          `LinkSphere/users/${userId}/posts/${post.assetsFolderId}`
        )) || [];

      post.attachments?.push(...images);

      updatedData.push("addToAttachments");
    }

    if (!updatedData.length) {
      throw new BadRequestException("Fail To Update Post");
    }

    await post.save();

    return successResponse({
      res,
      data: { updates: updatedData, post },
      statusCode: 200,
      info: "Post Attachments Updated Successfully",
    });
  };

  getPosts = async (req: Request, res: Response): Promise<Response> => {
    let { page, limit } = req.query as unknown as {
      page: number;
      limit: number;
    };

    const posts = await this.postModel.find({
      filter: {
        $or: postAvailability(req),
      },
      options: {
        populate: [
          {
            path: "author",
            options: {
              sort: { createdAt: -1 },
              select:
                "firstName lastName slug email phone gender picture coverImages",
            },
          },
          {
            path: "lastComment",
            match: { flag: CommentFlagEnum.comment },
            options: {
              sort: { createdAt: -1 },
              select: "-id",
            },
            populate: [
              {
                path: "lastReply",
                match: { flag: CommentFlagEnum.reply },
                options: {
                  sort: { createdAt: -1 },
                },
                select: "-id",
              },
            ],
          },
        ],
      },
      page: page,
      limit,
    });

    return successResponse({
      res,
      data: {
        pagination: posts.pagination,
        posts: posts.data,
      },
    });
  };

  getLikedUsers = async (req: Request, res: Response): Promise<Response> => {
    let { page, limit } = req.query as unknown as {
      page: number;
      limit: number;
    };

    const userFriends = req.user?.friends;
    let postId = req.params.postId;

    const post = await this.postModel.findOne({
      filter: {
        _id: postId,
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

    if (!post) {
      throw new NotFoundException("Post Not Exits");
    }

    if (post && !post.likedUsers?.length) {
      throw new BadRequestException("No Likes For This post");
    }

    const pagination = {
      page: new Number(page) || 1,
      totalPages: Math.ceil((post.likes?.length as number) / (limit || 10)),
      limit: new Number(limit) || 10,
      total: post.likedUsers?.length || 0,
    };

    const users: any[] = [];

    const processedUsers = await Promise.all(
      post.likedUsers?.map(async (u) => {
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

  searchPosts = async (req: Request, res: Response): Promise<Response> => {
    let { page, limit, key, author } = req.query as unknown as {
      page: number;
      limit: number;
      key: string;
      author: string;
    };

    const pageNum = page ? Number(page) : 1;
    const limitNum = limit ? Number(limit) : 10;

    let posts: { data: HPostDocument[]; pagination: any } = {
      data: [],
      pagination: {},
    };

    if (key && author) {
      const data = await this.postModel.find({
        filter: {
          $or: postAvailability(req),
          content: { $regex: new RegExp(key, "i") },
        },
        options: {
          populate: {
            path: "author",
            select: "_id firstName lastName picture userName",
          },
        },
        page: pageNum,
        limit: limitNum,
      });

      const filteredPosts = data.data.filter(
        (post: any) =>
          post.author && new RegExp(author, "i").test(post.author.userName)
      );

      posts.data = filteredPosts;

      posts.pagination = {
        page: data.pagination.page,
        limit: data.pagination.limit,
        totalPages: Math.ceil(filteredPosts.length / data.pagination.limit),
        total: filteredPosts.length,
      };
    }

    if (key && !author) {
      posts = await this.postModel.find({
        filter: { content: { $regex: new RegExp(key, "i") } },
        options: {
          populate: {
            path: "author",
            select: "_id firstName lastName picture userName",
          },
        },
        page: pageNum,
        limit: limitNum,
      });
    }

    if (author && !key) {
      const data = await this.postModel.find({
        filter: {},
        options: {
          populate: {
            path: "author",
            select: "_id firstName lastName picture userName",
          },
        },
        page: pageNum,
        limit: limitNum,
      });

      data.data.map((post: any) => {
        if (new RegExp(author, "i").test(post.author.userName)) {
          posts.data.push(post);
        }
      });

      if (posts.data.length) {
        posts.pagination = {
          page: data.pagination.page,
          limit: data.pagination.limit,
          totalPages: data.pagination.totalPages,
          total: posts.data.length,
        };
      }
    }

    if (!posts.data.length) {
      throw new BadRequestException("Not Matched Posts With Search");
    }

    return successResponse({
      res,
      data: {
        posts: posts.data,
        pagination: posts.pagination,
      },
    });
  };

  getFreezedPosts = async (req: Request, res: Response): Promise<Response> => {
    let { page, limit } = req.query as unknown as {
      page: number;
      limit: number;
    };
    const userId = req.user?._id;

    const posts = await this.postModel.find({
      filter: {
        createdBy: userId,
        freezedAt: { $exists: true },
        pranoId: false,
      },
      page: page,
      limit,
    });

    return successResponse({
      res,
      data: {
        ...(page && posts.pagination),
        count: posts.data.length,
        posts: posts.data,
      },
    });
  };

  getMyPosts = async (req: Request, res: Response): Promise<Response> => {
    let { page, limit } = req.query as unknown as {
      page: number;
      limit: number;
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
              select: "-id",
            },
            populate: [
              {
                path: "lastReply",
                match: { flag: CommentFlagEnum.reply },
                options: {
                  sort: { createdAt: -1 },
                },
                select: "-id",
              },
            ],
          },
        ],
      },
      page: page,
      limit,
    });

    return successResponse({
      res,
      data: {
        ...(page && posts.pagination),
        count: posts.data.length,
        posts: posts.data,
      },
    });
  };

  getUserPosts = async (req: Request, res: Response): Promise<Response> => {
    let { page, limit } = req.query as unknown as {
      page: number;
      limit: number;
    };

    const userId = req.params.userId;

    const posts = await this.postModel.find({
      filter: {
        createdBy: userId,
        $or: postAvailability(req),
      },
      options: {
        populate: [
          {
            path: "author",
            select: "firstName lastName userName picture",
          },
          {
            path: "lastComment",
            match: { flag: CommentFlagEnum.comment },
            options: {
              sort: { createdAt: -1 },
              select: "-id",
            },
            populate: [
              {
                path: "lastReply",
                match: { flag: CommentFlagEnum.reply },
                options: {
                  sort: { createdAt: -1 },
                },
                select: "-id",
              },
            ],
          },
        ],
      },
      page: page,
      limit,
    });

    return successResponse({
      res,
      data: {
        ...(page && posts.pagination),
        count: posts.data.length,
        posts: posts.data,
      },
    });
  };

  getPost = async (req: Request, res: Response): Promise<Response> => {
    const post = await this.postModel.findOne({
      filter: {
        _id: req.params.postId,
        $or: postAvailability(req),
      },
      options: {
        populate: [
          {
            path: "author",
            options: {
              sort: { createdAt: -1 },
              select: "firstName lastName picture",
            },
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
                    select: "firstName lastName picture",
                  },
                },
              ],
              sort: { createdAt: -1 },
              select: "-id",
            },
            populate: [
              {
                path: "lastReply",
                match: { flag: CommentFlagEnum.reply },
                options: {
                  populate: [
                    {
                      path: "author",
                      options: {
                        sort: { createdAt: -1 },
                        select: "firstName lastName picture",
                      },
                    },
                  ],
                  sort: { createdAt: -1 },
                },
                select: "-id",
              },
            ],
          },
        ],
      },
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
          Object.entries(comment).filter(
            ([key]) => key !== "author" && key !== "lastReply"
          )
        ),

        // نحط author الأول
        author: comment.author,

        // بعدين lastReply تحته
        lastReply: comment.lastReply,
      };
    }

    return successResponse({
      res,
      data: postDoc,
    });
  };

  likePost = async (req: Request, res: Response): Promise<Response> => {
    const { postId } = req.params;
    const userId = req.tokenDecoded?._id;

    const post = await this.postModel.findOne({
      filter: {
        _id: postId,
        $or: postAvailability(req),
      },
    });

    if (!post) {
      throw new NotFoundException("Post Not Found!");
    }

    let updateData = {};
    let message: string = "";

    if (post.likes?.includes(userId)) {
      updateData = { $pull: { likes: userId }, $inc: { likesCount: -1 } };
      message = "Post Unlike Success";
    } else {
      updateData = { $addToSet: { likes: userId }, $inc: { likesCount: 1 } };
      message = "Post liked Success";
    }

    const action = await this.postModel.findOneAndUpdate({
      filter: {
        _id: postId,
      },
      updateData,
    });

    if (!action) {
      throw new BadRequestException("Fail To Make This Action");
    }

    if (message === "Post liked Success") {
      getIo()
        .to(connectedSockets.get(post.createdBy.toString()) as string[])
        .emit("likePost", { postId, userId });
    }

    return successResponse({
      res,
      message,
    });
  };

  freezePost = async (req: Request, res: Response): Promise<Response> => {
    const { postId } = req.params;
    const userId = req.tokenDecoded?._id;

    const post = await this.postModel.findOneAndUpdate({
      filter: {
        _id: postId,
        freezedAt: { $exists: false },
        freezedBy: { $exists: false },
      },
      updateData: {
        freezedAt: new Date(),
        freezedBy: userId,
      },
    });

    if (!post) {
      throw new NotFoundException("Post Not Found");
    }

    await this.commentModel.updateMany(
      {
        createdBy: userId,
        freezedAt: { $exists: false },
        freezedBy: { $exists: false },
      },
      {
        $set: {
          freezedAt: new Date(),
          freezedBy: userId,
        },
      }
    );

    return successResponse({
      res,
      message: "Post freezed Success",
    });
  };

  unfreezePost = async (req: Request, res: Response): Promise<Response> => {
    const { postId } = req.params;
    const userId = req.tokenDecoded?._id;

    const post = await this.postModel.findOneAndUpdate({
      filter: {
        _id: postId,
        freezedAt: { $exists: true },
        freezedBy: userId,
        pranoId: false,
      },
      updateData: {
        $set: {
          restoredAt: new Date(),
          restoredBy: userId,
        },
        $unset: {
          freezedAt: "",
          freezedBy: "",
        },
      },
    });

    if (!post) {
      throw new NotFoundException(
        "Post Not Found Or No Authorized To Unfreeze"
      );
    }

    await this.commentModel.updateMany(
      {
        createdBy: userId,
        freezedAt: { $exists: true },
        freezedBy: { $exists: true },
      },
      {
        $set: {
          restoredAt: new Date(),
          restoredBy: userId,
        },
        $unset: {
          freezedAt: "",
          freezedBy: "",
        },
      }
    );

    return successResponse({
      res,
      message: "Post Un freezed Success",
    });
  };

  deletePost = async (req: Request, res: Response): Promise<Response> => {
    const { postId } = req.params;

    const post = await this.postModel.findOne({
      filter: {
        _id: postId,
      },
    });

    if (!post) {
      throw new NotFoundException("Post Not Found");
    }

    if (
      req.user?.role === RoleEnum.user &&
      post?.createdBy.toString() !== req.user._id.toString()
    ) {
      throw new NotFoundException("Not Authorized To Remove Post");
    }

    await Promise.all([
      this.postModel.deleteOne({
        _id: postId,
      }),

      post.assetsFolderId
        ? deleteFolderFromCloudinary(
            `LinkSphere/users/${post.createdBy}/posts/${post.assetsFolderId}`
          )
        : Promise.resolve(),

      this.commentModel.deleteMany({
        postId,
      }),
    ]);

    return successResponse({
      res,
      message: "Post Deleted Success",
    });
  };

  // GQL

  allPosts = async (args: { page: number; limit: number }, user: any) => {
    const posts = await this.postModel.find({
      filter: {
        $or: [
          { availability: AvailabilityEnum.public },
          { availability: AvailabilityEnum.onlyMe, createdBy: user._id },
          {
            availability: AvailabilityEnum.friends,
            createdBy: { $in: [...(user?.friends || []), user._id] },
          },
          {
            availability: { $ne: AvailabilityEnum.onlyMe },
            tags: { $in: user?._id },
          },
        ],
      },
      options: {
        populate: [
          {
            path: "comments",
            match: { flag: CommentFlagEnum.comment },
            options: {
              sort: { createdAt: -1 },
              select: "-id",
            },
          },
        ],
      },
      limit: args.limit,
      page: args.page,
    });

    return {
      count: posts.data.length,
      page: posts.pagination.page,
      limit: posts.pagination.limit,
      posts: posts.data,
    };
  };

  searchForPost = async (args: {
    key: string;
    page: number;
    limit: number;
  }) => {
    const posts = await this.postModel.find({
      filter: {
        content: { $regex: args.key, $options: "i" },
      },
      limit: args.limit,
      page: args.page,
    });

    return {
      count: posts.data.length,
      page: posts.pagination.page,
      limit: posts.pagination.limit,
      posts: posts.data,
    };
  };
}
