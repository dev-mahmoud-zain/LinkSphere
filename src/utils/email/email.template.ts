export const confirmEmailTemplate = async ({ OTPCode }: { OTPCode: string }): Promise<string> => {

    return ` 
  <div style="font-family: 'Segoe UI', Arial, sans-serif; padding: 30px; background-color: #f4f7fb; color: #333; max-width: 600px; margin: auto; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.08); text-align: center;">
    
    <h2 style="color: #2c3e50; margin-bottom: 10px;">✅ Email Confirmation</h2>
    <p style="font-size: 16px; line-height: 1.6; margin: 0 0 15px;">
        Thank you for registering with <strong style="color:#4a90e2;">LinkSphere</strong>.
    </p>
    <p style="font-size: 15px; line-height: 1.6; margin: 0 0 20px;">
        Please use the following code to confirm your email address:
    </p>

    <div style="margin: 20px auto; padding: 18px 35px; background: linear-gradient(135deg,#e0f7fa,#e3f2fd); border: 2px dashed #4a90e2; border-radius: 12px; display: inline-block; font-size: 26px; letter-spacing: 5px; font-weight: bold; color:#2c3e50; box-shadow: 0 2px 6px rgba(0,0,0,0.05);">
        ${OTPCode}
    </div>

    <p style="font-size: 14px; color: #555; line-height: 1.6; margin: 20px 0;">
        This code is valid for <strong>5 minutes</strong>.<br>
        If you didn’t create an account, you can safely ignore this email.
    </p>

    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

    <p style="font-size: 13px; color: #888; margin: 0;">
        Thanks,<br>
        <strong style="color:#4a90e2;">LinkSphere Developer</strong><br>
        <span style="font-size: 12px; color:#aaa;">Adham Zain</span>
    </p>
</div>

    `

}


export const forgetPasswordTemplate = async ({ OTPCode }: { OTPCode: string }): Promise<string> => {
    return `
<div style="font-family: 'Segoe UI', Arial, sans-serif; padding: 30px; background-color: #f4f7fb; color: #333; max-width: 600px; margin: auto; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.08); text-align: center;">
    
    <h2 style="color: #e74c3c; margin-bottom: 10px;">🔒 Reset Your Password</h2>
    
    <p style="font-size: 16px; line-height: 1.6; margin: 0 0 15px;">
        You requested to reset your password for <strong style="color:#4a90e2;">LinkSphere</strong>.
    </p>
    
    <p style="font-size: 15px; line-height: 1.6; margin: 0 0 20px;">
        Please use the following code to complete the password reset process:
    </p>

    <div style="margin: 20px auto; padding: 18px 35px; background: linear-gradient(135deg,#fff3f3,#fdecea); border: 2px dashed #e74c3c; border-radius: 12px; display: inline-block; font-size: 26px; letter-spacing: 5px; font-weight: bold; color:#c0392b; box-shadow: 0 2px 6px rgba(0,0,0,0.05);">
        ${OTPCode}
    </div>

    <p style="font-size: 14px; color: #555; line-height: 1.6; margin: 20px 0;">
        This code is valid for <strong>5 minutes</strong>.<br>
        If you didn’t request this change, you can safely ignore this email.
    </p>

    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

    <p style="font-size: 13px; color: #888; margin: 0;">
        Thanks,<br>
        <strong style="color:#4a90e2;">LinkSphere</strong><br>
        <span style="font-size: 12px; color:#aaa;">Developer: Adham Zain</span>
    </p>
</div>

  `;
};