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
        Stay secure,<br>
        <strong style="color:#4a90e2;">LinkSphere Developer</strong><br>
        <span style="font-size: 12px; color:#aaa;">Adham Zain</span>
    </p>
</div>

    `

}

export const updateEmailTemplate = async ({ OTPCode }: { OTPCode: string }): Promise<string> => {
    return ` 
  <div style="font-family: 'Segoe UI', Arial, sans-serif; padding: 30px; background-color: #f4f7fb; color: #333; max-width: 600px; margin: auto; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.08); text-align: center;">
    
    <h2 style="color: #2c3e50; margin-bottom: 10px;">🔄 Confirm Your New Email</h2>
    <p style="font-size: 16px; line-height: 1.6; margin: 0 0 15px;">
        You have requested to update your email address in <strong style="color:#4a90e2;">LinkSphere</strong>.
    </p>
    <p style="font-size: 15px; line-height: 1.6; margin: 0 0 20px;">
        Please use the following code to verify your new email:
    </p>

    <div style="margin: 20px auto; padding: 18px 35px; background: linear-gradient(135deg,#fff3e0,#fbe9e7); border: 2px dashed #ff9800; border-radius: 12px; display: inline-block; font-size: 26px; letter-spacing: 5px; font-weight: bold; color:#e65100; box-shadow: 0 2px 6px rgba(0,0,0,0.05);">
        ${OTPCode}
    </div>

    <p style="font-size: 14px; color: #555; line-height: 1.6; margin: 20px 0;">
        This code is valid for <strong> 1 Hour </strong>.<br>
        If you did not request this email update, please ignore this message and keep your current email secure.
    </p>

    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

    <p style="font-size: 13px; color: #888; margin: 0;">
        Stay secure,<br>
        <strong style="color:#4a90e2;">LinkSphere Developer</strong><br>
        <span style="font-size: 12px; color:#aaa;">Adham Zain</span>
    </p>
</div>
  `;
};

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
        Stay secure,<br>
        <strong style="color:#4a90e2;">LinkSphere Developer</strong><br>
        <span style="font-size: 12px; color:#aaa;">Adham Zain</span>
    </p>
</div>

  `;
};

export const passwordChangedTemplate = async (): Promise<string> => {
    return `
<div style="font-family: 'Segoe UI', Arial, sans-serif; padding: 30px; background-color: #f9fafc; color: #333; max-width: 600px; margin: auto; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.08); text-align: center;">
    
    <h2 style="color: #2ecc71; margin-bottom: 10px;">🔐 Password Changed Successfully</h2>
    
    <p style="font-size: 16px; line-height: 1.6; margin: 0 0 15px;">
        Your password for <strong style="color:#4a90e2;">LinkSphere</strong> has been updated Successfully.
    </p>
    
    <p style="font-size: 15px; line-height: 1.6; margin: 0 0 20px; color: #555;">
        If this action was not made by you, please reset your password immediately or contact our support team.
    </p>

    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

    <p style="font-size: 13px; color: #888; margin: 0;">
        Stay secure,<br>
        <strong style="color:#4a90e2;">LinkSphere Developer</strong><br>
        <span style="font-size: 12px; color:#aaa;">Adham Zain</span>
    </p>
</div>
  `;
};

export const enableTwoStepVerificationTemplate = async ({ OTPCode }: { OTPCode: string }): Promise<string> => {
    return `
  <div style="font-family: 'Segoe UI', Arial, sans-serif; padding: 30px; background-color: #f4f7fb; color: #333; max-width: 600px; margin: auto; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.08); text-align: center;">
    
    <h2 style="color: #2c3e50; margin-bottom: 10px;">🔐 Enable Two-Step Verification</h2>
    <p style="font-size: 16px; line-height: 1.6; margin: 0 0 15px;">
        You are about to secure your <strong style="color:#4a90e2;">LinkSphere Account</strong> with <strong>Two-Step Verification</strong>.
    </p>
    <p style="font-size: 15px; line-height: 1.6; margin: 0 0 20px;">
        Please use the code below to complete the setup process:
    </p>

    <div style="margin: 20px auto; padding: 18px 35px; background: linear-gradient(135deg,#e3f2fd,#e8f5e9); border: 2px dashed #2196f3; border-radius: 12px; display: inline-block; font-size: 26px; letter-spacing: 5px; font-weight: bold; color:#0d47a1; box-shadow: 0 2px 6px rgba(0,0,0,0.05);">
        ${OTPCode}
    </div>

    <p style="font-size: 14px; color: #555; line-height: 1.6; margin: 20px 0;">
        This code is valid for <strong>10 minutes</strong>.<br>
        If you did not request enabling Two-Step Verification, please ignore this message and contact support.
    </p>

    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

    <p style="font-size: 13px; color: #888; margin: 0;">
        Stay secure,<br>
        <strong style="color:#4a90e2;">LinkSphere Developer</strong><br>
        <span style="font-size: 12px; color:#aaa;">Adham Zain</span>
    </p>
  </div>
  `;
};

