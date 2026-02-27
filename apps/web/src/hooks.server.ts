import { error, redirect, type Handle } from "@sveltejs/kit";
import { sequence } from "@sveltejs/kit/hooks";
import { building } from "$app/environment";
import { svelteKitHandler } from "better-auth/svelte-kit";
import { auth } from "@leader/auth";
import { db, eq, runMigrations, schema, withRLS } from "@leader/db";

if (!building) {
  await runMigrations();
}

const LOGIN_PATH = "/auth/login";
const LOGIN_ROUTE_ID = "/auth";
const AUTH_API_ROUTE_PREFIX = "/api/auth";

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

  return isAuthApi || isLoginPage || isStaticRoute;
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

const permissionHandle: Handle = async ({ event, resolve }) => {
  if (!shouldAllowRequest(event)) {
    return handleUnauthenticated(event);
  }

  return svelteKitHandler({ event, resolve, auth, building });
};

export const handle = sequence(
  requestLocaleHandle,
  sessionHandle,
  permissionHandle
);
