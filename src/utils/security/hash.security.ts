import {hash , compare} from "bcryptjs";

export const generateHash = async (plainTxt: string, saltRound: string = process.env.SALTROUND || ""): Promise<string> => {
    return await hash(plainTxt, parseInt(saltRound))
}

export const compareHash = async (plainTxt: string, hashValue: string): Promise<boolean> => {
    return await compare(plainTxt, hashValue);
}