export const disableTwoStepVerificationTemplate = async ({ OTPCode }: { OTPCode: string }): Promise<string> => {
    return `
  <div style="font-family: 'Segoe UI', Arial, sans-serif; padding: 30px; background-color: #f4f7fb; color: #333; max-width: 600px; margin: auto; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.08); text-align: center;">
    
    <h2 style="color: #b71c1c; margin-bottom: 10px;">⚠️ Disable Two-Step Verification</h2>
    <p style="font-size: 16px; line-height: 1.6; margin: 0 0 15px;">
        You have requested to <strong style="color:#d32f2f;">disable Two-Step Verification</strong> on your <strong style="color:#4a90e2;">LinkSphere Account</strong>.
    </p>
    <p style="font-size: 15px; line-height: 1.6; margin: 0 0 20px;">
        To confirm this action, please enter the code below:
    </p>

    <div style="margin: 20px auto; padding: 18px 35px; background: linear-gradient(135deg,#ffebee,#fff3e0); border: 2px dashed #f44336; border-radius: 12px; display: inline-block; font-size: 26px; letter-spacing: 5px; font-weight: bold; color:#c62828; box-shadow: 0 2px 6px rgba(0,0,0,0.05);">
        ${OTPCode}
    </div>

    <p style="font-size: 14px; color: #555; line-height: 1.6; margin: 20px 0;">
        This code is valid for <strong>10 minutes</strong>.<br>
        If you did not request disabling Two-Step Verification, please <strong>do not share this code</strong> and contact our support team immediately.
    </p>

    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

    <p style="font-size: 13px; color: #888; margin: 0;">
        Stay safe,<br>
        <strong style="color:#4a90e2;">LinkSphere Developer</strong><br>
        <span style="font-size: 12px; color:#aaa;">Adham Zain</span>
    </p>
  </div>
  `;
};

export const loginTwoStepVerificationTemplate = async ({ OTPCode }: { OTPCode: string }): Promise<string> => {
    return `
  <div style="font-family: 'Segoe UI', Arial, sans-serif; padding: 30px; background-color: #f4f7fb; color: #333; max-width: 600px; margin: auto; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.08); text-align: center;">
    
    <h2 style="color: #2c3e50; margin-bottom: 10px;">🔐 Login Verification Code</h2>
    <p style="font-size: 16px; line-height: 1.6; margin: 0 0 15px;">
        You are attempting to log in to your <strong style="color:#4a90e2;">LinkSphere Account</strong>.  
        Please use the code below to complete the login process:
    </p>

    <div style="margin: 20px auto; padding: 18px 35px; background: linear-gradient(135deg,#e3f2fd,#e8f5e9); border: 2px dashed #2196f3; border-radius: 12px; display: inline-block; font-size: 26px; letter-spacing: 5px; font-weight: bold; color:#0d47a1; box-shadow: 0 2px 6px rgba(0,0,0,0.05);">
        ${OTPCode}
    </div>

    <p style="font-size: 14px; color: #555; line-height: 1.6; margin: 20px 0;">
        This code is valid for <strong>10 minutes</strong>.<br>
        If you did not attempt to log in, please ignore this message and secure your account immediately.
    </p>

    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

    <p style="font-size: 13px; color: #888; margin: 0;">
        Stay secure,<br>
        <strong style="color:#4a90e2;">LinkSphere Developer</strong><br>
        <span style="font-size: 12px; color:#aaa;">Adham Zain</span>
    </p>
  </div>
  `;
};

export const mentionNotificationTemplate = async (
    postLink: string,
    mentionedBy: string
): Promise<string> => {
    return `
<div style="font-family: 'Segoe UI', Arial, sans-serif; padding: 30px; background-color: #f9fafc; color: #333; max-width: 600px; margin: auto; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.08); text-align: center;">
    
    <h2 style="color: #4a90e2; margin-bottom: 10px;">📢 You’ve Been Mentioned!</h2>
    
    <p style="font-size: 16px; line-height: 1.6; margin: 0 0 15px;">
        <strong style="color:#2ecc71;">${mentionedBy}</strong> mentioned you in a post on 
        <strong style="color:#4a90e2;">LinkSphere</strong>.
    </p>
    
    <p style="font-size: 15px; line-height: 1.6; margin: 0 0 20px; color: #555;">
        Click the button below to view the post and join the conversation.
    </p>

    <a href="${postLink}" style="display: inline-block; padding: 12px 24px; background-color: #4a90e2; color: white; text-decoration: none; border-radius: 6px; font-size: 15px; font-weight: bold; margin-bottom: 20px;">
        🔗 View Post
    </a>

    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

    <p style="font-size: 13px; color: #888; margin: 0;">
        Thanks,<br>
        <strong style="color:#4a90e2;">LinkSphere</strong><br>
        <span style="font-size: 12px; color:#aaa;">Developer: Adham Zain</span>
    </p>
</div>
  `;
};