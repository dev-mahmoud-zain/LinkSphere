import { Socket } from "socket.io";
import { HUserDocument } from "../../DataBase/models";
import { JwtPayload } from "jsonwebtoken";

export interface IAuthSocket extends Socket {
    credentials?: {
        user?: Partial<HUserDocument>;
        decoded?: JwtPayload;
    }
}