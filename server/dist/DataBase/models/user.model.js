"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = exports.TwoSetupVerificationEnum = exports.ProviderEnum = exports.RoleEnum = exports.GenderEnum = void 0;
const mongoose_1 = require("mongoose");
const hash_security_1 = require("../../utils/security/hash.security");
const email_events_1 = require("../../utils/email/email.events");
var GenderEnum;
(function (GenderEnum) {
    GenderEnum["male"] = "male";
    GenderEnum["female"] = "female";
})(GenderEnum || (exports.GenderEnum = GenderEnum = {}));
var RoleEnum;
(function (RoleEnum) {
    RoleEnum["user"] = "user";
    RoleEnum["admin"] = "admin";
})(RoleEnum || (exports.RoleEnum = RoleEnum = {}));
var ProviderEnum;
(function (ProviderEnum) {
    ProviderEnum["system"] = "system";
    ProviderEnum["google"] = "google";
})(ProviderEnum || (exports.ProviderEnum = ProviderEnum = {}));
var TwoSetupVerificationEnum;
(function (TwoSetupVerificationEnum) {
    TwoSetupVerificationEnum["enable"] = "enable";
    TwoSetupVerificationEnum["disable"] = "disable";
})(TwoSetupVerificationEnum || (exports.TwoSetupVerificationEnum = TwoSetupVerificationEnum = {}));
const userSchema = new mongoose_1.Schema({
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
        type: String, required: function () {
            return this.provider === ProviderEnum.system ? true : false;
        }
    },
    reSetPasswordOTP: { type: String },
    changeCredentialsTime: { type: Date },
    phone: { type: String },
    adress: { type: String },
    gender: { type: String, enum: GenderEnum, default: GenderEnum.male },
    role: { type: String, enum: RoleEnum, default: RoleEnum.user },
    createdAt: { type: Date },
    updatedAt: { type: Date },
    provider: { type: String, enum: ProviderEnum, default: ProviderEnum.system },
    picture: { type: String },
    coverImages: { type: [String] },
    forgetPasswordOTP: { type: String },
    forgetPasswordOTPExpiresAt: { type: String },
    forgetPasswordCount: { type: Number, min: 0, max: 5 },
    forgetPasswordBlockExpiresAt: { type: Date },
    freezedAt: { type: Date },
    freezedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
    restoredAt: { type: Date },
    restoredBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
    twoSetupVerification: { type: String, enum: TwoSetupVerificationEnum, default: TwoSetupVerificationEnum.disable },
    twoSetupVerificationCode: { type: String },
    twoSetupVerificationCodeExpiresAt: { type: Date },
    friends: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "User" }],
}, {
    strictQuery: true,
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});
userSchema.virtual("userName").set(function (value) {
    const [firstName, lastName] = value.split(" ") || [];
    this.set({ firstName, lastName, slug: value.replaceAll(/\s+/g, "-").toLocaleLowerCase() });
}).get(function () {
    return this.firstName + " " + this.lastName;
});
userSchema.pre("findOneAndUpdate", async function (next) {
    const update = this.getUpdate();
    if (update.updateEmailOTP) {
        update.updateEmailOTP = await (0, hash_security_1.generateHash)(update.updateEmailOTP);
        update.updateEmailOTPExpiresAt = new Date(Date.now() + 60 * 60 * 1000);
    }
    if (update.twoSetupVerificationCode) {
        update.twoSetupVerificationCode = await (0, hash_security_1.generateHash)(update.twoSetupVerificationCode);
        update.twoSetupVerificationCodeExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    }
    this.setUpdate(update);
});
userSchema.pre("save", async function (next) {
    this.wasNew = this.isNew;
    const modifiedPaths = this.modifiedPaths();
    if (modifiedPaths.includes("password"))
        this.password = await (0, hash_security_1.generateHash)(this.password);
    if (modifiedPaths.includes("confirmEmailOTP") && this.confirmEmailOTP) {
        this.OTPCode = this.confirmEmailOTP;
        this.confirmEmailOTP = await (0, hash_security_1.generateHash)(this.confirmEmailOTP);
    }
});
userSchema.post("save", async function (next) {
    const that = this;
    if (that.wasNew && that.OTPCode)
        email_events_1.emailEvent.emit("confirmEmail", { to: this.email, OTPCode: that.OTPCode });
});
userSchema.pre(["updateOne", "findOne", "find"], function (next) {
    const query = this.getQuery();
    if (query.pranoId === false) {
        this.setQuery({ ...query });
    }
    else {
        this.setQuery({ ...query, freezedAt: { $exists: false } });
    }
    next();
});
exports.UserModel = mongoose_1.models.User || (0, mongoose_1.model)("User", userSchema);
