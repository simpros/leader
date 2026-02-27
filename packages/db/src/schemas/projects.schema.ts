import {
  pgTable,
  text,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { user, organization } from "../auth-schema";
import { generateId } from "../id";
import type { Id } from "../id";
import { createInsertSchema } from "drizzle-valibot";
import { projectPolicies } from "../policies/projects.policy";

export const project = pgTable.withRLS(
  "project",
  {
    id: text("id")
      .$type<Id<"project">>()
      .$defaultFn(() => generateId("project"))
      .primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("project_userId_idx").on(table.userId),
    index("project_organizationId_idx").on(table.organizationId),
    ...projectPolicies.project(table),
  ]
);

export const projectInsert = createInsertSchema(project);

export const projectCustomField = pgTable.withRLS(
  "project_custom_field",
  {
    id: text("id")
      .$type<Id<"projectCustomField">>()
      .$defaultFn(() => generateId("projectCustomField"))
      .primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    projectId: text("project_id")
      .$type<Id<"project">>()
      .notNull()
      .references(() => project.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("projectCustomField_projectId_idx").on(table.projectId),
    index("projectCustomField_organizationId_idx").on(
      table.organizationId
    ),
    uniqueIndex("projectCustomField_project_name_uidx").on(
      table.projectId,
      table.name
    ),
    ...projectPolicies.projectCustomField(table),
  ]
);
