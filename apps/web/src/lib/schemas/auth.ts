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
