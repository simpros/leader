import {
  buildFallbackQueries,
  parseJsonContent,
  uniqueStrings,
} from "./utils";

type OpenRouterOptions = {
  projectDescription: string;
  location: string;
  apiKey?: string | null;
  model?: string | null;
};

const getContentText = (content: unknown): string | null => {
  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    const text = content
      .map((part) => {
        if (part && typeof part === "object" && "text" in part) {
          const value = (part as { text?: unknown }).text;
          return typeof value === "string" ? value : "";
        }

        return "";
      })
      .join("\n")
      .trim();

    return text || null;
  }

  return null;
};

export const getOpenRouterAudienceQueries = async ({
  projectDescription,
  location,
  apiKey,
  model,
}: OpenRouterOptions) => {
  if (!apiKey) {
    return buildFallbackQueries(projectDescription, "");
  }

  const prompt = [
    "You are a B2B growth researcher helping find possible target audiences.",
    "Given a project description, identify business types that would buy or use it.",
    'Return JSON only in this format: {"queries":["audience 1","audience 2"]}.',
    "Provide 8-12 specific audience terms suitable for Google Places search.",
    'Use concrete business segments (for example "boutique gym", "dental clinic").',
    `Project description: ${projectDescription}`,
    location ? `Location focus: ${location}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model || "openai/gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    return buildFallbackQueries(projectDescription, "");
  }

  const data = await response.json();
  const content = getContentText(data?.choices?.[0]?.message?.content);
  if (!content) {
    return buildFallbackQueries(projectDescription, "");
  }

  const parsed = parseJsonContent(content);
  if (!parsed?.queries?.length) {
    return buildFallbackQueries(projectDescription, "");
  }

  return uniqueStrings(
    parsed.queries.map((query) => query.trim()).filter(Boolean)
  );
};
