import { model } from "mongoose";
import { HydratedDocument, models, Schema, Types } from "mongoose";

export interface IMessage {
    content: string;
    createdBy: Types.ObjectId;
    createdAt?: Date;
    updatedAt?: Date;
}
export type HMessageDocument = HydratedDocument<IMessage>;

export interface IChat {
    // OVO
    participants: Types.ObjectId[];
    messages: IMessage[];

    // OVM
    groupName: string;
    groupImage: string;
    roomId: string;

    // Common
    createdBy: Types.ObjectId;
    createdAt?: Date;
    updatedAt?: Date;
}
export type HChatDocument = HydratedDocument<IChat>;

const messageSchema = new Schema<IMessage>({
    content:{type:String,required:true},
    createdBy:Schema.Types.ObjectId,
},{timestamps:true})


const chatSchema = new Schema<IChat>({
    participants: [{ type: Schema.Types.ObjectId, ref: "User", required: true  }],
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },

    groupName: { type: String },
    groupImage: { type: String },
    roomId: {
        type: String,
        required: function () {
            return this.groupName ? true : false;
        }
    },

    messages:[messageSchema]

}, {
    timestamps: true
});



export const ChatModel = models.Chat || model("Chat",chatSchema); 