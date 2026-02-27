import { leadIdSchema, projectIdSchema } from "@leader/db";
import * as v from "valibot";

export const createInitiativeEmailInputSchema = v.object({
  projectId: projectIdSchema,
  title: v.string(),
  subject: v.string(),
  htmlBody: v.string(),
});

export const sendInitiativeTestEmailInputSchema = v.object({
  projectId: projectIdSchema,
  leadId: leadIdSchema,
  subject: v.string(),
  htmlBody: v.string(),
});

export const generateInitiativeEmailInputSchema = v.object({
  projectId: projectIdSchema,
  prompt: v.string(),
});
