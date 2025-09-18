"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const error_response_1 = require("../../utils/response/error.response");
const hash_security_1 = require("../../utils/security/hash.security");
const email_events_1 = require("../../utils/email/email.events");
const OTP_1 = require("../../utils/security/OTP");
const token_security_1 = require("../../utils/security/token.security");
const google_auth_library_1 = require("google-auth-library");
const succses_response_1 = require("../../utils/response/succses.response");
const repository_1 = require("../../DataBase/repository");
const models_1 = require("../../DataBase/models");
class AuthenticationServices {
    userModel = new repository_1.UserRepository(models_1.UserModel);
    tokenService = new token_security_1.TokenService;
    constructor() { }
    signup = async (req, res) => {
        let { userName, email, password, gender, phone } = req.body.validData;
        const userExsist = await this.userModel.findOne({
            filter: { email }, select: "_id userName email", options: { lean: true }
        });
        if (userExsist) {
            throw new error_response_1.ConflictException("Email Alredy Exsists Try To Login", {
                issues: {
                    path: "email",
                    value: email
                }
            });
        }
        const OTPCode = (0, OTP_1.generateOTP)();
        await this.userModel.createUser({
            data: [{
                    userName,
                    email,
                    password,
                    gender,
                    confirmEmailOTP: OTPCode,
                    confirmEmailSentTime: new Date(),
                    ...(phone ? { phone } : {})
                }]
        });
        return (0, succses_response_1.succsesResponse)({
            res,
            statusCode: 201,
            info: "We Sent A Confirm OTP To Your Email , Please Confirm It To Login"
        });
    };
    confirmEmail = async (req, res) => {
        const { email, OTP } = req.body.validData;
        const user = await this.userModel.findOne({
            filter: { email },
        });
        if (!user) {
            throw new error_response_1.NotFoundException("Email Is Not Exsist");
        }
        if (user.confirmedAt) {
            throw new error_response_1.BadRequestException("This Email Is Already Confirmed");
        }
        if (!user.confirmEmailSentTime || !user.confirmEmailOTP) {
            throw new error_response_1.NotFoundException("OTP Not Found Or Not Sent For This Email");
        }
        const sentAt = user.confirmEmailSentTime;
        const expiresAt = new Date(sentAt.getTime() + 5 * 60 * 1000);
        if (new Date() > expiresAt) {
            throw new error_response_1.BadRequestException("OTP Code Has Expired");
        }
        if (!await (0, hash_security_1.compareHash)(OTP, user.confirmEmailOTP)) {
            throw new error_response_1.BadRequestException("Invalid OTP Number");
        }
        await this.userModel.updateOne({
            email
        }, {
            $set: {
                confirmedAt: new Date(),
            },
            $unset: {
                confirmEmailOTP: true,
                confirmEmailSentTime: true,
                OTPReSendCount: true,
                otpBlockExpiresAt: true
            },
        });
        return (0, succses_response_1.succsesResponse)({
            res,
            info: "Email Confirmed Succses",
        });
    };
    reSendConfirmOTP = async (req, res) => {
        const { email } = req.body.validData;
        let user = await this.userModel.findOne({
            filter: { email },
        });
        if (!user) {
            throw new error_response_1.NotFoundException("User Not Found");
        }
        if (user.confirmedAt) {
            throw new error_response_1.BadRequestException("This Account Already Confirmed Before");
        }
        if (!user.otpBlockExpiresAt && user.OTPReSendCount === 5) {
            await this.userModel.updateOne({ email }, {
                otpBlockExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
                OTPReSendCount: user.OTPReSendCount
            });
            throw new error_response_1.BadRequestException("Max 5 Attempts Reached. Try Again In 10 Minutes.");
        }
        if (user.otpBlockExpiresAt) {
            if (user.otpBlockExpiresAt > new Date()) {
                throw new error_response_1.BadRequestException("Maximum attempts reached. Please try again later.");
            }
            else {
                user = await this.userModel.findOneAndUpdate({
                    filter: { email },
                    updateData: {
                        $unset: { otpBlockExpiresAt: 1 },
                        OTPReSendCount: 0
                    }
                });
            }
        }
        const OTPCode = (0, OTP_1.generateOTP)();
        await this.userModel.updateOne({ email }, {
            OTPReSendCount: user.OTPReSendCount ? user.OTPReSendCount + 1 : 1,
            confirmEmailOTP: await (0, hash_security_1.generateHash)(OTPCode),
            confirmEmailSentTime: new Date()
        });
        email_events_1.emailEvent.emit("confirmEmail", { to: email, OTPCode });
        return (0, succses_response_1.succsesResponse)({
            res,
            statusCode: 200,
            info: "Email Confirmed Succses"
        });
    };
    verifyGmailAccount = async (idToken) => {
        const client = new google_auth_library_1.OAuth2Client();
        const ticket = await client.verifyIdToken({
            idToken,
            audience: process.env.WEB_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        if (!payload?.email_verified) {
            throw new error_response_1.BadRequestException("Fail To Verify This Account");
        }
        return payload;
    };
    loginWithGmail = async (req, res) => {
        const { idToken } = req.body.validData;
        const { email } = await this.verifyGmailAccount(idToken);
        const user = await this.userModel.findOne({
            filter: {
                email,
                provider: models_1.ProviderEnum.google
            }
        });
        if (!user) {
            throw new error_response_1.NotFoundException("Not Registerd Account Or Registerd With Another Provider");
        }
        const credentials = await this.tokenService.createLoginCredentials(user);
        return (0, succses_response_1.succsesResponse)({
            res,
            info: "login Succses",
            data: { credentials }
        });
    };
    signupWithGmail = async (req, res) => {
        const { idToken } = req.body.validData;
        const { email, name, picture } = await this.verifyGmailAccount(idToken);
        const user = await this.userModel.findOne({
            filter: {
                email
            }
        });
        if (user) {
            if (user.provider === models_1.ProviderEnum.system) {
                return await this.loginWithGmail(req, res);
            }
            throw new error_response_1.ConflictException("Invalid Provider", { userProvider: user.provider });
        }
        const [newUser] = await this.userModel.create({
            data: [{
                    userName: name,
                    email: email,
                    picture: picture,
                    confirmedAt: new Date()
                }]
        }) || [];
        if (!newUser) {
            throw new error_response_1.BadRequestException("Fail To Signup");
        }
        const credentials = await this.tokenService.createLoginCredentials(newUser);
        return (0, succses_response_1.succsesResponse)({
            res,
            info: "Signup Succses",
            data: { credentials }
        });
    };
    login = async (req, res) => {
        const { email, password } = req.body.validData;
        const user = await this.userModel.findOne({
            filter: {
                email
            },
            select: { email: 1, password: 1, confirmedAt: 1, role: 1, twoSetupVerification: 1 }
        });
        if (!user) {
            throw new error_response_1.NotFoundException("User Not Found Try To Signup");
        }
        if (!user.confirmedAt) {
            throw new error_response_1.BadRequestException("Confirm Your Email To Login");
        }
        if (user.freezedAt) {
            throw new error_response_1.NotFoundException("User Not Found");
        }
        const compare = await (0, hash_security_1.compareHash)(password, user.password);
        if (!compare) {
            throw new error_response_1.BadRequestException("Invalid Email Or Password");
        }
        if (user.twoSetupVerification === models_1.TwoSetupVerificationEnum.enable) {
            const OTPCode = (0, OTP_1.generateOTP)();
            await this.userModel.updateOne({
                email,
            }, {
                twoSetupVerificationCode: OTPCode
            });
            email_events_1.emailEvent.emit("loginTwoStepVerification", { to: email, OTPCode });
            return (0, succses_response_1.succsesResponse)({
                res,
                info: "OTP Code Sent To Your Email",
            });
        }
        const credentials = await this.tokenService.createLoginCredentials(user);
        return (0, succses_response_1.succsesResponse)({
            res,
            info: "Login Succses",
            data: { credentials }
        });
    };
    verifyLoginOTPCode = async (req, res) => {
        const { email, OTP } = req.body.validData;
        const user = await this.userModel.findOne({
            filter: { email },
        });
        if (!user) {
            throw new error_response_1.NotFoundException("User Not Exsists");
        }
        if (!user.twoSetupVerificationCode) {
            throw new error_response_1.NotFoundException("No OTP Code For This User");
        }
        if (user?.twoSetupVerificationCodeExpiresAt
            && (user?.twoSetupVerificationCodeExpiresAt.getTime() <= Date.now())) {
            throw new error_response_1.BadRequestException("OTP Code Time Expired");
        }
        if (!await (0, hash_security_1.compareHash)(OTP, user.twoSetupVerificationCode)) {
            throw new error_response_1.BadRequestException("Invalid OTP Code");
        }
        this.userModel.updateOne({
            _id: user._id,
        }, {
            $unset: { twoSetupVerificationCode: "", twoSetupVerificationCodeExpiresAt: "" }
        });
        const credentials = await this.tokenService.createLoginCredentials(user);
        return (0, succses_response_1.succsesResponse)({
            res,
            info: "Login Succses",
            data: { credentials }
        });
    };
    logout = async (req, res) => {
        const { logoutFlag } = req.body.validData;
        if (logoutFlag === token_security_1.LogoutFlagEnum.all) {
            await this.userModel.updateOne({
                _id: req.user?._id
            }, {
                changeCredentialsTime: new Date()
            });
        }
        else {
            await this.tokenService.createRevokeToken(req.tokenDecoded);
        }
        return (0, succses_response_1.succsesResponse)({
            res,
            info: "Logout Succses",
        });
    };
    refreshToken = async (req, res) => {
        const credentials = await this.tokenService.createLoginCredentials(req.user);
        await this.tokenService.createRevokeToken(req.tokenDecoded);
        return (0, succses_response_1.succsesResponse)({
            res,
            data: { credentials }
        });
    };
    frogetPassword = async (req, res) => {
        const { email } = req.body.validData;
        const user = await this.userModel.findOne({
            filter: {
                email,
            }
        });
        if (!user) {
            throw new error_response_1.NotFoundException("User Not Exists");
        }
        if (user.provider === models_1.ProviderEnum.google) {
            throw new error_response_1.ConflictException("Invalid Provider", { userProvider: user.provider });
        }
        if (!user.confirmedAt) {
            throw new error_response_1.BadRequestException("Account Not Confirmed");
        }
        if (user.forgetPasswordCount) {
            throw new error_response_1.BadRequestException("Use EndPoint : [Re send Forget Password OTP]");
        }
        const OTPCode = (0, OTP_1.generateOTP)();
        await this.userModel.updateOne({ email }, {
            forgetPasswordOTP: await (0, hash_security_1.generateHash)(OTPCode),
            forgetPasswordOTPExpiresAt: new Date(Date.now() + 5 * 60 * 1000),
            forgetPasswordCount: user.forgetPasswordCount ? user.forgetPasswordCount + 1 : 1
        });
        email_events_1.emailEvent.emit("forgetPassword", { to: email, OTPCode });
        return (0, succses_response_1.succsesResponse)({
            res,
            info: "Password reset code has been sent to your registered email"
        });
    };
    reSendForgetPasswordOTP = async (req, res) => {
        const { email } = req.body.validData;
        const user = await this.userModel.findOne({
            filter: { email }
        });
        if (!user) {
            throw new error_response_1.NotFoundException("User Not Exists");
        }
        if (user.provider === models_1.ProviderEnum.google) {
            throw new error_response_1.ConflictException("Invalid Provider", { userProvider: user.provider });
        }
        if (!user.confirmedAt) {
            throw new error_response_1.BadRequestException("Account Not Confirmed");
        }
        const OTPCode = (0, OTP_1.generateOTP)();
        let data = {};
        if (!user.forgetPasswordBlockExpiresAt && user.forgetPasswordCount === 4) {
            data = {
                forgetPasswordOTP: await (0, hash_security_1.generateHash)(OTPCode),
                forgetPasswordOTPExpiresAt: new Date(Date.now() + 5 * 60 * 1000),
                forgetPasswordCount: 5,
                forgetPasswordBlockExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
            };
        }
        if (user.forgetPasswordBlockExpiresAt) {
            if (user.forgetPasswordBlockExpiresAt.getTime() <= Date.now()) {
                data = {
                    forgetPasswordOTP: await (0, hash_security_1.generateHash)(OTPCode),
                    forgetPasswordOTPExpiresAt: new Date(Date.now() + 5 * 60 * 1000),
                    forgetPasswordCount: 1,
                    $unset: { forgetPasswordBlockExpiresAt: 1 }
                };
            }
            else {
                throw new error_response_1.BadRequestException("Blocked For 10 Munits");
            }
        }
        if (user.forgetPasswordCount && user.forgetPasswordCount < 4) {
            data = {
                forgetPasswordOTP: await (0, hash_security_1.generateHash)(OTPCode),
                forgetPasswordOTPExpiresAt: new Date(Date.now() + 5 * 60 * 1000),
                forgetPasswordCount: user.forgetPasswordCount ? user.forgetPasswordCount + 1 : 1,
            };
        }
        await this.userModel.updateOne({ email }, data);
        email_events_1.emailEvent.emit("forgetPassword", { to: email, OTPCode });
        return (0, succses_response_1.succsesResponse)({
            res,
            info: "A new password reset code has been sent to your registered email"
        });
    };
    confirmForgetPasswordOTP = () => {
        return async (req, res, next) => {
            const { email, OTP } = req.body.validData;
            const user = await this.userModel.findOne({
                filter: { email }
            });
            if (!user) {
                throw new error_response_1.NotFoundException("User Not Exists");
            }
            if (!user.forgetPasswordOTP) {
                throw new error_response_1.BadRequestException("No OTP was requested for this account. Please request a new password reset");
            }
            if (user.forgetPasswordOTPExpiresAt && new Date(user.forgetPasswordOTPExpiresAt).getTime() < Date.now()) {
                throw new error_response_1.BadRequestException("Expierd OTP");
            }
            if (!await (0, hash_security_1.compareHash)(OTP, user.forgetPasswordOTP)) {
                throw new error_response_1.BadRequestException("Invalid OTP Code");
            }
            else {
                next();
            }
        };
    };
    changeForgetPassword = async (req, res) => {
        const { email, newPassword } = req.body.validData;
        const user = await this.userModel.findOneAndUpdate({
            filter: { email },
            updateData: {
                password: await (0, hash_security_1.generateHash)(newPassword),
                changeCredentialsTime: new Date,
                $unset: { forgetPasswordCount: 1, forgetPasswordOTP: 1, forgetPasswordOTPExpiresAt: 1 }
            }
        });
        if (!user) {
            throw new error_response_1.ApplicationException("Something Went Wrong");
        }
        const credentials = await this.tokenService.createLoginCredentials(user);
        return (0, succses_response_1.succsesResponse)({
            res,
            info: "Your Password Changed Succses",
            data: { credentials }
        });
    };
    changeTwoSetupVerification = async (req, res) => {
        const user = await this.userModel.findOne({
            filter: { _id: req.user?._id },
        });
        let action = models_1.TwoSetupVerificationEnum.enable;
        if (user?.twoSetupVerificationCode) {
            throw new error_response_1.BadRequestException("Alredy Ask To disable Please Verify OTP Code");
        }
        if (user?.twoSetupVerification === models_1.TwoSetupVerificationEnum.enable) {
            action = models_1.TwoSetupVerificationEnum.disable;
        }
        const OTPCode = (0, OTP_1.generateOTP)();
        await this.userModel.updateOne({
            _id: req.user?._id
        }, {
            twoSetupVerificationCode: OTPCode,
        });
        const event = action === models_1.TwoSetupVerificationEnum.enable ? "enableTwoStepVerification" : "disableTwoStepVerification";
        email_events_1.emailEvent.emit(event, { to: user?.email, OTPCode });
        return (0, succses_response_1.succsesResponse)({
            res,
            info: `OTP Code Sent To Your Email , will ${action} after Verify OTP`,
        });
    };
    verifyEnableTwoSetupVerification = async (req, res) => {
        const OTPCode = req.body.validData.OTP;
        const user = await this.userModel.findOne({
            filter: { _id: req.user?._id }
        });
        let action = models_1.TwoSetupVerificationEnum.enable;
        if (user?.twoSetupVerification === models_1.TwoSetupVerificationEnum.enable) {
            action = models_1.TwoSetupVerificationEnum.disable;
        }
        if (!user?.twoSetupVerificationCode) {
            throw new error_response_1.NotFoundException("Not OTP Code For This User");
        }
        if (user?.twoSetupVerificationCodeExpiresAt
            && (user?.twoSetupVerificationCodeExpiresAt.getTime() <= Date.now())) {
            throw new error_response_1.BadRequestException("OTP Code Time Expired");
        }
        if (!await (0, hash_security_1.compareHash)(OTPCode, user.twoSetupVerificationCode)) {
            throw new error_response_1.BadRequestException("Invlid OTP Code");
        }
        await this.userModel.updateOne({
            _id: req.user?._id
        }, {
            $set: { twoSetupVerification: action },
            $unset: { twoSetupVerificationCode: "", twoSetupVerificationCodeExpiresAt: "" }
        });
        const info = action === models_1.TwoSetupVerificationEnum.enable ?
            "Tow Setup Verification Is Enabled Succses" :
            "Tow Setup Verification Is Disabled Succses";
        return (0, succses_response_1.succsesResponse)({
            res,
            info,
        });
    };
}
exports.default = new AuthenticationServices();
