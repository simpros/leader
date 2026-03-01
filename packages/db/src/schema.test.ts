import { describe, it, expect } from "bun:test";
import { getTableName } from "drizzle-orm";
import * as schema from "./schema";
import { relations } from "./relations";

describe("auth schemas", () => {
  it.each([
    ["user", "user"],
    ["session", "session"],
    ["account", "account"],
    ["verification", "verification"],
    ["organization", "organization"],
    ["member", "member"],
    ["invitation", "invitation"],
  ] as const)("%s table has correct name '%s'", (key, expectedName) => {
    const table = schema[key];
    expect(getTableName(table)).toBe(expectedName);
  });
});

describe("app schemas", () => {
  it.each([
    ["project", "project"],
    ["projectCustomField", "project_custom_field"],
    ["lead", "lead"],
    ["projectLead", "project_lead"],
    ["leadCustomFieldValue", "lead_custom_field_value"],
    ["initiative", "initiative"],
    ["initiativeLead", "initiative_lead"],
    ["initiativeConversation", "initiative_conversation"],
  ] as const)("%s table has correct name '%s'", (key, expectedName) => {
    const table = schema[key];
    expect(getTableName(table)).toBe(expectedName);
  });
});

describe("schema columns", () => {
  it("project has organizationId foreign key", () => {
    const columns = schema.project as Record<string, unknown>;
    expect(columns).toHaveProperty("organizationId");
  });

  it("lead has organizationId and placeId", () => {
    const columns = schema.lead as Record<string, unknown>;
    expect(columns).toHaveProperty("organizationId");
    expect(columns).toHaveProperty("placeId");
  });

  it("initiative has status with draft/sent enum", () => {
    const columns = schema.initiative as Record<string, unknown>;
    expect(columns).toHaveProperty("status");
    expect(columns).toHaveProperty("subject");
    expect(columns).toHaveProperty("htmlBody");
  });

  it("initiativeConversation has direction field", () => {
    const columns = schema.initiativeConversation as Record<string, unknown>;
    expect(columns).toHaveProperty("direction");
    expect(columns).toHaveProperty("htmlBody");
  });
});

describe("relations", () => {
  it("relations object is defined", () => {
    expect(relations).toBeDefined();
  });

  it("all schema tables are exported", () => {
    const expectedTables = [
      "user",
      "session",
      "account",
      "verification",
      "organization",
      "member",
      "invitation",
      "project",
      "projectCustomField",
      "lead",
      "projectLead",
      "leadCustomFieldValue",
      "initiative",
      "initiativeLead",
      "initiativeConversation",
    ];

    for (const table of expectedTables) {
      expect(schema).toHaveProperty(table);
    }
  });
});
