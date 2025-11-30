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
import { Types } from "mongoose";

const chatGateWay = new ChatGateWay();
const token = new TokenService();

let io: undefined | Server = undefined;

export const initializeIo = (httpServer: HttpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: ["http://localhost:4200", "http://127.0.0.1:5500"],
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

    const userSockets = connectedSockets.get(userId);
    if (!userSockets) return;

    userSockets.delete(socket.id);

    // ندي مهلة قبل ما نعلن إن اليوزر offline
    setTimeout(() => {
      const stillSockets = connectedSockets.get(userId);

      // لو رجع بسوكيت جديد → يفضل Online ومش بنبعت offline
      if (stillSockets && stillSockets.size > 0) {
        return;
      }

      // فعلاً Offline
      connectedSockets.delete(userId);

      getIo().emit("offline-friend", userId);

    }, 500); // المهلة التي تمنع offline وقت الريفريش
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

    const entries: [string, Set<string>][] = Array.from(
      connectedSockets.entries()
    );

    const userFriends: string[] =
      socket.credentials?.user.friends?.map((f: any) => f.toString()) || [];

    // هات بس اللي أونلاين
    const onlineFriends = entries.filter(([userId]) =>
      userFriends.includes(userId)
    );

    // جمع الـ sockets كلها في Array
    const onlineFriendSockets: string[] = onlineFriends.flatMap(
      ([userId, sockets]) => Array.from(sockets)
    );

    // ابعت الرسالة
    getIo().to(onlineFriendSockets).emit("online-friend", { userId: socket.credentials?.user._id});

    // Register في الـ Chat Gateway
    chatGateWay.register(socket, getIo(), connectedSockets);

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