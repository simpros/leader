import { describe, it, expect } from "vitest";
import * as v from "valibot";
import { generateId } from "@leader/db";
import {
  createProjectInputSchema,
  addLeadsToProjectInputSchema,
  createProjectWithLeadsInputSchema,
  unlinkLeadFromProjectInputSchema,
  updateProjectInputSchema,
  deleteProjectInputSchema,
  projectLeadInputSchema,
} from "./projects";

describe("createProjectInputSchema", () => {
  it("accepts valid input", () => {
    const result = v.safeParse(createProjectInputSchema, { name: "My Project" });
    expect(result.success).toBe(true);
  });

  it("accepts project with description", () => {
    const result = v.safeParse(createProjectInputSchema, {
      name: "My Project",
      description: "A test project",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = v.safeParse(createProjectInputSchema, { name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects name over 200 chars", () => {
    const result = v.safeParse(createProjectInputSchema, { name: "a".repeat(201) });
    expect(result.success).toBe(false);
  });

  it("trims whitespace", () => {
    const result = v.safeParse(createProjectInputSchema, { name: "  Project  " });
    expect(result.success).toBe(true);
    if (result.success) expect(result.output.name).toBe("Project");
  });
});

describe("projectLeadInputSchema", () => {
  it("accepts valid lead with all fields", () => {
    const result = v.safeParse(projectLeadInputSchema, {
      placeId: "ChIJ123",
      name: "Test Business",
      address: "123 Main St",
      types: ["restaurant", "food"],
      website: "https://example.com",
      email: "test@test.com",
      phone: "+1234567890",
      rating: 4.5,
      ratingsTotal: 100,
      googleMapsUrl: "https://maps.google.com/123",
      businessStatus: "OPERATIONAL",
    });
    expect(result.success).toBe(true);
  });

  it("accepts minimal lead", () => {
    const result = v.safeParse(projectLeadInputSchema, {
      placeId: "ChIJ123",
      name: "Test",
    });
    expect(result.success).toBe(true);
  });
});

describe("addLeadsToProjectInputSchema", () => {
  it("accepts valid project and leads", () => {
    const result = v.safeParse(addLeadsToProjectInputSchema, {
      projectId: generateId("project"),
      leads: [{ placeId: "ChIJ123", name: "Lead 1" }],
    });
    expect(result.success).toBe(true);
  });

  it("accepts empty leads array", () => {
    const result = v.safeParse(addLeadsToProjectInputSchema, {
      projectId: generateId("project"),
      leads: [],
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid project ID", () => {
    const result = v.safeParse(addLeadsToProjectInputSchema, {
      projectId: "bad-id",
      leads: [],
    });
    expect(result.success).toBe(false);
  });
});

describe("createProjectWithLeadsInputSchema", () => {
  it("accepts valid input", () => {
    const result = v.safeParse(createProjectWithLeadsInputSchema, {
      name: "New Project",
      leads: [{ placeId: "ChIJ456", name: "Lead" }],
    });
    expect(result.success).toBe(true);
  });
});

describe("unlinkLeadFromProjectInputSchema", () => {
  it("accepts valid IDs", () => {
    const result = v.safeParse(unlinkLeadFromProjectInputSchema, {
      projectId: generateId("project"),
      leadId: generateId("lead"),
    });
    expect(result.success).toBe(true);
  });
});

describe("updateProjectInputSchema", () => {
  it("accepts valid update", () => {
    const result = v.safeParse(updateProjectInputSchema, {
      projectId: generateId("project"),
      name: "Updated Name",
    });
    expect(result.success).toBe(true);
  });
});

describe("deleteProjectInputSchema", () => {
  it("accepts valid project ID", () => {
    const result = v.safeParse(deleteProjectInputSchema, {
      projectId: generateId("project"),
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid project ID", () => {
    const result = v.safeParse(deleteProjectInputSchema, {
      projectId: "invalid",
    });
    expect(result.success).toBe(false);
  });
});
