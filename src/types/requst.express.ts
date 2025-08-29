import { JwtPayload } from "jsonwebtoken";
import { HUserDoucment } from "../DataBase/models/user.model";

declare module "express-serve-static-core"{
    interface Request{
        user?:HUserDoucment,
        tokenDecoded?:JwtPayload
    }
}