import { Server } from "socket.io";
import { IAuthSocket } from "../007-gateway";
import { ChatService } from "./chat.service";

export class ChatEvents {
  chatService = new ChatService();

  constructor() {}

  sendMessage = (socket: IAuthSocket,io:Server,connectedSockets: Map<string, Set<string>>) => {
    return socket.on("send-message", (message) => {

      return this.chatService.sendMessage({
        socket,
        message,
        io,
        connectedSockets
      });
      
    });
  };

  messageSeen = (socket: IAuthSocket,io:Server,connectedSockets: Map<string, Set<string>>) => {

    return socket.on("message-seen", (data) => {

      return this.chatService.messageSeen({
        socket,
        data,
        io,
        connectedSockets
      });
      
    });
  };


}