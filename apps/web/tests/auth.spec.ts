import {
  expect,
  loginAsUser,
  STORAGE_STATE_ADMIN,
  STORAGE_STATE_GUEST,
  STORAGE_STATE_USER,
  test,
  TEST_USER,
} from "./fixtures";

test.describe("Authentication", () => {
  test.describe("Guest", () => {
    test.use({ storageState: STORAGE_STATE_GUEST });

    test("should display login page", async ({ page }) => {
      await page.goto("/auth/login");

      await expect(
        page.getByRole("heading", { name: /sign in/i }),
      ).toBeVisible();
      await expect(page.locator("#email")).toBeVisible();
      await expect(page.locator("#password")).toBeVisible();
      await expect(
        page.getByRole("button", { name: /sign in/i }),
      ).toBeVisible();
    });

    test("should redirect unauthenticated users to login", async ({
      page,
    }) => {
      await page.goto("/projects");
      await expect(page).toHaveURL(/auth\/login/);
    });

    test("should show error on invalid credentials", async ({ page }) => {
      await page.goto("/auth/login");
      await page.locator("#email").fill("invalid@example.com");
      await page.locator("#password").fill("wrongpassword");
      await page.getByRole("button", { name: /sign in/i }).click();

      await expect(
        page.getByText(/invalid email or password/i),
      ).toBeVisible({ timeout: 5_000 });
    });

    test("should login successfully with valid credentials", async ({
      page,
    }) => {
      await loginAsUser(page, TEST_USER.email, TEST_USER.password);
      await expect(page).not.toHaveURL(/auth\/login/);
    });
  });

  test.describe("Authenticated", () => {
    test.use({ storageState: STORAGE_STATE_USER });

    test("should stay logged in across navigation", async ({ page }) => {
      await page.goto("/projects");
      await expect(page).toHaveURL("/projects");

      await page.goto("/leads");
      await expect(page).toHaveURL("/leads");

      await expect(page).not.toHaveURL(/auth\/login/);
    });
  });
});
