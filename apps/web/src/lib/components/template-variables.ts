import type { Lead } from "$lib/leads/types";

export type TemplateVariable = {
  token: string;
  label: string;
  group: string;
  description?: string;
};

export const CORE_LEAD_VARIABLES: TemplateVariable[] = [
  {
    token: "{{lead.name}}",
    label: "lead.name",
    group: "Lead fields",
    description: "Business name",
  },
  {
    token: "{{lead.email}}",
    label: "lead.email",
    group: "Lead fields",
    description: "Email address",
  },
  {
    token: "{{lead.phone}}",
    label: "lead.phone",
    group: "Lead fields",
    description: "Phone number",
  },
  {
    token: "{{lead.website}}",
    label: "lead.website",
    group: "Lead fields",
    description: "Website URL",
  },
  {
    token: "{{lead.address}}",
    label: "lead.address",
    group: "Lead fields",
    description: "Street address",
  },
  {
    token: "{{lead.rating}}",
    label: "lead.rating",
    group: "Lead fields",
    description: "Google rating",
  },
  {
    token: "{{lead.google_maps_url}}",
    label: "lead.google_maps_url",
    group: "Lead fields",
    description: "Google Maps link",
  },
];

export type CustomFieldValue = { name: string; value: string | null };

export type TemplateVariablePreview = {
  text: string;
  state: "raw" | "resolved" | "missing";
};

export function customFieldToken(fieldName: string): string {
  return `{{custom.${fieldName}}}`;
}

const CORE_LEAD_VALUE_ACCESSORS: Record<
  string,
  (lead: Lead) => string | null | undefined
> = {
  "{{lead.name}}": (lead) => lead.name,
  "{{lead.email}}": (lead) => lead.email,
  "{{lead.phone}}": (lead) => lead.phone,
  "{{lead.website}}": (lead) => lead.website,
  "{{lead.address}}": (lead) => lead.address,
  "{{lead.rating}}": (lead) =>
    lead.rating != null ? String(lead.rating) : null,
  "{{lead.google_maps_url}}": (lead) => lead.googleMapsUrl,
};

export function getTemplateVariablePreview(
  variableId: string,
  lead: Lead | null
): TemplateVariablePreview {
  const token = `{{${variableId}}}`;

  if (!lead) {
    return { text: token, state: "raw" };
  }

  const value = CORE_LEAD_VALUE_ACCESSORS[token]?.(lead)
    ?.toString()
    .trim();

  if (value) {
    return { text: value, state: "resolved" };
  }

  if (token in CORE_LEAD_VALUE_ACCESSORS) {
    return { text: token, state: "missing" };
  }

  return { text: token, state: "raw" };
}

export function resolveTemplate(
  html: string,
  lead: Lead,
  customFields: CustomFieldValue[]
): string {
  let result = html;

  for (const { token } of CORE_LEAD_VARIABLES) {
    result = result.replaceAll(
      token,
      CORE_LEAD_VALUE_ACCESSORS[token](lead) ?? ""
    );
  }

  for (const field of customFields) {
    result = result.replaceAll(
      customFieldToken(field.name),
      field.value ?? ""
    );
  }

  return result;
}

/**
 * Extracts all `{{...}}` placeholder tokens from text.
 */
export function extractPlaceholders(text: string): string[] {
  const matches = text.match(/\{\{[^}]+\}\}/g);
  return matches ? [...new Set(matches)] : [];
}

/**
 * For each placeholder used in the text, counts how many leads are missing a value.
 * Returns only placeholders that are missing for at least one lead.
 */
export function findMissingPlaceholders(
  text: string,
  leads: Lead[],
  customFields: { name: string }[]
): { token: string; missingCount: number }[] {
  if (leads.length === 0) return [];

  const tokens = extractPlaceholders(text);
  if (tokens.length === 0) return [];

  const knownTokens = new Set([
    ...Object.keys(CORE_LEAD_VALUE_ACCESSORS),
    ...customFields.map((f) => customFieldToken(f.name)),
  ]);

  const results: { token: string; missingCount: number }[] = [];

  for (const token of tokens) {
    const accessor = CORE_LEAD_VALUE_ACCESSORS[token];
    if (accessor) {
      const missing = leads.filter(
        (l) => !accessor(l)?.toString().trim()
      ).length;
      if (missing > 0) results.push({ token, missingCount: missing });
    } else if (knownTokens.has(token)) {
      // Custom fields — we don't have values client-side, skip
    } else {
      // Unknown placeholder — not in core or custom fields
      results.push({ token, missingCount: leads.length });
    }
  }

  return results;
}

/**
 * Returns all available template variables for a project,
 * combining core lead fields and custom fields into a single list.
 * Used by the editor toolbar dropdown and suggestion plugin.
 */
export function getAllTemplateVariables(
  customFields: { name: string }[]
): TemplateVariable[] {
  const customItems: TemplateVariable[] = customFields.map((f) => ({
    token: customFieldToken(f.name),
    label: `custom.${f.name}`,
    group: "Custom fields",
  }));

  return [...CORE_LEAD_VARIABLES, ...customItems];
}

export function highlightResolved(
  originalHtml: string,
  lead: Lead,
  customFields: CustomFieldValue[]
): string {
  const allTokens = [
    ...CORE_LEAD_VARIABLES.map((v) => v.token),
    ...customFields.map((f) => customFieldToken(f.name)),
  ];

  let result = originalHtml;

  for (const token of allTokens) {
    if (!result.includes(token)) continue;

    let value: string;
    if (token.startsWith("{{lead.")) {
      value = CORE_LEAD_VALUE_ACCESSORS[token]?.(lead) ?? "";
    } else {
      const fieldName = token.slice("{{custom.".length, -2);
      const field = customFields.find((f) => f.name === fieldName);
      value = field?.value ?? "";
    }

    const marked = value
      ? `<mark style="background-color:#fef08a;border-radius:2px;padding:0 2px;">${value}</mark>`
      : `<mark style="background-color:#fee2e2;border-radius:2px;padding:0 2px;color:#991b1b;">${token}</mark>`;

    result = result.replaceAll(token, marked);
  }

  return result;
}
