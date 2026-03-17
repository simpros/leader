export { db, sqlClient, withRLS } from "./client";
export type { AppDatabase } from "./client";
export { runMigrations } from "./migrate";
export {
  ID_PREFIX,
  generateId,
  isId,
  idSchema,
  projectIdSchema,
  leadIdSchema,
  projectLeadIdSchema,
  projectCustomFieldIdSchema,
  leadCustomFieldValueIdSchema,
  initiativeIdSchema,
  initiativeLeadIdSchema,
  initiativeConversationIdSchema,
  organizationSmtpConfigIdSchema,
} from "./id";
export type { IdKind, IdPrefix, Id } from "./id";

export * as schema from "./schema";

export { eq, and, or, count, sql, desc, inArray } from "drizzle-orm";
