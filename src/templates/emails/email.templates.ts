// ─── Email Templates ──────────────────────────────────────────────────────────

export const emailTemplates = {
  welcome: (name: string): string => `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f4f4f4; padding: 20px; text-align: center; border-radius: 5px; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #999; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Cogni Sacra!</h1>
          </div>
          <p>Hi ${name},</p>
          <p>Welcome aboard! We're excited to have you join Cogni Sacra.</p>
          <p>Get started by exploring your dashboard and checking out our features.</p>
          <div class="footer">
            <p>If you have any questions, feel free to reach out to us.</p>
          </div>
        </div>
      </body>
    </html>
  `,

  passwordReset: (resetUrl: string): string => `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f4f4f4; padding: 20px; text-align: center; border-radius: 5px; }
          .button { display: inline-block; background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .warning { background-color: #fff3cd; padding: 10px; border-left: 4px solid #ffc107; margin: 20px 0; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #999; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Reset Your Password</h1>
          </div>
          <p>You requested a password reset for your account.</p>
          <p>Click the button below to reset your password:</p>
          <a href="${resetUrl}" class="button">Reset Password</a>
          <div class="warning">
            <strong>Security Note:</strong> This link expires in 10 minutes. If you didn't request this, please ignore this email.
          </div>
          <p>Or copy and paste this link in your browser:</p>
          <p style="word-break: break-all; background-color: #f4f4f4; padding: 10px; border-radius: 5px;">
            ${resetUrl}
          </p>
          <div class="footer">
            <p>For security reasons, never share this link with anyone.</p>
          </div>
        </div>
      </body>
    </html>
  `,

  emailVerification: (verifyUrl: string): string => `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f4f4f4; padding: 20px; text-align: center; border-radius: 5px; }
          .button { display: inline-block; background-color: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #999; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Verify Your Email</h1>
          </div>
          <p>Thank you for signing up! Please verify your email address to complete your registration. This link will expire in 10 minutes.</p>
          <p>Click the button below to verify:</p>
          <a href="${verifyUrl}" class="button">Verify Email</a>
          <p>Or copy and paste this link in your browser:</p>
          <p style="word-break: break-all; background-color: #f4f4f4; padding: 10px; border-radius: 5px;">
            ${verifyUrl}
          </p>
          <div class="footer">
            <p>Once verified, you'll have full access to your account.</p>
          </div>
        </div>
      </body>
    </html>
  `,
};

export const emailSubjects = {
  welcome: 'Welcome to Cogni Sacra!',
  passwordReset: 'Reset your Cogni Sacra password',
  emailVerification: 'Verify your Cogni Sacra email address',
};
