import { execSync } from "child_process";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const composeFile = join(__dirname, "../docker-compose.e2e.yml");

/**
 * Config-level globalTeardown: stops Docker after all tests finish.
 * In CI the database service is managed externally — Docker cleanup is skipped.
 */
export default async function dockerTeardown(): Promise<void> {
  if (process.env.CI) {
    console.log("🐳 Running in CI — skipping Docker cleanup\n");
    return;
  }

  console.log("🐳 Stopping e2e database container...");
  execSync(`docker compose -f ${composeFile} down -v`, {
    stdio: "inherit",
  });
  console.log("✅ Database container removed\n");
}
