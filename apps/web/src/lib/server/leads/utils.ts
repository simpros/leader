const truncate = (value: string, max: number) =>
  value.length > max ? `${value.slice(0, max)}...` : value;

export const uniqueStrings = (values: string[]) =>
  Array.from(new Set(values));

export const parseJsonContent = (content: string) => {
  try {
    return JSON.parse(content) as { queries?: string[] };
  } catch {
    return null;
  }
};

const STOP_WORDS = new Set([
  // English
  "a",
  "an",
  "the",
  "and",
  "or",
  "but",
  "is",
  "are",
  "was",
  "were",
  "to",
  "of",
  "in",
  "on",
  "at",
  "by",
  "my",
  "our",
  "your",
  "their",
  "this",
  "that",
  "with",
  "from",
  "as",
  "it",
  "its",
  "for",
  "not",
  "all",
  // German
  "ein",
  "eine",
  "einer",
  "einem",
  "einen",
  "der",
  "die",
  "das",
  "den",
  "dem",
  "des",
  "und",
  "oder",
  "aber",
  "ist",
  "sind",
  "war",
  "wird",
  "zum",
  "zur",
  "von",
  "aus",
  "auf",
  "mit",
  "für",
  "als",
  "bei",
  "nach",
  "über",
  "unter",
  "vor",
  "wir",
  "ich",
  "sie",
  "uns",
  "ihr",
  "mein",
  "dein",
  "sein",
  "ihre",
  "diese",
  "jede",
  "alle",
  "nicht",
  "auch",
  "noch",
  "nur",
  "sehr",
]);

/**
 * Try to extract the target customer/business type from a product idea.
 * E.g. "AI analytics for boutique gyms" → "boutique gyms"
 *      "CRM tool to help dental clinics" → "dental clinics"
 *      "KI-Analysen für Fitnessstudios" → "Fitnessstudios"
 */
const extractCustomerSegment = (idea: string): string | null => {
  const lower = idea.toLowerCase();
  const patterns = [
    // English
    /\bfor\s+(.+)/i,
    /\bto\s+help\s+(.+)/i,
    /\btargeting\s+(.+)/i,
    /\bserving\s+(.+)/i,
    /\baimed\s+at\s+(.+)/i,
    /\bdesigned\s+for\s+(.+)/i,
    /\bbuilt\s+for\s+(.+)/i,
    // German
    /\bfür\s+(.+)/i,
    /\bum\s+(.+?)\s+zu\s+helfen/i,
    /\bausgerichtet\s+auf\s+(.+)/i,
    /\bgedacht\s+für\s+(.+)/i,
    /\bgebaut\s+für\s+(.+)/i,
    /\bentwickelt\s+für\s+(.+)/i,
  ];

  for (const pattern of patterns) {
    const match = lower.match(pattern);
    if (match?.[1]) {
      const cleaned = match[1]
        .replace(
          /\b(in|that|who|which|near|around|based in|welche|welcher|nahe|rund um)\b.*/i,
          ""
        )
        .trim();
      if (cleaned.length >= 3) {
        return cleaned;
      }
    }
  }

  return null;
};

/**
 * Split an idea into meaningful shorter keyword chunks for Places search.
 * Uses Unicode-aware word splitting to support German (umlauts, ß) and other languages.
 */
const extractKeywords = (text: string): string[] => {
  const words = text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));

  const results: string[] = [];
  for (let i = 0; i < words.length - 1; i++) {
    results.push(`${words[i]} ${words[i + 1]}`);
  }
  return results;
};

export const buildFallbackQueries = (idea: string, website: string) => {
  const base = idea || website;
  if (!base) {
    return [
      "small business",
      "local agency",
      "professional services firm",
      "startup office",
      "consulting company",
    ];
  }

  const queries: string[] = [];

  const segment = idea ? extractCustomerSegment(idea) : null;
  if (segment) {
    queries.push(segment);
    queries.push(`${segment} near me`);
  }

  const keywords = extractKeywords(base);
  for (const kw of keywords.slice(0, 4)) {
    queries.push(kw);
  }

  if (queries.length < 3) {
    const normalized = truncate(base, 80);
    queries.push(normalized);
    queries.push(`${normalized} company`);
    queries.push(`${normalized} services`);
  }

  return uniqueStrings(queries.filter(Boolean));
};
