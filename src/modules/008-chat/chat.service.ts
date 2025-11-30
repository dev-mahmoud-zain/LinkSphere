import { Request, Response } from "express";
import { ISendMessage } from "./chat.dto";
import { ChatRepository, UserRepository } from "../../DataBase/repository";
import { ChatModel, UserModel } from "../../DataBase/models";
import { Types } from "mongoose";
import {
  BadRequestException,
  NotFoundException,
} from "../../utils/response/error.response";
import { successResponse } from "../../utils/response/success.response";

export class ChatService {
  chatRepository = new ChatRepository(ChatModel);
  userRepository = new UserRepository(UserModel);

  constructor() {}

  // ===================  Get User Chat ===================
  getChat = async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { page, limit } = req.query as unknown as {
      page: number;
      limit: number;
    };
    const reqUserId = req.user?._id;

    const chat = await this.chatRepository.findOneChat({
      filter: {
        participants: {
          $all: [reqUserId, new Types.ObjectId(userId)],
        },
        groupName: { $exists: false },
      },
      options: {
        populate: [
          {
            path: "participants",
            select: "firstName lastName userName picture gender",
          },
        ],
      },
      page,
      size:limit
    });

    if (!chat) {
      throw new NotFoundException("No Matched Chat Between Participants");
    }

    console.log(chat)

    return successResponse({
      res,
      data: {
        chat,
      },
    });
  };

  // ===================  Send A Message  ===================

  sendMessage = async ({
    message,
    socket,
    io,
    connectedSockets,
  }: ISendMessage) => {
    try {
      const createdBy = socket.credentials?.decoded._id as Types.ObjectId;
      const sendTo = Types.ObjectId.createFromHexString(message.sendTo);

      if (
        !(await this.userRepository.findOne({
          filter: {
            _id: sendTo,
            friends: {
              $in: createdBy,
            },
          },
        }))
      ) {
        throw new BadRequestException("Fail To Find Recipient Friend");
      }

      let chat;
      chat = await this.chatRepository.findOneAndUpdate({
        filter: {
          participants: {
            $all: [sendTo, createdBy],
          },
          groupName: { $exists: false },
        },
        updateData: {
          $addToSet: {
            messages: {
              createdBy,
              content: message.content,
            },
          },
        },
      });

      if (!chat) {
        chat = await this.chatRepository.create({
          data: [
            {
              participants: [sendTo, createdBy],
              messages: [
                {
                  content: message.content,
                  createdBy,
                },
              ],
              createdBy,
            },
          ],
        });
      }

      const senderSockets = connectedSockets.get(createdBy.toString());
      const receiverSockets = connectedSockets.get(sendTo.toString());

      if (!senderSockets || senderSockets.size === 0) {
        return;
      }
      io.to([...senderSockets]).emit("success-message", {
        content: message.content,
      });
      if (!receiverSockets || receiverSockets.size === 0) {
        return;
      }

      io.to([...receiverSockets]).emit("new-message", {
        content: message.content,
        from: socket.credentials?.user,
      });
    } catch (error) {
      console.log(error);

      socket.emit("custom_error", error);
    }
  };
}