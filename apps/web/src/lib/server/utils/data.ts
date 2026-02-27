/**
 * Normalizes a string value by trimming whitespace.
 * Returns null for empty strings, null, or undefined values.
 */
export const normalize = (value?: string | null): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

/**
 * Parses a JSON string containing an array of strings.
 * Returns an empty array if parsing fails or if the value is not a valid array.
 */
export const parseTypes = (types: string | null): string[] => {
  if (!types) return [];

  try {
    const parsed = JSON.parse(types);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
};
