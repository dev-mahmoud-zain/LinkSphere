export const confirmEmailTemplate = async (OTPCode: string) => {

    return ` <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #ffffff; color: #333;">
  <h2 style="color: #444;">✅ Email Confirmation</h2>
  <p>Thank you for registering with  LinkSphere.</p>
  <p>Please use the following code to confirm your email address:</p>

  <div style="margin: 20px 0; padding: 15px 25px; background-color: #f9f9f9; border: 2px dashed #ccc; border-radius: 10px; display: inline-block; font-size: 24px; letter-spacing: 3px; font-weight: bold;">
    ${OTPCode}
  </div>

  <p>This code is valid for 2 Minutes. If you didn’t create an account, you can safely ignore this email.</p>
  <p style="margin-top: 30px;">Thanks,<br><strong> LinkSphere Developer: Adham Zain</strong></p>
</div>`

}


export const forgetPasswordTemplate = async ({ OTPCode = "" } = {}) => {
    return `
  <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #ffffff; color: #333;">
    <h2 style="color: #444;">Reset Your Password</h2>
    
    <p>You requested to reset your password for the <strong>LinkSphere</strong>.</p>
    
    <p>Please use the following code to complete the password reset process:</p>

    <div style="margin: 20px 0; padding: 15px 25px; background-color: #f9f9f9; border: 2px dashed #ccc; border-radius: 10px; display: inline-block; font-size: 24px; letter-spacing: 3px; font-weight: bold;">
      ${OTPCode}
    </div>

    <p>This code is valid for <strong>2 minutes</strong>. If you didn’t request this change, you can safely ignore this email.</p>
    
    <p style="margin-top: 30px;">Thanks,<br><strong>LinkSphere</strong><br><small>Developer: Adham Zain</small></p>
  </div>
  `;
};