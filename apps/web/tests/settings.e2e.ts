import {
  expect,
  STORAGE_STATE_ADMIN,
  STORAGE_STATE_USER,
  TEST_INVITATION,
  TEST_USER,
  test,
} from "./fixtures";

test.describe("Settings", () => {
  test.describe("Profile", () => {
    test.use({ storageState: STORAGE_STATE_USER });

    test("should display profile settings", async ({ settingsPage }) => {
      await settingsPage.gotoProfile();
      await expect(settingsPage.profileNameInput).toBeVisible();
      await expect(settingsPage.profileEmailInput).toBeVisible();
    });

    test("should show current user name", async ({ settingsPage }) => {
      await settingsPage.gotoProfile();
      await expect(settingsPage.profileNameInput).toHaveValue(/\S+/);
    });

    test("should show password change form", async ({ settingsPage }) => {
      await settingsPage.gotoProfile();
      await expect(settingsPage.currentPasswordInput).toBeVisible();
      await expect(settingsPage.newPasswordInput).toBeVisible();
      await expect(settingsPage.confirmPasswordInput).toBeVisible();
      await expect(settingsPage.changePasswordButton).toBeVisible();
    });

    test("should update profile name", async ({ settingsPage }) => {
      await settingsPage.gotoProfile();

      const updatedName = `Test User ${Date.now()}`;
      await settingsPage.profileNameInput.fill(updatedName);
      await settingsPage.profileSaveButton.click();

      // Verify success feedback
      await expect(
        settingsPage.page.getByText(/profile updated/i),
      ).toBeVisible({ timeout: 5_000 });

      // Reload and verify persistence
      await settingsPage.gotoProfile();
      await expect(settingsPage.profileNameInput).toHaveValue(updatedName);

      // Restore original name
      await settingsPage.profileNameInput.fill(TEST_USER.name);
      await settingsPage.profileSaveButton.click();
      await expect(
        settingsPage.page.getByText(/profile updated/i),
      ).toBeVisible({ timeout: 5_000 });
    });
  });

  test.describe("Organisation (Admin)", () => {
    test.use({ storageState: STORAGE_STATE_ADMIN });

    test("should display organisation settings", async ({ settingsPage }) => {
      await settingsPage.gotoOrganisation();
      await expect(settingsPage.orgNameInput).toBeVisible();
      await expect(settingsPage.orgSlugInput).toBeVisible();
    });

    test("should show invite member form", async ({ settingsPage }) => {
      await settingsPage.gotoOrganisation();
      await expect(settingsPage.inviteEmailInput).toBeVisible();
      await expect(settingsPage.sendInvitationButton).toBeVisible();
    });

    test("should show pending invitations section", async ({
      settingsPage,
    }) => {
      await settingsPage.gotoOrganisation();
      await expect(settingsPage.pendingInvitationsHeading).toBeVisible();
    });

    test("should display seeded invitation in table", async ({
      settingsPage,
    }) => {
      await settingsPage.gotoOrganisation();
      await expect(
        settingsPage.invitationsTable.getByText(TEST_INVITATION.email),
      ).toBeVisible();
    });

    test("should show resend and cancel buttons for invitation", async ({
      settingsPage,
    }) => {
      await settingsPage.gotoOrganisation();
      const row = settingsPage.invitationsTable.getByRole("row", {
        name: new RegExp(TEST_INVITATION.email),
      });
      await expect(
        row.getByRole("button", { name: /resend/i }),
      ).toBeVisible();
      await expect(
        row.getByRole("button", { name: /cancel/i }),
      ).toBeVisible();
    });

    test("should update organisation name", async ({ settingsPage }) => {
      await settingsPage.gotoOrganisation();

      const originalName = await settingsPage.orgNameInput.inputValue();
      const updatedName = `Leader ${Date.now()}`;

      await settingsPage.orgNameInput.fill(updatedName);
      await settingsPage.orgSaveButton.click();

      // Verify success feedback
      await expect(
        settingsPage.page.getByText(/organisation updated/i),
      ).toBeVisible({ timeout: 5_000 });

      // Reload and verify persistence
      await settingsPage.gotoOrganisation();
      await expect(settingsPage.orgNameInput).toHaveValue(updatedName);

      // Restore original name
      await settingsPage.orgNameInput.fill(originalName);
      await settingsPage.orgSaveButton.click();
      await expect(
        settingsPage.page.getByText(/organisation updated/i),
      ).toBeVisible({ timeout: 5_000 });
    });
  });
});
