"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.replyOnComment = exports.createComment = void 0;
const zod_1 = __importDefault(require("zod"));
const validation_middleware_1 = require("../../middlewares/validation.middleware");
const cloud__multer_1 = require("../../utils/multer/cloud.,multer");
exports.createComment = {
    params: zod_1.default.strictObject({
        postId: validation_middleware_1.generalFields.id
    }),
    body: zod_1.default.strictObject({
        content: zod_1.default.string().min(2).max(50000).optional(),
        attachment: validation_middleware_1.generalFields.file(cloud__multer_1.fileValidation.image).optional(),
        tags: zod_1.default.array(validation_middleware_1.generalFields.id).max(10).optional()
    }).superRefine((data, context) => {
        if (!data.attachment && !data.content) {
            context.addIssue({
                code: "custom",
                path: ["content"],
                message: "Cannot Make Post Without Content Or image"
            });
        }
        if (data.tags?.length && data.tags.length !== [...new Set(data.tags)].length) {
            context.addIssue({
                code: "custom",
                path: ["tags"],
                message: "Duplicated Tagged Users"
            });
        }
    })
};
exports.replyOnComment = {
    params: exports.createComment.params.extend({
        commentId: validation_middleware_1.generalFields.id
    }),
    body: exports.createComment.body.extend({})
};
