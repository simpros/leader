import { command, getRequestEvent, query } from "$app/server";
import { db, eq, schema } from "@leader/db";
import { error } from "@sveltejs/kit";
import { organizationSmtpConfigSchema } from "$lib/schemas/settings";
import { encrypt } from "$lib/server/crypto";
import { addRequestLogContext } from "$lib/server/request-logging";
import nodemailer from "nodemailer";

const ensureOrgAdmin = (locals: App.Locals) => {
  const userId = locals.user?.id;
  const organizationId = locals.session?.activeOrganizationId;
  if (!userId || !organizationId) throw error(401, "Unauthorized");
  return { userId, organizationId };
};

export const getSmtpConfig = query(async () => {
  addRequestLogContext({ action: "getSmtpConfig" });
  const { locals } = getRequestEvent();
  const { organizationId } = ensureOrgAdmin(locals);

  const [config] = await db
    .select({
      id: schema.organizationSmtpConfig.id,
      smtpHost: schema.organizationSmtpConfig.smtpHost,
      smtpPort: schema.organizationSmtpConfig.smtpPort,
      smtpUser: schema.organizationSmtpConfig.smtpUser,
      emailFrom: schema.organizationSmtpConfig.emailFrom,
    })
    .from(schema.organizationSmtpConfig)
    .where(
      eq(schema.organizationSmtpConfig.organizationId, organizationId)
    )
    .limit(1);

  return config ?? null;
});

export const saveSmtpConfig = command(
  organizationSmtpConfigSchema,
  async (input) => {
    addRequestLogContext({ action: "saveSmtpConfig" });
    const { locals } = getRequestEvent();
    const { organizationId } = ensureOrgAdmin(locals);

    const encryptedPass = encrypt(input.smtpPass);
    const now = new Date();

    const [existing] = await db
      .select({ id: schema.organizationSmtpConfig.id })
      .from(schema.organizationSmtpConfig)
      .where(
        eq(schema.organizationSmtpConfig.organizationId, organizationId)
      )
      .limit(1);

    if (existing) {
      await db
        .update(schema.organizationSmtpConfig)
        .set({
          smtpHost: input.smtpHost,
          smtpPort: input.smtpPort,
          smtpUser: input.smtpUser,
          smtpPass: encryptedPass,
          emailFrom: input.emailFrom,
          updatedAt: now,
        })
        .where(eq(schema.organizationSmtpConfig.id, existing.id));
    } else {
      await db.insert(schema.organizationSmtpConfig).values({
        organizationId,
        smtpHost: input.smtpHost,
        smtpPort: input.smtpPort,
        smtpUser: input.smtpUser,
        smtpPass: encryptedPass,
        emailFrom: input.emailFrom,
        createdAt: now,
        updatedAt: now,
      });
    }

    return { success: true };
  }
);

export const testSmtpConnection = command(
  organizationSmtpConfigSchema,
  async (input) => {
    addRequestLogContext({ action: "testSmtpConnection" });
    const { locals } = getRequestEvent();
    ensureOrgAdmin(locals);

    const transporter = nodemailer.createTransport({
      host: input.smtpHost,
      port: input.smtpPort,
      secure: input.smtpPort === 465,
      auth:
        input.smtpUser && input.smtpPass
          ? { user: input.smtpUser, pass: input.smtpPass }
          : undefined,
    });

    try {
      await transporter.verify();
      return { success: true };
    } catch (err) {
      throw error(
        400,
        `SMTP connection failed: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }
);
