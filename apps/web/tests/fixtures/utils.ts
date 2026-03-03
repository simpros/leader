import type { Page } from "@playwright/test";

/**
 * Wait for SvelteKit hydration to complete.
 */
export async function waitForHydration(page: Page): Promise<void> {
  await page.waitForLoadState("networkidle");
}
