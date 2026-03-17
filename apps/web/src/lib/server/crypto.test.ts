import { describe, it, expect } from "bun:test";

// getEncryptionKey is lazy — only reads the env var on first encrypt/decrypt call,
// so setting it after import (which is hoisted) but before tests is fine.
process.env.BETTER_AUTH_SECRET = "test-secret-for-smtp";

import { encrypt, decrypt } from "./crypto";

describe("encrypt", () => {
  it("returns a string with three colon-separated base64 parts", () => {
    const result = encrypt("hello");
    const parts = result.split(":");
    expect(parts).toHaveLength(3);
    for (const part of parts) {
      expect(() => Buffer.from(part, "base64")).not.toThrow();
    }
  });

  it("produces different ciphertexts for the same plaintext (random IV)", () => {
    const a = encrypt("same-input");
    const b = encrypt("same-input");
    expect(a).not.toBe(b);
  });

  it("handles empty string", () => {
    const result = encrypt("");
    expect(result.split(":")).toHaveLength(3);
  });

  it("handles unicode text", () => {
    const result = encrypt("héllo wörld 🌍");
    expect(result.split(":")).toHaveLength(3);
  });
});

describe("decrypt", () => {
  it("round-trips a simple string", () => {
    const plaintext = "my-smtp-password";
    const ciphertext = encrypt(plaintext);
    expect(decrypt(ciphertext)).toBe(plaintext);
  });

  it("round-trips an empty string", () => {
    const ciphertext = encrypt("");
    expect(decrypt(ciphertext)).toBe("");
  });

  it("round-trips unicode text", () => {
    const plaintext = "pässwörd-🔑";
    const ciphertext = encrypt(plaintext);
    expect(decrypt(ciphertext)).toBe(plaintext);
  });

  it("round-trips a long string", () => {
    const plaintext = "x".repeat(10_000);
    const ciphertext = encrypt(plaintext);
    expect(decrypt(ciphertext)).toBe(plaintext);
  });

  it("throws on invalid format (missing parts)", () => {
    expect(() => decrypt("onlyonepart")).toThrow("Invalid encrypted value format");
  });

  it("throws on invalid format (two parts)", () => {
    expect(() => decrypt("part1:part2")).toThrow("Invalid encrypted value format");
  });

  it("throws on invalid format (four parts)", () => {
    expect(() => decrypt("a:b:c:d")).toThrow("Invalid encrypted value format");
  });

  it("throws on tampered IV length", () => {
    const ciphertext = encrypt("test");
    const parts = ciphertext.split(":");
    parts[0] = Buffer.from("short").toString("base64");
    expect(() => decrypt(parts.join(":"))).toThrow("Invalid encrypted value format");
  });

  it("throws on tampered auth tag", () => {
    const ciphertext = encrypt("test");
    const parts = ciphertext.split(":");
    const tag = Buffer.from(parts[1], "base64");
    tag[0] = tag[0] ^ 0xff;
    parts[1] = tag.toString("base64");
    expect(() => decrypt(parts.join(":"))).toThrow();
  });

  it("throws on tampered ciphertext", () => {
    const ciphertext = encrypt("test");
    const parts = ciphertext.split(":");
    const enc = Buffer.from(parts[2], "base64");
    enc[0] = enc[0] ^ 0xff;
    parts[2] = enc.toString("base64");
    expect(() => decrypt(parts.join(":"))).toThrow();
  });
});
