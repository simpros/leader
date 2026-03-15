import { describe, it, expect, mock, beforeEach } from "bun:test";

// Use same secret as crypto.test.ts — the key is cached process-wide
process.env.BETTER_AUTH_SECRET = "test-secret-for-smtp";

const mockSendMail = mock(() => Promise.resolve());
const mockCreateTransport = mock(() => ({
  sendMail: mockSendMail,
}));

mock.module("nodemailer", () => ({
  default: { createTransport: mockCreateTransport },
}));

mock.module("$env/dynamic/private", () => ({
  env: {},
}));

// Import real crypto to create realistic encrypted test data
// (do NOT mock $lib/server/crypto — it leaks across test files in bun)
const { encrypt } = await import("./crypto");

// Preserve real @leader/db exports so the mock doesn't break other test files
// (bun's mock.module leaks across files in the same process)
const realDb = await import("@leader/db");

const SMTP_PASSWORD = "org-smtp-password";

const mockSmtpConfig = {
  id: "osc_test123",
  organizationId: "org-1",
  smtpHost: "smtp.org.com",
  smtpPort: 587,
  smtpUser: "org-user",
  smtpPass: encrypt(SMTP_PASSWORD),
  emailFrom: "noreply@org.com",
  createdAt: new Date(),
  updatedAt: new Date(),
};

let mockDbResult: typeof mockSmtpConfig | undefined = mockSmtpConfig;

const mockLimit = mock(() => Promise.resolve(mockDbResult ? [mockDbResult] : []));
const mockWhere = mock(() => ({ limit: mockLimit }));
const mockFrom = mock(() => ({ where: mockWhere }));
const mockSelect = mock(() => ({ from: mockFrom }));

mock.module("@leader/db", () => ({
  ...realDb,
  db: { select: mockSelect },
  eq: mock((col: unknown, val: unknown) => ({ col, val })),
  schema: {
    ...realDb.schema,
    organizationSmtpConfig: {
      organizationId: "organizationSmtpConfig.organizationId",
    },
  },
}));

const { sendOrgEmail } = await import("./email");

describe("sendOrgEmail", () => {
  beforeEach(() => {
    mockSendMail.mockClear();
    mockCreateTransport.mockClear();
    mockSelect.mockClear();
    mockFrom.mockClear();
    mockWhere.mockClear();
    mockLimit.mockClear();
    mockDbResult = { ...mockSmtpConfig, smtpPass: encrypt(SMTP_PASSWORD) };
  });

  it("sends email using org SMTP config", async () => {
    await sendOrgEmail("org-1", "to@example.com", "Subject", "<p>Hi</p>");

    expect(mockSelect).toHaveBeenCalledTimes(1);
    expect(mockCreateTransport).toHaveBeenCalledTimes(1);
    expect(mockCreateTransport.mock.calls[0]![0]).toEqual({
      host: "smtp.org.com",
      port: 587,
      secure: false,
      auth: {
        user: "org-user",
        pass: SMTP_PASSWORD,
      },
    });
    expect(mockSendMail).toHaveBeenCalledTimes(1);
    expect(mockSendMail.mock.calls[0]![0]).toEqual({
      from: "noreply@org.com",
      to: "to@example.com",
      subject: "Subject",
      html: "<p>Hi</p>",
    });
  });

  it("decrypts the SMTP password back to plaintext", async () => {
    await sendOrgEmail("org-1", "to@example.com", "Test", "body");

    const transportConfig = mockCreateTransport.mock.calls[0]![0] as Record<
      string,
      unknown
    >;
    expect((transportConfig.auth as Record<string, unknown>).pass).toBe(
      SMTP_PASSWORD
    );
  });

  it("uses secure: true when port is 465", async () => {
    mockDbResult = { ...mockSmtpConfig, smtpPort: 465, smtpPass: encrypt(SMTP_PASSWORD) };

    await sendOrgEmail("org-1", "to@example.com", "Test", "body");

    expect(mockCreateTransport.mock.calls[0]![0]).toMatchObject({
      port: 465,
      secure: true,
    });
  });

  it("throws when no SMTP config exists for the organisation", async () => {
    mockDbResult = undefined;

    await expect(
      sendOrgEmail("org-unknown", "to@example.com", "Test", "body")
    ).rejects.toThrow(
      "SMTP is not configured for this organisation"
    );
    expect(mockCreateTransport).not.toHaveBeenCalled();
    expect(mockSendMail).not.toHaveBeenCalled();
  });
});
