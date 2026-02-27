type EmailSource = "website" | "brave";

type EmailEnrichmentOptions = {
  website?: string | null;
  name?: string | null;
  location?: string | null;
  braveApiKey?: string | null;
};

type EmailEnrichmentResult = {
  email: string | null;
  source: EmailSource | null;
};

const EMAIL_REGEX = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;

const CONTACT_PATH_HINTS = [
  "contact",
  "about",
  "team",
  "support",
  "legal",
  "privacy",
  "terms",
];

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const normalizeWebsiteUrl = (value?: string | null) => {
  if (!value) {
    return null;
  }

  try {
    const parsed = new URL(
      value.startsWith("http") ? value : `https://${value}`
    );
    return parsed.href;
  } catch {
    return null;
  }
};

const fetchText = async (url: string, timeoutMs = 8000) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml",
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      return null;
    }

    return await response.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
};

const extractEmails = (text: string) => {
  const matches = text.match(EMAIL_REGEX) ?? [];
  const unique = Array.from(new Set(matches.map((value) => value.trim())));
  return unique.filter((value) => value.length <= 254);
};

const isLikelyBusinessEmail = (email: string) => {
  const lower = email.toLowerCase();
  const blockedPrefixes = ["noreply", "no-reply", "donotreply"];

  if (blockedPrefixes.some((prefix) => lower.startsWith(prefix))) {
    return false;
  }

  return true;
};

const pickBestEmail = (emails: string[]) => {
  if (!emails.length) {
    return null;
  }

  const filtered = emails.filter(isLikelyBusinessEmail);
  return filtered[0] ?? emails[0] ?? null;
};

const extractCandidateLinks = (html: string, baseUrl: string) => {
  const linkMatches = html.matchAll(/href\s*=\s*["']([^"']+)["']/gi);
  const links: string[] = [];

  for (const match of linkMatches) {
    const href = match[1];
    if (!href || href.startsWith("mailto:") || href.startsWith("tel:")) {
      continue;
    }

    try {
      const url = new URL(href, baseUrl);
      links.push(url.href);
    } catch {
      continue;
    }
  }

  const unique = Array.from(new Set(links));
  return unique.filter((link) => {
    try {
      const url = new URL(link);
      const base = new URL(baseUrl);
      if (url.hostname !== base.hostname) {
        return false;
      }

      const pathname = url.pathname.toLowerCase();
      return CONTACT_PATH_HINTS.some((hint) => pathname.includes(hint));
    } catch {
      return false;
    }
  });
};

const findEmailFromWebsite = async (website: string) => {
  const homepage = await fetchText(website);
  if (!homepage) {
    return null;
  }

  const homepageEmail = pickBestEmail(extractEmails(homepage));
  if (homepageEmail) {
    return homepageEmail;
  }

  const candidateLinks = extractCandidateLinks(homepage, website).slice(
    0,
    4
  );
  for (const link of candidateLinks) {
    const pageHtml = await fetchText(link);
    if (!pageHtml) {
      continue;
    }

    const email = pickBestEmail(extractEmails(pageHtml));
    if (email) {
      return email;
    }
  }

  return null;
};

const findEmailFromBrave = async (
  query: string,
  apiKey: string
): Promise<string | null> => {
  const endpoint = new URL(
    "https://api.search.brave.com/res/v1/web/search"
  );
  endpoint.searchParams.set("q", query);
  endpoint.searchParams.set("count", "5");

  const response = await fetch(endpoint, {
    headers: {
      "X-Subscription-Token": apiKey,
      "User-Agent": USER_AGENT,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as {
    web?: { results?: Array<{ title?: string; description?: string }> };
  };

  const results = data?.web?.results ?? [];
  const combined = results
    .map((result) => `${result.title ?? ""} ${result.description ?? ""}`)
    .join(" ");

  return pickBestEmail(extractEmails(combined));
};

export const enrichEmail = async ({
  website,
  name,
  location,
  braveApiKey,
}: EmailEnrichmentOptions): Promise<EmailEnrichmentResult> => {
  const normalizedWebsite = normalizeWebsiteUrl(website);
  if (normalizedWebsite) {
    const websiteEmail = await findEmailFromWebsite(normalizedWebsite);
    if (websiteEmail) {
      return { email: websiteEmail, source: "website" };
    }
  }

  const searchContext = [name, location]
    .filter(Boolean)
    .map((value) => value?.toString().trim())
    .filter(Boolean)
    .join(" ");

  if (braveApiKey && searchContext) {
    const braveEmail = await findEmailFromBrave(
      `${searchContext} email contact`,
      braveApiKey
    );
    if (braveEmail) {
      return { email: braveEmail, source: "brave" };
    }
  }

  return { email: null, source: null };
};
