"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_service_1 = __importDefault(require("./auth.service"));
const validation_middleware_1 = require("../../middlewares/validation.middleware");
const authValidators = __importStar(require("./auth.validation"));
const authentication_middleware_1 = require("../../middlewares/authentication.middleware");
const token_security_1 = require("../../utils/security/token.security");
const router = (0, express_1.Router)();
router.post("/signup", (0, validation_middleware_1.validationMiddleware)(authValidators.signup), auth_service_1.default.signup);
router.patch("/confirm-email", (0, validation_middleware_1.validationMiddleware)(authValidators.confirmEmail), auth_service_1.default.confirmEmail);
router.post("/re-send-confirm-email-otp", (0, validation_middleware_1.validationMiddleware)(authValidators.reSendConfirmOTP), auth_service_1.default.reSendConfirmOTP);
router.post("/signup-with-gmail", (0, validation_middleware_1.validationMiddleware)(authValidators.signupWithGmail), auth_service_1.default.signupWithGmail);
router.post("/login", (0, validation_middleware_1.validationMiddleware)(authValidators.login), auth_service_1.default.login);
router.post("/login/verify-otp-code", (0, validation_middleware_1.validationMiddleware)(authValidators.verifyLoginOTPCode), auth_service_1.default.verifyLoginOTPCode);
router.post("/logout", (0, validation_middleware_1.validationMiddleware)(authValidators.logout), (0, authentication_middleware_1.authenticationMiddeware)(), auth_service_1.default.logout);
router.get("/refresh-token", (0, authentication_middleware_1.authenticationMiddeware)(token_security_1.TokenTypeEnum.refresh), auth_service_1.default.refreshToken);
router.post("/forget-password", (0, validation_middleware_1.validationMiddleware)(authValidators.frogetPassword), auth_service_1.default.frogetPassword);
router.post("/resend-forget-password-otp", (0, validation_middleware_1.validationMiddleware)(authValidators.frogetPassword), auth_service_1.default.reSendForgetPasswordOTP);
router.post("/change-forget-password", (0, validation_middleware_1.validationMiddleware)(authValidators.changeForgetPassword), auth_service_1.default.confirmForgetPasswordOTP(), auth_service_1.default.changeForgetPassword);
router.patch("/change-two-setup-verification", (0, authentication_middleware_1.authenticationMiddeware)(), auth_service_1.default.changeTwoSetupVerification);
router.patch("/verify-enable-two-setup-verification", (0, authentication_middleware_1.authenticationMiddeware)(), (0, validation_middleware_1.validationMiddleware)(authValidators.verifyEnableTwoSetupVerification), auth_service_1.default.verifyEnableTwoSetupVerification);
exports.default = router;
