/**
 * Mailpit API helper for E2E email assertions.
 *
 * Reads MAILPIT_API_URL from env (default: http://localhost:8025).
 * See https://mailpit.axllent.org/docs/api-v1/ for full API docs.
 */

const BASE_URL = process.env.MAILPIT_API_URL ?? "http://localhost:8025";

export interface MailpitMessage {
  ID: string;
  MessageID: string;
  From: { Name: string; Address: string };
  To: { Name: string; Address: string }[];
  Cc: { Name: string; Address: string }[];
  Bcc: { Name: string; Address: string }[];
  Subject: string;
  Snippet: string;
  Created: string;
  Size: number;
  Tags: string[];
}

export interface MailpitMessageDetail extends MailpitMessage {
  HTML: string;
  Text: string;
}

export interface MailpitSearchResult {
  total: number;
  count: number;
  start: number;
  messages: MailpitMessage[];
}

/**
 * Search messages in Mailpit using search query syntax.
 * Examples: "to:user@example.com", "subject:Verify", "from:noreply@example.com"
 * @see https://mailpit.axllent.org/docs/usage/search-filters/
 */
export async function searchMessages(
  query: string,
  options?: { limit?: number; retries?: number; retryDelay?: number },
): Promise<MailpitSearchResult> {
  const { limit = 50, retries = 10, retryDelay = 500 } = options ?? {};

  for (let attempt = 0; attempt <= retries; attempt++) {
    const url = `${BASE_URL}/api/v1/search?query=${encodeURIComponent(query)}&limit=${limit}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(
        `Mailpit search failed (${res.status}): ${await res.text()}`,
      );
    }

    const data = (await res.json()) as MailpitSearchResult;

    if (data.total > 0 || attempt === retries) {
      return data;
    }

    // Email delivery is async — wait and retry
    await new Promise((r) => setTimeout(r, retryDelay));
  }

  // unreachable, but satisfies TS
  return { total: 0, count: 0, start: 0, messages: [] };
}

/**
 * Get full message details including HTML and text body.
 */
export async function getMessage(
  id: string,
): Promise<MailpitMessageDetail> {
  const res = await fetch(`${BASE_URL}/api/v1/message/${id}`);
  if (!res.ok) {
    throw new Error(
      `Mailpit get message failed (${res.status}): ${await res.text()}`,
    );
  }
  return res.json() as Promise<MailpitMessageDetail>;
}

/**
 * Delete all messages in Mailpit. Use between tests to avoid interference.
 */
export async function deleteAllMessages(): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/v1/messages`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  if (!res.ok) {
    throw new Error(
      `Mailpit delete failed (${res.status}): ${await res.text()}`,
    );
  }
}
