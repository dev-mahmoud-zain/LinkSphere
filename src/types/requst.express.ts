import { JwtPayload } from "jsonwebtoken";
import { HUserDocument } from "../DataBase/models/user.model";

declare module "express-serve-static-core"{
    interface Request{
        user?:HUserDocument,
        tokenDecoded?:JwtPayload
    }
}