import { Server } from "socket.io";
import { IAuthSocket } from "../007-gateway";
import { ChatEvents } from "./chat.events";

export class ChatGateWay {
  private chatEvents = new ChatEvents();

  constructor() {}

  register = (socket: IAuthSocket, io: Server,connectedSockets: Map<string, Set<string>>) => {
    this.chatEvents.sendMessage(socket, io,connectedSockets);
  };
}
