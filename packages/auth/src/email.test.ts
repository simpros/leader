import { describe, it, expect, mock, beforeEach } from "bun:test";

// Mock nodemailer before importing email module
const mockSendMail = mock((_opts: Record<string, unknown>) =>
  Promise.resolve({ messageId: "test-msg-id-123" }),
);
mock.module("nodemailer", () => ({
  default: {
    createTransport: () => ({
      sendMail: mockSendMail,
    }),
  },
}));

const { sendEmail, emailFrom } = await import("./email");

describe("sendEmail", () => {
  beforeEach(() => {
    mockSendMail.mockClear();
    mockSendMail.mockImplementation((_opts: Record<string, unknown>) =>
      Promise.resolve({ messageId: "test-msg-id-123" }),
    );
  });

  it("sends email with correct parameters", async () => {
    await sendEmail({
      to: "user@example.com",
      subject: "Test Subject",
      html: "<p>Hello</p>",
    });

    expect(mockSendMail).toHaveBeenCalledTimes(1);
    const call = mockSendMail.mock.calls[0]![0];
    expect(call.to).toBe("user@example.com");
    expect(call.subject).toBe("Test Subject");
    expect(call.html).toBe("<p>Hello</p>");
    expect(call.from).toBe(emailFrom);
  });

  it("generates text fallback from HTML when text not provided", async () => {
    await sendEmail({
      to: "user@example.com",
      subject: "Test",
      html: "<p>Hello <strong>World</strong></p>",
    });

    const call = mockSendMail.mock.calls[0]![0];
    expect(call.text).toBe("Hello World");
  });

  it("uses provided text when given", async () => {
    await sendEmail({
      to: "user@example.com",
      subject: "Test",
      html: "<p>Hello</p>",
      text: "Custom text",
    });

    const call = mockSendMail.mock.calls[0]![0];
    expect(call.text).toBe("Custom text");
  });

  it("returns message info on success", async () => {
    const result = await sendEmail({
      to: "user@example.com",
      subject: "Test",
      html: "<p>Hi</p>",
    });

    expect(result.messageId).toBe("test-msg-id-123");
  });

  it("throws on transporter failure", async () => {
    mockSendMail.mockImplementation((_opts: Record<string, unknown>) =>
      Promise.reject(new Error("SMTP connection refused")),
    );

    expect(
      sendEmail({
        to: "user@example.com",
        subject: "Test",
        html: "<p>Hi</p>",
      }),
    ).rejects.toThrow("SMTP connection refused");
  });

  it("exports emailFrom with default value", () => {
    expect(typeof emailFrom).toBe("string");
    expect(emailFrom.length).toBeGreaterThan(0);
  });
});
