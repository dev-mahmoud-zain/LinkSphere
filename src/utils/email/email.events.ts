import EventEmitter from 'node:events';
import { sendEmail } from './sendEmail.js';

export const emailEvent = new EventEmitter();

emailEvent.on("sentConfirmEmail", async ({ email = "", html="", subject = "Confirm Email" }) => {

    await sendEmail({
        to: email,
        subject,
        html
    })

})



emailEvent.on("sendForgotPasswordOTP", async ({ email = "", html="", subject = "Rest Password" }) => {
    
    await sendEmail({
        to: email,
        subject,
        html
    })

})