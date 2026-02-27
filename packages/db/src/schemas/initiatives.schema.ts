import {
  pgTable,
  text,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { organization } from "../auth-schema";
import { generateId } from "../id";
import type { Id } from "../id";
import { project } from "./projects.schema";
import { lead } from "./leads.schema";
import { initiativePolicies } from "../policies/initiatives.policy";

export const initiative = pgTable.withRLS(
  "initiative",
  {
    id: text("id")
      .$type<Id<"initiative">>()
      .$defaultFn(() => generateId("initiative"))
      .primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    projectId: text("project_id")
      .$type<Id<"project">>()
      .notNull()
      .references(() => project.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    title: text("title").notNull(),
    subject: text("subject").notNull(),
    htmlBody: text("html_body").notNull(),
    status: text("status", { enum: ["draft", "sent"] })
      .notNull()
      .default("draft"),
    sentAt: timestamp("sent_at", { mode: "date" }),
    createdAt: timestamp("created_at", { mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("initiative_projectId_idx").on(table.projectId),
    index("initiative_organizationId_idx").on(table.organizationId),
    ...initiativePolicies.initiative(table),
  ]
);

export const initiativeLead = pgTable.withRLS(
  "initiative_lead",
  {
    id: text("id")
      .$type<Id<"initiativeLead">>()
      .$defaultFn(() => generateId("initiativeLead"))
      .primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    initiativeId: text("initiative_id")
      .$type<Id<"initiative">>()
      .notNull()
      .references(() => initiative.id, { onDelete: "cascade" }),
    leadId: text("lead_id")
      .$type<Id<"lead">>()
      .notNull()
      .references(() => lead.id, { onDelete: "cascade" }),
    status: text("status").notNull(),
    lastEmailSentAt: timestamp("last_email_sent_at", { mode: "date" }),
    createdAt: timestamp("created_at", { mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("initiativeLead_initiativeId_idx").on(table.initiativeId),
    index("initiativeLead_leadId_idx").on(table.leadId),
    index("initiativeLead_organizationId_idx").on(table.organizationId),
    uniqueIndex("initiativeLead_initiative_lead_uidx").on(
      table.initiativeId,
      table.leadId
    ),
    ...initiativePolicies.initiativeLead(table),
  ]
);

export const initiativeConversation = pgTable.withRLS(
  "initiative_conversation",
  {
    id: text("id")
      .$type<Id<"initiativeConversation">>()
      .$defaultFn(() => generateId("initiativeConversation"))
      .primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    initiativeLeadId: text("initiative_lead_id")
      .$type<Id<"initiativeLead">>()
      .notNull()
      .references(() => initiativeLead.id, { onDelete: "cascade" }),
    direction: text("direction").notNull(),
    subject: text("subject"),
    htmlBody: text("html_body").notNull(),
    sentAt: timestamp("sent_at", { mode: "date" }),
    createdAt: timestamp("created_at", { mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("initiativeConversation_initiativeLeadId_idx").on(
      table.initiativeLeadId
    ),
    index("initiativeConversation_organizationId_idx").on(
      table.organizationId
    ),
    ...initiativePolicies.initiativeConversation(table),
  ]
);
