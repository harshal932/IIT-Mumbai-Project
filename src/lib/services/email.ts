import nodemailer from "nodemailer";
import { logError } from "@/lib/utils/errors";

interface SendEmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

/**
 * Email Notification Service
 * Sends transactional HTML emails for problem updates, comments, and help offers.
 * If EMAIL_SERVER is not configured, safely logs the email in dev mode.
 */
export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  const emailServer = process.env.EMAIL_SERVER;
  const from = process.env.EMAIL_FROM || "LocalLoop <noreply@localloop.org>";

  if (!emailServer) {
    // In dev / unconfigured state, log email silently
    console.info(`[Email Service (Dev Mock)] To: ${options.to} | Subject: "${options.subject}"`);
    return true;
  }

  try {
    const transporter = nodemailer.createTransport(emailServer);
    await transporter.sendMail({
      from,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html || `<div style="font-family: sans-serif; padding: 20px;"><h2>${options.subject}</h2><p>${options.text}</p></div>`,
    });
    return true;
  } catch (err) {
    logError("EmailService.sendEmail", err, { to: options.to, subject: options.subject });
    return false;
  }
}

/**
 * Send styled notification email for LocalLoop events
 */
export async function sendNotificationEmail(options: {
  to: string;
  title: string;
  message: string;
  actionUrl?: string;
}) {
  const { to, title, message, actionUrl } = options;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
      <div style="background-color: #4f46e5; padding: 20px; text-align: center; color: #ffffff;">
        <h1 style="margin: 0; font-size: 20px; font-weight: 700;">LocalLoop</h1>
        <p style="margin: 4px 0 0 0; font-size: 12px; opacity: 0.85;">Community Problem-Solving Platform</p>
      </div>

      <div style="padding: 24px; color: #1e293b;">
        <h2 style="margin-top: 0; font-size: 18px; color: #0f172a;">${title}</h2>
        <p style="font-size: 14px; line-height: 1.6; color: #334155;">${message}</p>

        ${
          actionUrl
            ? `<div style="margin-top: 24px; text-align: center;">
                <a href="${actionUrl}" style="background-color: #4f46e5; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px; display: inline-block;">View Details on LocalLoop</a>
               </div>`
            : ""
        }
      </div>

      <div style="background-color: #f8fafc; padding: 16px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #f1f5f9;">
        You are receiving this notification because of your activity on LocalLoop.
      </div>
    </div>
  `;

  return sendEmail({
    to,
    subject: `LocalLoop Notification: ${title}`,
    text: `${title}\n\n${message}${actionUrl ? `\n\nView at: ${actionUrl}` : ""}`,
    html,
  });
}
