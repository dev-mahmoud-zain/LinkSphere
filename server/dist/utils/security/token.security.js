"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenService = exports.LogoutFlagEnum = exports.TokenTypeEnum = exports.SignatureLevelEnum = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_model_1 = require("../../DataBase/models/user.model");
const error_response_1 = require("../response/error.response");
const uuid_1 = require("uuid");
const token_model_1 = require("../../DataBase/models/token.model");
const repository_1 = require("../../DataBase/repository");
var SignatureLevelEnum;
(function (SignatureLevelEnum) {
    SignatureLevelEnum["Bearer"] = "Bearer";
    SignatureLevelEnum["System"] = "System";
})(SignatureLevelEnum || (exports.SignatureLevelEnum = SignatureLevelEnum = {}));
var TokenTypeEnum;
(function (TokenTypeEnum) {
    TokenTypeEnum["accses"] = "accses";
    TokenTypeEnum["refresh"] = "refresh";
})(TokenTypeEnum || (exports.TokenTypeEnum = TokenTypeEnum = {}));
var LogoutFlagEnum;
(function (LogoutFlagEnum) {
    LogoutFlagEnum["current"] = "current";
    LogoutFlagEnum["all"] = "all";
})(LogoutFlagEnum || (exports.LogoutFlagEnum = LogoutFlagEnum = {}));
class TokenService {
    constructor() { }
    userModel = new repository_1.UserRepository(user_model_1.UserModel);
    tokenModel = new repository_1.TokenRepository(token_model_1.TokenModel);
    detectSignatureLevel = async (role = user_model_1.RoleEnum.user) => {
        let SignatureLevel = SignatureLevelEnum.Bearer;
        switch (role) {
            case user_model_1.RoleEnum.admin:
                SignatureLevel = SignatureLevelEnum.System;
                break;
            default:
                SignatureLevel = SignatureLevelEnum.Bearer;
                break;
        }
        return SignatureLevel;
    };
    getSignatures = async (signatureLevel = SignatureLevelEnum.Bearer) => {
        let signatures = { accses_signature: "", refresh_signature: "" };
        switch (signatureLevel) {
            case SignatureLevelEnum.System:
                signatures.accses_signature = process.env.ACCESS_SYSTEM_TOKEN_SIGNATURE;
                signatures.refresh_signature = process.env.REFRESH_SYSTEM_TOKEN_SIGNATURE;
                break;
            default:
                signatures.accses_signature = process.env.ACCESS_USER_TOKEN_SIGNATURE;
                signatures.refresh_signature = process.env.REFRESH_USER_TOKEN_SIGNATURE;
                break;
        }
        return signatures;
    };
    generateToken = async ({ payload, secretKey = process.env.ACCESS_USER_TOKEN_SIGNATURE, options = { expiresIn: 60 * 60 } }) => {
        return jsonwebtoken_1.default.sign(payload, secretKey, options);
    };
    verifyToken = async ({ token, secretKey = process.env.ACCESS_USER_TOKEN_SIGNATURE, }) => {
        return await jsonwebtoken_1.default.verify(token, secretKey);
    };
    createLoginCredentials = async (user) => {
        const signatureLevel = await this.detectSignatureLevel(user.role);
        const signatures = await this.getSignatures(signatureLevel);
        const jwtid = (0, uuid_1.v4)();
        const accses_token = await this.generateToken({
            payload: { _id: user._id, role: user.role },
            secretKey: signatures.accses_signature,
            options: { expiresIn: "1h", jwtid }
        });
        const refresh_token = await this.generateToken({
            payload: { _id: user._id, role: user.role },
            secretKey: signatures.refresh_signature,
            options: { expiresIn: "1y", jwtid }
        });
        return { accses_token, refresh_token };
    };
    decodeToken = async ({ authorization, tokenType = TokenTypeEnum.accses }) => {
        const [bearerKey, token] = authorization.split(" ");
        if ((!bearerKey || !token)) {
            throw new error_response_1.InvalidTokenException("Token is missing required parts: [Bearer/System Key, Token]");
        }
        if (bearerKey !== SignatureLevelEnum.Bearer && bearerKey !== SignatureLevelEnum.System) {
            throw new error_response_1.InvalidTokenException("Bearer Key Is Only Valid On: [Bearer / System]");
        }
        const signatures = await this.getSignatures(bearerKey);
        const decoded = await this.verifyToken({
            token,
            secretKey: tokenType ===
                TokenTypeEnum.accses ?
                signatures.accses_signature :
                signatures.refresh_signature
        });
        if (!decoded?._id || !decoded?.iat) {
            throw new error_response_1.InvalidTokenException("Invalid Token Payload");
        }
        if (await this.tokenModel.findOne({
            filter: {
                jti: decoded?.jti
            }
        })) {
            throw new error_response_1.UnAuthorizedException("Invalid Or Old Credentials");
        }
        const user = await this.userModel.findOne({
            filter: {
                _id: decoded._id,
                pranoId: true,
                confirmedAt: { $exists: true }
            }
        });
        if (!user) {
            throw new error_response_1.BadRequestException("Not Registerd Account");
        }
        if ((user.changeCredentialsTime?.getTime() || 0) - 1000 > decoded.iat * 1000) {
            throw new error_response_1.UnAuthorizedException("Invalid Or Old Credentials");
        }
        return { decoded, user };
    };
    createRevokeToken = async (tokenDecoded) => {
        const [result] = await this.tokenModel.create({
            data: [{
                    jti: tokenDecoded.jti,
                    expiresIn: tokenDecoded.iat + 60 * 60 * 24 * 365,
                    userId: tokenDecoded._id
                }]
        }) || [];
        if (!result) {
            throw new error_response_1.BadRequestException("Fail To Revoke Token");
        }
        return result;
    };
}
exports.TokenService = TokenService;
