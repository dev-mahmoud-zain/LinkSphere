import type { Request, Response } from "express"
import type { I_ConfirmEmailInputs, I_loginBodyInputs, I_ReSendConfirmEmailIOTPInputs, I_SignupBodyInputs, IVerifyToken } from "./dto/auth.dto";
import { UserModel } from "../../DataBase/models/user.model";
import { BadRequestException, NotFoundException, TokenException } from "../../utils/response/error.response";
import { compareHash, generateHash } from "../../utils/security/hash.security";
import { emailEvent } from "../../utils/email/email.events";
import { confirmEmailTemplate } from "../../utils/email/email.template";
import { customAlphabet } from "nanoid";
import jwt from "jsonwebtoken";



class AuthenticationServices {

    constructor() { }

    signup = async (req: Request, res: Response): Promise<Response> => {

        let userData: I_SignupBodyInputs = req.body.validData;

        const userExsist = await UserModel.findOne({
            email: userData.email
        })




        if (userExsist) {
            throw new BadRequestException("Email Exsist")
        }

        const userPassword = await generateHash({ plainTxt: userData.password })
        userData.password = userPassword
        const OTPCode = customAlphabet("0123456789", 6)();

        const newUser = await UserModel.create({
            ...userData,
            confirmEmailOTP: OTPCode,
            confirmEmailSentTime: Date.now(),
        })

        const html = await confirmEmailTemplate(OTPCode);
        emailEvent.emit("sentConfirmEmail", { email: userData.email, html })

        return res.status(201).json({
            message: "Done",
            info: "We Sent A Confirm OTP To Your Email , Please Confirm It To Login",
            data: {
                id: newUser._id,
                email: newUser.email,
            }
        });

    }

    confirmEmail = async (req: Request, res: Response): Promise<Response> => {

        const { email, OTP }: I_ConfirmEmailInputs = req.body.validData;

        const user = await UserModel.findOne({
            email,
        })

        if (!user) {
            throw new NotFoundException("User Not Found")
        }

        if (user?.confirmEmail) {
            throw new BadRequestException("Email Alredy Confirmed Before")
        }

        const sentTime = user.confirmEmailSentTime.getTime();
        const now = Date.now();

        if (now - sentTime > 2 * 60 * 1000) {
            throw new BadRequestException("OTP Code Expired");
        }

        if (OTP !== user.confirmEmailOTP) {
            throw new BadRequestException("Wrong OTP Number");
        }

        await UserModel.updateOne({
            email,
        }, {
            $unset: {
                confirmEmailOTP: true,
                confirmEmailSentTime: true,
                OTPReSendCount: true
            },
            $set: { confirmEmail: Date.now() }
        })

        return res.status(201).json({
            message: "Done",
            info: "Email Confirmed Succses"
        });

    }

    reSendConfirmEmailOTP = async (req: Request, res: Response): Promise<Response> => {

        const { email }: I_ReSendConfirmEmailIOTPInputs = req.body.validData;

        const user = await UserModel.findOne({
            email,
        })

        if (!user) {
            throw new NotFoundException("User Not Found")
        }

        if (user?.confirmEmail) {
            throw new BadRequestException("Email Alredy Confirmed Before")
        }

        const blockDuration = 5 * 60 * 1000;
        const now = Date.now();
        const blockEndTime = user.OTPReSendBlockTime?.getTime() + blockDuration;


        // واخد بلوك لمدة 5 دقايق 
        if (user.OTPReSendBlockTime && now < blockEndTime) {
            const remainingMs = blockEndTime - now;
            const remainingMinutes = Math.ceil(remainingMs / 60000);

            throw new BadRequestException(
                `Wait ${remainingMinutes} Minutes Before Requesting A New OTP`
            );
        }

        const OTPCode = customAlphabet("0123456789", 6)();

        // كده وقت البلوك خلص
        if (user.OTPReSendBlockTime && now >= blockEndTime) {
            await UserModel.updateOne({
                email
            }, {
                confirmEmailSentTime: Date.now(),
                confirmEmailOTP: OTPCode,
                $inc: {
                    __v: 1,
                },
                $set: { OTPReSendCount: 1 },
                $unset: { OTPReSendBlockTime: true }
            })

            return res.status(201).json({
                message: "Done",
                info: "New OTP Sent Succses"
            });

        }

        // هنديله بلوك عشان حاول 5 مرات
        if (user.OTPReSendCount >= 5 && !user.OTPReSendBlockTime) {

            await UserModel.findOneAndUpdate({
                email
            }, {
                OTPReSendBlockTime: Date.now(),
                $inc: {
                    __v: 1,
                }
            })

            throw new BadRequestException("You Tried 5 Times, Wait 5 Minutes Before Requesting A New OTP");

        }


        // مفيش بلوك و المحاولات أقل من 5

        await UserModel.findOneAndUpdate({
            email
        }, {
            confirmEmailSentTime: Date.now(),
            confirmEmailOTP: OTPCode,
            $inc: {
                __v: 1,
                OTPReSendCount: 1
            }
        })

        const html = await confirmEmailTemplate(OTPCode);
        emailEvent.emit("sentConfirmEmail", { email, html })

        return res.status(201).json({
            message: "Done",
            info: "New OTP Sent Succses"
        });

    }

    login = async (req: Request, res: Response): Promise<Response> => {


        const { email, password }: I_loginBodyInputs = req.body.validData;


        const user = await UserModel.findOne({
            email,
        }, "email password role")

        if (!user) {
            throw new NotFoundException("User Not Found Try To Login");
        }

        const comparePassword = await compareHash({ plainTxt: password, hashValue: user.password });

        if (!comparePassword) {
            throw new BadRequestException("Invalid Email Or Password")
        }

        const access_token = jwt.sign(
            { id: user._id, role: user.role },
            user?.role === "user" ? process.env.ACCESS_USER_TOKEN_SIGNATURE as string
                : process.env.ACCESS_SYSTEM_TOKEN_SIGNATURE as string,
            { expiresIn: "1h" }
        )

        const refresh_token = jwt.sign(
            { id: user._id, role: user.role },
            user?.role === "user" ? process.env.REFRESH_USER_TOKEN_SIGNATURE as string
                : process.env.REFRESH_SYSTEM_TOKEN_SIGNATURE as string,
            { expiresIn: "1y" }
        )

        return res.status(200).json({
            message: "Done",
            info: "Signup Succses",
            data: { access_token, refresh_token }
        });
    }

    verifyToken = async (req: Request, res: Response): Promise<Response> => {

        const { token, tokenType }: IVerifyToken = req.body.validData;
        const role = token.split(" ")[0];
        const userToken = token.split(" ")[1];


        try {

            if (role === "Bearer") {
                if (tokenType == "access_token") {
                    jwt.verify(userToken!, process.env.ACCESS_USER_TOKEN_SIGNATURE!)

                }

                else {
                    jwt.verify(userToken!, process.env.REFRESH_USER_TOKEN_SIGNATURE!)
                }
            }


            else {

                if (tokenType == "access_token") {
                    jwt.verify(userToken!, process.env.ACCESS_SYSTEM_TOKEN_SIGNATURE!)
                }

                else {
                    jwt.verify(userToken!, process.env.REFRESH_SYSTEM_TOKEN_SIGNATURE!)
                }

            }

        } catch (error: any) {

            throw new TokenException();

        }


        return res.status(200).json({
            message: "Done",
            info: "Token Is Correct",
        });

        
    }

}

export default new AuthenticationServices()