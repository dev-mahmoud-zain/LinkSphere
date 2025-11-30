import { Server } from "socket.io";
import { IAuthSocket } from "../007-gateway";
import { Types } from "mongoose";

export interface ISendMessage{
    message:{
        content:string,
        sendTo:string
    },
    socket:IAuthSocket,
    io:Server,
    connectedSockets:Map<string, Set<string>>
}


export interface IMessageSeen{
    data:{
        messageId:Types.ObjectId,
        chatId:Types.ObjectId,
        
    },
    socket:IAuthSocket,
    io:Server,
    connectedSockets:Map<string, Set<string>>
}