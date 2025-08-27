import type { Request, Response } from "express"
import type { I_ConfirmEmailInputs, I_loginBodyInputs, I_ReSendConfirmEmailIOTPInputs, I_SignupBodyInputs } from "./dto/auth.dto";
import { UserRepository } from "../../DataBase/repository/user.repository";
import { UserModel } from "../../DataBase/models/user.model";
import { BadRequestException, ConflictException, NotFoundException } from "../../utils/response/error.response";
import { compareHash, generateHash } from "../../utils/security/hash.security";
import { emailEvent } from "../../utils/email/email.events";
import { generateOTP } from "../../utils/security/OTP";
import { TokenService } from "../../utils/security/token.security";


class AuthenticationServices {

    private userModel = new UserRepository(UserModel);
    private tokenService = new TokenService;

    constructor() { }

    signup = async (req: Request, res: Response): Promise<Response> => {

        let { userName, email, password, gender, phone }: I_SignupBodyInputs = req.body.validData;


        const userExsist = await this.userModel.findOne({
            filter: { email }, select: "_id userName email", options: { lean: true }
        })

        if (userExsist) {
            throw new ConflictException("Email Alredy Exsists Try To Login", userExsist)
        }

        const OTPCode = generateOTP();

        await this.userModel.createUser({
            data: [{
                userName,
                email,
                password: await generateHash(password),
                gender,
                confirmEmailOTP: await generateHash(OTPCode),
                confirmEmailSentTime: new Date(),
                ...(phone ? { phone } : {})
            }]
        })

        emailEvent.emit("confirmEmail", { to: email, OTPCode })

        return res.status(201).json({
            message: "Done",
            info: "We Sent A Confirm OTP To Your Email , Please Confirm It To Login",
        });

    }

    confirmEmail = async (req: Request, res: Response): Promise<Response> => {

        const { email, OTP }: I_ConfirmEmailInputs = req.body.validData;

        const user = await this.userModel.findOne({
            filter: { email },
        })

        if (!user) {
            throw new NotFoundException("Email Is Not Exsist")
        }

        if (user.confirmedAt) {
            throw new BadRequestException("This Email Is Already Confirmed");
        }

        if (!user.confirmEmailSentTime || !user.confirmEmailOTP) {
            throw new NotFoundException("OTP Not Found Or Not Sent For This Email");
        }

        const sentAt: Date = user.confirmEmailSentTime
        const expiresAt = new Date(sentAt.getTime() + 5 * 60 * 1000);
        if (new Date() > expiresAt) {
            throw new BadRequestException("OTP Code Has Expired");
        }

        if (! await compareHash(OTP, user.confirmEmailOTP as string)) {
            throw new BadRequestException("Invalid OTP Number")
        }


        await this.userModel.updateOne({
            email
        }, {
            $set: {
                confirmedAt: new Date(),
            },
            $unset: {
                confirmEmailOTP: true,
                confirmEmailSentTime: true,
                OTPReSendCount: true,
                otpBlockExpiresAt: true
            },
        })

        return res.status(200).json({
            message: "Done",
            info: "Email Confirmed Succses",
        });

    }

    reSendConfirmOTP = async (req: Request, res: Response): Promise<Response> => {

        const { email }: I_ReSendConfirmEmailIOTPInputs = req.body.validData;

        let user = await this.userModel.findOne({
            filter: { email },
        })

        // الأكونت مش موجود يا بلدينا
        if (!user) {
            throw new NotFoundException("User Not Found")
        }

        // جاي تأكتف أكونت أوريدي متأكتف !! طب اقنعني ازاي
        if (user.confirmedAt) {
            throw new BadRequestException("This Account Already Confirmed Before");
        }

        //  لسة مش واخد بلوك بس وصل الحد الاقصى
        if (!user.otpBlockExpiresAt && user.OTPReSendCount === 5) {
            await this.userModel.updateOne({ email }, {
                otpBlockExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
                OTPReSendCount: user.OTPReSendCount
            })
            throw new BadRequestException("Max 5 Attempts Reached. Try Again In 10 Minutes.");
        }

        // واخد بلوك
        if (user.otpBlockExpiresAt) {

            // لسة واخد بلوك
            if (user.otpBlockExpiresAt > new Date()) {
                throw new BadRequestException("Maximum attempts reached. Please try again later.");
            }

            // نفك البلوك عشان الوقت خلص
            else {
                user = await this.userModel.updateOne({ email }, {
                    $unset: { otpBlockExpiresAt: 1 },
                    OTPReSendCount: 0
                })
            }
        }

        const OTPCode: string = generateOTP();
        await this.userModel.updateOne({ email }, {
            OTPReSendCount: user.OTPReSendCount ? user.OTPReSendCount + 1 : 1,
            confirmEmailOTP: await generateHash(OTPCode),
            confirmEmailSentTime: new Date()
        })

        emailEvent.emit("confirmEmail", { to: email, OTPCode });

        return res.status(200).json({
            message: "Done",
            info: "Email Confirmed Succses",
        });
    }

    login = async (req: Request, res: Response): Promise<Response> => {

        const { email, password }: I_loginBodyInputs = req.body.validData;

        const user = await this.userModel.findOne({
            filter: {
                email
            },
            select: { email: 1, password: 1, confirmedAt: 1, role: 1 }
        })

        if (!user) {
            throw new NotFoundException("User Not Found Try To Signup");
        }

        if (!user.confirmedAt) {
            throw new BadRequestException("Confirm Your Email To Login")
        }

        const compare: boolean = await compareHash(password, user.password);
        console.log(compare)

        if (!compare) {
            throw new BadRequestException("Invalid Email Or Password");
        }

        const accses_token = await this.tokenService.generateAccsesToken({ payload: { _id: user._id, role: user.role } })
        const refresh_token = await this.tokenService.generateRefreshToken({ payload: { _id: user._id, role: user.role } })

        return res.status(200).json({
            message: "Done",
            info: "Login Succses",
            data: {
                accses_token,
                refresh_token
            }
        });

    }

}

export default new AuthenticationServices();