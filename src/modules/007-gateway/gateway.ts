import { Server } from "socket.io";
import {
  TokenService,
  TokenTypeEnum,
} from "../../utils/security/token.security";
import { Server as HttpServer } from "http";
import { IAuthSocket } from "./interface";
import { ChatGateWay } from "../008-chat";
import { BadRequestException } from "../../utils/response/error.response";
import { connectedSockets } from "./connectedSockets";



const chatGateWay = new ChatGateWay();
const token = new TokenService();


let io: undefined | Server = undefined;

export const initializeIo = (httpServer: HttpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: ["http://localhost:4200", "http://127.0.0.1:5500",],
    },
  });

  // ===========================
  // Middleware: Auth
  // ===========================
  getIo().use(async (socket: IAuthSocket, next) => {
    try {
      const { authorization } = socket.handshake.auth as {
        authorization: string;
      };

      const { decoded, user } = await token.decodeToken({
        authorization,
        tokenType: TokenTypeEnum.access,
      });

      socket.credentials = { decoded, user };
      next();
    } catch (error: any) {
      next(error);
    }
  });

  // ===========================
  // Handle Disconnect
  // ===========================
  function disconnection(socket: IAuthSocket) {
    socket.on("disconnect", () => {
      const userId = socket.credentials?.decoded._id as string;

      const sockets = connectedSockets.get(userId);
      if (!sockets) return;

      // شيل socket اللي اتقفل بس
      sockets.delete(socket.id);

      // لو بقى 0 → يعتبر فعلاً user offline
      if (sockets.size === 0) {
        connectedSockets.delete(userId);
        getIo().emit("offline-user", userId);
      }

      console.log("updated connectedSockets:", connectedSockets);
    });
  }

  // ===========================
  // On Connection
  // ===========================
  getIo().on("connection", (socket: IAuthSocket) => {
    const userId = socket.credentials?.decoded._id as string;
    
    // لو أول مرة user يدخل → اعمله Set جديدة
    if (!connectedSockets.has(userId)) {
      connectedSockets.set(userId, new Set());
    }

    // ضيف socket الحالي للتابات المفتوحة
    connectedSockets.get(userId)!.add(socket.id);




    // Register في الـ Chat Gateway
    chatGateWay.register(socket, getIo(),connectedSockets);

    disconnection(socket);
  });
};

// Getter
export const getIo = (): Server => {
  if (!io) {
    throw new BadRequestException("Fail To Stablish Io Server");
  }
  return io;
};