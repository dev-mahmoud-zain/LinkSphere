import z from "zod"
import * as validators from "../auth.validation"

export type I_loginBodyInputs = z.infer<typeof validators.login.body>

export type I_SignupBodyInputs = z.infer<typeof validators.signup.body>

export type I_ConfirmEmailInputs = z.infer<typeof validators.confirmEmail.body>

export type I_ReSendConfirmEmailIOTPInputs = z.infer<typeof validators.reSendConfirmOTP.body>

export type IVerifyToken = z.infer<typeof validators.verifyToken.body>

export type ILogout = z.infer<typeof validators.logout.body>

export type ISignupWithGmail = z.infer<typeof validators.signupWithGmail.body>

// export type IChangePassword = z.infer<typeof validators.changePassword.body>

export type IForgetPassword = z.infer<typeof validators.forgetPassword.body>

export type IResendForgetPasswordOTP = z.infer<typeof validators.forgetPassword.body>

export type IChangeForgetPassword = z.infer<typeof validators.changeForgetPassword.body>