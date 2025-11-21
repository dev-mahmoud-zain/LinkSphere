import { Server } from "socket.io";
import { IAuthSocket } from "../005-gateway";
import z from "zod";
import { validation } from ".";

export type IGetChatParams =z.infer<typeof validation.getChat.params>;
export type IGetChatQuery =z.infer<typeof validation.getChat.query>;

export type IGetGroupChatParams =z.infer<typeof validation.getGroupChat.params>;
export type IGetGroupChatQuery =z.infer<typeof validation.getGroupChat.query>;

export type ICreateChattingGroup =z.infer<typeof validation.createChattingGroup.body>;

export interface IMainDto {
    socket: IAuthSocket,
    callback?: any,
    io?: Server
}

export interface ISayHiDto extends IMainDto {
    message: string,
}

export interface ISendMessageDto extends IMainDto {
    content: string,
    sendTo:string
}

export interface ISendGroupMessageDto extends IMainDto {
    content: string,
    groupId:string
}

export interface IJoinRoom extends IMainDto {
    roomId: string,
}