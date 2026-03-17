import {
  expect,
  STORAGE_STATE_GUEST,
  test,
} from "./fixtures";

test.describe("Sign Up", () => {
  test.use({ storageState: STORAGE_STATE_GUEST });

  test("should display sign-up page with all form fields", async ({
    signUpPage,
  }) => {
    await signUpPage.goto();
    await expect(signUpPage.heading).toBeVisible();
    await expect(signUpPage.nameInput).toBeVisible();
    await expect(signUpPage.emailInput).toBeVisible();
    await expect(signUpPage.passwordInput).toBeVisible();
    await expect(signUpPage.confirmPasswordInput).toBeVisible();
    await expect(signUpPage.orgNameInput).toBeVisible();
    await expect(signUpPage.orgSlugInput).toBeVisible();
    await expect(signUpPage.createAccountButton).toBeVisible();
  });

  test("should have a sign-in link", async ({ signUpPage }) => {
    await signUpPage.goto();
    await expect(signUpPage.signInLink).toBeVisible();
    await expect(signUpPage.signInLink).toHaveAttribute("href", /\/auth\/login/);
  });

  test("should show sign-up link on login page", async ({ page }) => {
    await page.goto("/auth/login");
    const signUpLink = page.getByRole("link", { name: /create one/i });
    await expect(signUpLink).toBeVisible();
    await expect(signUpLink).toHaveAttribute("href", "/auth/sign-up");
  });

  test("should show organisation name and slug fields", async ({
    signUpPage,
  }) => {
    await signUpPage.goto();

    // Verify labels exist for org fields
    await expect(
      signUpPage.page.getByText("Organisation Name"),
    ).toBeVisible();
    await expect(
      signUpPage.page.getByText("Organisation Slug"),
    ).toBeVisible();
  });

  test("should register a new user with organisation", async ({
    signUpPage,
  }) => {
    await signUpPage.goto();

    const timestamp = Date.now();
    await signUpPage.nameInput.fill("E2E Signup User");
    await signUpPage.emailInput.fill(`signup-${timestamp}@e2e.local`);
    await signUpPage.passwordInput.fill("Test@123456");
    await signUpPage.confirmPasswordInput.fill("Test@123456");
    await signUpPage.orgNameInput.fill(`E2E Org ${timestamp}`);

    // Wait for slug to auto-derive, then verify
    await expect(signUpPage.orgSlugInput).toHaveValue(/e2e-org/);

    await signUpPage.createAccountButton.click();

    // Should redirect to the app after successful sign-up
    await signUpPage.page.waitForURL(
      (url) => !url.pathname.includes("/auth/"),
      { timeout: 15_000 },
    );
    await expect(signUpPage.page).not.toHaveURL(/auth/);
  });
});
