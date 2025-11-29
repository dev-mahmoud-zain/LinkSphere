import jwt, { JwtPayload, Secret, SignOptions } from "jsonwebtoken";
import { ObjectId } from "mongoose";
import {
  HUserDocument,
  RoleEnum,
  UserModel,
} from "../../DataBase/models/user.model";
import {
  BadRequestException,
  InvalidTokenException,
  UnAuthorizedException,
} from "../response/error.response";
import { v4 as uuid } from "uuid";
import { HTokenDocument, TokenModel } from "../../DataBase/models/token.model";
import { TokenRepository, UserRepository } from "../../DataBase/repository";

interface IGenerateToken {
  payload: {
    _id: ObjectId;
    role: string;
  };
  secretKey: Secret;
  options?: SignOptions;
}

interface IverifyToken {
  token: string;
  secretKey: Secret;
}

export enum SignatureLevelEnum {
  Bearer = "Bearer",
  System = "System",
}

export enum TokenTypeEnum {
  access = "access",
  refresh = "refresh",
}

export enum LogoutFlagEnum {
  current = "current",
  all = "all",
}

export class TokenService {
  constructor() {}

  userModel = new UserRepository(UserModel);
  tokenModel = new TokenRepository(TokenModel);

  private detectSignatureLevel = async (
    role: RoleEnum = RoleEnum.user
  ): Promise<SignatureLevelEnum> => {
    let SignatureLevel: SignatureLevelEnum = SignatureLevelEnum.Bearer;

    switch (role) {
      case RoleEnum.admin:
      case RoleEnum.suberAdmin:
        SignatureLevel = SignatureLevelEnum.System;
        break;
      default:
        SignatureLevel = SignatureLevelEnum.Bearer;
        break;
    }
    return SignatureLevel;
  };

  private getSignatures = async (
    signatureLevel: SignatureLevelEnum = SignatureLevelEnum.Bearer
  ): Promise<{ access_signature: string; refresh_signature: string }> => {
    let signatures: { access_signature: string; refresh_signature: string } = {
      access_signature: "",
      refresh_signature: "",
    };

    switch (signatureLevel) {
      case SignatureLevelEnum.System:
        signatures.access_signature = process.env
          .ACCESS_SYSTEM_TOKEN_SIGNATURE as string;
        signatures.refresh_signature = process.env
          .REFRESH_SYSTEM_TOKEN_SIGNATURE as string;
        break;
      default:
        signatures.access_signature = process.env
          .ACCESS_USER_TOKEN_SIGNATURE as string;
        signatures.refresh_signature = process.env
          .REFRESH_USER_TOKEN_SIGNATURE as string;
        break;
    }

    return signatures;
  };

  private generateToken = async ({
    payload,
    secretKey = process.env.ACCESS_USER_TOKEN_SIGNATURE as string,
    options = { expiresIn: 60 * 60 },
  }: IGenerateToken) => {
    return jwt.sign(payload, secretKey, options);
  };

  private verifyToken = async ({
    token,
    secretKey = process.env.ACCESS_USER_TOKEN_SIGNATURE as string,
  }: IverifyToken): Promise<JwtPayload> => {
    return (await jwt.verify(token, secretKey)) as JwtPayload;
  };

  createLoginCredentials = async (
    user: HUserDocument
  ): Promise<{ access_token: string; refresh_token: string }> => {
    const signatureLevel = await this.detectSignatureLevel(user.role);
    const signatures = await this.getSignatures(signatureLevel);

    const jwtid = uuid();

    const access_token = await this.generateToken({
      payload: { _id: user._id, role: user.role },
      secretKey: signatures.access_signature,
      options: { expiresIn: process.env.MOOD == "development" ? "1d" :"1h", jwtid },
    });

    const refresh_token = await this.generateToken({
      payload: { _id: user._id, role: user.role },
      secretKey: signatures.refresh_signature,
      options: { expiresIn: "1y", jwtid },
    });

    return { access_token, refresh_token };
  };

  decodeToken = async ({
    authorization,
    tokenType = TokenTypeEnum.access,
  }: {
    authorization: string;
    tokenType: TokenTypeEnum;
  }) => {
    const [bearerKey, token] = authorization.split(" ");

    if (!bearerKey || !token) {
      throw new InvalidTokenException(
        "Token is missing required parts: [Bearer/System Key, Token]"
      );
    }

    if (
      bearerKey !== SignatureLevelEnum.Bearer &&
      bearerKey !== SignatureLevelEnum.System
    ) {
      throw new InvalidTokenException(
        "Bearer Key Is Only Valid On: [Bearer / System]"
      );
    }

    const signatures = await this.getSignatures(
      bearerKey as SignatureLevelEnum
    );

    const decoded = await this.verifyToken({
      token,
      secretKey:
        tokenType === TokenTypeEnum.access
          ? signatures.access_signature
          : signatures.refresh_signature,
    });

    if (!decoded?._id || !decoded?.iat) {
      throw new InvalidTokenException("Invalid Token Payload");
    }

    if (
      await this.tokenModel.findOne({
        filter: {
          jti: decoded?.jti,
        },
      })
    ) {
      throw new UnAuthorizedException("Invalid Or Old Credentials");
    }

    const user = await this.userModel.findOne({
      filter: {
        _id: decoded._id,
        pranoId: true,
        confirmedAt: { $exists: true },
      },
    });

    if (!user) {
      throw new BadRequestException("Not Registerd Account");
    }

    if (
      (user.changeCredentialsTime?.getTime() || 0) - 1000 >
      decoded.iat * 1000
    ) {
      throw new UnAuthorizedException("Invalid Or Old Credentials");
    }

    return { decoded, user };
  };

  createRevokeToken = async (
    tokenDecoded: JwtPayload
  ): Promise<HTokenDocument> => {
    const [result] =
      (await this.tokenModel.create({
        data: [
          {
            jti: tokenDecoded.jti as string,
            expiresIn: (tokenDecoded.iat as number) + 60 * 60 * 24 * 365,
            userId: tokenDecoded._id,
          },
        ],
      })) || [];

    if (!result) {
      throw new BadRequestException("Fail To Revoke Token");
    }

    return result;
  };
}
