import { describe, it, expect } from "bun:test";
import { getContentText } from "./openrouter";

describe("getContentText", () => {
  it("returns string content directly", () => {
    expect(getContentText("hello world")).toBe("hello world");
  });

  it("returns null for null input", () => {
    expect(getContentText(null)).toBeNull();
  });

  it("returns null for undefined input", () => {
    expect(getContentText(undefined)).toBeNull();
  });

  it("returns null for number input", () => {
    expect(getContentText(42)).toBeNull();
  });

  it("returns null for plain object", () => {
    expect(getContentText({ key: "value" })).toBeNull();
  });

  it("extracts text from array of content parts", () => {
    const content = [{ text: "Hello" }, { text: "World" }];
    expect(getContentText(content)).toBe("Hello\nWorld");
  });

  it("skips non-text parts in array", () => {
    const content = [{ text: "Hello" }, { image: "url" }, { text: "World" }];
    expect(getContentText(content)).toBe("Hello\n\nWorld");
  });

  it("returns null for empty array", () => {
    expect(getContentText([])).toBeNull();
  });

  it("returns null for array with only non-text parts", () => {
    const content = [{ image: "url" }, { audio: "data" }];
    expect(getContentText(content)).toBeNull();
  });

  it("handles array with non-object elements", () => {
    const content = ["raw string", 42, null];
    expect(getContentText(content)).toBeNull();
  });

  it("trims whitespace from concatenated text", () => {
    const content = [{ text: "  Hello  " }, { text: "  World  " }];
    expect(getContentText(content)).toBe("Hello  \n  World");
  });

  it("returns empty string content as-is", () => {
    expect(getContentText("")).toBe("");
  });
});
