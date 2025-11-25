import { HydratedDocument, model, models, Schema, Types } from "mongoose";
import { HUserDocument, IUser, UserModel } from "./user.model";
import { UserRepository } from "../repository";
import { emailEvent } from "../../utils/email/email.events";
import { IImage } from "../../utils/cloudinary/cloudinary.interface";

const userModel = new UserRepository(UserModel);

export enum allowCommentsEnum {
  allow = "allow",
  deny = "deny",
}

export enum AvailabilityEnum {
  public = "public",
  friends = "friends",
  onlyMe = "only-me",
}

export interface IPost {
  createdBy: Types.ObjectId;

  content?: string;
  attachments?: IImage[];
  assetsFolderId: string;

  availability?: AvailabilityEnum;
  except?: Types.ObjectId[];
  only?: Types.ObjectId[];
  allowComments: allowCommentsEnum;

  commentsCount:number;

  tags?: Types.ObjectId[];
  likes?: Types.ObjectId[];
  likesCount:number;

  freezedAt?: Date;
  freezedBy?: Types.ObjectId;

  restoredAt?: Date;
  restoredBy?: Types.ObjectId;

  cretedAt: Date;
  updatedAt?: Date;

  likedUsers?: IUser[];
}

export type HPostDocument = HydratedDocument<IPost>;

const postSchema = new Schema<IPost>(
  {
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },

    content: {
      type: String,
      required: function () {
        return !this.attachments?.length;
      },
    },

    attachments: {
      type: [
        new Schema(
          {
            url: { type: String, required: true },
            public_id: { type: String, required: true },
          },
          { _id: false } 
        ),
      ],
      required: false,
    },

    assetsFolderId: { type: String },
    availability: {
      type: String,
      enum: AvailabilityEnum,
      default: AvailabilityEnum.public,
    },
    except: [{ type: [Schema.Types.ObjectId], ref: "User" }],
    only: [{ type: [Schema.Types.ObjectId], ref: "User" }],

    allowComments: {
      type: String,
      enum: allowCommentsEnum,
      default: allowCommentsEnum.allow,
    },

    commentsCount:{type:Number,default :0},

    tags: { type: [Schema.Types.ObjectId], ref: "User" },
    likes: { type: [Schema.Types.ObjectId], ref: "User" },
    likesCount:{type:Number,default:0},
    
    freezedAt: Date,
    freezedBy: { type: Schema.Types.ObjectId, ref: "User" },

    restoredAt: Date,
    restoredBy: { type: Schema.Types.ObjectId, ref: "User" },

    cretedAt: Date,
    updatedAt: Date,
  },
  {
    timestamps: true,
    strictQuery: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

postSchema.virtual("author", {
  localField: "createdBy",
  foreignField: "_id",
  ref: "User",
  justOne: true,
});

postSchema.virtual("lastComment", {
  localField: "_id",
  foreignField: "postId",
  ref: "Comment",
  justOne: true,
});

postSchema.virtual("comments", {
  localField: "_id",
  foreignField: "postId",
  ref: "Comment",
});


postSchema.virtual("likedUsers", {
  ref: "User",
  localField: "likes",
  foreignField: "_id",
  justOne: false
});


postSchema.pre(
  "save",

  async function (
    this: HPostDocument & {
      _tags: Types.ObjectId[] | undefined;
      _postId: Types.ObjectId;
      _createdBy: Types.ObjectId;
    }
  ) {
    if (this.modifiedPaths().includes("tags")) {
      this._tags = this.tags;
      this._postId = this._id;
      this._createdBy = this.createdBy;
    }
  }
);

postSchema.post(
  "save",
  async function (
    this: HPostDocument & {
      _tags?: Types.ObjectId[];
      _postId: Types.ObjectId;
      _createdBy: Types.ObjectId;
    }
  ) {
    let users: HUserDocument[] = [];

    if (this._tags?.length) {
      const result = await userModel.find({
        filter: { _id: { $in: this._tags } },
      });
      users = result.data as HUserDocument[];
    }

    if (users.length) {
      const postLink = `${process.env.BASE_URL}/posts/${this._postId}`;

      const mentionedBy = await userModel.findOne({
        filter: { _id: this._createdBy },
      });

      for (const user of users) {
        emailEvent.emit("mentionedInPost", {
          to: user.email,
          postLink,
          mentionedBy: mentionedBy?.userName,
        });
      }
    }
  }
);

postSchema.pre(["updateOne", "findOne", "find"], function (next) {
  const query = this.getQuery();
  if (query.pranoId === false) {
    this.setQuery({ ...query });
  } else {
    this.setQuery({ ...query, freezedAt: { $exists: false } });
  }
  next();
});

export const PostModel = models.Post || model("post", postSchema);