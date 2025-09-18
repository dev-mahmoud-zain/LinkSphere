"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.likePost = exports.getPosts = exports.getPost = exports.updatePost = exports.createPost = void 0;
const zod_1 = __importDefault(require("zod"));
const post_model_1 = require("../../DataBase/models/post.model");
const validation_middleware_1 = require("../../middlewares/validation.middleware");
const cloud__multer_1 = require("../../utils/multer/cloud.,multer");
exports.createPost = {
    body: zod_1.default.strictObject({
        content: zod_1.default.string().min(2).max(50000).optional(),
        attachments: zod_1.default.array(validation_middleware_1.generalFields.file(cloud__multer_1.fileValidation.image)).max(2).optional(),
        availability: zod_1.default.enum(post_model_1.AvailabilityEnum).default(post_model_1.AvailabilityEnum.public),
        allowCommentsEnum: zod_1.default.enum(post_model_1.AllowCommentsEnum).default(post_model_1.AllowCommentsEnum.allow),
        tags: zod_1.default.array(validation_middleware_1.generalFields.id).max(10).optional()
    }).superRefine((data, context) => {
        if (!data.attachments?.length && !data.content) {
            context.addIssue({
                code: "custom",
                path: ["content"],
                message: "Cannot Make Post Without Content Or Attacments"
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
exports.updatePost = {
    params: zod_1.default.strictObject({
        postId: validation_middleware_1.generalFields.id,
    }),
    body: zod_1.default.strictObject({
        content: zod_1.default.string().min(2).max(50000).optional(),
        attachments: zod_1.default.array(validation_middleware_1.generalFields.file(cloud__multer_1.fileValidation.image)).max(2).optional(),
        removedAttachments: zod_1.default.array(zod_1.default.string()).max(2).optional(),
        availability: zod_1.default.enum(post_model_1.AvailabilityEnum).optional(),
        allowCommentsEnum: zod_1.default.enum(post_model_1.AllowCommentsEnum).optional(),
        tags: zod_1.default.array(validation_middleware_1.generalFields.id).max(10).optional(),
        removedTags: zod_1.default.array(validation_middleware_1.generalFields.id).max(10).optional()
    }).superRefine((data, context) => {
        if (!Object.values(data)?.length) {
            context.addIssue({
                code: "custom",
                message: "All Fields Are Empty"
            });
        }
        if (data.tags?.length && data.tags.length !== [...new Set(data.tags)].length) {
            context.addIssue({
                code: "custom",
                path: ["tags"],
                message: "Duplicated Tagged Users"
            });
        }
        if (data.removedTags?.length && data.removedTags.length !== [...new Set(data.removedTags)].length) {
            context.addIssue({
                code: "custom",
                path: ["removedTags"],
                message: "Duplicated Removed Tagged Users"
            });
        }
    })
};
exports.getPost = {
    params: zod_1.default.strictObject({
        postId: validation_middleware_1.generalFields.id
    })
};
exports.getPosts = {
    query: zod_1.default.strictObject({
        page: zod_1.default.coerce.number().positive().min(1).max(10).optional(),
        limit: zod_1.default.coerce.number().positive().min(1).max(50).optional()
    })
};
exports.likePost = {
    params: exports.getPost.params.extend({})
};
