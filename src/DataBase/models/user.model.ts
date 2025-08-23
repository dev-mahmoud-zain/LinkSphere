import { Schema, model, Document } from "mongoose";

interface IUser extends Document {
    userName: string;

    email: string;
    confirmEmail: Date,

    confirmEmailOTP: string,
    confirmEmailSentTime: Date,

    OTPReSendCount: number,
    OTPReSendBlockTime: Date,

    password: string,
    phone: string,
    gender: "male" | "female";

    role: "user" | "admin";
}

const userSchema = new Schema<IUser>({
    userName: { type: String, required: true },
    email: { type: String, required: true, unique: true },

    confirmEmail: { type: Date },
    confirmEmailOTP: { type: String },

    confirmEmailSentTime: { type: Date },
    OTPReSendCount: { type: Number },
    OTPReSendBlockTime: { type: Date },

    password: { type: String, required: true },
    phone: { type: String, required: false },
    gender: { type: String, enum: ["male", "female"], default: "male" },

    role: { type: String, enum: ["user", "admin"], default: "user" }
});

export const UserModel = model<IUser>("User", userSchema);