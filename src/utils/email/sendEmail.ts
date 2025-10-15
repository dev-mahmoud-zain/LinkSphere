import { createTransport, Transporter } from "nodemailer";
import Mail from "nodemailer/lib/mailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";
import { BadRequestException } from "../response/error.response";


export const sendEmail = async (data: Mail.Options): Promise<void> => {

    if (!data.html && data.attachments?.length && !data.text) {
        throw new BadRequestException("Missing Email Content!!");
    }

    const transporter:

        Transporter<SMTPTransport.SentMessageInfo, SMTPTransport.Options>

        = createTransport({
            service: "gmail",
            auth: {
                user: process.env.APP_EMAIL as string,
                pass: process.env.APP_PASSWORD as string,
            }
            ,
            tls: {
                rejectUnauthorized: false, 
            },
        })


    await transporter.sendMail({
        ...data,
        from: `"${process.env.APPLCATION_NAME}" <${process.env.APP_EMAIL}>`,
    });


}