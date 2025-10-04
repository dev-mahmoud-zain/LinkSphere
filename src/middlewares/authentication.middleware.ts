import { NextFunction, Request, Response } from "express";
import { BadRequestException, UnAuthorizedException } from "../utils/response/error.response";
import { TokenService, TokenTypeEnum } from "../utils/security/token.security";
import { RoleEnum } from "../DataBase/models/user.model";

export const authenticationMiddleware = (tokenType: TokenTypeEnum = TokenTypeEnum.access) => {

    return async (req: Request, res: Response, next: NextFunction) => {


        if (!req.headers.authorization) {
            throw new BadRequestException("Validation Error", {
                key: "headers",
                issus: {
                    path: "authorization",
                    message: "Missing Authorization"
                }
            })
        }

        const tokenService = new TokenService;

        const { decoded, user } = await tokenService.decodeToken({
            authorization: req.headers.authorization
            , tokenType
        })

        req.tokenDecoded = decoded;
        req.user = user;

        next()
    }

}

export const authorizationMiddleware = (accessRoles: RoleEnum[]) => {

    return async (req: Request, res: Response, next: NextFunction) => {


        if (!req.headers.authorization) {
            throw new BadRequestException("Validation Error", {
                key: "headers",
                issus: {
                    path: "authorization",
                    message: "Missing Authorization"
                }
            })
        }

        const tokenService = new TokenService;

        const { decoded, user } = await tokenService.decodeToken({
            authorization: req.headers.authorization
            , tokenType: TokenTypeEnum.access
        })

        if (!accessRoles.includes(user.role)) {
            throw new UnAuthorizedException("Not Authorized Account")
        }

        req.tokenDecoded = decoded;
        req.user = user;

        next()
    }

}