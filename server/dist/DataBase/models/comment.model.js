"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommentModel = exports.CommentFlagEnum = void 0;
const mongoose_1 = require("mongoose");
var CommentFlagEnum;
(function (CommentFlagEnum) {
    CommentFlagEnum["comment"] = "comment";
    CommentFlagEnum["reply"] = "reply";
})(CommentFlagEnum || (exports.CommentFlagEnum = CommentFlagEnum = {}));
const commentSchima = new mongoose_1.Schema({
    flag: { type: String, enum: CommentFlagEnum, default: CommentFlagEnum.comment },
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    postId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Post", required: true },
    commentId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Comment" },
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
commentSchima.pre(["updateOne", "findOne", "find"], function (next) {
    const query = this.getQuery();
    if (query.pranoId === false) {
        this.setQuery({ ...query });
    }
    else {
        this.setQuery({ ...query, freezedAt: { $exists: false } });
    }
    next();
});
exports.CommentModel = mongoose_1.models.Comment || (0, mongoose_1.model)("Comment", commentSchima);
