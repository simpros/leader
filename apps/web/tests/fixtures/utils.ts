import type { Page } from "@playwright/test";

/**
 * Wait for SvelteKit hydration to complete.
 * Uses `domcontentloaded` + a body element wait instead of `networkidle`
 * which is fragile and explicitly discouraged by Playwright docs.
 */
export async function waitForHydration(page: Page): Promise<void> {
  await page.waitForLoadState("domcontentloaded");
  await page.locator("body").waitFor({ state: "visible" });
}
