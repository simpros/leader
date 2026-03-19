import { SpanStatusCode } from "@opentelemetry/api";
import type { Handle } from "@sveltejs/kit";
import { getRootServerSpan } from "$lib/server/telemetry";

// ── duck-type checks for SvelteKit thrown errors ────────────────────
// These avoid importing the runtime helpers from `@sveltejs/kit` which
// are not available under `--conditions browser` (used by the test
// runner).  The shapes match SvelteKit's internal Redirect / HttpError.

function isRedirectLike(
  err: unknown,
): err is { status: number; location: string } {
  if (
    typeof err !== "object" ||
    err === null ||
    !("status" in err) ||
    !("location" in err)
  )
    return false;
  const status = (err as Record<string, unknown>).status;
  return typeof status === "number" && status >= 300 && status < 400;
}

function isHttpErrorLike(
  err: unknown,
): err is { status: number; body: { message: string } } {
  return (
    typeof err === "object" &&
    err !== null &&
    "status" in err &&
    "body" in err &&
    typeof (err as Record<string, unknown>).status === "number" &&
    typeof (err as Record<string, unknown>).body === "object"
  );
}

/**
 * SvelteKit handle hook that enriches the root SERVER span (promoted by
 * {@link SvelteKitServerSpanProcessor} in telemetry.ts) with HTTP
 * semantic-convention attributes.
 *
 * This hook does **not** create its own span.  SvelteKit's built-in
 * tracing already wraps the handle chain in `sveltekit.handle.root`;
 * the SpanProcessor promotes that span to `SpanKind.SERVER` so
 * Dynatrace can map it to a service entity.  This hook adds the
 * request/response metadata that Dynatrace needs.
 */
export const tracingHandle: Handle = async ({ event, resolve }) => {
  const rootSpan = getRootServerSpan();

  if (rootSpan) {
    rootSpan.updateName(
      `${event.request.method} ${event.route.id ?? event.url.pathname}`,
    );
    rootSpan.setAttributes({
      "http.request.method": event.request.method,
      "url.path": event.url.pathname,
      "url.query": event.url.search,
      "url.scheme": event.url.protocol.replace(":", ""),
      "server.address": event.url.hostname,
      "user_agent.original":
        event.request.headers.get("user-agent") ?? undefined,
    });

    if (event.route.id != null) {
      rootSpan.setAttribute("http.route", event.route.id);
    }

    const port = parseInt(event.url.port, 10);
    if (port) rootSpan.setAttribute("server.port", port);
  }

  try {
    const response = await resolve(event);
    if (rootSpan) {
      rootSpan.setAttribute("http.response.status_code", response.status);
      if (response.status >= 500) {
        rootSpan.setStatus({ code: SpanStatusCode.ERROR });
      }
    }
    return response;
  } catch (err) {
    if (rootSpan) {
      if (isRedirectLike(err)) {
        rootSpan.setAttribute("http.response.status_code", err.status);
      } else if (isHttpErrorLike(err)) {
        rootSpan.setAttribute("http.response.status_code", err.status);
        if (err.status >= 500) {
          rootSpan.setStatus({
            code: SpanStatusCode.ERROR,
            message: err.body.message,
          });
        }
      } else {
        rootSpan.setAttribute("http.response.status_code", 500);
        rootSpan.setStatus({
          code: SpanStatusCode.ERROR,
          message: err instanceof Error ? err.message : String(err),
        });
      }
    }
    throw err;
  }
};
