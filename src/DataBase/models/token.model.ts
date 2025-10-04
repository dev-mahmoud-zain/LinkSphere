import { HydratedDocument } from "mongoose";
import { model, models, Schema, Types } from "mongoose";

export interface IToken {
    jti: string;
    expiresIn: Number
    userId: Types.ObjectId;
}


const tokenSchema = new Schema<IToken>(
    {
        jti: { type: String, required: true, unique: true },
        expiresIn:{type:Number , required:true},
        userId:{type:Schema.Types.ObjectId, required:true, ref:"User"}
    },{
        timestamps:true
    }
)

export const TokenModel = models.Token || model("Token",tokenSchema);

export type HTokenDocument = HydratedDocument<IToken>