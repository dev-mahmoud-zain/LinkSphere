import { Request, Response } from "express";
import { ICreateGroup, IMessageSeen, ISendMessage, ITyping } from "./chat.dto";
import { ChatRepository, UserRepository } from "../../DataBase/repository";
import { ChatModel, HChatDocument, UserModel } from "../../DataBase/models";
import { Types } from "mongoose";
import * as crypto from "crypto";
import {
  BadRequestException,
  NotFoundException,
  UnAuthorizedException,
} from "../../utils/response/error.response";
import { successResponse } from "../../utils/response/success.response";

export class ChatService {
  chatRepository = new ChatRepository(ChatModel);
  userRepository = new UserRepository(UserModel);

  constructor() { }

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
      size: limit,
    });

    if (!chat) {
      throw new NotFoundException("No Matched Chat Between Participants");
    }

    return successResponse({
      res,
      data: {
        chat: chat.chat,
        p: chat.pagination,
      },
    });
  };

  // ===================  Get Group Chat ===================

  getGroupChat = async (req: Request, res: Response) => {
    const { chatId } = req.params;
    const { page, limit } = req.query as unknown as {
      page: number;
      limit: number;
    };
    const reqUserId = req.user?._id;

    const chat = await this.chatRepository.findOneChat({
      filter: {
        _id: chatId,
        participants: {
          $in: [reqUserId],
        },
        groupName: { $exists: true },
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
      size: limit,
    });

    if (!chat) {
      throw new NotFoundException("No Matched Group Chat");
    }

    return successResponse({
      res,
      data: {
        chat: chat.chat,
        p: chat.pagination,
      },
    });
  };

  // ===================  Create Group Chat ===================
  createGroup = async (req: Request, res: Response) => {
    const { name, participants } = req.body as ICreateGroup;
    const createdBy = req.user?._id;
    if (!createdBy) throw new UnAuthorizedException();

    // Remove Duplicates & Add Creator
    const uniqueParticipants = Array.from(new Set([...participants, createdBy.toString()]));

    // Basic validation: Check minimum size
    if (uniqueParticipants.length < 2) {
      throw new BadRequestException("Group must have at least 2 members");
    }


    // Create Chat
    const [chat] = await this.chatRepository.create({
      data: [{
        groupName: name,
        participants: uniqueParticipants.map((id) => new Types.ObjectId(id)),
        createdBy: new Types.ObjectId(createdBy.toString()),
        roomId: crypto.randomUUID()
      }]
    }) || [];

    if (!chat) {
      throw new BadRequestException("Fail To Create Group");
    }


    return successResponse({
      res,
      statusCode: 201,
      data: {
        chat
      }
    })
  }

  // ===================  Send A Message  ===================

  sendMessage = async ({
    message,
    socket,
    io,
    connectedSockets,
  }: ISendMessage) => {
    try {
      const createdBy = socket.credentials?.decoded._id as Types.ObjectId;
      // Check if sendTo is a valid ChatId (Group) or UserId
      const targetId = Types.ObjectId.createFromHexString(message.sendTo);

      // Try to find a group chat first with this ID
      const groupChat = await this.chatRepository.findOne({
        filter: {
          _id: targetId,
          groupName: { $exists: true },
          participants: { $in: [createdBy] }
        }
      });

      if (groupChat) {
        // ================= Handle Group Message =================
        const chat = await this.chatRepository.findOneAndUpdate({
          filter: {
            _id: targetId,
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

        const messageId = chat?.messages[chat?.messages.length - 1]?._id;

        // Broadcast to all participants
        chat?.participants.forEach(pId => {
          const pSockets = connectedSockets.get(pId.toString());
          if (pSockets && pSockets.size > 0) {
            const event = pId.toString() === createdBy.toString() ? "success-message" : "new-message";
            io.to([...pSockets]).emit(event, {
              content: message.content,
              from: socket.credentials?.user, // Only useful for receiver
              messageId,
              chatId: chat._id,
              groupName: chat.groupName
            });
          }
        });
        return;
      }

      // ================= Handle DM (Existing Logic) =================
      const sendTo = targetId;

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

      let chat: HChatDocument | null;

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
        const [newChat] =
          (await this.chatRepository.create({
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
          })) || [];

        if (newChat) {
          chat = newChat;
        }
      }

      const lastChat = await this.chatRepository.findOneChat({
        filter: {
          participants: {
            $all: [sendTo, createdBy],
          },
          groupName: { $exists: false },
        },
      });
      const messageId = lastChat.chat?.messages[lastChat.chat?.messages.length - 1]?._id;



      const senderSockets = connectedSockets.get(createdBy.toString());
      const receiverSockets = connectedSockets.get(sendTo.toString());

      if (!senderSockets || senderSockets.size === 0) {
        return;
      }

      io.to([...senderSockets]).emit("success-message", {
        content: message.content,
        messageId
      });

      if (!receiverSockets || receiverSockets.size === 0) {
        return;
      }

      io.to([...receiverSockets]).emit("new-message", {
        content: message.content,
        from: socket.credentials?.user,
        messageId
      });
    } catch (error) {
      console.error("send-message error", error);

      socket.emit("custom_error", error);
    }
  };

  messageSeen = async ({
    data,
    socket,
    io,
    connectedSockets,
  }: IMessageSeen) => {
    try {
      if (!data.chatId || !data.messageId) {
        throw new BadRequestException("chatId and messageId are required");
      }

      const userId = socket.credentials?.decoded._id;

      const { chat } = await this.chatRepository.findOneChat({
        filter: {
          _id: data.chatId,
          participants: {
            $in: [userId],
          },
        },
        options: {
          populate: "participants",
        },
      });

      if (!chat) {
        throw new BadRequestException("Fail To Find Matched Chat");
      }

      const message = chat.messages[chat.messages.length - 1];

      if (message?._id!.toString() !== data.messageId.toString()) {
        throw new BadRequestException("Fail To Find Matched Message In Chat");
      }

      if (message.seen === true) {
        throw new BadRequestException("Message Already Seen Before");
      }

      message.seen = true;
      message.seenAt = new Date();

      const senderSockets = connectedSockets.get(userId.toString());
      if (!senderSockets || senderSockets.size === 0) {
        return;
      }

      io.to([...senderSockets]).emit("message-seen", {
        chatId: data.chatId,
        messageId: data.messageId,
        seen: true,
        seenAt: message.seenAt,
      });


      // Notify other participants
      chat.participants.forEach((participant: any) => {
        const pId = participant._id.toString();
        if (pId !== userId?.toString()) {
          const pSockets = connectedSockets.get(pId);
          if (pSockets && pSockets.size > 0) {
            io.to([...pSockets]).emit("message-seen", {
              chatId: data.chatId,
              messageId: data.messageId,
              seen: true,
              seenAt: message.seenAt,
              // user: { _id: userId } 
            });
          }
        }
      });

      chat.save();
    } catch (error) {
      console.error("message-seen error", error);

      socket.emit("custom_error", error);
    }
  };


  startWriting = ({
    data,
    socket,
    io,
    connectedSockets,
  }: ITyping) => {
    try {
      const { receiverId } = data;
      const senderId = socket.credentials?.decoded._id;

      const receiverSockets = connectedSockets.get(receiverId);
      if (receiverSockets && receiverSockets.size > 0) {
        io.to([...receiverSockets]).emit("writing-start", {
          senderId,
        });
      }
    } catch (error) {
      console.error("start-writing error", error);
      socket.emit("custom_error", error);
    }
  };

  stopWriting = ({
    data,
    socket,
    io,
    connectedSockets,
  }: ITyping) => {
    try {
      const { receiverId } = data;
      const senderId = socket.credentials?.decoded._id;

      const receiverSockets = connectedSockets.get(receiverId);
      if (receiverSockets && receiverSockets.size > 0) {
        io.to([...receiverSockets]).emit("writing-stop", {
          senderId,
        });
      }
    } catch (error) {
      console.error("stop-writing error", error);
      socket.emit("custom_error", error);
    }
  };
}
