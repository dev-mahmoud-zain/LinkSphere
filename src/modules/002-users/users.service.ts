import { Response, Request } from "express"
import {
    deleteFile,
    deleteFiles,
    deleteFolderByPrefix,
    getPreSignedUrl,
    uploadFile,
    uploadFiles
} from "../../utils/multer/s3.config";
import {
    ApplicationException,
    BadRequestException,
    ConflictException,
    NotFoundException
} from "../../utils/response/error.response";
import {
    ChatRepository,
    CommentRepository,
    FriendRequestRepository,
    PostRepository,
    UserRepository
} from "../../DataBase/repository";
import { JwtPayload } from "jsonwebtoken";
import { successResponse } from "../../utils/response/success.response";
import { compareHash, generateHash } from "../../utils/security/hash.security";
import { generateOTP } from "../../utils/security/OTP";
import { emailEvent } from "../../utils/email/email.events";
import { CommentModel, PostModel, HUserDocument, UserModel, RoleEnum, FriendRequestModel, ChatModel } from "../../DataBase/models";
import { Types } from "mongoose";
import { generalFields } from "../../middlewares/validation.middleware";

export class UserService {

    private userModel = new UserRepository(UserModel);
    private postModel = new PostRepository(PostModel);
    private commentModel = new CommentRepository(CommentModel);
    private friendRequestModel = new FriendRequestRepository(FriendRequestModel);
    private chatModel = new ChatRepository(ChatModel);


    private unfreezeUser = async (userId: Types.ObjectId, restoredBy: Types.ObjectId) => {

        // Un UnFreez User
        await this.userModel.findOneAndUpdate({
            filter: {
                _id: userId,
            }, updateData: {
                set: {
                    restoredAt: new Date(),
                    restoredBy
                },
                $unset: {
                    freezedAt: "",
                    freezedBy: ""
                }
            }
        });

        // UnFreez All Posts And Comments For User 
        await this.postModel.updateMany({
            createdBy: userId,
            freezedAt: { $exists: true },
            freezedBy: { $exists: true },
        }, {
            $set: {
                restoredAt: new Date(),
                restoredBy
            },
            $unset: {
                freezedAt: "",
                freezedBy: ""
            }
        });

        await this.commentModel.updateMany({
            createdBy: userId,
            freezedAt: { $exists: true },
            freezedBy: { $exists: true },
        }, {
            set: {
                restoredAt: new Date(),
                restoredBy
            },
            $unset: {
                freezedAt: "",
                freezedBy: ""
            }
        });

    }

    constructor() { }

    // ============================ Profile Management =============================

    profile = async (req: Request, res: Response): Promise<Response> => {
        // const { password, twoSetupVerificationCode, twoSetupVerificationCodeExpiresAt, ...safeUser } = req.user?.toObject() as HUserDocument;

        interface IFriend {
            _id: string;
            firstName: string;
            lastName: string;
            email: string;
            gender: string;
            picture: string;
        }

        const user = await this.userModel.findOne({
            filter: {
                _id: req.user?._id
            }, select: {
                password: 0,
                twoSetupVerification: 0,
                twoSetupVerificationCode: 0,
                twoSetupVerificationCodeExpiresAt: 0,
                provider: 0,
                createdAt: 0,
                updatedAt: 0,
                confirmedAt: 0
            }, options: {
                populate: [{
                    path: "friends",
                    select: "firstName lastName email gender picture"
                }]
            }
        })

        if (!user) {
            throw new NotFoundException("Fail To Get Profile")
        }

        if (user.picture) {
            const key = await getPreSignedUrl({ Key: user.picture });
            user.picture = key
        }

        if (user.coverImages) {
            let keys = []
            for (const Key of user.coverImages) {
                keys.push(await getPreSignedUrl({ Key }));
            }
            user.coverImages = keys;
        }

        if (user.friends?.length) {
            for (const friend of user.friends as unknown as IFriend[]) {
                if (friend.picture) {
                    const friendKey = await getPreSignedUrl({ Key: friend.picture });
                    friend.picture = friendKey || ""
                }
            }
        }

        const groups = await this.chatModel.find({
            filter: {
                groupName: { $exists: true },
                participants: { $in: req.user?._id }
            }
        })

        if (groups?.data?.length) {
            for (const group of groups.data) {
                if (group.groupImage) {
                    const groupKey = await getPreSignedUrl({ Key: group.groupImage });
                    group.groupImage = groupKey || "";
                }
            }
        }

        return successResponse({
            res,
            data: { user, groups: groups.data }
        })

    }

