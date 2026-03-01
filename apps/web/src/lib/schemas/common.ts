import * as v from "valibot";

const emptyStringToUndefined = v.transform((value: string) =>
  value === "" ? undefined : value
);

export const optionalStringSchema = v.optional(
  v.pipe(v.string(), emptyStringToUndefined)
);

export const optionalNumberSchema = v.optional(
  v.pipe(
    v.union([v.number(), v.literal("")]),
    v.transform((value) => (value === "" ? undefined : value))
  )
);
