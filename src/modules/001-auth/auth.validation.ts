import { z } from "zod";
import { generalFields } from "../../middlewares/validation.middleware";


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
        gender: z.enum(["male", "female"]).default("male")
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

export const reSendConfirmEmailOTP = {
    body: z.strictObject({
        email: generalFields.email,
    })
}

export const confirmEmail = {
    body: reSendConfirmEmailOTP.body.extend({
        OTP: generalFields.OTP
    })
}


export const verifyToken = {
    body: z.object({
        tokenType: z.enum(["access_token","refresh_token"]),
        token: generalFields.token
    })
}