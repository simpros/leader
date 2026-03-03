import { describe, it, expect } from "bun:test";
import { normalize, parseTypes } from "./data";

describe("normalize", () => {
  it("trims and returns non-empty string", () => {
    expect(normalize("  hello  ")).toBe("hello");
  });

  it("returns null for empty string", () => {
    expect(normalize("")).toBeNull();
  });

  it("returns null for whitespace-only string", () => {
    expect(normalize("   ")).toBeNull();
  });

  it("returns null for null input", () => {
    expect(normalize(null)).toBeNull();
  });

  it("returns null for undefined input", () => {
    expect(normalize(undefined)).toBeNull();
  });

  it("preserves internal whitespace", () => {
    expect(normalize("  hello world  ")).toBe("hello world");
  });
});

describe("parseTypes", () => {
  it("parses valid JSON array of strings", () => {
    expect(parseTypes('["restaurant","bar"]')).toEqual(["restaurant", "bar"]);
  });

  it("returns empty array for null", () => {
    expect(parseTypes(null)).toEqual([]);
  });

  it("returns empty array for empty string", () => {
    expect(parseTypes("")).toEqual([]);
  });

  it("returns empty array for invalid JSON", () => {
    expect(parseTypes("not-json")).toEqual([]);
  });

  it("returns empty array for JSON object", () => {
    expect(parseTypes('{"key":"value"}')).toEqual([]);
  });

  it("filters out non-string items", () => {
    expect(parseTypes('[1, "valid", null, true]')).toEqual(["valid"]);
  });

  it("returns empty array for JSON number", () => {
    expect(parseTypes("42")).toEqual([]);
  });
});
