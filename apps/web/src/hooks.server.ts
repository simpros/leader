import {
  error,
  isHttpError,
  isRedirect,
  redirect,
  type Handle,
} from "@sveltejs/kit";
import { sequence } from "@sveltejs/kit/hooks";
import { building } from "$app/environment";
import { svelteKitHandler } from "better-auth/svelte-kit";
import { auth } from "@leader/auth";
import { and, db, eq, runMigrations, schema, withRLS } from "@leader/db";
import { configureLogging, getLogger } from "@leader/logging";
import { ensureInitialUserWithOrganization } from "$lib/server/bootstrap";
import { randomUUIDv7 } from "bun";

if (!building) {
  await configureLogging();
  await runMigrations();
  await ensureInitialUserWithOrganization();
}

const logger = getLogger(["leader", "web"]);

const envContext = Object.freeze({
  service: "leader-web",
  version: process.env.npm_package_version ?? "unknown",
  commit_hash: process.env.COMMIT_SHA ?? "unknown",
  environment: process.env.NODE_ENV ?? "development",
});

const LOGIN_PATH = "/auth/login";
const LOGIN_ROUTE_ID = "/auth";
const AUTH_API_ROUTE_PREFIX = "/api/auth";
const ACCEPT_INVITATION_ROUTE_PREFIX = "/accept-invitation";
const SIGN_UP_PATH = "/api/auth/sign-up/email";

const getRequestLocale = (headers: Headers) => {
  const [locale] = headers.get("accept-language")?.split(",") ?? [];
  return locale?.trim() || "en-US";
};

const shouldAllowRequest = (event: Parameters<Handle>[0]["event"]) => {
  if (event.locals.session) {
    return true;
  }

  const routeId = event.route.id;
  const isAuthApi = routeId?.startsWith(AUTH_API_ROUTE_PREFIX) ?? false;
  const isStaticRoute = routeId === null;
  const isLoginPage = routeId?.startsWith(LOGIN_ROUTE_ID) ?? false;
  const isHealthCheck = routeId === "/health";
  const isAcceptInvitation =
    routeId?.startsWith(ACCEPT_INVITATION_ROUTE_PREFIX) ?? false;

  return (
    isAuthApi ||
    isLoginPage ||
    isStaticRoute ||
    isHealthCheck ||
    isAcceptInvitation
  );
};

const handleUnauthenticated = (event: Parameters<Handle>[0]["event"]) => {
  const acceptsHtml = event.request.headers
    .get("accept")
    ?.includes("text/html");

  if (acceptsHtml) {
    const redirectTo = `${event.url.pathname}${event.url.search}`;
    const url = new URL(LOGIN_PATH, event.url.origin);
    url.searchParams.set("redirectTo", redirectTo);
    throw redirect(303, url.toString());
  }

  return new Response("Unauthorized", { status: 401 });
};

const requestLocaleHandle: Handle = async ({ event, resolve }) => {
  event.locals.requestLocale = getRequestLocale(event.request.headers);

  return resolve(event);
};

const sessionHandle: Handle = async ({ event, resolve }) => {
  event.locals.db = async (callback) => {
    const organizationId = event.locals.session?.activeOrganizationId;

    if (!organizationId) {
      throw error(401, "Unauthorized");
    }

    return withRLS(organizationId, callback);
  };

  const session = await auth.api.getSession({
    headers: event.request.headers,
  });

  if (session) {
    event.locals.user = session.user;

    if (!session.session.activeOrganizationId) {
      const [firstMembership] = await db
        .select({ organizationId: schema.member.organizationId })
        .from(schema.member)
        .where(eq(schema.member.userId, session.user.id))
        .limit(1);

      if (firstMembership) {
        await auth.api.setActiveOrganization({
          headers: event.request.headers,
          body: { organizationId: firstMembership.organizationId },
        });
        event.locals.session = {
          ...session.session,
          activeOrganizationId: firstMembership.organizationId,
        };
      } else {
        event.locals.session = session.session;
      }
    } else {
      event.locals.session = session.session;
    }
  } else {
    event.locals.session = null;
    event.locals.user = null;
  }

  return resolve(event);
};

const signUpGuardHandle: Handle = async ({ event, resolve }) => {
  if (
    event.url.pathname === SIGN_UP_PATH &&
    event.request.method === "POST"
  ) {
    const cloned = event.request.clone();
    const body = await cloned.json().catch(() => null);
    const email = (body as Record<string, unknown> | null)?.email;

    if (typeof email === "string") {
      const [invitation] = await db
        .select({ id: schema.invitation.id })
        .from(schema.invitation)
        .where(
          and(
            eq(schema.invitation.email, email),
            eq(schema.invitation.status, "pending")
          )
        )
        .limit(1);

      if (!invitation) {
        return new Response(
          JSON.stringify({
            message: "Registration requires a valid invitation",
          }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }
    }
  }

  return resolve(event);
};

const permissionHandle: Handle = async ({ event, resolve }) => {
  if (!shouldAllowRequest(event)) {
    return handleUnauthenticated(event);
  }

  return svelteKitHandler({ event, resolve, auth, building });
};

const wideEventHandle: Handle = async ({ event, resolve }) => {
  const startTime = Date.now();
  const requestId =
    event.request.headers.get("x-request-id") || randomUUIDv7();

  const wideEvent: Record<string, unknown> = {
    request_id: requestId,
    method: event.request.method,
    path: event.url.pathname,
    route_id: event.route.id,
    ...envContext,
  };

  event.locals.requestId = requestId;
  event.locals.wideEvent = wideEvent;

  try {
    const response = await resolve(event);
    wideEvent.status_code = response.status;
    wideEvent.outcome = response.status < 400 ? "success" : "error";
    response.headers.set("x-request-id", requestId);
    return response;
  } catch (err) {
    if (isRedirect(err)) {
      wideEvent.status_code = err.status;
      wideEvent.outcome = "redirect";
      wideEvent.redirect_location = err.location;
    } else if (isHttpError(err)) {
      wideEvent.status_code = err.status;
      wideEvent.outcome = "error";
      wideEvent.error = { message: err.body.message };
    } else {
      wideEvent.status_code = 500;
      wideEvent.outcome = "error";
      wideEvent.error = {
        type: err instanceof Error ? err.name : "Unknown",
        message: err instanceof Error ? err.message : String(err),
      };
    }
    throw err;
  } finally {
    wideEvent.duration_ms = Date.now() - startTime;
    if (event.locals.user) {
      wideEvent.user_id = event.locals.user.id;
    }
    if (event.locals.session?.activeOrganizationId) {
      wideEvent.organization_id = event.locals.session.activeOrganizationId;
    }
    if (event.route.id !== "/health") {
      logger.info("request {method} {path} {status_code}", wideEvent);
    }
  }
};

export const handle = sequence(
  wideEventHandle,
  requestLocaleHandle,
  sessionHandle,
  signUpGuardHandle,
  permissionHandle
);
