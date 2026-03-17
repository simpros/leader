import * as v from "valibot";

export const registerSchema = v.pipe(
	v.object({
		name: v.pipe(
			v.string(),
			v.minLength(1, "Name is required"),
			v.maxLength(100, "Name is too long")
		),
		password: v.pipe(
			v.string(),
			v.minLength(8, "Password must be at least 8 characters")
		),
		confirmPassword: v.pipe(
			v.string(),
			v.minLength(1, "Please confirm your password")
		),
	}),
	v.forward(
		v.check(
			(input) => input.password === input.confirmPassword,
			"Passwords do not match"
		),
		["confirmPassword"]
	)
);

export const signUpSchema = v.pipe(
	v.object({
		name: v.pipe(
			v.string(),
			v.minLength(1, "Name is required"),
			v.maxLength(100, "Name is too long")
		),
		email: v.pipe(
			v.string(),
			v.email("Please enter a valid email address")
		),
		password: v.pipe(
			v.string(),
			v.minLength(8, "Password must be at least 8 characters")
		),
		confirmPassword: v.pipe(
			v.string(),
			v.minLength(1, "Please confirm your password")
		),
		orgName: v.pipe(
			v.string(),
			v.minLength(1, "Organisation name is required"),
			v.maxLength(100, "Organisation name is too long")
		),
		orgSlug: v.pipe(
			v.string(),
			v.minLength(1, "Slug is required"),
			v.maxLength(100, "Slug is too long"),
			v.regex(
				/^[a-z0-9-]+$/,
				"Slug must contain only lowercase letters, numbers, and hyphens"
			)
		),
	}),
	v.forward(
		v.check(
			(input) => input.password === input.confirmPassword,
			"Passwords do not match"
		),
		["confirmPassword"]
	)
);
