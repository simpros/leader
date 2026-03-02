import { defineConfig, devices } from "@playwright/test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
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
