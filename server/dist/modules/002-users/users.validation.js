"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.confirmUpdateEmail = exports.updateEmail = exports.updateBasicInfo = exports.changePassword = exports.deleteAccount = exports.freezAccount = void 0;
const zod_1 = __importDefault(require("zod"));
const validation_middleware_1 = require("../../middlewares/validation.middleware");
exports.freezAccount = {
    params: zod_1.default.object({
        userId: validation_middleware_1.generalFields.id.optional()
    })
};
exports.deleteAccount = {
    params: zod_1.default.object({
        userId: validation_middleware_1.generalFields.id
    })
};
exports.changePassword = {
    body: zod_1.default.object({
        oldPassword: validation_middleware_1.generalFields.password,
        newPassword: validation_middleware_1.generalFields.password,
        confirmNewPassword: zod_1.default.string()
    }).superRefine((data, ctx) => {
        if (data.newPassword !== data.confirmNewPassword) {
            ctx.addIssue({
                code: "custom",
                path: ["confirmNewPassword"],
                message: "newPassword and confirmNewPassword must be the same."
            });
        }
        if (data.oldPassword === data.newPassword) {
            ctx.addIssue({
                code: "custom",
                path: ["oldPassword"],
                message: "Old Password And New Password Cannot Be The Same."
            });
        }
    })
};
exports.updateBasicInfo = {
    body: zod_1.default
        .object({
        userName: validation_middleware_1.generalFields.userName.optional(),
        phone: validation_middleware_1.generalFields.phone.optional(),
        gender: validation_middleware_1.generalFields.gender.optional(),
    })
        .strict()
        .superRefine((data, ctx) => {
        if (!data.userName && !data.phone && !data.gender) {
            ctx.addIssue({
                code: "custom",
                message: "No Input Data To Update!",
                path: ["userName", "phone", "gender"]
            });
        }
    }),
};
exports.updateEmail = {
    body: zod_1.default
        .strictObject({
        email: validation_middleware_1.generalFields.email
    })
};
exports.confirmUpdateEmail = {
    body: zod_1.default.strictObject({
        OTP: validation_middleware_1.generalFields.OTP,
    })
};
