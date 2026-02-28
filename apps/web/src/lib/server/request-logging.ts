import { getRequestEvent } from "$app/server";

/**
 * Merges additional context into the current request's wide event.
 * Call this at the top of remote functions to enrich the per-request log line
 * with action-specific metadata (function name, entity IDs, counts, etc.).
 */
export const addRequestLogContext = (
  context: Record<string, unknown>,
): void => {
  const { locals } = getRequestEvent();
  Object.assign(locals.wideEvent, context);
};
