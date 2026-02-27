import * as v from "valibot";

export const updateProfileSchema = v.object({
  name: v.pipe(
    v.string(),
    v.minLength(1, "Name is required"),
    v.maxLength(100, "Name is too long")
  ),
});

export const changePasswordSchema = v.pipe(
  v.object({
    currentPassword: v.pipe(
      v.string(),
      v.minLength(1, "Current password is required")
    ),
    newPassword: v.pipe(
      v.string(),
      v.minLength(8, "Password must be at least 8 characters")
    ),
    confirmPassword: v.pipe(
      v.string(),
      v.minLength(1, "Please confirm your new password")
    ),
  }),
  v.forward(
    v.check(
      (input) => input.newPassword === input.confirmPassword,
      "Passwords do not match"
    ),
    ["confirmPassword"]
  )
);

export const updateOrganisationSchema = v.object({
  name: v.pipe(
    v.string(),
    v.minLength(1, "Organisation name is required"),
    v.maxLength(100, "Name is too long")
  ),
  slug: v.pipe(
    v.string(),
    v.minLength(1, "Slug is required"),
    v.maxLength(100, "Slug is too long"),
    v.regex(
      /^[a-z0-9-]+$/,
      "Slug must contain only lowercase letters, numbers, and hyphens"
    )
  ),
});

export const inviteMemberSchema = v.object({
  email: v.pipe(v.string(), v.email("Please enter a valid email address")),
  role: v.picklist(["member", "admin"], "Please select a role"),
});
