import EventEmitter from 'node:events';
import { sendEmail } from './sendEmail.js';
import Mail from 'nodemailer/lib/mailer/index.js';
import { confirmEmailTemplate, forgetPasswordTemplate, passwordChangedTemplate } from './email.template.js';
import { ApplicationException } from '../response/error.response.js';

export const emailEvent = new EventEmitter();


interface IEmailData extends Mail.Options{
    OTPCode :string
}

emailEvent.on("confirmEmail", async (data:IEmailData ) => {
    try {
        data.html = await confirmEmailTemplate({ OTPCode:data.OTPCode });
        data.subject = "Confirm Your Email Address";
        await sendEmail(data);
    } catch (error) {
        console.log("Fail To Send Email", error);
        throw new ApplicationException("Something Went Wrong")
    }

})



emailEvent.on("forgetPassword", async (data: IEmailData) => {

    try {
        data.html = await forgetPasswordTemplate({ OTPCode:data.OTPCode });
        data.subject = "Forget Your Password?";
        await sendEmail(data);
    } catch (error) {
        console.log("Fail To Send Email", error);
        throw new ApplicationException("Something Went Wrong")
    }

})


emailEvent.on("changePassword", async (data: IEmailData) => {

    try {
        data.html = await passwordChangedTemplate();
        data.subject = "Forget Your Password?";
        await sendEmail(data);
    } catch (error) {
        console.log("Fail To Send Email", error);
        throw new ApplicationException("Something Went Wrong")
    }

})