import { test as teardown } from "@playwright/test";

/**
 * Global teardown: cleanup after all tests.
 * Docker container is stopped by the test:e2e script after Playwright exits.
 */
teardown("global teardown", async () => {
  console.log("\n🧹 E2E test teardown complete.\n");
});
