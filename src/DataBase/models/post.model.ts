import { HydratedDocument, model, models, Schema, Types } from "mongoose";
import { HUserDocument, UserModel } from "./user.model";
import { UserRepository } from "../repository";
import { emailEvent } from "../../utils/email/email.events";

const userModel = new UserRepository(UserModel);


export enum AllowCommentsEnum {
    allow = "allow",
    deny = "deny"
}

export enum AvailabilityEnum {
    public = "public",
    friends = "friends",
    onlyMe = "only-me"
}

export interface IPost {
    createdBy: Types.ObjectId;

    content?: string;
    attachments?: string[];
    assetsFolderId: string;

    availability?: AvailabilityEnum;
    except?: Types.ObjectId[];
    only?: Types.ObjectId[];
    allowComments: AllowCommentsEnum;

    tags?: Types.ObjectId[];
    likes?: Types.ObjectId[];

    freezeedAt?: Date;
    freezeedBy?: Types.ObjectId;

    restoredAt?: Date;
    restoredBy?: Types.ObjectId;

    cretedAt: Date;
    updatedAt?: Date;
}

export type HPostDocument = HydratedDocument<IPost>;

const postSchima = new Schema<IPost>({

    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },

    content: {
        type: String, required: function () {
            return !this.attachments?.length;
        }
    },
    attachments: {
        type: [String], required: function () {
            return !this.content;
        }
    },
    assetsFolderId: { type: String, required: true },

    availability: { type: String, enum: AvailabilityEnum, default: AvailabilityEnum.public },
    except: [{ type: [Schema.Types.ObjectId], ref: "User" }],
    only: [{ type: [Schema.Types.ObjectId], ref: "User" }],

    allowComments: { type: String, enum: AllowCommentsEnum, default: AllowCommentsEnum.allow },

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
    toObject: { virtuals: true }
});


postSchima.virtual("author", {
    localField: "createdBy",
    foreignField: "_id",
    ref: "User",
    justOne: true
})

postSchima.virtual("lastComment", {
    localField: "_id",
    foreignField: "postId",
    ref: "Comment",
    justOne: true,
})

postSchima.virtual("comments", {
    localField: "_id",
    foreignField: "postId",
    ref: "Comment",
})


postSchima.pre("save",

    async function (this: HPostDocument & { _tags: Types.ObjectId[] | undefined, _postId: Types.ObjectId, _createdBy: Types.ObjectId }) {

        if (this.modifiedPaths().includes("tags")) {
            this._tags = this.tags;
            this._postId = this._id;
            this._createdBy = this.createdBy;
        }

    });

postSchima.post("save",
    async function (this: HPostDocument & { _tags?: Types.ObjectId[], _postId: Types.ObjectId, _createdBy: Types.ObjectId }) {

        let users: HUserDocument[] = [];

        if (this._tags?.length) {
            const result = await userModel.find({
                filter: { _id: { $in: this._tags } }
            });
            users = result.data as HUserDocument[];
        }


        if (users.length) {
            const postLink = `${process.env.BASE_URL}/posts/${this._postId}`

            const mentionedBy = await userModel.findOne({
                filter: { _id: this._createdBy }
            });

            for (const user of users) {
                emailEvent.emit("mentionedInPost", { to: user.email, postLink, mentionedBy: mentionedBy?.userName });
            }

        }

    }
);

postSchima.pre(["updateOne", "findOne", "find"], function (next) {
    const query = this.getQuery();
    if (query.pranoId === false) {
        this.setQuery({ ...query });
    }
    else {
        this.setQuery({ ...query, freezeedAt: { $exists: false } });
    }
    next()
});

export const PostModel = models.Post || model("post", postSchima);