import { Server } from "socket.io";
import { IAuthSocket } from "../005-gateway";
import { ChatService } from "./chat.service";


export class ChatEvents {
    constructor() { }

    private chatService = new ChatService();


    sayHi = (socket: IAuthSocket) => {

        socket.on("sayHi", (message, callback) => {
            this.chatService.sayHi({ socket, message, callback })
        });
    }

    sendMessage = (socket: IAuthSocket, io: Server) => {

        return socket.on("send_message", (data: { content: string, sendTo: string }) => {
            return this.chatService.sendMessage({ socket, ...data, io })
        });
    }

    joinRoom = (socket: IAuthSocket, io: Server) => {

        return socket.on("join_room", (data: { roomId: string }) => {

            return this.chatService.joinRoom({ socket, ...data, io })

        });

    }


    sendGroupMessage = (socket: IAuthSocket, io: Server) => {
        return socket.on("send_group_message", (data: { content: string, groupId: string }) => {
            return this.chatService.sendGroupMessage({ socket, ...data, io })
        });
    }


}