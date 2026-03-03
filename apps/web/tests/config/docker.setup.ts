import { execSync } from "child_process";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const composeFile = join(__dirname, "../docker-compose.e2e.yml");

/**
 * @deprecated Docker lifecycle is now managed directly in playwright.config.ts.
 *
 * Playwright 1.58+ runs plugins (including webServer) before globalSetup,
 * so Docker must start at config-load time. This file is kept for reference
 * but is no longer referenced by the Playwright config.
 */
export default async function dockerSetup(): Promise<void> {
  if (process.env.CI) {
    console.log("🐳 Running in CI — using service database\n");
    return;
  }

  console.log("🐳 Starting e2e database container...");
  execSync(`docker compose -f ${composeFile} down -v 2>/dev/null || true`, {
    stdio: "inherit",
  });
  execSync(`docker compose -f ${composeFile} up -d --wait`, {
    stdio: "inherit",
  });
  console.log("✅ Database container started\n");
}