    getUserById = async (req: Request, res: Response): Promise<Response> => {

        const { userId } = req.params as unknown as {
            userId: Types.ObjectId
        };

        console.log(userId)

        interface IFriend {
            _id: string;
            firstName: string;
            lastName: string;
            email: string;
            gender: string;
            picture: string;
        }

        const user = await this.userModel.findOne({
            filter: {
                _id: userId
            }, select: {
                password: 0,
                twoSetupVerification: 0,
                twoSetupVerificationCode: 0,
                twoSetupVerificationCodeExpiresAt: 0,
                provider: 0,
                createdAt: 0,
                updatedAt: 0,
                confirmedAt: 0
            }, options: {
                populate: [{
                    path: "friends",
                    select: "firstName lastName email gender picture"
                }]
            }
        })

        if (!user) {
            throw new NotFoundException("Fail To Get Profile")
        }

        if (user.picture) {
            const key = await getPreSignedUrl({ Key: user.picture });
            user.picture = key
        }

        if (user.coverImages) {
            let keys = []
            for (const Key of user.coverImages) {
                keys.push(await getPreSignedUrl({ Key }));
            }
            user.coverImages = keys;
        }

        if (user.friends?.length) {
            for (const friend of user.friends as unknown as IFriend[]) {
                if (friend.picture) {
                    const friendKey = await getPreSignedUrl({ Key: friend.picture });
                    friend.picture = friendKey || ""
                }
            }
        }

        const groups = await this.chatModel.find({
            filter: {
                groupName: { $exists: true },
                participants: { $in: req.user?._id }
            }
        })

        if (groups?.data?.length) {
            for (const group of groups.data) {
                if (group.groupImage) {
                    const groupKey = await getPreSignedUrl({ Key: group.groupImage });
                    group.groupImage = groupKey || "";
                }
            }
        }

        return successResponse({
            res,
            data: { user, groups: groups.data }
        })

    }

    uploadProfilePicture = async (req: Request, res: Response): Promise<Response> => {

        const { _id } = req.tokenDecoded as JwtPayload

        const key = await uploadFile({
            file: req.file as Express.Multer.File,
            path: `users/${_id}`
        })

        const update = await this.userModel.updateOne({
            _id
        }, {
            picture: key
        })

        if (!update) {
            throw new BadRequestException("Fail To Upload Profile Picture")
        }

        return successResponse({
            res,
            message: "Profile Picture Uploaded Success",
            data: { key }
        })


    }

    uploadCoverImages = async (req: Request, res: Response): Promise<Response> => {

        const { _id } = req.tokenDecoded as JwtPayload

        if (!req.files?.length) {
            throw new BadRequestException("No files uploaded")
        }

        const keys = await uploadFiles({
            files: req.files as Express.Multer.File[],
            path: `users/${req.tokenDecoded?._id}/cover`
        })

        await this.userModel.updateOne({ _id }, {
            coverImages: keys
        })

        return successResponse({
            res,
            message: "Profile Picture Uploaded Success",
            data: { keys }
        })

    }

    deleteProfilePicture = async (req: Request, res: Response): Promise<Response> => {

        const { _id } = req.tokenDecoded as JwtPayload
        const Key = req.user?.picture;

        if (!Key) {
            throw new NotFoundException("User Has No Profile Picture")
        }

        const deleted = await deleteFile({ Key });

        if (!deleted) {
            throw new ApplicationException("Fail To Delete Profile Picture");
        }

        await this.userModel.updateOne({ _id }, {
            $unset: { picture: 1 }
        })

        return successResponse({
            res,
            message: "Profile Picture Deleted Success",
        })



    }

    deleteCoverImages = async (req: Request, res: Response): Promise<Response> => {

        const { _id } = req.tokenDecoded as JwtPayload
        const urls = req.user?.coverImages;

        if (!urls?.length) {
            throw new NotFoundException("User Has No Cover Images")
        }

        const deleted = await deleteFiles({ urls });

        if (!deleted) {
            throw new ApplicationException("Fail To Delete Cover Images");
        }

        await this.userModel.updateOne({ _id }, {
            $unset: { coverImages: 1 }
        })

        return successResponse({
            res,
            message: "Cover Images Deleted Success",
        })

    }


