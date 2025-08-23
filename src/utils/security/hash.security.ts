import bcrypt from "bcryptjs";


export const generateHash = async ({ plainTxt = "", saltRound = process.env.SALTROUND || "" }) => {
    return bcrypt.hashSync(plainTxt, parseInt(saltRound))
}

export const compareHash = async ({ plainTxt = "", hashValue = "" }) => {
    return bcrypt.compareSync(plainTxt, hashValue);
}