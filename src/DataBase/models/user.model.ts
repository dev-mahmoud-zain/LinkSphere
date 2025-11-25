import mongoose, { Schema, models, model, HydratedDocument } from "mongoose";
import { generateHash } from "../../utils/security/hash.security";
import { emailEvent } from "../../utils/email/email.events";
import { IImage } from "../../utils/cloudinary/cloudinary.interface";

export enum GenderEnum {
  male = "male",
  female = "female",
}
export enum RoleEnum {
  user = "user",
  admin = "admin",
  suberAdmin = "suber-admin",
}
export enum ProviderEnum {
  system = "system",
  google = "google",
}

export enum TwoSetupVerificationEnum {
  enable = "enable",
  disable = "disable",
}

export interface IUser {
  _id: Schema.Types.ObjectId;
  firstName: string;
  lastName: string;
  userName?: string;
  slug: string;

  email: string;
  confirmedAt: Date;
  confirmEmailOTP?: string;
  confirmEmailSentTime?: Date;
  OTPReSendCount: number;
  otpBlockExpiresAt: Date;

  newEmail?: string;
  updateEmailOTP?: string;
  updateEmailOTPExpiresAt?: Date;

  password: string;
  reSetPasswordOTP: string;

  changeCredentialsTime?: Date;

  phone?: string;

  address?: string;

  gender: GenderEnum;

  role: RoleEnum;

  createdAt: Date;

  updatedAt?: Date;

  provider: string;

  picture?: IImage;
  coverImage?: IImage;

  forgetPasswordOTP?: string;
  forgetPasswordOTPExpiresAt?: Date;
  forgetPasswordCount?: number;
  forgetPasswordBlockExpiresAt?: Date;

  freezedAt?: Date;
  freezedBy?: Schema.Types.ObjectId;
  restoredAt?: Date;
  restoredBy?: Schema.Types.ObjectId;

  twoSetupVerification: TwoSetupVerificationEnum;
  twoSetupVerificationCode?: string;
  twoSetupVerificationCodeExpiresAt?: Date;

  friends?: Schema.Types.ObjectId[];
}

const userSchema = new Schema<IUser>(
  {
    firstName: { type: String, required: true, min: 3, max: 25 },
    lastName: { type: String, required: true, min: 3, max: 25 },
    slug: { type: String, required: true, min: 6, max: 51 },
    email: { type: String, required: true, unique: true },
    confirmedAt: { type: Date },
    confirmEmailOTP: { type: String },
    confirmEmailSentTime: { type: Date },
    OTPReSendCount: { type: Number, max: 5 },
    otpBlockExpiresAt: { type: Date },

    newEmail: { type: String },
    updateEmailOTP: { type: String },
    updateEmailOTPExpiresAt: { type: Date },

    password: {
      type: String,
      required: function () {
        return this.provider === ProviderEnum.system ? true : false;
      },
    },

    reSetPasswordOTP: { type: String },
    changeCredentialsTime: { type: Date },

    phone: { type: String },
    address: { type: String },
    gender: { type: String, enum: GenderEnum, default: GenderEnum.male },
    role: { type: String, enum: RoleEnum, default: RoleEnum.user },

    createdAt: { type: Date },
    updatedAt: { type: Date },
    provider: {
      type: String,
      enum: ProviderEnum,
      default: ProviderEnum.system,
    },

    picture: {
      type: new Schema(
        {
          url: { type: String, required: true },
          public_id: { type: String, required: true },
        },
        { _id: false }
      ),
      required: false,
    },

    coverImage: {
      type: new Schema(
        {
          url: { type: String, required: true },
          public_id: { type: String, required: true },
        },
        { _id: false }
      ),
      required: false,
    },

    forgetPasswordOTP: { type: String },
    forgetPasswordOTPExpiresAt: { type: String },
    forgetPasswordCount: { type: Number, min: 0, max: 5 },
    forgetPasswordBlockExpiresAt: { type: Date },

    freezedAt: { type: Date },
    freezedBy: { type: Schema.Types.ObjectId, ref: "User" },

    restoredAt: { type: Date },
    restoredBy: { type: Schema.Types.ObjectId, ref: "User" },

    twoSetupVerification: {
      type: String,
      enum: TwoSetupVerificationEnum,
      default: TwoSetupVerificationEnum.disable,
    },
    twoSetupVerificationCode: { type: String },
    twoSetupVerificationCodeExpiresAt: { type: Date },

    friends: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  {
    strictQuery: true,
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

userSchema
  .virtual("userName")
  .set(function (value: String) {
    const [firstName, lastName] = value.split(" ") || [];
    this.set({
      firstName,
      lastName,
      slug: value.replaceAll(/\s+/g, "-").toLocaleLowerCase(),
    });
  })
  .get(function () {
    return this.firstName + " " + this.lastName;
  });

userSchema.pre("findOneAndUpdate", async function (next) {
  const update: any = this.getUpdate();

  if (update.updateEmailOTP) {
    update.updateEmailOTP = await generateHash(update.updateEmailOTP);
    update.updateEmailOTPExpiresAt = new Date(Date.now() + 60 * 60 * 1000);
  }

  if (update.twoSetupVerificationCode) {
    update.twoSetupVerificationCode = await generateHash(
      update.twoSetupVerificationCode
    );
    update.twoSetupVerificationCodeExpiresAt = new Date(
      Date.now() + 10 * 60 * 1000
    );
  }

  this.setUpdate(update);
});

userSchema.pre(
  "save",
  async function (
    this: HUserDocument & { wasNew: boolean; OTPCode?: string },
    next
  ) {
    this.wasNew = this.isNew;

    const modifiedPaths = this.modifiedPaths();

    if (modifiedPaths.includes("password"))
      this.password = await generateHash(this.password);

    if (modifiedPaths.includes("confirmEmailOTP") && this.confirmEmailOTP) {
      this.OTPCode = this.confirmEmailOTP;
      this.confirmEmailOTP = await generateHash(this.confirmEmailOTP);
    }

    if (
      modifiedPaths.includes("firstName") ||
      modifiedPaths.includes("lastName")
    ) {
      const first = this.firstName || "";
      const last = this.lastName || "";

      this.slug = `${first} ${last}`
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");
    }
  }
);

userSchema.post("save", async function (next) {
  const that = this as HUserDocument & { wasNew: boolean; OTPCode?: string };
  if (that.wasNew && that.OTPCode)
    emailEvent.emit("confirmEmail", { to: this.email, OTPCode: that.OTPCode });
});

userSchema.pre(["updateOne", "findOne", "find"], function (next) {
  const query = this.getQuery();
  if (query.pranoId === false) {
    this.setQuery({ ...query });
  } else {
    this.setQuery({ ...query, freezedAt: { $exists: false } });
  }
  next();
});

export const UserModel = models.User || model<IUser>("User", userSchema);

export type HUserDocument = HydratedDocument<IUser>;
