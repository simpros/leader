import { PostgreSqlContainer, type StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { drizzle } from "drizzle-orm/postgres-js";
import { sql } from "drizzle-orm";
import postgres from "postgres";
import { relations } from "../relations";

type TestDatabase = ReturnType<typeof drizzle<typeof relations>>;

let container: StartedPostgreSqlContainer | null = null;
let testDb: TestDatabase | null = null;
let sqlClient: ReturnType<typeof postgres> | null = null;

export async function setupTestDb(): Promise<{
  db: TestDatabase;
  connectionUri: string;
  container: StartedPostgreSqlContainer;
}> {
  container = await new PostgreSqlContainer("postgres:16-alpine").start();
  const connectionUri = container.getConnectionUri();
  sqlClient = postgres(connectionUri);
  testDb = drizzle({ client: sqlClient, schema: relations });

  // Run migrations by executing the raw SQL files
  const migrationsDir = new URL("../../drizzle", import.meta.url);
  const { readdirSync, readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const { fileURLToPath } = await import("node:url");

  const migrationsPath = fileURLToPath(migrationsDir);
  const migrationFolders = readdirSync(migrationsPath, {
    withFileTypes: true,
  })
    .filter((d) => d.isDirectory())
    .sort((a, b) => a.name.localeCompare(b.name));

  for (const folder of migrationFolders) {
    const sqlFile = join(migrationsPath, folder.name, "migration.sql");
    let migrationSql: string;
    try {
      migrationSql = readFileSync(sqlFile, "utf-8");
    } catch {
      continue; // Skip if migration file doesn't exist
    }

    const statements = migrationSql
      .split("--> statement-breakpoint")
      .map((s) => s.trim())
      .filter(Boolean);

    for (const stmt of statements) {
      await testDb.execute(sql.raw(stmt));
    }
  }

  return { db: testDb, connectionUri, container };
}

export async function teardownTestDb(): Promise<void> {
  if (sqlClient) {
    await sqlClient.end();
    sqlClient = null;
  }
  if (container) {
    await container.stop();
    container = null;
    testDb = null;
  }
}

export function getTestDb(): TestDatabase {
  if (!testDb) {
    throw new Error(
      "Test database not initialized. Call setupTestDb() first."
    );
  }
  return testDb;
}
