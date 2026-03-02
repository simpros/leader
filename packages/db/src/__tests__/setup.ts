import { PostgreSqlContainer, type StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { Wait } from "testcontainers";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { SQL } from "bun";
import { drizzle } from "drizzle-orm/bun-sql";
import { relations } from "../relations";

// Auto-detect Docker socket for alternative runtimes (Rancher Desktop, Colima)
if (!process.env.DOCKER_HOST) {
  const home = homedir();
  const sockets = [
    join(home, ".rd", "docker.sock"),
    join(home, ".colima", "default", "docker.sock"),
  ];
  for (const sock of sockets) {
    if (existsSync(sock)) {
      process.env.DOCKER_HOST = `unix://${sock}`;
      break;
    }
  }
}

// Disable Ryuk — its log-stream wait strategy is incompatible with Bun's
// streaming implementation on non-default Docker runtimes.
process.env.TESTCONTAINERS_RYUK_DISABLED ??= "true";

type TestDatabase = ReturnType<typeof drizzle<typeof relations>>;

let container: StartedPostgreSqlContainer | null = null;
let testDb: TestDatabase | null = null;
let sqlClient: InstanceType<typeof SQL> | null = null;

export async function setupTestDb(): Promise<{
  db: TestDatabase;
  connectionUri: string;
  container: StartedPostgreSqlContainer;
}> {
  // Custom wait strategy: the default forListeningPorts() includes an
  // internal-port exec check that hangs under Bun + VM-based Docker runtimes.
  // Log message ×2 ensures PG completes its init/restart cycle; the health
  // check (pg_isready) adds a Docker-level readiness gate that also gives the
  // host port mapping time to stabilise.
  container = await new PostgreSqlContainer("postgres:16-alpine")
    .withWaitStrategy(
      Wait.forAll([
        Wait.forLogMessage(/database system is ready to accept connections/, 2),
        Wait.forHealthCheck(),
      ])
    )
    .start();
  const connectionUri = container.getConnectionUri();

  // Retry connection — host port forwarding may lag behind the container
  // readiness signals on VM-based Docker runtimes (Rancher Desktop, Colima).
  for (let attempt = 0; ; attempt++) {
    try {
      sqlClient = new SQL(connectionUri);
      await sqlClient.unsafe("SELECT 1");
      break;
    } catch {
      sqlClient?.close();
      sqlClient = null;
      if (attempt >= 4) throw new Error("Could not connect to test database after 5 attempts");
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  // Run migrations using the raw SQL client. Drizzle's bun-sql adapter in
  // beta drops the connection when initialised with a relations schema before
  // the referenced tables exist.
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
      continue;
    }

    const statements = migrationSql
      .split("--> statement-breakpoint")
      .map((s) => s.trim())
      .filter(Boolean);

    for (const stmt of statements) {
      await sqlClient.unsafe(stmt);
    }
  }

  // Now that tables exist, create the typed drizzle instance with relations
  testDb = drizzle({ client: sqlClient, schema: relations });

  return { db: testDb, connectionUri, container };
}

export async function teardownTestDb(): Promise<void> {
  if (sqlClient) {
    sqlClient.close();
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
