const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST || 'smtp.gmail.com',
  port:   parseInt(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Send an email.
 * @param {{ to: string, subject: string, html: string }} options
 */
const sendEmail = async ({ to, subject, html }) => {
  const info = await transporter.sendMail({
    from:    process.env.EMAIL_FROM || '"SBI AI Assistant" <noreply@sbi-ai.in>',
    to,
    subject,
    html,
  });
  return info;
};

/**
 * Pre-built: OTP email template.
 */
const sendOTPEmail = (to, otp, name) =>
  sendEmail({
    to,
    subject: 'Your SBI AI Assistant OTP',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#0f1117;color:#e8edf5;border-radius:12px">
        <div style="font-size:18px;font-weight:600;margin-bottom:8px">SBI AI Assistant</div>
        <p style="color:#8b9ab5">Hi ${name}, your one-time password is:</p>
        <div style="font-size:40px;font-weight:700;letter-spacing:8px;color:#3b82f6;margin:24px 0">${otp}</div>
        <p style="color:#8b9ab5;font-size:13px">Valid for 10 minutes. Do not share this with anyone.</p>
      </div>`,
  });

module.exports = { sendEmail, sendOTPEmail };