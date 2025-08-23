import z from "zod"
import * as validators from "../auth.validation"

export type I_loginBodyInputs = z.infer<typeof validators.login.body>

export type I_SignupBodyInputs = z.infer<typeof validators.signup.body>

export type I_ConfirmEmailInputs = z.infer<typeof validators.confirmEmail.body>

export type I_ReSendConfirmEmailIOTPInputs = z.infer<typeof validators.reSendConfirmEmailOTP.body>

export type IVerifyToken = z.infer<typeof validators.verifyToken.body>