    // =============================  Friendship Management ===============================

    sendFriendRequest = async (req: Request, res: Response): Promise<Response> => {

        const { userId } = req.params as unknown as { userId: Types.ObjectId }
        const sendBy = req.user?._id as unknown as Types.ObjectId;

        if (userId === sendBy) {
            throw new BadRequestException("User Cannot Send Friend Request To Himself");
        }

        if (await this.friendRequestModel.findOne({
            filter: {
                sendBy: { $in: [userId, sendBy] },
                sendto: { $in: [userId, sendBy] },
            }
        })
        ) {
            throw new ConflictException("Friend Request Alredy Exists");
        }

        if (!await this.userModel.findOne({
            filter: { _id: userId }
        })) {
            throw new NotFoundException("User Not Found");
        }

        const [friendRequest] = await this.friendRequestModel.create({
            data: [{
                sendTo: userId,
                sendBy
            }]
        }) || []

        if (!friendRequest) {
            throw new BadRequestException("Fail To Send Friend Request");
        }

        return successResponse({
            res,
            statusCode: 201,
            message: "Friend Request Sent Success",
            data: {
                RequestId: friendRequest._id
            }
        })
    }

    acceptFriendRequest = async (req: Request, res: Response): Promise<Response> => {

        const { RequestId } = req.params as unknown as { RequestId: Types.ObjectId }
        const reseverId = req.user?._id as unknown as Types.ObjectId;

        const freindRequest = await this.friendRequestModel.findOneAndUpdate({
            filter: {
                _id: RequestId,
                sendTo: reseverId,
                acceptedAt: { $exists: false }
            }, updateData: {
                acceptedAt: new Date()
            }
        })

        if (!freindRequest) {
            throw new NotFoundException("Friend Request Not Exists");
        }


        const accepted = await Promise.all([
            this.userModel.updateOne({
                _id: freindRequest.sendBy
            }, {
                $addToSet: { friends: reseverId }
            }),

            this.userModel.updateOne({
                _id: reseverId
            }, {
                $addToSet: { friends: freindRequest.sendBy }
            })
        ]);

        if (!accepted) {
            throw new BadRequestException("Fail To Accept Request")
        }

        return successResponse({
            res,
            statusCode: 200,
            message: "Friend Request Sent Success",
        })
    }


    cancelFriendRequest = async (req: Request, res: Response): Promise<Response> => {

        const { RequestId } = req.params as unknown as { RequestId: Types.ObjectId }

        const Request = await this.friendRequestModel.findOneAndDelete({
            filter: {
                _id: RequestId,
                acceptedAt: { $exists: false },
                $or: [
                    { sendBy: req.user?._id, },
                    { sendTo: req.user?._id, }
                ]
            }
        })

        if (!Request) {
            throw new BadRequestException("No Matched Request");
        }

        return successResponse({
            res,
            statusCode: 200,
            message: "Friend Request Deleted Success",
        });

    }

    removeFriend = async (req: Request, res: Response): Promise<Response> => {

        const { userId } = req.params as unknown as { userId: Types.ObjectId }

        const friendExist = await this.userModel.findOne({
            filter: {
                _id: req.user?._id,
                friends: { $in: userId }
            }
        });

        if (!friendExist) {
            throw new NotFoundException("Friend Not Found");
        }

        const removeFriend = await Promise.all([

            this.userModel.findOneAndUpdate({
                filter: { _id: req.user?._id },
                updateData: { $pull: { friends: userId } }
            }),

            this.userModel.findOneAndUpdate({
                filter: { _id: userId },
                updateData: { $pull: { friends: req.user?._id } }
            }),

        ])

        if (!removeFriend) {
            throw new BadRequestException("Fail To Remove Friend");
        }

        return successResponse({
            res,
            statusCode: 200,
            message: "Friend Removed Success",
        });

    }

    // ========================= User Information Updates ==========================

