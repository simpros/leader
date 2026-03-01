import { describe, it, expect } from "bun:test";
import {
  uniqueStrings,
  parseJsonContent,
  buildFallbackQueries,
} from "./utils";

describe("uniqueStrings", () => {
  it("removes duplicates", () => {
    expect(uniqueStrings(["a", "b", "a", "c"])).toEqual(["a", "b", "c"]);
  });

  it("returns empty array for empty input", () => {
    expect(uniqueStrings([])).toEqual([]);
  });

  it("preserves order of first occurrence", () => {
    expect(uniqueStrings(["c", "b", "a", "b"])).toEqual(["c", "b", "a"]);
  });
});

describe("parseJsonContent", () => {
  it("parses valid JSON with queries", () => {
    const result = parseJsonContent('{"queries":["restaurant","cafe"]}');
    expect(result).toEqual({ queries: ["restaurant", "cafe"] });
  });

  it("returns null for invalid JSON", () => {
    expect(parseJsonContent("not json")).toBeNull();
  });

  it("returns parsed object even without queries field", () => {
    const result = parseJsonContent('{"other":"value"}');
    expect(result).toEqual({ other: "value" });
  });
});

describe("buildFallbackQueries", () => {
  it("returns default queries when both args are empty", () => {
    const result = buildFallbackQueries("", "");
    expect(result).toContain("small business");
    expect(result.length).toBeGreaterThanOrEqual(3);
  });

  it("extracts customer segment from English idea", () => {
    const result = buildFallbackQueries("CRM tool for dental clinics", "");
    expect(result.some((q) => q.includes("dental clinics"))).toBe(true);
  });

  it("extracts customer segment from German idea", () => {
    const result = buildFallbackQueries("KI-Analysen für Fitnessstudios", "");
    expect(result.some((q) => q.includes("fitnessstudios"))).toBe(true);
  });

  it("generates keyword pairs from idea", () => {
    const result = buildFallbackQueries("boutique hotel management software", "");
    expect(result.length).toBeGreaterThan(0);
    // Should contain bigrams from the keywords
    expect(result.some((q) => q.includes("boutique"))).toBe(true);
  });

  it("uses website as fallback when no idea", () => {
    const result = buildFallbackQueries("", "example.com");
    expect(result.length).toBeGreaterThan(0);
  });

  it("returns unique queries only", () => {
    const result = buildFallbackQueries("for restaurants for restaurants", "");
    const uniqueResult = new Set(result);
    expect(result.length).toBe(uniqueResult.size);
  });

  it("extracts segment with 'to help' pattern", () => {
    const result = buildFallbackQueries("tool to help small bakeries", "");
    expect(result.some((q) => q.includes("small bakeries"))).toBe(true);
  });

  it("extracts segment with 'designed for' pattern", () => {
    const result = buildFallbackQueries("platform designed for yoga studios", "");
    expect(result.some((q) => q.includes("yoga studios"))).toBe(true);
  });
});
