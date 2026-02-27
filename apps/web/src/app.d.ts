// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { auth } from "@leader/auth";
import type { db } from "@leader/db";

type SessionData = typeof auth.$Infer.Session;
type DbTx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type TenantDb = <T>(callback: (tx: DbTx) => Promise<T>) => Promise<T>;

declare global {
  namespace App {
    // interface Error {}
    interface Locals {
      session: SessionData["session"] | null;
      user: SessionData["user"] | null;
      requestLocale: string;
      requestId: string;
      wideEvent: Record<string, unknown>;
      db: TenantDb;
    }
    // interface PageData {}
    // interface PageState {}
    // interface Platform {}
  }
}

export {};
