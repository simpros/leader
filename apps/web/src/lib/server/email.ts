import nodemailer from "nodemailer";
import { env } from "$env/dynamic/private";
import { db, eq, schema } from "@leader/db";
import { decrypt } from "$lib/server/crypto";

let transporter: ReturnType<typeof nodemailer.createTransport> | null =
  null;

const getTransporter = () => {
  if (transporter) {
    return transporter;
  }

  const host = env.SMTP_HOST;
  const port = Number(env.SMTP_PORT ?? 1025);
  const user = env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;

  if (!host) {
    throw new Error("SMTP_HOST environment variable is not set");
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: user && pass ? { user, pass } : undefined,
  });

  return transporter;
};

export const sendEmail = async (
  to: string,
  subject: string,
  html: string
): Promise<void> => {
  const from = process.env.EMAIL_FROM ?? "noreply@example.com";
  await getTransporter().sendMail({ from, to, subject, html });
};

export const sendOrgEmail = async (
  organizationId: string,
  to: string,
  subject: string,
  html: string
): Promise<void> => {
  const [config] = await db
    .select()
    .from(schema.organizationSmtpConfig)
    .where(
      eq(schema.organizationSmtpConfig.organizationId, organizationId)
    )
    .limit(1);

  if (!config) {
    throw new Error(
      "SMTP is not configured for this organisation. Go to Settings > Organisation to set it up."
    );
  }

  const orgTransporter = nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpPort === 465,
    auth: {
      user: config.smtpUser,
      pass: decrypt(config.smtpPass),
    },
  });

  await orgTransporter.sendMail({
    from: config.emailFrom,
    to,
    subject,
    html,
  });
};
