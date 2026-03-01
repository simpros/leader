import { type Locator, type Page } from "@playwright/test";
import { waitForHydration } from "./utils";

export class SettingsPage {
  readonly page: Page;

  // Profile
  readonly profileNameInput: Locator;
  readonly profileEmailInput: Locator;
  readonly profileSaveButton: Locator;

  // Password
  readonly currentPasswordInput: Locator;
  readonly newPasswordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly changePasswordButton: Locator;

  // Organisation
  readonly orgNameInput: Locator;
  readonly orgSlugInput: Locator;
  readonly orgSaveButton: Locator;
  readonly inviteEmailInput: Locator;
  readonly sendInvitationButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Profile
    this.profileNameInput = page.locator("#profile-name");
    this.profileEmailInput = page.locator("#profile-email");
    this.profileSaveButton = page
      .locator("form")
      .filter({ has: page.locator("#profile-name") })
      .getByRole("button", { name: /save/i });

    // Password
    this.currentPasswordInput = page.locator("#current-password");
    this.newPasswordInput = page.locator("#new-password");
    this.confirmPasswordInput = page.locator("#confirm-password");
    this.changePasswordButton = page.getByRole("button", {
      name: /change password/i,
    });

    // Organisation
    this.orgNameInput = page.locator("#org-name");
    this.orgSlugInput = page.locator("#org-slug");
    this.orgSaveButton = page
      .locator("form")
      .filter({ has: page.locator("#org-name") })
      .getByRole("button", { name: /save/i });
    this.inviteEmailInput = page.locator("#invite-email");
    this.sendInvitationButton = page.getByRole("button", {
      name: /send invitation/i,
    });
  }

  async gotoProfile() {
    await this.page.goto("/settings/profile");
    await waitForHydration(this.page);
  }

  async gotoOrganisation() {
    await this.page.goto("/settings/organisation");
    await waitForHydration(this.page);
  }
}
