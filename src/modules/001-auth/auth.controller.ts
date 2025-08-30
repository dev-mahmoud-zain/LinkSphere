import { Router } from "express";
import AuthenticationServices from "./auth.service";
import { validationMiddleware } from "../../middlewares/validation.middleware";
import * as authValidators from "./auth.validation"
import { authenticationMiddeware } from "../../middlewares/authentication.middleware";
import { TokenTypeEnum } from "../../utils/security/token.security";

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

authRouter.post("/signup-with-gmail",
    validationMiddleware(authValidators.signupWithGmail),
    AuthenticationServices.signupWithGmail);


authRouter.post("/login",
    validationMiddleware(authValidators.login),
    AuthenticationServices.login);


authRouter.post("/logout",
    validationMiddleware(authValidators.logout),
    authenticationMiddeware(),
    AuthenticationServices.logout);


authRouter.get("/refresh-token",
    authenticationMiddeware(TokenTypeEnum.refresh),
    AuthenticationServices.refreshToken);


authRouter.post("/forget-password",
    validationMiddleware(authValidators.frogetPassword),
    AuthenticationServices.frogetPassword);


authRouter.post("/resend-forget-password-otp",
    validationMiddleware(authValidators.frogetPassword),
    AuthenticationServices.reSendForgetPasswordOTP);

authRouter.post("/change-forget-password",
    validationMiddleware(authValidators.changeForgetPassword),
    AuthenticationServices.confirmForgetPasswordOTP(),
    AuthenticationServices.changeForgetPassword);





// authRouter.post("/verify-token",
//     validationMiddleware(authValidators.verifyToken),
//     AuthenticationServices.verifyToken);


export default authRouter;