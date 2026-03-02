import { test as teardown } from "@playwright/test";
import { execSync } from "child_process";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const composeFile = join(__dirname, "../docker-compose.e2e.yml");

/**
 * Global teardown: stop and remove the database container.
 * In CI the database service is managed externally — Docker cleanup is skipped.
 */
teardown("global teardown", async () => {
  console.log("\n🧹 Starting E2E test teardown...\n");

  if (!process.env.CI) {
    console.log("🐳 Stopping e2e database container...");
    execSync(`docker compose -f ${composeFile} down -v`, {
      stdio: "inherit",
    });
    console.log("✅ Database container removed\n");
  } else {
    console.log("🐳 Running in CI — skipping Docker cleanup\n");
  }

  console.log("🎉 E2E test teardown complete!\n");
});
