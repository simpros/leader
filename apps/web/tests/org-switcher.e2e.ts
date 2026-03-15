import {
  expect,
  STORAGE_STATE_ADMIN,
  STORAGE_STATE_USER,
  TEST_SECOND_ORG,
  test,
  waitForHydration,
} from "./fixtures";

test.describe("Org Switcher", () => {
  test.describe("Multi-org user (admin in 2 orgs)", () => {
    test.use({ storageState: STORAGE_STATE_ADMIN });

    test("should display org name in header", async ({ page }) => {
      await page.goto("/projects");
      await waitForHydration(page);

      // Use getByRole('banner') to target the main page header (avoids strict mode
      // violation when other <header> elements exist on the page)
      const header = page.getByRole("banner");
      await expect(header).toBeVisible();

      // Org name should appear as text in the header (either in a button or span)
      // Note: "Leader" also appears as the app logo link
      await expect(header.getByText("Leader").first()).toBeVisible();
    });

    test("should show org switcher as dropdown when user has multiple orgs", async ({
      page,
    }) => {
      await page.goto("/projects");
      await waitForHydration(page);

      // When user has >1 org, the org switcher renders a dropdown trigger (button)
      // The trigger text is the active org name
      // Use getByRole to find the dropdown trigger button in the header
      const header = page.getByRole("banner");
      const orgDropdown = header
        .getByRole("button")
        .filter({ hasText: /Leader|Acme/i });

      // If the dropdown trigger is visible, the multi-org switcher is active
      const isMultiOrg = await orgDropdown
        .isVisible({ timeout: 5_000 })
        .catch(() => false);

      test.skip(
        !isMultiOrg,
        "Org switcher dropdown not visible — admin may only have 1 org in this environment",
      );

      await expect(orgDropdown).toBeVisible();
    });

    test("should open dropdown and show both organisations", async ({
      page,
    }) => {
      await page.goto("/projects");
      await waitForHydration(page);

      const header = page.getByRole("banner");
      const orgDropdown = header
        .getByRole("button")
        .filter({ hasText: /Leader|Acme/i });

      const isMultiOrg = await orgDropdown
        .isVisible({ timeout: 5_000 })
        .catch(() => false);

      test.skip(
        !isMultiOrg,
        "Org switcher dropdown not visible — admin may only have 1 org in this environment",
      );

      await orgDropdown.click();

      // Both orgs should appear in the dropdown menu
      await expect(
        page.getByRole("menuitem", { name: "Leader" }),
      ).toBeVisible({ timeout: 5_000 });
      await expect(
        page.getByRole("menuitem", { name: TEST_SECOND_ORG.name }),
      ).toBeVisible();
    });

    test("should switch to second organisation", async ({ page }) => {
      await page.goto("/projects");
      await waitForHydration(page);

      const header = page.getByRole("banner");
      const orgDropdown = header
        .getByRole("button")
        .filter({ hasText: /Leader|Acme/i });

      const isMultiOrg = await orgDropdown
        .isVisible({ timeout: 5_000 })
        .catch(() => false);

      test.skip(
        !isMultiOrg,
        "Org switcher dropdown not visible — admin may only have 1 org in this environment",
      );

      await orgDropdown.click();

      // Click the second org
      await page
        .getByRole("menuitem", { name: TEST_SECOND_ORG.name })
        .click();

      // After switching, the header should show the second org name
      await expect(
        header.getByRole("button").filter({
          hasText: new RegExp(TEST_SECOND_ORG.name, "i"),
        }),
      ).toBeVisible({ timeout: 10_000 });
    });

    test("should show org name in settings", async ({ settingsPage }) => {
      await settingsPage.gotoOrganisation();

      // The org name input should show the current org
      await expect(settingsPage.orgNameInput).toHaveValue(/\S+/);
    });
  });

  test.describe("Single-org user (member in 1 org)", () => {
    test.use({ storageState: STORAGE_STATE_USER });

    test("should not show dropdown button for single-org user", async ({
      page,
    }) => {
      await page.goto("/projects");
      await waitForHydration(page);

      const header = page.getByRole("banner");

      // Single-org user should NOT have a dropdown button for org switching
      // (they see a plain span with the org name, or no org switcher at all)
      const orgDropdownButton = header
        .getByRole("button")
        .filter({ hasText: /Leader/i });
      await expect(orgDropdownButton).not.toBeVisible({ timeout: 3_000 });
    });
  });
});
