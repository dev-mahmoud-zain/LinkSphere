import { Schema, models, model, Document } from "mongoose";

export enum GenderEnum {
    male = "male",
    female = "female"
}
export enum RoleEnum {
    user = "user",
    admin = "admin"
}

export interface IUser extends Document {
    _id: Schema.Types.ObjectId;
    firstName: string;
    lastName: string;
    userName?: string;
    email: string;
    confirmedAt: Date;
    confirmEmailOTP?: string;
    confirmEmailSentTime?: Date;
    OTPReSendCount: number;
    otpBlockExpiresAt: Date;
    password: string,
    reSetPasswordOTP: string;
    changeCredentialsTime?: Date;
    phone?: string;
    adress?: string;
    gender: GenderEnum;
    role: RoleEnum;
    createdAt: Date;
    updatedAt?: Date;
}

const userSchema = new Schema<IUser>({

    firstName: { type: String, required: true, min: 3, max: 25 },
    lastName: { type: String, required: true, min: 3, max: 25 },

    email: { type: String, required: true, unique: true },
    confirmedAt: { type: Date },
    confirmEmailOTP: { type: String },
    confirmEmailSentTime: { type: Date },
    OTPReSendCount: { type: Number },
    otpBlockExpiresAt: { type: Date },

    password: { type: String, required: true },
    reSetPasswordOTP: { type: String },
    changeCredentialsTime: { type: Date },

    phone: { type: String },
    adress: { type: String },
    gender: { type: String, enum: GenderEnum, default: GenderEnum.male },
    role: { type: String, enum: RoleEnum, default: RoleEnum.user },

    createdAt: { type: Date },
    updatedAt: { type: Date },
},
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);


userSchema.virtual("userName").set(function (value: String) {
    const [firstName, lastName] = value.split(" ") || [];
    this.set({ firstName, lastName });
}).get(function () {
    return this.firstName + " " + this.lastName;
})

export const UserModel = models.User || model<IUser>("User", userSchema);

