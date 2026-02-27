import { auth } from "@leader/auth";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ request }) => {
  return await auth.handler(request);
};

export const POST: RequestHandler = async ({ request }) => {
  return await auth.handler(request);
};
