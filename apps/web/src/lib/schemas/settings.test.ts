import { describe, it, expect } from "bun:test";
import * as v from "valibot";
import {
  updateProfileSchema,
  changePasswordSchema,
  updateOrganisationSchema,
  inviteMemberSchema,
} from "./settings";

describe("updateProfileSchema", () => {
  it("accepts a valid name", () => {
    const result = v.safeParse(updateProfileSchema, { name: "John" });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = v.safeParse(updateProfileSchema, { name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects name over 100 chars", () => {
    const result = v.safeParse(updateProfileSchema, { name: "a".repeat(101) });
    expect(result.success).toBe(false);
  });
});

describe("changePasswordSchema", () => {
  it("accepts matching passwords", () => {
    const result = v.safeParse(changePasswordSchema, {
      currentPassword: "old-password",
      newPassword: "new-password-123",
      confirmPassword: "new-password-123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects mismatched passwords", () => {
    const result = v.safeParse(changePasswordSchema, {
      currentPassword: "old-password",
      newPassword: "new-password-123",
      confirmPassword: "different-password",
    });
    expect(result.success).toBe(false);
  });

  it("rejects short new password", () => {
    const result = v.safeParse(changePasswordSchema, {
      currentPassword: "old-password",
      newPassword: "short",
      confirmPassword: "short",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty current password", () => {
    const result = v.safeParse(changePasswordSchema, {
      currentPassword: "",
      newPassword: "new-password-123",
      confirmPassword: "new-password-123",
    });
    expect(result.success).toBe(false);
  });
});

describe("updateOrganisationSchema", () => {
  it("accepts valid org data", () => {
    const result = v.safeParse(updateOrganisationSchema, {
      name: "My Org",
      slug: "my-org",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = v.safeParse(updateOrganisationSchema, {
      name: "",
      slug: "my-org",
    });
    expect(result.success).toBe(false);
  });

  it("rejects slug with uppercase", () => {
    const result = v.safeParse(updateOrganisationSchema, {
      name: "My Org",
      slug: "My-Org",
    });
    expect(result.success).toBe(false);
  });

  it("rejects slug with spaces", () => {
    const result = v.safeParse(updateOrganisationSchema, {
      name: "My Org",
      slug: "my org",
    });
    expect(result.success).toBe(false);
  });

  it("accepts slug with numbers and hyphens", () => {
    const result = v.safeParse(updateOrganisationSchema, {
      name: "Org 2",
      slug: "org-2-test",
    });
    expect(result.success).toBe(true);
  });

  it("rejects slug over 100 chars", () => {
    const result = v.safeParse(updateOrganisationSchema, {
      name: "Org",
      slug: "a".repeat(101),
    });
    expect(result.success).toBe(false);
  });
});

describe("inviteMemberSchema", () => {
  it("accepts valid email and role", () => {
    const result = v.safeParse(inviteMemberSchema, {
      email: "user@example.com",
      role: "member",
    });
    expect(result.success).toBe(true);
  });

  it("accepts admin role", () => {
    const result = v.safeParse(inviteMemberSchema, {
      email: "admin@example.com",
      role: "admin",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = v.safeParse(inviteMemberSchema, {
      email: "not-an-email",
      role: "member",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid role", () => {
    const result = v.safeParse(inviteMemberSchema, {
      email: "user@example.com",
      role: "owner",
    });
    expect(result.success).toBe(false);
  });
});
