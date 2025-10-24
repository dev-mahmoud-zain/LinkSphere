import { HydratedDocument, model, models, Schema, Types } from "mongoose";
import { IPost } from "./post.model";

export enum CommentFlagEnum {
    comment = "comment",
    reply = "reply"
}

export interface IComment {
    flag: CommentFlagEnum;
    createdBy: Types.ObjectId;
    postId: Types.ObjectId | Partial<IPost>;
    commentId?: Types.ObjectId;

    content?: string;
    attachment?: string;

    tags?: Types.ObjectId[];
    likes?: Types.ObjectId[];

    freezeedAt?: Date;
    freezeedBy?: Types.ObjectId;

    restoredAt?: Date;
    restoredBy?: Types.ObjectId;

    cretedAt: Date;
    updatedAt?: Date;
}

export type HCommentDocument = HydratedDocument<IComment>;

const commentSchema = new Schema<IComment>({
    flag: { type: String, enum: CommentFlagEnum, default: CommentFlagEnum.comment },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    postId: { type: Schema.Types.ObjectId, ref: "Post", required: true },
    commentId: { type: Schema.Types.ObjectId, ref: "Comment" },

    content: {
        type: String, required: function () {
            return !this.attachment?.length;
        }
    },
    attachment: {
        type: String, required: function () {
            return !this.content;
        }
    },

    tags: { type: [Schema.Types.ObjectId], ref: "User" },
    likes: { type: [Schema.Types.ObjectId], ref: "User" },

    freezeedAt: Date,
    freezeedBy: { type: Schema.Types.ObjectId, ref: "User" },

    restoredAt: Date,
    restoredBy: { type: Schema.Types.ObjectId, ref: "User" },

    cretedAt: Date,
    updatedAt: Date,

}, {
    timestamps: true,
    strictQuery: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

commentSchema.virtual("lastReply", {
    localField: "_id",
    foreignField: "commentId",
    ref: "Comment",
    justOne: true,
})

commentSchema.virtual("author", {
    localField: "createdBy",
    foreignField: "_id",
    ref: "User",
    justOne: true,
})



commentSchema.pre(["updateOne", "findOne", "find"], function (next) {
    const query = this.getQuery();
    if (query.pranoId === false) {
        this.setQuery({ ...query });
    }
    else {
        this.setQuery({ ...query, freezeedAt: { $exists: false } });
    }
    next()
});

export const CommentModel = models.Comment || model("Comment", commentSchema);