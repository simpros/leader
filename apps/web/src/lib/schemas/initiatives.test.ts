import { describe, it, expect } from "bun:test";
import * as v from "valibot";
import { generateId } from "@leader/db";
import {
  createInitiativeEmailInputSchema,
  updateInitiativeEmailInputSchema,
  sendInitiativeTestEmailInputSchema,
  generateInitiativeEmailInputSchema,
} from "./initiatives";

describe("createInitiativeEmailInputSchema", () => {
  it("accepts valid input", () => {
    const result = v.safeParse(createInitiativeEmailInputSchema, {
      projectId: generateId("project"),
      title: "Welcome Email",
      subject: "Welcome!",
      htmlBody: "<h1>Hello</h1>",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing fields", () => {
    const result = v.safeParse(createInitiativeEmailInputSchema, {
      projectId: generateId("project"),
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid project ID", () => {
    const result = v.safeParse(createInitiativeEmailInputSchema, {
      projectId: "bad",
      title: "T",
      subject: "S",
      htmlBody: "B",
    });
    expect(result.success).toBe(false);
  });
});

describe("updateInitiativeEmailInputSchema", () => {
  it("accepts valid input", () => {
    const result = v.safeParse(updateInitiativeEmailInputSchema, {
      initiativeId: generateId("initiative"),
      title: "Updated Title",
      subject: "Updated Subject",
      htmlBody: "<p>Updated</p>",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid initiative ID", () => {
    const result = v.safeParse(updateInitiativeEmailInputSchema, {
      initiativeId: "invalid",
      title: "T",
      subject: "S",
      htmlBody: "B",
    });
    expect(result.success).toBe(false);
  });
});

describe("sendInitiativeTestEmailInputSchema", () => {
  it("accepts my-email mode", () => {
    const result = v.safeParse(sendInitiativeTestEmailInputSchema, {
      projectId: generateId("project"),
      mode: "my-email",
      subject: "Test",
      htmlBody: "<p>Test</p>",
    });
    expect(result.success).toBe(true);
  });

  it("accepts lead mode with leadId", () => {
    const result = v.safeParse(sendInitiativeTestEmailInputSchema, {
      projectId: generateId("project"),
      mode: "lead",
      leadId: generateId("lead"),
      subject: "Test",
      htmlBody: "<p>Test</p>",
    });
    expect(result.success).toBe(true);
  });

  it("accepts custom mode with email", () => {
    const result = v.safeParse(sendInitiativeTestEmailInputSchema, {
      projectId: generateId("project"),
      mode: "custom",
      customEmail: "test@example.com",
      subject: "Test",
      htmlBody: "<p>Test</p>",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid mode", () => {
    const result = v.safeParse(sendInitiativeTestEmailInputSchema, {
      projectId: generateId("project"),
      mode: "invalid",
      subject: "Test",
      htmlBody: "<p>Test</p>",
    });
    expect(result.success).toBe(false);
  });
});

describe("generateInitiativeEmailInputSchema", () => {
  it("accepts valid input", () => {
    const result = v.safeParse(generateInitiativeEmailInputSchema, {
      projectId: generateId("project"),
      prompt: "Write a marketing email",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid project ID", () => {
    const result = v.safeParse(generateInitiativeEmailInputSchema, {
      projectId: "bad-id",
      prompt: "test",
    });
    expect(result.success).toBe(false);
  });
});
