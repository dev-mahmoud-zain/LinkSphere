"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyLoginOTPCode = exports.verifyEnableTwoSetupVerification = exports.changeForgetPassword = exports.frogetPassword = exports.signupWithGmail = exports.logout = exports.verifyToken = exports.confirmEmail = exports.reSendConfirmOTP = exports.signup = exports.login = void 0;
const zod_1 = require("zod");
const validation_middleware_1 = require("../../middlewares/validation.middleware");
const user_model_1 = require("../../DataBase/models/user.model");
const token_security_1 = require("../../utils/security/token.security");
exports.login = {
    body: zod_1.z.strictObject({
        email: validation_middleware_1.generalFields.email,
        password: validation_middleware_1.generalFields.password,
    })
};
exports.signup = {
    body: exports.login.body.extend({
        userName: validation_middleware_1.generalFields.userName,
        confirmPassword: zod_1.z.string(),
        phone: validation_middleware_1.generalFields.phone.optional(),
        gender: zod_1.z.enum(user_model_1.GenderEnum).default(user_model_1.GenderEnum.male)
    }).superRefine((data, ctx) => {
        if (data.password !== data.confirmPassword) {
            ctx.addIssue({
                code: "custom",
                path: ["confirmPassword"],
                message: "Password and confirm password must be the same."
            });
        }
        if (data.userName.split(" ").length !== 2) {
            ctx.addIssue({
                code: "custom",
                path: ["userName"],
                message: "User Name Must Include First And Last Name Example:[Adham Zain]"
            });
        }
    })
};
exports.reSendConfirmOTP = {
    body: zod_1.z.strictObject({
        email: validation_middleware_1.generalFields.email,
    })
};
exports.confirmEmail = {
    body: exports.reSendConfirmOTP.body.extend({
        OTP: validation_middleware_1.generalFields.OTP
    })
};
exports.verifyToken = {
    body: zod_1.z.object({
        tokenType: zod_1.z.enum(token_security_1.TokenTypeEnum).default(token_security_1.TokenTypeEnum.accses),
        token: validation_middleware_1.generalFields.token
    })
};
exports.logout = {
    body: zod_1.z.object({
        logoutFlag: zod_1.z.enum(token_security_1.LogoutFlagEnum).default(token_security_1.LogoutFlagEnum.current),
    })
};
exports.signupWithGmail = {
    body: zod_1.z.object({
        idToken: zod_1.z.string()
    })
};
exports.frogetPassword = {
    body: zod_1.z.object({
        email: validation_middleware_1.generalFields.email
    })
};
exports.changeForgetPassword = {
    body: zod_1.z.object({
        email: validation_middleware_1.generalFields.email,
        OTP: validation_middleware_1.generalFields.OTP,
        newPassword: validation_middleware_1.generalFields.password,
        confirmNewPassword: zod_1.z.string()
    }).superRefine((data, ctx) => {
        if (data.newPassword !== data.confirmNewPassword) {
            ctx.addIssue({
                code: "custom",
                path: ["confirmNewPassword"],
                message: "newPassword and confirmNewPassword must be the same."
            });
        }
    })
};
exports.verifyEnableTwoSetupVerification = {
    body: zod_1.z.strictObject({
        OTP: validation_middleware_1.generalFields.OTP,
    })
};
exports.verifyLoginOTPCode = {
    body: zod_1.z.strictObject({
        OTP: validation_middleware_1.generalFields.OTP,
        email: validation_middleware_1.generalFields.email
    })
};