    updateBasicInfo = async (req: Request, res: Response): Promise<Response> => {


        interface IUpdateData {
            firstName?: string,
            lastName?: string,
            phone?: string,
            gender?: string,
            slug?: string
        }

        let data: IUpdateData = {
            firstName: req.body.validData.userName.split(" ")[0],
            lastName: req.body.validData.userName.split(" ")[1],
            slug: req.body.validData.userName.replaceAll(/\s+/g, "-").toLocaleLowerCase(),
            phone: req.body.validData.phone,
            gender: req.body.validData.gender,
        };

        const oldData = await this.userModel.findOne({
            filter: {
                _id: req.user?._id,
            }
        })

        let issues = [];


        if (data.firstName && data.lastName) {
            if (oldData?.userName === `${data.firstName} ${data.lastName}`) {
                issues.push({
                    path: "userName",
                    message: "new userName Is The Same Old userName",
                })
            }
        }

        if (data.gender) {
            if (oldData?.gender === data.gender) {
                issues.push({
                    path: "gender",
                    message: "new gender Is The Same Old gender",
                })
            }
        }

        if (data.phone) {
            if (oldData?.phone === data.phone) {
                issues.push({
                    path: "phone",
                    message: "new phone Is The Same Old phone",
                })
            }
        }

        if (issues.length) {
            throw new BadRequestException("Invalid Update Data", { issues })
        }

        const user = await this.userModel.updateOne({
            _id: req.user?._id
        }, {
            $set: { ...data }
        })

        if (!user) {
            throw new BadRequestException("Fail To Update User Data");
        }

        return successResponse({
            res,
            message: "Data Updated Success",
        })

    }

    updateEmail = async (req: Request, res: Response): Promise<Response> => {

        const newEmail = req.body.validData.email;

        const emailExists = await this.userModel.findOne({
            filter: { email: newEmail }
        })

        if (emailExists) {
            throw new BadRequestException("Email Is Alrady Exists");
        }

        const OTPCode = generateOTP();

        await this.userModel.updateOne({
            _id: req.user?._id
        }, { updateEmailOTP: OTPCode, newEmail })

        emailEvent.emit("confirmUpdatedEmail", { to: newEmail, OTPCode })

        return successResponse({
            res,
            message: "Verify Your Email",
        })

    }

    confirmUpdateEmail = async (req: Request, res: Response): Promise<Response> => {

        const OTP = req.body.validData.OTP;

        const user = await this.userModel.findOne({
            filter: {
                _id: req.user?._id,
            }, select: { updateEmailOTP: 1, updateEmailOTPExpiresAt: 1, newEmail: 1 }
        })

        if (!user?.updateEmailOTP || !user?.updateEmailOTPExpiresAt || !user?.newEmail) {
            throw new NotFoundException("No OTP Requested For User");
        }

        if (!await compareHash(OTP, user.updateEmailOTP)) {
            throw new BadRequestException("Invalid OTP Code");
        }

        if (user.updateEmailOTPExpiresAt.getTime() <= Date.now()) {
            throw new BadRequestException("OTP Code Time Expired");
        }

        await this.userModel.updateOne({
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
        })


        return successResponse({
            res,
            message: "Verify Your Email",
        })

    }

    changePassword = async (req: Request, res: Response): Promise<Response> => {


        const { _id, email, password } = req.user as HUserDocument;
        const { oldPassword, newPassword } = req.body


        if (!await compareHash(oldPassword, password)) {
            throw new BadRequestException("Invalid Old Password")
        }

        const OTPCode = generateOTP();
        emailEvent.emit("changePassword", { to: email, OTPCode })


        await this.userModel.updateOne({
            _id
        }, {
            password: await generateHash(newPassword)
        })



        return successResponse({
            res,
            message: "Your Password Changed Success"
        })



    }

    // ============================= Account Control ===============================

    freezeAccount = async (req: Request, res: Response): Promise<Response> => {

        const adminId = req.tokenDecoded?._id;
        let { userId } = req.params;

        if (!userId) {
            // لنفسه Freez  يعمل 
            userId = adminId;
        }

        const freezedAccount = await this.userModel.updateOne({
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
        })

        if (!freezedAccount) {
            throw new BadRequestException("Fail To Freez Account")
        }

        // Freez All Posts And Comments For User 
        await this.postModel.updateMany({
            createdBy: userId,
            freezedAt: { $exists: false },
            freezedBy: { $exists: false },
        }, {
            $set: {
                freezedAt: new Date(),
                freezedBy: adminId,
            },
            $unset: {
                restoredAt: 1,
                restoredBy: 1
            }
        })

        await this.commentModel.updateMany({
            createdBy: userId,
            freezedAt: { $exists: false },
            freezedBy: { $exists: false },
        }, {
            $set: {
                freezedAt: new Date(),
                freezedBy: adminId,
            },
            $unset: {
                restoredAt: 1,
                restoredBy: 1
            }
        })

        return successResponse({
            res,
            message: "Account Freezed Success",
        })

    }

