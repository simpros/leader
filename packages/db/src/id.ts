import { nanoid } from "nanoid";
import * as v from "valibot";

export const ID_PREFIX = {
  project: "prj",
  lead: "led",
  projectLead: "pld",
  projectCustomField: "pcf",
  leadCustomFieldValue: "lcv",
  initiative: "ini",
  initiativeLead: "inl",
  initiativeConversation: "inc",
  organizationSmtpConfig: "osc",
} as const;

export type IdKind = keyof typeof ID_PREFIX;
export type IdPrefix = (typeof ID_PREFIX)[IdKind];

export type Id<Kind extends IdKind> =
  `${(typeof ID_PREFIX)[Kind]}_${string}`;

export const generateId = <Kind extends IdKind>(kind: Kind): Id<Kind> => {
  return `${ID_PREFIX[kind]}_${nanoid(16)}`;
};

export const isId = <Kind extends IdKind>(
  value: string,
  kind: Kind
): value is Id<Kind> => {
  const prefix = ID_PREFIX[kind];
  return (
    value.startsWith(`${prefix}_`) && value.length > prefix.length + 1
  );
};

export const idSchema = <Kind extends IdKind>(kind: Kind) =>
  v.pipe(
    v.string(),
    v.check((value) => isId(value, kind), `Invalid ${kind} id`),
    v.transform((value) => value as Id<Kind>)
  );

export const projectIdSchema = idSchema("project");
export const leadIdSchema = idSchema("lead");
export const projectLeadIdSchema = idSchema("projectLead");
export const projectCustomFieldIdSchema = idSchema("projectCustomField");
export const leadCustomFieldValueIdSchema = idSchema(
  "leadCustomFieldValue"
);
export const initiativeIdSchema = idSchema("initiative");
export const initiativeLeadIdSchema = idSchema("initiativeLead");
export const initiativeConversationIdSchema = idSchema(
  "initiativeConversation"
);
export const organizationSmtpConfigIdSchema = idSchema(
  "organizationSmtpConfig"
);
