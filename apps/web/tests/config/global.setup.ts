import { test as setup } from "@playwright/test";
import { execSync } from "child_process";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const E2E_DATABASE_URL = "postgres://test:test@localhost:5433/e2e_test";

/**
 * Global setup: run migrations and seed test data via bun subprocess.
 * The E2E database container is started by the test:e2e script before Playwright.
 * We use bun to run setup-db.ts because @leader/db requires the bun runtime.
 */
setup("global setup", async () => {
  console.log("\n🚀 Starting E2E test setup...\n");

  const dbUrl = process.env.DATABASE_URL || E2E_DATABASE_URL;
  const setupScript = join(__dirname, "setup-db.ts");

  execSync(`bun run ${setupScript}`, {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: dbUrl },
  });

  console.log("🎉 E2E test setup complete!\n");
});