    unFreezeAccountByAdmin = async (req: Request, res: Response): Promise<Response> => {

        const adminId = req.tokenDecoded?._id;
        let { userId } = req.params as unknown as {
            userId: Types.ObjectId
        };

        // UnFreezAccount
        this.unfreezeUser(userId, adminId)

        return successResponse({
            res,
            message: "Account Unfreezed Success",
        })

    }

    unFreezeAccountByAccountAuthor = async (req: Request, res: Response): Promise<Response> => {

        const { email, password } = req.body as unknown as {
            email: string,
            password: string
        };

        const user = await this.userModel.findOne({
            filter: {
                email,
                pranoId: false
            }
        });

        if (!user) {
            throw new NotFoundException("User Not Found");
        }

        if (!await compareHash(password, user.password)) {
            throw new BadRequestException("Invalid Email Or Password");
        }

        if (!user.freezedAt && !user.freezedBy) {
            throw new BadRequestException("Account Is Not Freezed");
        }

        if (user.freezedBy &&
            (user.freezedBy.toString() !== user._id.toString())) {
            throw new BadRequestException("Account Is Freezed By Admin");
        }

        const userId = user._id as unknown as Types.ObjectId;

        await this.unfreezeUser(userId, userId);

        return successResponse({
            res,
            message: "Account Unfreezed Success",
        })

    }

    deleteAccount = async (req: Request, res: Response): Promise<Response> => {

        const { userId } = req.params;

        const user = await this.userModel.findOne({ filter: { _id: userId } });

        if (!user) {
            throw new NotFoundException("User Not Found")
        }

        if (!user.freezedAt) {
            throw new BadRequestException("Cannot Delete Not Freezed Account");
        }

        const deletedUser = await this.userModel.deleteOne({ _id: userId });

        if (!deletedUser.deletedCount) {
            throw new BadRequestException("Fail To Delete User")
        }

        await deleteFolderByPrefix({ path: `users/${user._id}` });

        return successResponse({
            res,
            message: "Account Deleted Success",
        })

    }


    // ============================= Admin Control ===============================


    changeRole = async (req: Request, res: Response): Promise<Response> => {

        const { id } = req.params as unknown as { id: Types.ObjectId };
        const { role } = req.body as unknown as { role: RoleEnum };

        let denyRoles: RoleEnum[] = [role, RoleEnum.suberAdmin];

        if (req.user?.role === RoleEnum.admin) {
            denyRoles.push(RoleEnum.admin);
        }



        const user = await this.userModel.findOneAndUpdate({
            filter: {
                _id: id,
                role: { $nin: denyRoles }
            }, updateData: {
                role
            }
        })

        if (!user) {
            throw new BadRequestException("Fail To Change Role");
        }

        return successResponse({
            res,
            message: "Role Updated Success",
        })

    }


    // ============================= GQL ===============================

    allUsers = async (args: { page: number, limit: number }) => {
        const users = await this.userModel.find({
            limit: args.limit,
            page: args.page
        });

        return {
            count: users.data.length,
            page: users.pagination.page,
            limit: users.pagination.limit,
            users: users.data
        }

    }

    searchForUser = async (args: { key: string, page: number, limit: number }) => {


        const users = await this.userModel.find({
            filter: {
                $or: [
                    { userName: { $regex: new RegExp(`\\b${args.key}`, "i") } },
                    { firstName: { $regex: new RegExp(`\\b${args.key}`, "i") } },
                    { lastName: { $regex: new RegExp(`\\b${args.key}`, "i") } },
                    { email: { $regex: new RegExp(`\\b${args.key}`, "i") } },
                ]
            },
            page: args.page,
            limit: args.limit
        });



        return {
            count: users.data.length,
            page: users.pagination.page,
            limit: users.pagination.limit,
            users: users.data
        }
    }

}

export default new UserService()