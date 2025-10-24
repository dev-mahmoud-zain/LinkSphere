import {  z } from "zod";
import { generalFields } from "../../middlewares/validation.middleware";
import { GenderEnum } from "../../DataBase/models/user.model";
import { LogoutFlagEnum, TokenTypeEnum } from "../../utils/security/token.security";


export const login = {
    body: z.strictObject({
        email: generalFields.email,
        password: generalFields.password,
    })
}

export const signup = {

    body: login.body.extend({
        userName: generalFields.userName,
        confirmPassword: z.string(),
        phone: generalFields.phone.optional(),
        gender: z.enum(GenderEnum).default(GenderEnum.male)
    }).superRefine((data, ctx) => {
        if (data.password !== data.confirmPassword) {
            ctx.addIssue({
                code: "custom",
                path: ["confirmPassword"],
                message: "Password and confirm password must be the same."
            })
        }
        if (data.userName.split(" ").length !== 2) {
            ctx.addIssue({
                code: "custom",
                path: ["userName"],
                message: "User Name Must Include First And Last Name Example:[Adham Zain]"
            })
        }
    })

}

export const reSendConfirmOTP = {
    body: z.strictObject({
        email: generalFields.email,
    })
}

export const confirmEmail = {
    body: reSendConfirmOTP.body.extend({
        OTP: generalFields.OTP
    })
}

export const verifyToken = {
    body: z.object({
        tokenType: z.enum(TokenTypeEnum).default(TokenTypeEnum.access),
        token: generalFields.token
    })
}

export const logout = {
    body: z.object({
        logoutFlag: z.enum(LogoutFlagEnum).default(LogoutFlagEnum.current),
    })
}

export const signupWithGmail = {
    body: z.object({
        idToken: z.string()
    })
}

export const forgetPassword = {
    body: z.object({
        email: generalFields.email
    })
}

export const changeForgetPassword = {
    body: z.object({
        email: generalFields.email,
        OTP: generalFields.OTP,
        newPassword: generalFields.password,
        confirmNewPassword: z.string()
    }).superRefine((data, ctx) => {
        if (data.newPassword !== data.confirmNewPassword) {
            ctx.addIssue({
                code: "custom",
                path: ["confirmNewPassword"],
                message: "newPassword and confirmNewPassword must be the same."
            })
        }
    })
}

export const verifyEnableTwoSetupVerification = {
    body: z.strictObject({
        OTP: generalFields.OTP,
    })
}

export const verifyLoginOTPCode = {
    body: z.strictObject({
        OTP: generalFields.OTP,
        email: generalFields.email
    })
}