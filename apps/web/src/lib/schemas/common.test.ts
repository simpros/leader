import { describe, it, expect } from "bun:test";
import * as v from "valibot";
import { optionalStringSchema, optionalNumberSchema } from "./common";

describe("optionalStringSchema", () => {
  it("accepts a non-empty string", () => {
    const result = v.safeParse(optionalStringSchema, "hello");
    expect(result.success).toBe(true);
    if (result.success) expect(result.output).toBe("hello");
  });

  it("transforms empty string to undefined", () => {
    const result = v.safeParse(optionalStringSchema, "");
    expect(result.success).toBe(true);
    if (result.success) expect(result.output).toBeUndefined();
  });

  it("accepts undefined", () => {
    const result = v.safeParse(optionalStringSchema, undefined);
    expect(result.success).toBe(true);
    if (result.success) expect(result.output).toBeUndefined();
  });

  it("rejects non-string values", () => {
    const result = v.safeParse(optionalStringSchema, 123);
    expect(result.success).toBe(false);
  });
});

describe("optionalNumberSchema", () => {
  it("accepts a number", () => {
    const result = v.safeParse(optionalNumberSchema, 42);
    expect(result.success).toBe(true);
    if (result.success) expect(result.output).toBe(42);
  });

  it("accepts zero", () => {
    const result = v.safeParse(optionalNumberSchema, 0);
    expect(result.success).toBe(true);
    if (result.success) expect(result.output).toBe(0);
  });

  it("transforms empty string to undefined", () => {
    const result = v.safeParse(optionalNumberSchema, "");
    expect(result.success).toBe(true);
    if (result.success) expect(result.output).toBeUndefined();
  });

  it("accepts undefined", () => {
    const result = v.safeParse(optionalNumberSchema, undefined);
    expect(result.success).toBe(true);
    if (result.success) expect(result.output).toBeUndefined();
  });

  it("rejects non-empty strings", () => {
    const result = v.safeParse(optionalNumberSchema, "abc");
    expect(result.success).toBe(false);
  });
});
