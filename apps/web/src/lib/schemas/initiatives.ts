import { initiativeIdSchema, leadIdSchema, projectIdSchema } from "@leader/db";
import * as v from "valibot";

export const createInitiativeEmailInputSchema = v.object({
  projectId: projectIdSchema,
  title: v.string(),
  subject: v.string(),
  htmlBody: v.string(),
});

export const updateInitiativeEmailInputSchema = v.object({
  initiativeId: initiativeIdSchema,
  title: v.string(),
  subject: v.string(),
  htmlBody: v.string(),
});

const testEmailModeSchema = v.picklist(["my-email", "lead", "custom"]);

export const sendInitiativeTestEmailInputSchema = v.object({
  projectId: projectIdSchema,
  leadId: v.optional(leadIdSchema),
  mode: testEmailModeSchema,
  customEmail: v.optional(v.pipe(v.string(), v.trim())),
  subject: v.string(),
  htmlBody: v.string(),
});

export const generateInitiativeEmailInputSchema = v.object({
  projectId: projectIdSchema,
  prompt: v.string(),
});
