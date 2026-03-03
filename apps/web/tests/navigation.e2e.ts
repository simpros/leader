import { expect, STORAGE_STATE_USER, test } from "./fixtures";

test.describe("Navigation", () => {
  test.use({ storageState: STORAGE_STATE_USER });

  test("should navigate to projects page", async ({ page }) => {
    await page.goto("/projects");
    await expect(page).toHaveURL("/projects");
  });

  test("should navigate to leads page", async ({ page }) => {
    await page.goto("/leads");
    await expect(page).toHaveURL("/leads");
  });

  test("should navigate to settings page", async ({ page }) => {
    await page.goto("/settings/profile");
    await expect(page).toHaveURL("/settings/profile");
  });

  test("should navigate to discover page", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL("/");
    await expect(page).not.toHaveURL(/auth\/login/);
  });

  test("should have working navigation links", async ({ page }) => {
    await page.goto("/");

    const nav = page.locator("nav, [role='navigation']");
    await expect(nav.first()).toBeVisible({ timeout: 5_000 });

    const projectsLink = page.getByRole("link", { name: /projects/i });
    if (await projectsLink.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await projectsLink.click();
      await expect(page).toHaveURL("/projects");
    }
  });
});
