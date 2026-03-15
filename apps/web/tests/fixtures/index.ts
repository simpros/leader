import { test as base, type Page } from "@playwright/test";
import { AcceptInvitationPage } from "./accept-invitation-page";
import { LeadsPage } from "./leads-page";
import { ProjectsPage } from "./projects-page";
import { SettingsPage } from "./settings-page";
import { SignUpPage } from "./sign-up-page";

export { waitForHydration } from "./utils";

// Test user credentials — seeded by global setup
export { TEST_USER, TEST_ADMIN, TEST_INVITATION, TEST_SECOND_ORG } from "./credentials";

// Storage state paths
export const STORAGE_STATE_USER = "tests/.auth/user.json";
export const STORAGE_STATE_ADMIN = "tests/.auth/admin.json";
export const STORAGE_STATE_GUEST = "tests/.auth/guest.json";

// Extended test with page-object fixtures
export const test = base.extend<{
  projectsPage: ProjectsPage;
  leadsPage: LeadsPage;
  settingsPage: SettingsPage;
  acceptInvitationPage: AcceptInvitationPage;
  signUpPage: SignUpPage;
}>({
  projectsPage: async ({ page }, use) => {
    await use(new ProjectsPage(page));
  },
  leadsPage: async ({ page }, use) => {
    await use(new LeadsPage(page));
  },
  settingsPage: async ({ page }, use) => {
    await use(new SettingsPage(page));
  },
  acceptInvitationPage: async ({ page }, use) => {
    await use(new AcceptInvitationPage(page));
  },
  signUpPage: async ({ page }, use) => {
    await use(new SignUpPage(page));
  },
});

export { expect } from "@playwright/test";

/**
 * Login helper for tests that need a fresh login.
 */
export async function loginAsUser(
  page: Page,
  email: string,
  password: string,
): Promise<void> {
  await page.goto("/auth/login");
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL(/(?!.*auth\/login).*/, { timeout: 10_000 });
}

/**
 * Logout by clearing cookies, then navigating to trigger redirect.
 */
export async function logout(page: Page): Promise<void> {
  await page.context().clearCookies();
  await page.goto("/");
  await page.waitForURL(/auth\/login/, { timeout: 5_000 });
}
