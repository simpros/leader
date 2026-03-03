import { test as teardown } from "@playwright/test";

/**
 * Project-based teardown (placeholder).
 * Docker cleanup is handled by config-level globalTeardown (docker.teardown.ts).
 */
teardown("global teardown", async () => {
  console.log("\n🧹 E2E test teardown complete.\n");
});
