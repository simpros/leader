import { test as setup } from "@playwright/test";
import { execSync } from "child_process";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Project-based setup: run migrations and seed test data.
 * Docker is already running via config-level setup in playwright.config.ts.
 */
setup("global setup", async () => {
  console.log("\n🚀 Running E2E migrations & seeding...\n");

  const setupScript = join(__dirname, "setup-db.ts");
  execSync(`bun run ${setupScript}`, {
    stdio: "inherit",
    env: { ...process.env },
  });

  console.log("🎉 E2E test setup complete!\n");
});
