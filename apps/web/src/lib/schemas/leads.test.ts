import { describe, it, expect } from "vitest";
import * as v from "valibot";
import { generateId } from "@leader/db";
import {
  createManualLeadInputSchema,
  updateLeadCoreInputSchema,
  createProjectCustomFieldInputSchema,
  upsertLeadCustomFieldValueInputSchema,
  deleteLeadInputSchema,
} from "./leads";

describe("createManualLeadInputSchema", () => {
  it("accepts valid input", () => {
    const result = v.safeParse(createManualLeadInputSchema, {
      projectId: generateId("project"),
      name: "Test Lead",
    });
    expect(result.success).toBe(true);
  });

  it("accepts full input with optional fields", () => {
    const result = v.safeParse(createManualLeadInputSchema, {
      projectId: generateId("project"),
      name: "Test Lead",
      address: "123 Main St",
      website: "https://example.com",
      email: "test@example.com",
      phone: "+1234567890",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing name", () => {
    const result = v.safeParse(createManualLeadInputSchema, {
      projectId: generateId("project"),
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty name", () => {
    const result = v.safeParse(createManualLeadInputSchema, {
      projectId: generateId("project"),
      name: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects name over 200 chars", () => {
    const result = v.safeParse(createManualLeadInputSchema, {
      projectId: generateId("project"),
      name: "a".repeat(201),
    });
    expect(result.success).toBe(false);
  });

  it("trims whitespace from name", () => {
    const result = v.safeParse(createManualLeadInputSchema, {
      projectId: generateId("project"),
      name: "  Test Lead  ",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.output.name).toBe("Test Lead");
  });

  it("rejects invalid project ID", () => {
    const result = v.safeParse(createManualLeadInputSchema, {
      projectId: "invalid-id",
      name: "Test Lead",
    });
    expect(result.success).toBe(false);
  });

  it("transforms empty optional strings to undefined", () => {
    const result = v.safeParse(createManualLeadInputSchema, {
      projectId: generateId("project"),
      name: "Test Lead",
      email: "",
      phone: "",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.output.email).toBeUndefined();
      expect(result.output.phone).toBeUndefined();
    }
  });
});

describe("updateLeadCoreInputSchema", () => {
  it("accepts valid input", () => {
    const result = v.safeParse(updateLeadCoreInputSchema, {
      leadId: generateId("lead"),
      name: "Updated Lead",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid lead ID", () => {
    const result = v.safeParse(updateLeadCoreInputSchema, {
      leadId: "bad",
      name: "Updated Lead",
    });
    expect(result.success).toBe(false);
  });
});

describe("createProjectCustomFieldInputSchema", () => {
  it("accepts valid input", () => {
    const result = v.safeParse(createProjectCustomFieldInputSchema, {
      leadId: generateId("lead"),
      projectId: generateId("project"),
      name: "Custom Field",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty field name", () => {
    const result = v.safeParse(createProjectCustomFieldInputSchema, {
      leadId: generateId("lead"),
      projectId: generateId("project"),
      name: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects field name over 100 chars", () => {
    const result = v.safeParse(createProjectCustomFieldInputSchema, {
      leadId: generateId("lead"),
      projectId: generateId("project"),
      name: "a".repeat(101),
    });
    expect(result.success).toBe(false);
  });
});

describe("upsertLeadCustomFieldValueInputSchema", () => {
  it("accepts valid input with value", () => {
    const result = v.safeParse(upsertLeadCustomFieldValueInputSchema, {
      leadId: generateId("lead"),
      projectCustomFieldId: generateId("projectCustomField"),
      value: "some value",
    });
    expect(result.success).toBe(true);
  });

  it("accepts input with empty value (transforms to undefined)", () => {
    const result = v.safeParse(upsertLeadCustomFieldValueInputSchema, {
      leadId: generateId("lead"),
      projectCustomFieldId: generateId("projectCustomField"),
      value: "",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.output.value).toBeUndefined();
  });
});

describe("deleteLeadInputSchema", () => {
  it("accepts valid lead ID", () => {
    const result = v.safeParse(deleteLeadInputSchema, {
      leadId: generateId("lead"),
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid lead ID", () => {
    const result = v.safeParse(deleteLeadInputSchema, {
      leadId: "invalid",
    });
    expect(result.success).toBe(false);
  });
});
