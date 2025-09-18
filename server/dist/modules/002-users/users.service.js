"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const user_model_1 = require("../../DataBase/models/user.model");
const s3_config_1 = require("../../utils/multer/s3.config");
const error_response_1 = require("../../utils/response/error.response");
const repository_1 = require("../../DataBase/repository");
const succses_response_1 = require("../../utils/response/succses.response");
const hash_security_1 = require("../../utils/security/hash.security");
const OTP_1 = require("../../utils/security/OTP");
const email_events_1 = require("../../utils/email/email.events");
class UserServise {
    usermodel = new repository_1.UserRepository(user_model_1.UserModel);
    constructor() { }
    profile = async (req, res) => {
        const { password, twoSetupVerificationCode, twoSetupVerificationCodeExpiresAt, ...safeUser } = req.user?.toObject();
        if (safeUser.picture) {
            const key = await (0, s3_config_1.getPreSigndUrl)({ Key: safeUser.picture });
            safeUser.picture = key;
        }
        if (safeUser.coverImages) {
            let keys = [];
            for (const Key of safeUser.coverImages) {
                keys.push(await (0, s3_config_1.getPreSigndUrl)({ Key }));
            }
            safeUser.coverImages = keys;
        }
        return (0, succses_response_1.succsesResponse)({
            res,
            data: safeUser
        });
    };
    uploadProfilePicture = async (req, res) => {
        const { _id } = req.tokenDecoded;
        const key = await (0, s3_config_1.uploadFile)({
            file: req.file,
            path: `users/${_id}`
        });
        const update = await this.usermodel.updateOne({
            _id
        }, {
            picture: key
        });
        if (!update) {
            throw new error_response_1.BadRequestException("Fail To Upload Profile Picture");
        }
        return (0, succses_response_1.succsesResponse)({
            res,
            info: "Profile Picture Uploaded Succses",
            data: { key }
        });
    };
    uploadCoverImages = async (req, res) => {
        const { _id } = req.tokenDecoded;
        if (!req.files?.length) {
            throw new error_response_1.BadRequestException("No files uploaded");
        }
        const keys = await (0, s3_config_1.uploadFiles)({
            files: req.files,
            path: `users/${req.tokenDecoded?._id}/cover`
        });
        await this.usermodel.updateOne({ _id }, {
            coverImages: keys
        });
        return (0, succses_response_1.succsesResponse)({
            res,
            info: "Profile Picture Uploaded Succses",
            data: { keys }
        });
    };
    deleteProfilePicture = async (req, res) => {
        const { _id } = req.tokenDecoded;
        const Key = req.user?.picture;
        if (!Key) {
            throw new error_response_1.NotFoundException("User Has No Profile Picture");
        }
        const deleted = await (0, s3_config_1.deleteFile)({ Key });
        if (!deleted) {
            throw new error_response_1.ApplicationException("Faild To Delete Profile Picture");
        }
        await this.usermodel.updateOne({ _id }, {
            $unset: { picture: 1 }
        });
        return (0, succses_response_1.succsesResponse)({
            res,
            info: "Profile Picture Deleted Succses",
        });
    };
    deleteCoverImages = async (req, res) => {
        const { _id } = req.tokenDecoded;
        const urls = req.user?.coverImages;
        if (!urls?.length) {
            throw new error_response_1.NotFoundException("User Has No Cover Images");
        }
        const deleted = await (0, s3_config_1.deleteFiles)({ urls });
        if (!deleted) {
            throw new error_response_1.ApplicationException("Faild To Delete Cover Images");
        }
        await this.usermodel.updateOne({ _id }, {
            $unset: { coverImages: 1 }
        });
        return (0, succses_response_1.succsesResponse)({
            res,
            info: "Cover Images Deleted Succses",
        });
    };
    updateBasicInfo = async (req, res) => {
        let data = {
            firstName: req.body.validData.userName.split(" ")[0],
            lastName: req.body.validData.userName.split(" ")[1],
            slug: req.body.validData.userName.replaceAll(/\s+/g, "-").toLocaleLowerCase(),
            phone: req.body.validData.phone,
            gender: req.body.validData.gender,
        };
        const oldData = await this.usermodel.findOne({
            filter: {
                _id: req.user?._id,
            }
        });
        let issues = [];
        if (data.firstName && data.lastName) {
            if (oldData?.userName === `${data.firstName} ${data.lastName}`) {
                issues.push({
                    path: "userName",
                    message: "new userName Is The Same Old userName",
                });
            }
        }
        if (data.gender) {
            if (oldData?.gender === data.gender) {
                issues.push({
                    path: "gender",
                    message: "new gender Is The Same Old gender",
                });
            }
        }
        if (data.phone) {
            if (oldData?.phone === data.phone) {
                issues.push({
                    path: "phone",
                    message: "new phone Is The Same Old phone",
                });
            }
        }
        if (issues.length) {
            throw new error_response_1.BadRequestException("Invalid Update Data", { issues });
        }
        const user = await this.usermodel.updateOne({
            _id: req.user?._id
        }, {
            $set: { ...data }
        });
        if (!user) {
            throw new error_response_1.BadRequestException("Fail To Update User Data");
        }
        return (0, succses_response_1.succsesResponse)({
            res,
            info: "Data Updated Succses",
        });
    };
    updateEmail = async (req, res) => {
        const newEmail = req.body.validData.email;
        const emailExists = await this.usermodel.findOne({
            filter: { email: newEmail }
        });
        if (emailExists) {
            throw new error_response_1.BadRequestException("Email Is Alrady Exists");
        }
        const OTPCode = (0, OTP_1.generateOTP)();
        await this.usermodel.updateOne({
            _id: req.user?._id
        }, { updateEmailOTP: OTPCode, newEmail });
        email_events_1.emailEvent.emit("confirmUpdatedEmail", { to: newEmail, OTPCode });
        return (0, succses_response_1.succsesResponse)({
            res,
            info: "Verify Your Email",
        });
    };
    confirmUpdateEmail = async (req, res) => {
        const OTP = req.body.validData.OTP;
        const user = await this.usermodel.findOne({
            filter: {
                _id: req.user?._id,
            }, select: { updateEmailOTP: 1, updateEmailOTPExpiresAt: 1, newEmail: 1 }
        });
        if (!user?.updateEmailOTP || !user?.updateEmailOTPExpiresAt || !user?.newEmail) {
            throw new error_response_1.NotFoundException("No OTP Requsted For User");
        }
        if (!await (0, hash_security_1.compareHash)(OTP, user.updateEmailOTP)) {
            throw new error_response_1.BadRequestException("Invalid OTP Code");
        }
        if (user.updateEmailOTPExpiresAt.getTime() <= Date.now()) {
            throw new error_response_1.BadRequestException("OTP Code Time Expired");
        }
        await this.usermodel.updateOne({
            _id: req.user?._id,
        }, {
            $set: {
                email: user.newEmail,
                confirmedAt: new Date()
            },
            $unset: {
                updateEmailOTP: true,
                updateEmailOTPExpiresAt: true,
                newEmail: true
            }
        });
        return (0, succses_response_1.succsesResponse)({
            res,
            info: "Verify Your Email",
        });
    };
    changePassword = async (req, res) => {
        const { _id, email, password } = req.user;
        const { oldPassword, newPassword } = req.body;
        if (!await (0, hash_security_1.compareHash)(oldPassword, password)) {
            throw new error_response_1.BadRequestException("Invalid Old Password");
        }
        const OTPCode = (0, OTP_1.generateOTP)();
        email_events_1.emailEvent.emit("changePassword", { to: email, OTPCode });
        await this.usermodel.updateOne({
            _id
        }, {
            password: await (0, hash_security_1.generateHash)(newPassword)
        });
        return (0, succses_response_1.succsesResponse)({
            res,
            info: "Your Password Changed Succses"
        });
    };
    freezAccount = async (req, res) => {
        const adminId = req.tokenDecoded?._id;
        let { userId } = req.params;
        if (!userId) {
            userId = adminId;
        }
        const freezedAccount = await this.usermodel.updateOne({
            _id: userId,
            freezedAt: { $exists: false },
            freezedBy: { $exists: false },
        }, {
            $set: {
                freezedAt: new Date(),
                freezedBy: adminId,
                changeCredentialsTime: new Date()
            },
            $unset: {
                restoredAt: 1,
                restoredBy: 1
            }
        });
        if (!freezedAccount) {
            throw new error_response_1.BadRequestException("Faild To Freez Account");
        }
        return (0, succses_response_1.succsesResponse)({
            res,
            info: "Account Freezed Succses",
        });
    };
    deleteAccount = async (req, res) => {
        const { userId } = req.params;
        const user = await this.usermodel.findOne({ filter: { _id: userId } });
        if (!user) {
            throw new error_response_1.NotFoundException("User Not Found");
        }
        if (!user.freezedAt) {
            throw new error_response_1.BadRequestException("Cannot Delete Not Freezed Account");
        }
        const deletedUser = await this.usermodel.deleteOne({ _id: userId });
        if (!deletedUser.deletedCount) {
            throw new error_response_1.BadRequestException("Faild To Delete User");
        }
        await (0, s3_config_1.deleteFolderByPrefix)({ path: `users/${user._id}` });
        return (0, succses_response_1.succsesResponse)({
            res,
            info: "Account Deleted Succses",
        });
    };
}
exports.default = new UserServise();
