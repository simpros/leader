import { expect, test as setup } from "@playwright/test";
import type { Page } from "@playwright/test";
import { TEST_ADMIN, TEST_USER } from "./fixtures";
import { waitForHydration } from "./fixtures/utils";

const authDir = "tests/.auth";

async function loginAndSaveState(
  page: Page,
  email: string,
  password: string,
  path: string,
) {
  await page.goto("/auth/login");
  await waitForHydration(page);

  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();

  // Wait until we're no longer on the login page
  await page.waitForURL((url) => !url.pathname.includes("/auth/login"), {
    timeout: 15_000,
  });

  // Verify we have cookies
  const cookies = await page.context().cookies();
  expect(cookies.length).toBeGreaterThan(0);

  await page.context().storageState({ path });
}

setup("authenticate as user", async ({ page }) => {
  await loginAndSaveState(
    page,
    TEST_USER.email,
    TEST_USER.password,
    `${authDir}/user.json`,
  );
});

setup("authenticate as admin", async ({ page }) => {
  await loginAndSaveState(
    page,
    TEST_ADMIN.email,
    TEST_ADMIN.password,
    `${authDir}/admin.json`,
  );
});

setup("guest state", async ({ page }) => {
  await page.goto("/");
  await page.context().storageState({ path: `${authDir}/guest.json` });
});
