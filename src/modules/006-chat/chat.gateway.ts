import { Server } from "socket.io";
import { IAuthSocket } from "../005-gateway";
import { ChatEvents } from "./chat.events";

export class ChatGateway {
    constructor() { }

    private chatEvents = new ChatEvents();

    register = (socket: IAuthSocket, io: Server) => {
        this.chatEvents.sayHi(socket);
        this.chatEvents.sendMessage(socket, io);
        this.chatEvents.joinRoom(socket, io);
        this.chatEvents.sendGroupMessage(socket, io);

    }
}