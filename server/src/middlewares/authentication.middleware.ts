import { NextFunction, Request, Response } from "express";
import { BadRequestException, UnAuthorizedException } from "../utils/response/error.response";
import { TokenService, TokenTypeEnum } from "../utils/security/token.security";
import { RoleEnum } from "../DataBase/models/user.model";

export const authenticationMiddeware = (tokenType: TokenTypeEnum = TokenTypeEnum.accses) => {

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

export const authorizationMiddeware = (accsesRoles: RoleEnum[]) => {

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
            , tokenType: TokenTypeEnum.accses
        })

        if (!accsesRoles.includes(user.role)) {
            throw new UnAuthorizedException("Not Authorized Account")
        }

        req.tokenDecoded = decoded;
        req.user = user;

        next()
    }

}