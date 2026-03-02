import { test as setup } from "@playwright/test";
import { execSync } from "child_process";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const composeFile = join(__dirname, "../docker-compose.e2e.yml");

async function startDatabase(): Promise<void> {
  console.log("🐳 Starting e2e database container...");
  execSync(`docker compose -f ${composeFile} down -v 2>/dev/null || true`, {
    stdio: "inherit",
  });
  execSync(`docker compose -f ${composeFile} up -d --wait`, {
    stdio: "inherit",
  });
  console.log("✅ Database container started\n");
}

/**
 * Global setup: start database, run migrations, seed test data.
 * In CI the database service is provided externally — Docker is skipped.
 */
setup("global setup", async () => {
  console.log("\n🚀 Starting E2E test setup...\n");

  if (!process.env.CI) {
    await startDatabase();
  } else {
    console.log("🐳 Running in CI — using service database\n");
  }

  const setupScript = join(__dirname, "setup-db.ts");
  execSync(`bun run ${setupScript}`, {
    stdio: "inherit",
    env: { ...process.env },
  });

  console.log("🎉 E2E test setup complete!\n");
});
