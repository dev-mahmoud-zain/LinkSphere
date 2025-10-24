import { HydratedDocument, model, models, Schema, Types } from "mongoose";

export interface IFriendRequest {    
    sendBy: Types.ObjectId;
    sendTo: Types.ObjectId;
    acceptedAt?:Date;

    createdAt: Date;
    updatedAt?: Date;
}

export type HFriendRequest = HydratedDocument<IFriendRequest>;

const friendRequestSchema = new Schema<IFriendRequest>({
    sendBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    sendTo: { type: Schema.Types.ObjectId, ref: "User", required: true },
    acceptedAt: Date,
    createdAt: Date,
    updatedAt: Date,

}, {
    timestamps: true,
    strictQuery: true,
});

export const FriendRequestModel = models.FriendRequestModel || model("FriendRequest", friendRequestSchema);