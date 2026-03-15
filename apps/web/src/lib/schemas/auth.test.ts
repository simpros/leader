import { describe, it, expect } from "bun:test";
import * as v from "valibot";
import { registerSchema, signUpSchema } from "./auth";

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

describe("signUpSchema", () => {
	const validInput = {
		name: "Jane Doe",
		email: "jane@example.com",
		password: "password123",
		confirmPassword: "password123",
		orgName: "Acme Corp",
		orgSlug: "acme-corp",
	};

	it("accepts valid sign-up data", () => {
		const result = v.safeParse(signUpSchema, validInput);
		expect(result.success).toBe(true);
	});

	it("rejects empty name", () => {
		const result = v.safeParse(signUpSchema, { ...validInput, name: "" });
		expect(result.success).toBe(false);
	});

	it("rejects name over 100 chars", () => {
		const result = v.safeParse(signUpSchema, { ...validInput, name: "a".repeat(101) });
		expect(result.success).toBe(false);
	});

	it("rejects invalid email", () => {
		const result = v.safeParse(signUpSchema, { ...validInput, email: "not-email" });
		expect(result.success).toBe(false);
	});

	it("rejects short password", () => {
		const result = v.safeParse(signUpSchema, {
			...validInput,
			password: "short",
			confirmPassword: "short",
		});
		expect(result.success).toBe(false);
	});

	it("rejects mismatched passwords", () => {
		const result = v.safeParse(signUpSchema, {
			...validInput,
			confirmPassword: "different123",
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			const messages = result.issues.map((i) => i.message);
			expect(messages).toContain("Passwords do not match");
		}
	});

	it("rejects empty confirm password", () => {
		const result = v.safeParse(signUpSchema, { ...validInput, confirmPassword: "" });
		expect(result.success).toBe(false);
	});

	it("rejects empty org name", () => {
		const result = v.safeParse(signUpSchema, { ...validInput, orgName: "" });
		expect(result.success).toBe(false);
	});

	it("rejects org name over 100 chars", () => {
		const result = v.safeParse(signUpSchema, { ...validInput, orgName: "a".repeat(101) });
		expect(result.success).toBe(false);
	});

	it("rejects empty org slug", () => {
		const result = v.safeParse(signUpSchema, { ...validInput, orgSlug: "" });
		expect(result.success).toBe(false);
	});

	it("rejects slug with uppercase letters", () => {
		const result = v.safeParse(signUpSchema, { ...validInput, orgSlug: "Acme-Corp" });
		expect(result.success).toBe(false);
	});

	it("rejects slug with spaces", () => {
		const result = v.safeParse(signUpSchema, { ...validInput, orgSlug: "acme corp" });
		expect(result.success).toBe(false);
	});

	it("rejects slug with special characters", () => {
		const result = v.safeParse(signUpSchema, { ...validInput, orgSlug: "acme_corp!" });
		expect(result.success).toBe(false);
	});

	it("accepts slug with numbers and hyphens", () => {
		const result = v.safeParse(signUpSchema, { ...validInput, orgSlug: "acme-2-corp" });
		expect(result.success).toBe(true);
	});

	it("rejects slug over 100 chars", () => {
		const result = v.safeParse(signUpSchema, { ...validInput, orgSlug: "a".repeat(101) });
		expect(result.success).toBe(false);
	});
});
