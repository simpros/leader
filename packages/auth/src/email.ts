import { getLogger } from "@logtape/logtape";
import nodemailer from "nodemailer";

const logger = getLogger(["leader", "auth", "email"]);

const smtpHost = process.env.SMTP_HOST || "localhost";
const smtpPort = parseInt(process.env.SMTP_PORT || "1025", 10); // default to mailhog/mailpit port for local dev
const smtpUser = process.env.SMTP_USER || "";
const smtpPass = process.env.SMTP_PASS || "";
export const emailFrom = process.env.EMAIL_FROM || "noreply@example.com";

const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpPort === 465, // true for 465, false for other ports
  auth:
    smtpUser && smtpPass
      ? {
          user: smtpUser,
          pass: smtpPass,
        }
      : undefined,
});

export const sendEmail = async ({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) => {
  try {
    const info = await transporter.sendMail({
      from: emailFrom,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>?/gm, ""), // simple fallback text
    });
    console.log("Message sent: %s", info.messageId);
    logger.info("Email sent", { messageId: info.messageId, to });
    return info;
  } catch (error) {
    logger.error("Failed to send email", {
      to,
      subject,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
};
