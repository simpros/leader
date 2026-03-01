import {
  pgTable,
  text,
  integer,
  real,
  index,
  uniqueIndex,
  timestamp,
} from "drizzle-orm/pg-core";
import { organization } from "../auth-schema";
import { generateId } from "../id";
import type { Id } from "../id";
import { project, projectCustomField } from "./projects.schema";
import { leadPolicies } from "../policies/leads.policy";

export const lead = pgTable.withRLS(
  "lead",
  {
    id: text("id")
      .$type<Id<"lead">>()
      .$defaultFn(() => generateId("lead"))
      .primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    placeId: text("place_id").notNull(),
    name: text("name").notNull(),
    address: text("address"),
    types: text("types"),
    website: text("website"),
    email: text("email"),
    phone: text("phone"),
    rating: real("rating"),
    ratingsTotal: integer("ratings_total"),
    googleMapsUrl: text("google_maps_url"),
    businessStatus: text("business_status"),
    createdAt: timestamp("created_at", { mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("lead_org_placeId_uidx").on(
      table.organizationId,
      table.placeId
    ),
    index("lead_organizationId_idx").on(table.organizationId),
    ...leadPolicies.lead(table),
  ]
);

export const projectLead = pgTable.withRLS(
  "project_lead",
  {
    id: text("id")
      .$type<Id<"projectLead">>()
      .$defaultFn(() => generateId("projectLead"))
      .primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    projectId: text("project_id")
      .$type<Id<"project">>()
      .notNull()
      .references(() => project.id, { onDelete: "cascade" }),
    leadId: text("lead_id")
      .$type<Id<"lead">>()
      .notNull()
      .references(() => lead.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("projectLead_projectId_idx").on(table.projectId),
    index("projectLead_leadId_idx").on(table.leadId),
    index("projectLead_organizationId_idx").on(table.organizationId),
    uniqueIndex("projectLead_project_lead_uidx").on(
      table.projectId,
      table.leadId
    ),
    ...leadPolicies.projectLead(table),
  ]
);

export const leadCustomFieldValue = pgTable.withRLS(
  "lead_custom_field_value",
  {
    id: text("id")
      .$type<Id<"leadCustomFieldValue">>()
      .$defaultFn(() => generateId("leadCustomFieldValue"))
      .primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    leadId: text("lead_id")
      .$type<Id<"lead">>()
      .notNull()
      .references(() => lead.id, { onDelete: "cascade" }),
    projectCustomFieldId: text("project_custom_field_id")
      .$type<Id<"projectCustomField">>()
      .notNull()
      .references(() => projectCustomField.id, { onDelete: "cascade" }),
    value: text("value"),
    createdAt: timestamp("created_at", { mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("leadCustomFieldValue_leadId_idx").on(table.leadId),
    index("leadCustomFieldValue_projectCustomFieldId_idx").on(
      table.projectCustomFieldId
    ),
    index("leadCustomFieldValue_organizationId_idx").on(
      table.organizationId
    ),
    uniqueIndex("leadCustomFieldValue_lead_field_uidx").on(
      table.leadId,
      table.projectCustomFieldId
    ),
    ...leadPolicies.leadCustomFieldValue(table),
  ]
);
