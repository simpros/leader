import { fileURLToPath } from "node:url";
import { migrate } from "drizzle-orm/bun-sql/migrator";
import { db } from "./client";

export const runMigrations = async () => {
  const migrationsFolder = fileURLToPath(
    new URL("../drizzle", import.meta.url)
  );
  await migrate(db, { migrationsFolder });
};
