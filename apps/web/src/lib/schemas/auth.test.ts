import { describe, it, expect } from "bun:test";
import * as v from "valibot";
import { registerSchema } from "./auth";

describe("registerSchema", () => {
	it("accepts valid registration data", () => {
		const result = v.safeParse(registerSchema, {
			name: "John Doe",
			password: "password123",
			confirmPassword: "password123",
		});
		expect(result.success).toBe(true);
	});

	it("rejects empty name", () => {
		const result = v.safeParse(registerSchema, {
			name: "",
			password: "password123",
			confirmPassword: "password123",
		});
		expect(result.success).toBe(false);
	});

	it("rejects name over 100 chars", () => {
		const result = v.safeParse(registerSchema, {
			name: "a".repeat(101),
			password: "password123",
			confirmPassword: "password123",
		});
		expect(result.success).toBe(false);
	});

	it("rejects password shorter than 8 characters", () => {
		const result = v.safeParse(registerSchema, {
			name: "John",
			password: "short",
			confirmPassword: "short",
		});
		expect(result.success).toBe(false);
	});

	it("rejects mismatched passwords", () => {
		const result = v.safeParse(registerSchema, {
			name: "John",
			password: "password123",
			confirmPassword: "different123",
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			const messages = result.issues.map((i) => i.message);
			expect(messages).toContain("Passwords do not match");
		}
	});

	it("rejects empty confirm password", () => {
		const result = v.safeParse(registerSchema, {
			name: "John",
			password: "password123",
			confirmPassword: "",
		});
		expect(result.success).toBe(false);
	});

	it("accepts minimum length password", () => {
		const result = v.safeParse(registerSchema, {
			name: "J",
			password: "12345678",
			confirmPassword: "12345678",
		});
		expect(result.success).toBe(true);
	});
});
