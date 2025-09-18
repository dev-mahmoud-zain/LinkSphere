"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizationMiddeware = exports.authenticationMiddeware = void 0;
const error_response_1 = require("../utils/response/error.response");
const token_security_1 = require("../utils/security/token.security");
const authenticationMiddeware = (tokenType = token_security_1.TokenTypeEnum.accses) => {
    return async (req, res, next) => {
        if (!req.headers.authorization) {
            throw new error_response_1.BadRequestException("Validation Error", {
                key: "headers",
                issus: {
                    path: "authorization",
                    message: "Missing Authorization"
                }
            });
        }
        const tokenService = new token_security_1.TokenService;
        const { decoded, user } = await tokenService.decodeToken({
            authorization: req.headers.authorization,
            tokenType
        });
        req.tokenDecoded = decoded;
        req.user = user;
        next();
    };
};
exports.authenticationMiddeware = authenticationMiddeware;
const authorizationMiddeware = (accsesRoles) => {
    return async (req, res, next) => {
        if (!req.headers.authorization) {
            throw new error_response_1.BadRequestException("Validation Error", {
                key: "headers",
                issus: {
                    path: "authorization",
                    message: "Missing Authorization"
                }
            });
        }
        const tokenService = new token_security_1.TokenService;
        const { decoded, user } = await tokenService.decodeToken({
            authorization: req.headers.authorization,
            tokenType: token_security_1.TokenTypeEnum.accses
        });
        if (!accsesRoles.includes(user.role)) {
            throw new error_response_1.UnAuthorizedException("Not Authorized Account");
        }
        req.tokenDecoded = decoded;
        req.user = user;
        next();
    };
};
exports.authorizationMiddeware = authorizationMiddeware;
