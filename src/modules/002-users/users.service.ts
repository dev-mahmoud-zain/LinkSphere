import { Response, Request } from "express"
import {
    deleteFile,
    deleteFiles,
    deleteFolderByPrefix,
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
import { ObjectId, Types } from "mongoose";

export class UserService {

    private userModel = new UserRepository(UserModel);
    private postModel = new PostRepository(PostModel);
    private commentModel = new CommentRepository(CommentModel);
    private friendRequestModel = new FriendRequestRepository(FriendRequestModel);
    private chatModel = new ChatRepository(ChatModel);


    private unfreezeUser = async (userId: Types.ObjectId, restoredBy: Types.ObjectId) => {

        // Un Unfreeze User
        await this.userModel.findOneAndUpdate({
            filter: {
                _id: userId,
            }, updateData: {
                set: {
                    restoredAt: new Date(),
                    restoredBy
                },
                $unset: {
                    freezeedAt: "",
                    freezeedBy: ""
                }
            }
        });

        // Unfreeze All Posts And Comments For User 
        await this.postModel.updateMany({
            createdBy: userId,
            freezeedAt: { $exists: true },
            freezeedBy: { $exists: true },
        }, {
            $set: {
                restoredAt: new Date(),
                restoredBy
            },
            $unset: {
                freezeedAt: "",
                freezeedBy: ""
            }
        });

        await this.commentModel.updateMany({
            createdBy: userId,
            freezeedAt: { $exists: true },
            freezeedBy: { $exists: true },
        }, {
            set: {
                restoredAt: new Date(),
                restoredBy
            },
            $unset: {
                freezeedAt: "",
                freezeedBy: ""
            }
        });

    }

    constructor() { }

    // ============================ Profile Management =============================

    profile = async (req: Request, res: Response): Promise<Response> => {



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

        const groups = await this.chatModel.find({
            filter: {
                groupName: { $exists: true },
                participants: { $in: req.user?._id }
            }
        })


        return successResponse({
            res,
            data: { user, groups: groups.data }
        })

    }

    getUserById = async (req: Request, res: Response): Promise<Response> => {

        const { userId } = req.params as unknown as {
            userId: Types.ObjectId
        };

        const reqUser = req.user?._id as unknown as Types.ObjectId;


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

        const groups = await this.chatModel.find({
            filter: {
                groupName: { $exists: true },
                participants: { $in: req.user?._id }
            }
        })


        const isFriend =
            (user.friends as any[])?.some((f) => f._id.equals(reqUser));


        let friendRequestStatus: "sent" | "received" | null = null;

        if (!isFriend) {

            const friendRequest = await this.friendRequestModel.findOne({
                filter: {
                    $or: [
                        { sendBy: reqUser, sendTo: userId },
                        { sendBy: userId, sendTo: reqUser },
                    ]
                }
            });

            if (friendRequest) {
                if (friendRequest.sendBy.equals(reqUser)) {
                    friendRequestStatus = "sent";
                } else {
                    friendRequestStatus = "received";
                }
            }

        }

        const data = {
            ...user.toObject(),
            isFriend,
            friendRequest: friendRequestStatus,
            groups: groups.data
        };

        return successResponse({
            res,
            data
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

        if (userId.toString() === sendBy.toString()) {
            throw new BadRequestException("Cannot Send Friend Request To Yourself");
        }

        if (await this.userModel.findOne({
            filter: {
                _id: userId,
                friends: { $in: sendBy }
            }
        })) {
            throw new ConflictException("User Already In Friends list");
        }

        if (await this.friendRequestModel.findOne({
            filter: {
                sendBy: { $in: [userId, sendBy] },
                sendto: { $in: [userId, sendBy] },
            }
        })) {
            throw new ConflictException("Friend Request Already Exists");
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

        const { requestId } = req.params as unknown as { requestId: Types.ObjectId }
        const receiverId = req.user?._id as unknown as Types.ObjectId;


        const friendRequest = await this.friendRequestModel.findOneAndUpdate({
            filter: {
                _id: requestId,
                sendTo: receiverId,
                acceptedAt: { $exists: false }
            }, updateData: {
                acceptedAt: new Date()
            }
        })

        if (!friendRequest) {
            throw new NotFoundException("Friend Request Not Exists");
        }


        const accepted = await Promise.all([
            this.userModel.updateOne({
                _id: friendRequest.sendBy
            }, {
                $addToSet: { friends: receiverId }
            }),

            this.userModel.updateOne({
                _id: receiverId
            }, {
                $addToSet: { friends: friendRequest.sendBy }
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

        const { requestId } = req.params as unknown as { requestId: Types.ObjectId }

        const Request = await this.friendRequestModel.findOneAndDelete({
            filter: {
                _id: requestId,
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

            this.friendRequestModel.findOneAndDelete({
                filter: {
                    acceptedAt: { $exists: true },
                    $and: [
                        {
                            $or: [
                                { sendBy: req.user?._id },
                                { sendBy: userId },
                            ],
                        },
                        {
                            $or: [
                                { sendTo: req.user?._id },
                                { sendTo: userId },
                            ],
                        },
                    ]
                }
            })
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

    GetFriendRequests = async (req: Request, res: Response): Promise<Response> => {

        const userId = req.user?._id;

        const requests = await this.friendRequestModel.find({
            filter: {
                sendTo: userId,
                acceptedAt: { $exists: false }
            }
        })

        return successResponse({
            res,
            data: {
                count: requests.data.length,
                requests: requests.data
            }
        });

    }

    getFriendsList = async (req: Request, res: Response): Promise<Response> => {

        const userId = req.user?._id;

        const friends = await this.userModel.find({
            filter: {
                friends: { $in: userId },
            },
            projection: {
                firstName: 1,
                lastName: 1,
                slug: 1,
                email: 1,
                phone: 1,
                gender: 1,
                coverImages: 1,
                picture: 1,
            }
        })


        return successResponse({
            res,
            data: {
                count: friends.data.length,
                friends: friends.data
            }
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
            // لنفسه freeze  يعمل 
            userId = adminId;
        }

        const freezeedAccount = await this.userModel.updateOne({
            _id: userId,
            freezeedAt: { $exists: false },
            freezeedBy: { $exists: false },
        }, {
            $set: {
                freezeedAt: new Date(),
                freezeedBy: adminId,
                changeCredentialsTime: new Date()
            },
            $unset: {
                restoredAt: 1,
                restoredBy: 1
            }
        })

        if (!freezeedAccount) {
            throw new BadRequestException("Fail To freeze Account")
        }

        // freeze All Posts And Comments For User 
        await this.postModel.updateMany({
            createdBy: userId,
            freezeedAt: { $exists: false },
            freezeedBy: { $exists: false },
        }, {
            $set: {
                freezeedAt: new Date(),
                freezeedBy: adminId,
            },
            $unset: {
                restoredAt: 1,
                restoredBy: 1
            }
        })

        await this.commentModel.updateMany({
            createdBy: userId,
            freezeedAt: { $exists: false },
            freezeedBy: { $exists: false },
        }, {
            $set: {
                freezeedAt: new Date(),
                freezeedBy: adminId,
            },
            $unset: {
                restoredAt: 1,
                restoredBy: 1
            }
        })

        return successResponse({
            res,
            message: "Account freezeed Success",
        })

    }

    unfreezeAccountByAdmin = async (req: Request, res: Response): Promise<Response> => {

        const adminId = req.tokenDecoded?._id;
        let { userId } = req.params as unknown as {
            userId: Types.ObjectId
        };

        // UnfreezeAccount
        this.unfreezeUser(userId, adminId)

        return successResponse({
            res,
            message: "Account Unfreezeed Success",
        })

    }

    unfreezeAccountByAccountAuthor = async (req: Request, res: Response): Promise<Response> => {

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

        if (!user.freezeedAt && !user.freezeedBy) {
            throw new BadRequestException("Account Is Not freezeed");
        }

        if (user.freezeedBy &&
            (user.freezeedBy.toString() !== user._id.toString())) {
            throw new BadRequestException("Account Is freezeed By Admin");
        }

        const userId = user._id as unknown as Types.ObjectId;

        await this.unfreezeUser(userId, userId);

        return successResponse({
            res,
            message: "Account Unfreezeed Success",
        })

    }

    deleteAccount = async (req: Request, res: Response): Promise<Response> => {

        const { userId } = req.params;

        const user = await this.userModel.findOne({ filter: { _id: userId } });

        if (!user) {
            throw new NotFoundException("User Not Found")
        }

        if (!user.freezeedAt) {
            throw new BadRequestException("Cannot Delete Not freezeed Account");
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