import { Server } from "socket.io";
import { IAuthSocket } from "../007-gateway";

export interface ISendMessage{
    message:{
        content:string,
        sendTo:string
    },
    socket:IAuthSocket,
    io:Server,
    connectedSockets:Map<string, Set<string>>
}