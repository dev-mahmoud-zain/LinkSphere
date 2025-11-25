import type { NextFunction, Request, Response } from "express";
import type {
  I_ConfirmEmailInputs,
  I_loginBodyInputs,
  I_ReSendConfirmEmailIOTPInputs,
  I_SignupBodyInputs,
  IChangeForgetPassword,
  IForgetPassword,
  ILogout,
  IResendForgetPasswordOTP,
  ISignupWithGmail,
} from "./dto/auth.dto";
import {
  ApplicationException,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from "../../utils/response/error.response";
import { compareHash, generateHash } from "../../utils/security/hash.security";
import { emailEvent } from "../../utils/email/email.events";
import { generateOTP } from "../../utils/security/OTP";
import {
  LogoutFlagEnum,
  TokenService,
} from "../../utils/security/token.security";
import { JwtPayload } from "jsonwebtoken";
import { OAuth2Client, TokenPayload } from "google-auth-library";
import { UpdateQuery } from "mongoose";
import { UserRepository } from "../../DataBase/repository";
import {
  UserModel,
  HUserDocument,
  ProviderEnum,
  TwoSetupVerificationEnum,
} from "../../DataBase/models";
import { successResponse } from "../../utils/response/success.response";

class AuthenticationServices {
  private userModel = new UserRepository(UserModel);
  private tokenService = new TokenService();

  constructor() {}

  // ================= Account Registration & Email Verification =================

  signup = async (req: Request, res: Response): Promise<Response> => {
    let { userName, email, password, gender, phone }: I_SignupBodyInputs =
      req.body.validData;

    const userExists = await this.userModel.findOne({
      filter: { email },
      select: "_id userName email",
      options: { lean: true },
    });

    if (userExists) {
      throw new ConflictException("Email Already Exists Try To Login", {
        issues: {
          path: "email",
          value: email,
        },
      });
    }

    const OTPCode = generateOTP();

    await this.userModel.createUser({
      data: [
        {
          userName,
          email,
          password,
          gender,
          confirmEmailOTP: OTPCode,
          confirmEmailSentTime: new Date(),
          ...(phone ? { phone } : {}),
        },
      ],
    });

    return successResponse({
      res,
      statusCode: 201,
      info: "We Sent A Confirm OTP To Your Email , Please Confirm It To Login",
    });
  };

  confirmEmail = async (req: Request, res: Response): Promise<Response> => {
    const { email, OTP }: I_ConfirmEmailInputs = req.body.validData;

    const user = await this.userModel.findOne({
      filter: { email },
    });

    if (!user) {
      throw new NotFoundException("Email Is Not Exists");
    }

    if (user.confirmedAt) {
      throw new BadRequestException("This Email Is Already Confirmed");
    }

    if (!user.confirmEmailSentTime || !user.confirmEmailOTP) {
      throw new NotFoundException("OTP Not Found Or Not Sent For This Email");
    }

    const sentAt: Date = user.confirmEmailSentTime;
    const expiresAt = new Date(sentAt.getTime() + 5 * 60 * 1000);
    if (new Date() > expiresAt) {
      throw new BadRequestException("OTP Code Has Expired");
    }

    if (!(await compareHash(OTP, user.confirmEmailOTP as string))) {
      throw new BadRequestException("Invalid OTP Number");
    }

    await this.userModel.updateOne(
      {
        email,
      },
      {
        $set: {
          confirmedAt: new Date(),
        },
        $unset: {
          confirmEmailOTP: true,
          confirmEmailSentTime: true,
          OTPReSendCount: true,
          otpBlockExpiresAt: true,
        },
      }
    );

    const credentials = await this.tokenService.createLoginCredentials(user);

    return successResponse({
      res,
      data: { credentials },
      info: "Email Confirmed Success",
    });
  };

  reSendConfirmOTP = async (req: Request, res: Response): Promise<Response> => {
    const { email }: I_ReSendConfirmEmailIOTPInputs = req.body.validData;

    let user = await this.userModel.findOne({
      filter: { email },
    });

    // الأكونت مش موجود يا بلدينا
    if (!user) {
      throw new NotFoundException("User Not Found");
    }

    // جاي تأكتف أكونت أوريدي متأكتف !! طب اقنعني ازاي
    if (user.confirmedAt) {
      throw new BadRequestException("This Account Already Confirmed Before");
    }

    //  لسة مش واخد بلوك بس وصل الحد الاقصى
    if (!user.otpBlockExpiresAt && user.OTPReSendCount === 5) {
      await this.userModel.updateOne(
        { email },
        {
          otpBlockExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
          OTPReSendCount: user.OTPReSendCount,
        }
      );
      throw new BadRequestException(
        "Max 5 Attempts Reached. Try Again In 10 Minutes."
      );
    }

    // واخد بلوك
    if (user.otpBlockExpiresAt) {
      // لسة واخد بلوك
      if (user.otpBlockExpiresAt > new Date()) {
        throw new BadRequestException(
          "Maximum attempts reached. Please try again later."
        );
      }

      // نفك البلوك عشان الوقت خلص
      else {
        user = await this.userModel.findOneAndUpdate({
          filter: { email },
          updateData: {
            $unset: { otpBlockExpiresAt: 1 },
            OTPReSendCount: 0,
          },
        });
      }
    }

    const OTPCode: string = generateOTP();

    await this.userModel.updateOne(
      { email },
      {
        OTPReSendCount: user?.OTPReSendCount ? user.OTPReSendCount + 1 : 1,
        confirmEmailOTP: await generateHash(OTPCode),
        confirmEmailSentTime: new Date(),
      }
    );

    emailEvent.emit("confirmEmail", { to: email, OTPCode });

    return successResponse({
      res,
      statusCode: 200,
      info: "Email Confirmed Success",
    });
  };

  private verifyGmailAccount = async (
    idToken: string
  ): Promise<TokenPayload> => {
    const client = new OAuth2Client();
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.WEB_CLIENT_ID as string,
    });
    const payload = ticket.getPayload();
    if (!payload?.email_verified) {
      throw new BadRequestException("Fail To Verify This Account");
    }
    return payload;
  };

  loginWithGmail = async (req: Request, res: Response): Promise<Response> => {
    const { idToken }: ISignupWithGmail = req.body.validData;

    const { email }: TokenPayload = await this.verifyGmailAccount(idToken);

    const user = await this.userModel.findOne({
      filter: {
        email,
      },
    });

    if (!user) {
      throw new NotFoundException(
        "Not Registered Account Or Registered With Another Provider"
      );
    }

    const credentials = await this.tokenService.createLoginCredentials(user);

    return successResponse({
      res,
      info: "login Success",
      data: { credentials },
    });
  };

  signupWithGmail = async (req: Request, res: Response): Promise<Response> => {
    const { idToken, userName }: ISignupWithGmail = req.body.validData;


    const {email} = await this.verifyGmailAccount(idToken);

    const user = await this.userModel.findOne({
      filter: {
        email,
      },
    });

    if (user) {
      if (user.provider === ProviderEnum.system) {
        return await this.loginWithGmail(req, res);
      }
      throw new ConflictException("Invalid Provider", {
        userProvider: user.provider,
      });
    }

    const newUser = await this.userModel.createUser({
      data: [
        {
         userName,
          email: email as string,
          confirmedAt: new Date(),
          provider: ProviderEnum.google,
        },
      ],
    });

    if (!newUser) {
      throw new BadRequestException("Fail To Signup");
    }

    const credentials = await this.tokenService.createLoginCredentials(newUser);

    return successResponse({
      res,
      info: "Signup Success",
        data: { credentials },
    });
  };

  // ======================== Login & Session Management =========================

  login = async (req: Request, res: Response): Promise<Response> => {
    const { email, password }: I_loginBodyInputs = req.body.validData;

    const user = await this.userModel.findOne({
      filter: {
        email,
      },
      select: {
        email: 1,
        password: 1,
        confirmedAt: 1,
        role: 1,
        twoSetupVerification: 1,
      },
    });

    if (!user) {
      throw new NotFoundException("User Not Found Try To Signup");
    }

    if (!user.confirmedAt) {
      throw new BadRequestException("Confirm Your Email To Login");
    }

    if (user.freezedAt) {
      throw new NotFoundException("User Not Found");
    }

    const compare: boolean = await compareHash(password, user.password);

    if (!compare) {
      throw new BadRequestException("Invalid Email Or Password");
    }

    if (user.twoSetupVerification === TwoSetupVerificationEnum.enable) {
      const OTPCode = generateOTP();

      await this.userModel.updateOne(
        {
          email,
        },
        {
          twoSetupVerificationCode: OTPCode,
        }
      );

      emailEvent.emit("loginTwoStepVerification", { to: email, OTPCode });

      return successResponse({
        res,
        info: "OTP Code Sent To Your Email",
      });
    }

    const credentials = await this.tokenService.createLoginCredentials(user);

    return successResponse({
      res,
      info: "Login Success",
      data: { credentials },
    });
  };

  verifyLoginOTPCode = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    const { email, OTP } = req.body.validData;

    const user = await this.userModel.findOne({
      filter: { email },
    });

    if (!user) {
      throw new NotFoundException("User Not Exsists");
    }

    if (!user.twoSetupVerificationCode) {
      throw new NotFoundException("No OTP Code For This User");
    }

    if (
      user?.twoSetupVerificationCodeExpiresAt &&
      user?.twoSetupVerificationCodeExpiresAt.getTime() <= Date.now()
    ) {
      throw new BadRequestException("OTP Code Time Expired");
    }

    if (!(await compareHash(OTP, user.twoSetupVerificationCode))) {
      throw new BadRequestException("Invalid OTP Code");
    }

    this.userModel.updateOne(
      {
        _id: user._id,
      },
      {
        $unset: {
          twoSetupVerificationCode: "",
          twoSetupVerificationCodeExpiresAt: "",
        },
      }
    );

    const credentials = await this.tokenService.createLoginCredentials(user);

    return successResponse({
      res,
      info: "Login Success",
      data: { credentials },
    });
  };

  logout = async (req: Request, res: Response): Promise<Response> => {
    const { logoutFlag }: ILogout = req.body.validData;

    if (logoutFlag === LogoutFlagEnum.all) {
      await this.userModel.updateOne(
        {
          _id: req.user?._id,
        },
        {
          changeCredentialsTime: new Date(),
        }
      );
    } else {
      await this.tokenService.createRevokeToken(req.tokenDecoded as JwtPayload);
    }

    return successResponse({
      res,
      info: "Logout Success",
    });
  };

  refreshToken = async (req: Request, res: Response): Promise<Response> => {
    const credentials = await this.tokenService.createLoginCredentials(
      req.user as HUserDocument
    );

    await this.tokenService.createRevokeToken(req.tokenDecoded as JwtPayload);

    return successResponse({
      res,
      data: { credentials },
    });
  };

  // =================== Password Reset (Forget Password Flow) ===================
  forgetPassword = async (req: Request, res: Response): Promise<Response> => {
    const { email }: IForgetPassword = req.body.validData;
    const user = await this.userModel.findOne({
      filter: {
        email,
      },
    });

    if (!user) {
      throw new NotFoundException("User Not Exists");
    }
    if (user.provider === ProviderEnum.google) {
      throw new ConflictException("Invalid Provider", {
        userProvider: user.provider,
      });
    }
    if (!user.confirmedAt) {
      throw new BadRequestException("Account Not Confirmed");
    }

    if (user.forgetPasswordCount) {
      throw new BadRequestException(
        "Use EndPoint : [Re send Forget Password OTP]"
      );
    }

    const OTPCode = generateOTP();
    await this.userModel.updateOne(
      { email },
      {
        forgetPasswordOTP: await generateHash(OTPCode),
        forgetPasswordOTPExpiresAt: new Date(Date.now() + 5 * 60 * 1000),
        forgetPasswordCount: user.forgetPasswordCount
          ? user.forgetPasswordCount + 1
          : 1,
      }
    );

    emailEvent.emit("forgetPassword", { to: email, OTPCode });

    return successResponse({
      res,
      info: "Password reset code has been sent to your registered email",
    });
  };

  reSendForgetPasswordOTP = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    const { email }: IResendForgetPasswordOTP = req.body.validData;

    const user = await this.userModel.findOne({
      filter: { email },
    });
    if (!user) {
      throw new NotFoundException("User Not Exists");
    }
    if (user.provider === ProviderEnum.google) {
      throw new ConflictException("Invalid Provider", {
        userProvider: user.provider,
      });
    }
    if (!user.confirmedAt) {
      throw new BadRequestException("Account Not Confirmed");
    }
    const OTPCode = generateOTP();

    let data: UpdateQuery<HUserDocument> = {};

    // وصل الحد الأقصى بس مخدش بلوك
    if (!user.forgetPasswordBlockExpiresAt && user.forgetPasswordCount === 4) {
      // نديله بلوك ونبعتله الكود للمرة الاخيرة
      data = {
        forgetPasswordOTP: await generateHash(OTPCode),
        forgetPasswordOTPExpiresAt: new Date(Date.now() + 5 * 60 * 1000),
        forgetPasswordCount: 5,
        forgetPasswordBlockExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
      };
    }

    // واخد بلوك
    if (user.forgetPasswordBlockExpiresAt) {
      // وقت البلوك خلص
      if (user.forgetPasswordBlockExpiresAt.getTime() <= Date.now()) {
        // نفك البلوك ونرجع العداد لـ 1

        data = {
          forgetPasswordOTP: await generateHash(OTPCode),
          forgetPasswordOTPExpiresAt: new Date(Date.now() + 5 * 60 * 1000),
          forgetPasswordCount: 1,
          $unset: { forgetPasswordBlockExpiresAt: 1 },
        };
      } else {
        // لسة وقت البلوك مخلصش
        throw new BadRequestException("Blocked For 10 Munits");
      }
    }

    // لسة الدنيا تمام كمل زي ما انت
    if (user.forgetPasswordCount && user.forgetPasswordCount < 4) {
      data = {
        forgetPasswordOTP: await generateHash(OTPCode),
        forgetPasswordOTPExpiresAt: new Date(Date.now() + 5 * 60 * 1000),
        forgetPasswordCount: user.forgetPasswordCount
          ? user.forgetPasswordCount + 1
          : 1,
      };
    }

    await this.userModel.updateOne({ email }, data);
    emailEvent.emit("forgetPassword", { to: email, OTPCode });

    return successResponse({
      res,
      info: "A new password reset code has been sent to your registered email",
    });
  };

  // Middleware
  confirmForgetPasswordOTP = () => {
    return async (req: Request, res: Response, next: NextFunction) => {
      const { email, OTP }: IChangeForgetPassword = req.body.validData;

      const user = await this.userModel.findOne({
        filter: { email },
      });

      if (!user) {
        throw new NotFoundException("User Not Exists");
      }

      if (!user.forgetPasswordOTP) {
        throw new BadRequestException(
          "No OTP was requested for this account. Please request a new password reset"
        );
      }

      if (
        user.forgetPasswordOTPExpiresAt &&
        new Date(user.forgetPasswordOTPExpiresAt).getTime() < Date.now()
      ) {
        throw new BadRequestException("Expierd OTP");
      }

      if (!(await compareHash(OTP, user.forgetPasswordOTP as string))) {
        throw new BadRequestException("Invalid OTP Code");
      } else {
        next();
      }
    };
  };

  changeForgetPassword = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    const { email, newPassword }: IChangeForgetPassword = req.body.validData;

    const user = await this.userModel.findOneAndUpdate({
      filter: { email },
      updateData: {
        password: await generateHash(newPassword),
        changeCredentialsTime: new Date(),
        $unset: {
          forgetPasswordCount: 1,
          forgetPasswordOTP: 1,
          forgetPasswordOTPExpiresAt: 1,
        },
      },
    });

    if (!user) {
      throw new ApplicationException("Something Went Wrong");
    }

    const credentials = await this.tokenService.createLoginCredentials(user);

    return successResponse({
      res,
      info: "Your Password Changed Success",
      data: { credentials },
    });
  };

  // ======================== Two-Step Verification (2FA) ========================
  changeTwoSetupVerification = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    const user = await this.userModel.findOne({
      filter: { _id: req.user?._id },
    });

    let action = TwoSetupVerificationEnum.enable; //defult = enable

    if (user?.twoSetupVerificationCode) {
      throw new BadRequestException(
        "Already Ask To disable Please Verify OTP Code"
      );
    }
    if (user?.twoSetupVerification === TwoSetupVerificationEnum.enable) {
      action = TwoSetupVerificationEnum.disable;
    }

    const OTPCode = generateOTP();
    await this.userModel.updateOne(
      {
        _id: req.user?._id,
      },
      {
        twoSetupVerificationCode: OTPCode,
      }
    );

    const event =
      action === TwoSetupVerificationEnum.enable
        ? "enableTwoStepVerification"
        : "disableTwoStepVerification";
    emailEvent.emit(event, { to: user?.email, OTPCode });

    return successResponse({
      res,
      info: `OTP Code Sent To Your Email , will ${action} after Verify OTP`,
    });
  };

  verifyEnableTwoSetupVerification = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    const OTPCode = req.body.validData.OTP;

    const user = await this.userModel.findOne({
      filter: { _id: req.user?._id },
    });

    let action = TwoSetupVerificationEnum.enable; //defult = enable

    if (user?.twoSetupVerification === TwoSetupVerificationEnum.enable) {
      action = TwoSetupVerificationEnum.disable;
    }

    if (!user?.twoSetupVerificationCode) {
      throw new NotFoundException("Not OTP Code For This User");
    }

    if (
      user?.twoSetupVerificationCodeExpiresAt &&
      user?.twoSetupVerificationCodeExpiresAt.getTime() <= Date.now()
    ) {
      throw new BadRequestException("OTP Code Time Expired");
    }

    if (!(await compareHash(OTPCode, user.twoSetupVerificationCode))) {
      throw new BadRequestException("Invlid OTP Code");
    }

    await this.userModel.updateOne(
      {
        _id: req.user?._id,
      },
      {
        $set: { twoSetupVerification: action },
        $unset: {
          twoSetupVerificationCode: "",
          twoSetupVerificationCodeExpiresAt: "",
        },
      }
    );

    const info =
      action === TwoSetupVerificationEnum.enable
        ? "Tow Setup Verification Is Enabled Success"
        : "Tow Setup Verification Is Disabled Success";

    return successResponse({
      res,
      info,
    });
  };
}

export default new AuthenticationServices();
