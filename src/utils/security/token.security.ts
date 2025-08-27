import jwt, { SignOptions } from "jsonwebtoken";
import { ObjectId } from "mongoose";


interface IGenerateToken {
    payload: {
        _id: ObjectId,
        role: string
    },
    secretKey: string,
    options?: SignOptions
}

interface IGenerateAccsesToken {
    payload: {
        _id: ObjectId,
        role: string
    },
}

type IGenerateRefreshToken = IGenerateAccsesToken;

export class TokenService {

    constructor() { }

    generateToken = async ({
        payload,
        secretKey = process.env.ACCESS_USER_TOKEN_SIGNATURE as string,
        options = { expiresIn: 60 * 60 } }: IGenerateToken) => {
        return jwt.sign(payload, secretKey, options)
    }

    generateAccsesToken = async ({
        payload }
        : IGenerateAccsesToken): Promise<string> => {
        return this.generateToken({

            payload,
            secretKey: (
                payload.role === "user" ?
                    process.env.ACCESS_USER_TOKEN_SIGNATURE :
                    process.env.ACCESS_SYSTEM_TOKEN_SIGNATURE) as string,
            options: { expiresIn: 60 * 60 }
        })
    }

    generateRefreshToken = async ({
        payload }
        : IGenerateRefreshToken): Promise<string> => {
        return this.generateToken({
            payload,
            secretKey: (
                payload.role === "user" ?
                    process.env.REFRESH_USER_TOKEN_SIGNATURE :
                    process.env.REFRESH_SYSTEM_TOKEN_SIGNATURE) as string,
            options: { expiresIn: 60 * 60 }
        })
    }

}