import { SQL } from "bun";
import { drizzle } from "drizzle-orm/bun-sql";
import { sql } from "drizzle-orm";
import { relations } from "./relations";

const databaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@localhost:5432/leader";

export const sqlClient = new SQL(databaseUrl);
export const db = drizzle(databaseUrl, { schema: relations });

export type AppDatabase = typeof db;

export const withRLS = async <T>(
  organizationId: string,
  callback: (
    tx: Parameters<Parameters<typeof db.transaction>[0]>[0]
  ) => Promise<T>
) => {
  return await db.transaction(async (tx) => {
    try {
      await tx.execute(
        sql`select set_config('app.current_org_id', ${organizationId}, true)`
      );
      return await callback(tx);
    } finally {
      // Transaction automatically resets local config at the end when the 3rd parameter is true
    }
  });
};
