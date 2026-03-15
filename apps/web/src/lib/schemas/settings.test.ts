import { describe, it, expect } from "bun:test";
import * as v from "valibot";
import {
  updateProfileSchema,
  changePasswordSchema,
  updateOrganisationSchema,
  inviteMemberSchema,
  organizationSmtpConfigSchema,
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

describe("organizationSmtpConfigSchema", () => {
  const validInput = {
    smtpHost: "smtp.example.com",
    smtpPort: 587,
    smtpUser: "user@example.com",
    smtpPass: "secret-password",
    emailFrom: "noreply@example.com",
  };

  it("accepts valid SMTP config", () => {
    const result = v.safeParse(organizationSmtpConfigSchema, validInput);
    expect(result.success).toBe(true);
  });

  it("rejects empty smtpHost", () => {
    const result = v.safeParse(organizationSmtpConfigSchema, { ...validInput, smtpHost: "" });
    expect(result.success).toBe(false);
  });

  it("rejects smtpHost over 253 chars", () => {
    const result = v.safeParse(organizationSmtpConfigSchema, {
      ...validInput,
      smtpHost: "a".repeat(254),
    });
    expect(result.success).toBe(false);
  });

  it("rejects port below 1", () => {
    const result = v.safeParse(organizationSmtpConfigSchema, { ...validInput, smtpPort: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects port above 65535", () => {
    const result = v.safeParse(organizationSmtpConfigSchema, { ...validInput, smtpPort: 65536 });
    expect(result.success).toBe(false);
  });

  it("accepts common SMTP ports", () => {
    for (const port of [25, 465, 587, 2525]) {
      const result = v.safeParse(organizationSmtpConfigSchema, { ...validInput, smtpPort: port });
      expect(result.success).toBe(true);
    }
  });

  it("rejects non-number port", () => {
    const result = v.safeParse(organizationSmtpConfigSchema, { ...validInput, smtpPort: "587" });
    expect(result.success).toBe(false);
  });

  it("rejects empty smtpUser", () => {
    const result = v.safeParse(organizationSmtpConfigSchema, { ...validInput, smtpUser: "" });
    expect(result.success).toBe(false);
  });

  it("rejects smtpUser over 255 chars", () => {
    const result = v.safeParse(organizationSmtpConfigSchema, {
      ...validInput,
      smtpUser: "a".repeat(256),
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty smtpPass", () => {
    const result = v.safeParse(organizationSmtpConfigSchema, { ...validInput, smtpPass: "" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid emailFrom", () => {
    const result = v.safeParse(organizationSmtpConfigSchema, {
      ...validInput,
      emailFrom: "not-an-email",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty emailFrom", () => {
    const result = v.safeParse(organizationSmtpConfigSchema, { ...validInput, emailFrom: "" });
    expect(result.success).toBe(false);
  });
});
