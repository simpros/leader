import { describe, it, expect } from "bun:test";
import * as v from "valibot";
import {
  generateId,
  isId,
  idSchema,
  ID_PREFIX,
  projectIdSchema,
  leadIdSchema,
  projectLeadIdSchema,
  projectCustomFieldIdSchema,
  leadCustomFieldValueIdSchema,
  initiativeIdSchema,
  initiativeLeadIdSchema,
  initiativeConversationIdSchema,
} from "./id";
import type { IdKind } from "./id";

const ALL_KINDS: IdKind[] = [
  "project",
  "lead",
  "projectLead",
  "projectCustomField",
  "leadCustomFieldValue",
  "initiative",
  "initiativeLead",
  "initiativeConversation",
];

describe("generateId", () => {
  it.each(ALL_KINDS)("generates a valid %s ID with correct prefix", (kind) => {
    const id = generateId(kind);
    const prefix = ID_PREFIX[kind];
    expect(id).toMatch(new RegExp(`^${prefix}_[A-Za-z0-9_-]{16}$`));
  });

  it("generates unique IDs", () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId("project")));
    expect(ids.size).toBe(100);
  });
});

describe("isId", () => {
  it.each(ALL_KINDS)("validates a correct %s ID", (kind) => {
    const id = generateId(kind);
    expect(isId(id, kind)).toBe(true);
  });

  it.each(ALL_KINDS)("rejects empty string for %s", (kind) => {
    expect(isId("", kind)).toBe(false);
  });

  it("rejects an ID with wrong prefix", () => {
    const projectId = generateId("project");
    expect(isId(projectId, "lead")).toBe(false);
  });

  it("rejects prefix-only string without underscore content", () => {
    expect(isId("prj_", "project")).toBe(false);
  });

  it("accepts prefix with at least one char after underscore", () => {
    expect(isId("prj_x", "project")).toBe(true);
  });

  it("rejects strings without underscore separator", () => {
    expect(isId("prjsomething", "project")).toBe(false);
  });
});

describe("idSchema", () => {
  it.each(ALL_KINDS)("parses a valid %s ID", (kind) => {
    const id = generateId(kind);
    const schema = idSchema(kind);
    const result = v.safeParse(schema, id);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.output).toBe(id);
    }
  });

  it.each(ALL_KINDS)("rejects invalid %s ID", (kind) => {
    const schema = idSchema(kind);
    const result = v.safeParse(schema, "invalid_id");
    expect(result.success).toBe(false);
  });

  it("rejects non-string input", () => {
    const result = v.safeParse(projectIdSchema, 123);
    expect(result.success).toBe(false);
  });
});

describe("named ID schemas", () => {
  const schemas = [
    { schema: projectIdSchema, kind: "project" as const },
    { schema: leadIdSchema, kind: "lead" as const },
    { schema: projectLeadIdSchema, kind: "projectLead" as const },
    { schema: projectCustomFieldIdSchema, kind: "projectCustomField" as const },
    { schema: leadCustomFieldValueIdSchema, kind: "leadCustomFieldValue" as const },
    { schema: initiativeIdSchema, kind: "initiative" as const },
    { schema: initiativeLeadIdSchema, kind: "initiativeLead" as const },
    { schema: initiativeConversationIdSchema, kind: "initiativeConversation" as const },
  ];

  it.each(schemas)(
    "validates correct ID for $kind",
    ({ schema, kind }) => {
      const id = generateId(kind);
      const result = v.safeParse(schema, id);
      expect(result.success).toBe(true);
    }
  );

  it.each(schemas)(
    "rejects wrong prefix for $kind",
    ({ schema, kind }) => {
      const wrongKind = kind === "project" ? "lead" : "project";
      const id = generateId(wrongKind);
      const result = v.safeParse(schema, id);
      expect(result.success).toBe(false);
    }
  );
});
