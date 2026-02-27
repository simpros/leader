import * as v from "valibot";

export const optionalEmailSources = [
  "website",
  "brave",
] as const;

const emptyStringToUndefined = v.transform((value: string) =>
  value === "" ? undefined : value
);

export const optionalStringSchema = v.optional(
  v.pipe(v.string(), emptyStringToUndefined)
);

export const optionalEmailSourceSchema = v.optional(
  v.pipe(
    v.union([v.picklist(optionalEmailSources), v.literal("")]),
    v.transform((value) => (value === "" ? undefined : value))
  )
);

export const optionalNumberSchema = v.optional(
  v.pipe(
    v.union([v.number(), v.literal("")]),
    v.transform((value) => (value === "" ? undefined : value))
  )
);
