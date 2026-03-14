import {
  pgTable,
  text,
  integer,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { organization } from "../auth-schema";
import { generateId } from "../id";
import type { Id } from "../id";
import { organizationSmtpConfigPolicies } from "../policies/organization-smtp-config.policy";

export const organizationSmtpConfig = pgTable.withRLS(
  "organization_smtp_config",
  {
    id: text("id")
      .$type<Id<"organizationSmtpConfig">>()
      .$defaultFn(() => generateId("organizationSmtpConfig"))
      .primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    smtpHost: text("smtp_host").notNull(),
    smtpPort: integer("smtp_port").notNull(),
    smtpUser: text("smtp_user").notNull(),
    smtpPass: text("smtp_pass").notNull(),
    emailFrom: text("email_from").notNull(),
    createdAt: timestamp("created_at", { mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("organizationSmtpConfig_organizationId_uidx").on(
      table.organizationId
    ),
    ...organizationSmtpConfigPolicies.organizationSmtpConfig(table),
  ]
);
