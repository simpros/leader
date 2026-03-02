import { defineConfig, devices } from "@playwright/test";
import { execSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const composeFile = join(__dirname, "tests/docker-compose.e2e.yml");

const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;

/**
 * Start/stop the e2e database container at config-load time so it is ready
 * before Playwright boots the webServer plugin.
 *
 * Playwright 1.58+ runs plugins (including webServer) *before* globalSetup,
 * so Docker must be started here — not in a globalSetup file.
 */
if (!process.env.CI && !process.env.TEST_WORKER_INDEX) {
  console.log("🐳 Starting e2e database container...");
  execSync(`docker compose -f ${composeFile} down -v 2>/dev/null || true`, {
    stdio: "inherit",
  });
  execSync(`docker compose -f ${composeFile} up -d --wait`, {
    stdio: "inherit",
  });
  console.log("✅ Database container started\n");
}

export default defineConfig({
  globalTeardown: "./tests/config/docker.teardown.ts",
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 4 : undefined,
  reporter: [["html", { open: "never" }], ["list"]],
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    contextOptions: {
      reducedMotion: "reduce",
    },
  },
  projects: [
    {
      name: "setup",
      testMatch: /config\/global\.setup\.ts/,
      teardown: "teardown",
    },
    {
      name: "auth setup",
      testMatch: /auth\.setup\.ts/,
      dependencies: ["setup"],
    },
    {
      name: "teardown",
      testMatch: /config\/global\.teardown\.ts/,
    },
    {
      name: "chromium",
      testMatch: /\.e2e\.ts$/,
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["auth setup"],
    },
  ],
  webServer: {
    command: `bun run ${join(__dirname, "build/index.js")}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      PORT: String(PORT),
      ORIGIN: BASE_URL,
    },
  },
});
