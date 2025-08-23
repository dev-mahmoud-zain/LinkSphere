import nodemailer from "nodemailer";

export const sendEmail = async ({
    from = `"LinkSphere" <${process.env.APP_EMAIL}>`,
    to = "",
    cc = [],
    bcc = [],
    subject = "",
    text = "",
    html = "",
    attachments = []
} = {}) => {

    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.APP_EMAIL,
            pass: process.env.APP_PASSWORD,
        },
    });

    const info = await transporter.sendMail({
        from,
        to,
        subject,
        text,
        html,
        attachments
    });
}