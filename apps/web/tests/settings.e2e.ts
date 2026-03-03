import {
  expect,
  STORAGE_STATE_ADMIN,
  STORAGE_STATE_USER,
  TEST_INVITATION,
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
  });
});
