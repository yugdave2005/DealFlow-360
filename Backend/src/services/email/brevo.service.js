import { logger } from '../../utils/logger.js';

export const sendEmail = async ({ to, subject, templateId, params, htmlContent }) => {
  const apiKey = process.env.BREVO_API_KEY?.trim();
  const senderEmail = process.env.BREVO_SENDER_EMAIL?.trim() || 'no-reply@dealflow360.com';
  const senderName = process.env.BREVO_SENDER_NAME?.trim() || 'DealFlow-360 Security';

  if (!apiKey) {
    logger.warn('Brevo API key missing in environment; skipping email send.');
    return false;
  }

  const otpCode = params?.code || '';
  const recipientName = params?.name || 'Valued User';

  const defaultHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FAF8F5; margin: 0; padding: 24px; color: #1E1B18; }
        .card { max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #EBE8E2; padding: 32px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
        .brand { font-size: 20px; font-weight: 800; color: #B85D19; margin-bottom: 24px; letter-spacing: -0.5px; }
        .title { font-size: 18px; font-weight: 700; margin-bottom: 12px; color: #1E1B18; }
        .text { font-size: 14px; line-height: 1.6; color: #44403C; margin-bottom: 24px; }
        .otp-box { background: #FAF8F5; border: 2px dashed #B85D19; border-radius: 12px; padding: 18px; text-align: center; margin-bottom: 24px; }
        .otp-code { font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #B85D19; font-family: monospace; }
        .footer { font-size: 12px; color: #A8A29E; line-height: 1.5; border-top: 1px solid #F5EFEB; padding-top: 16px; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="brand">DealFlow-360</div>
        <div class="title">Password Reset Verification Code</div>
        <div class="text">
          Hello ${recipientName},<br><br>
          We received a request to reset your DealFlow-360 account password. Use the 6-digit verification code below to complete your reset:
        </div>
        <div class="otp-box">
          <div class="otp-code">${otpCode}</div>
        </div>
        <div class="text" style="font-size: 13px; color: #78716C;">
          This code is valid for <strong>10 minutes</strong>. If you did not request a password reset, please ignore this email or contact support.
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} DealFlow-360 Enterprise Commerce. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;

  const payload = {
    sender: { name: senderName, email: senderEmail },
    to: [{ email: to }],
    subject: subject || 'Your DealFlow-360 Password Reset Code',
    htmlContent: htmlContent || defaultHtml
  };

  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': apiKey
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok) {
      logger.error({ status: res.status, data }, 'Failed to send transactional email via Brevo');
      return false;
    }

    logger.info({ to, messageId: data.messageId }, 'Transactional email sent successfully via Brevo');
    return true;
  } catch (err) {
    logger.error({ err: err.message }, 'Exception occurred while sending email via Brevo');
    return false;
  }
};
