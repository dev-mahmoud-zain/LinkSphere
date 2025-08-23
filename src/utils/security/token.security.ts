import jwt, { SignOptions } from "jsonwebtoken";


interface IGenerateToken {
    payload: {
        _id: string,
        role: string
    },
    secretKey: string,
    options?: SignOptions
}



export const generateToken = async ({
    payload,
    secretKey = process.env.ACCESS_USER_TOKEN_SIGNATURE as string,
    options = { expiresIn: 60 * 60 } }: IGenerateToken) => {
    return jwt.sign(payload, secretKey, options)
}