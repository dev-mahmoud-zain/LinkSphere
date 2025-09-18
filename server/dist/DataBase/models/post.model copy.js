"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostModel = exports.AvailabilityEnum = exports.AllowCommentsEnum = void 0;
const mongoose_1 = require("mongoose");
const user_model_1 = require("./user.model");
const repository_1 = require("../repository");
const email_events_1 = require("../../utils/email/email.events");
const userModel = new repository_1.UserRepository(user_model_1.UserModel);
var AllowCommentsEnum;
(function (AllowCommentsEnum) {
    AllowCommentsEnum["allow"] = "allow";
    AllowCommentsEnum["deny"] = "deny";
})(AllowCommentsEnum || (exports.AllowCommentsEnum = AllowCommentsEnum = {}));
var AvailabilityEnum;
(function (AvailabilityEnum) {
    AvailabilityEnum["public"] = "public";
    AvailabilityEnum["friends"] = "friends";
    AvailabilityEnum["onlyMe"] = "only-me";
})(AvailabilityEnum || (exports.AvailabilityEnum = AvailabilityEnum = {}));
const postSchima = new mongoose_1.Schema({
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
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
    except: [{ type: [mongoose_1.Schema.Types.ObjectId], ref: "User" }],
    only: [{ type: [mongoose_1.Schema.Types.ObjectId], ref: "User" }],
    allowComments: { type: String, enum: AllowCommentsEnum, default: AllowCommentsEnum.allow },
    tags: { type: [mongoose_1.Schema.Types.ObjectId], ref: "User" },
    likes: { type: [mongoose_1.Schema.Types.ObjectId], ref: "User" },
    freezedAt: Date,
    freezedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
    restoredAt: Date,
    restoredBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
    cretedAt: Date,
    updatedAt: Date,
}, {
    timestamps: true,
    strictQuery: true,
});
postSchima.pre("save", async function () {
    if (this.modifiedPaths().includes("tags")) {
        this._tags = this.tags;
        this._postId = this._id;
        this._createdBy = this.createdBy;
    }
});
postSchima.post("save", async function () {
    let users = [];
    if (this._tags?.length) {
        const result = await userModel.find({
            filter: { _id: { $in: this._tags } }
        });
        users = result.data;
    }
    if (users.length) {
        const postLink = `${process.env.BASE_URL}/posts/${this._postId}`;
        const mentionedBy = await userModel.findOne({
            filter: { _id: this._createdBy }
        });
        for (const user of users) {
            email_events_1.emailEvent.emit("mentionedInPost", { to: user.email, postLink, mentionedBy: mentionedBy?.userName });
        }
    }
});
postSchima.pre(["updateOne", "findOne", "find"], function (next) {
    const query = this.getQuery();
    if (query.pranoId === false) {
        this.setQuery({ ...query });
    }
    else {
        this.setQuery({ ...query, freezedAt: { $exists: false } });
    }
    next();
});
exports.PostModel = mongoose_1.models.Post || (0, mongoose_1.model)("post", postSchima);
