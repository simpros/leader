import { describe, it, expect } from "bun:test";
import {
  normalizeWebsiteUrl,
  extractEmails,
  isLikelyBusinessEmail,
  pickBestEmail,
  extractCandidateLinks,
} from "./email";

describe("normalizeWebsiteUrl", () => {
  it("returns null for null input", () => {
    expect(normalizeWebsiteUrl(null)).toBeNull();
  });

  it("returns null for undefined input", () => {
    expect(normalizeWebsiteUrl(undefined)).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(normalizeWebsiteUrl("")).toBeNull();
  });

  it("prepends https:// when no protocol", () => {
    expect(normalizeWebsiteUrl("example.com")).toBe("https://example.com/");
  });

  it("preserves http:// protocol", () => {
    expect(normalizeWebsiteUrl("http://example.com")).toBe(
      "http://example.com/",
    );
  });

  it("preserves https:// protocol", () => {
    expect(normalizeWebsiteUrl("https://example.com")).toBe(
      "https://example.com/",
    );
  });

  it("preserves path and query", () => {
    expect(normalizeWebsiteUrl("example.com/about?q=1")).toBe(
      "https://example.com/about?q=1",
    );
  });

  it("returns null for invalid URL", () => {
    expect(normalizeWebsiteUrl("://bad")).toBeNull();
  });
});

describe("extractEmails", () => {
  it("extracts a single email", () => {
    expect(extractEmails("Contact us at info@example.com")).toEqual([
      "info@example.com",
    ]);
  });

  it("extracts multiple emails", () => {
    const result = extractEmails("a@b.com and c@d.com");
    expect(result).toEqual(["a@b.com", "c@d.com"]);
  });

  it("deduplicates emails", () => {
    expect(extractEmails("a@b.com a@b.com")).toEqual(["a@b.com"]);
  });

  it("is case-insensitive but preserves original casing", () => {
    const result = extractEmails("Info@Example.COM");
    expect(result).toEqual(["Info@Example.COM"]);
  });

  it("returns empty array when no emails found", () => {
    expect(extractEmails("no emails here")).toEqual([]);
  });

  it("filters emails longer than 254 chars", () => {
    const longLocal = "a".repeat(250);
    const longEmail = `${longLocal}@example.com`;
    expect(extractEmails(longEmail)).toEqual([]);
  });

  it("handles emails with dots and special chars in local part", () => {
    const result = extractEmails("user.name+tag@example.co.uk");
    expect(result).toEqual(["user.name+tag@example.co.uk"]);
  });
});

describe("isLikelyBusinessEmail", () => {
  it("returns true for business emails", () => {
    expect(isLikelyBusinessEmail("sales@company.com")).toBe(true);
    expect(isLikelyBusinessEmail("john@startup.io")).toBe(true);
  });

  it("returns false for noreply emails", () => {
    expect(isLikelyBusinessEmail("noreply@company.com")).toBe(false);
  });

  it("returns false for no-reply emails", () => {
    expect(isLikelyBusinessEmail("no-reply@company.com")).toBe(false);
  });

  it("returns false for donotreply emails", () => {
    expect(isLikelyBusinessEmail("donotreply@company.com")).toBe(false);
  });

  it("is case-insensitive for blocked prefixes", () => {
    expect(isLikelyBusinessEmail("NoReply@COMPANY.COM")).toBe(false);
    expect(isLikelyBusinessEmail("NO-REPLY@test.com")).toBe(false);
  });
});

describe("pickBestEmail", () => {
  it("returns null for empty array", () => {
    expect(pickBestEmail([])).toBeNull();
  });

  it("returns the first business email", () => {
    expect(pickBestEmail(["noreply@x.com", "sales@x.com"])).toBe(
      "sales@x.com",
    );
  });

  it("falls back to first email if all are non-business", () => {
    expect(pickBestEmail(["noreply@x.com", "no-reply@y.com"])).toBe(
      "noreply@x.com",
    );
  });

  it("returns the only email when just one provided", () => {
    expect(pickBestEmail(["hello@test.com"])).toBe("hello@test.com");
  });
});

describe("extractCandidateLinks", () => {
  const base = "https://example.com";

  it("extracts contact page links from same domain", () => {
    const html = `<a href="/contact">Contact</a>`;
    const result = extractCandidateLinks(html, base);
    expect(result).toEqual(["https://example.com/contact"]);
  });

  it("extracts about page links", () => {
    const html = `<a href="https://example.com/about-us">About</a>`;
    const result = extractCandidateLinks(html, base);
    expect(result).toEqual(["https://example.com/about-us"]);
  });

  it("ignores links to other domains", () => {
    const html = `<a href="https://other.com/contact">Contact</a>`;
    expect(extractCandidateLinks(html, base)).toEqual([]);
  });

  it("ignores mailto: and tel: links", () => {
    const html = `<a href="mailto:a@b.com">Mail</a><a href="tel:123">Call</a>`;
    expect(extractCandidateLinks(html, base)).toEqual([]);
  });

  it("ignores links without contact path hints", () => {
    const html = `<a href="/products">Products</a><a href="/pricing">Pricing</a>`;
    expect(extractCandidateLinks(html, base)).toEqual([]);
  });

  it("resolves relative URLs against base", () => {
    const html = `<a href="/team/leadership">Team</a>`;
    const result = extractCandidateLinks(html, base);
    expect(result).toEqual(["https://example.com/team/leadership"]);
  });

  it("deduplicates links", () => {
    const html = `<a href="/contact">1</a><a href="/contact">2</a>`;
    const result = extractCandidateLinks(html, base);
    expect(result).toEqual(["https://example.com/contact"]);
  });

  it("matches multiple hint keywords", () => {
    const html = `
      <a href="/support">Support</a>
      <a href="/legal/privacy">Privacy</a>
      <a href="/terms">Terms</a>
    `;
    const result = extractCandidateLinks(html, base);
    expect(result).toHaveLength(3);
  });
});
