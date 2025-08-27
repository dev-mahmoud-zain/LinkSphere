import { Router } from "express";
import AuthenticationServices from "./auth.service";
import { validationMiddleware } from "../../middlewares/validation.middleware";
import * as authValidators from "./auth.validation"

const authRouter = Router();


authRouter.post("/signup",
    validationMiddleware(authValidators.signup),
    AuthenticationServices.signup);

authRouter.patch("/confirm-email",
    validationMiddleware(authValidators.confirmEmail),
    AuthenticationServices.confirmEmail);

authRouter.post("/re-send-confirm-email-otp",
    validationMiddleware(authValidators.reSendConfirmOTP),
    AuthenticationServices.reSendConfirmOTP);

authRouter.post("/login",
    validationMiddleware(authValidators.login),
    AuthenticationServices.login);

// authRouter.post("/verify-token",
//     validationMiddleware(authValidators.verifyToken),
//     AuthenticationServices.verifyToken);


export default authRouter;