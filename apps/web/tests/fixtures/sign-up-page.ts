import { type Locator, type Page } from "@playwright/test";
import { waitForHydration } from "./utils";

export class SignUpPage {
  readonly page: Page;

  readonly heading: Locator;
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly orgNameInput: Locator;
  readonly orgSlugInput: Locator;
  readonly createAccountButton: Locator;
  readonly signInLink: Locator;

  constructor(page: Page) {
    this.page = page;

    this.heading = page.getByRole("heading", {
      name: /create an account/i,
    });
    this.nameInput = page.locator("#name");
    this.emailInput = page.locator("#email");
    this.passwordInput = page.locator("#password");
    this.confirmPasswordInput = page.locator("#confirm-password");
    this.orgNameInput = page.locator("#org-name");
    this.orgSlugInput = page.locator("#org-slug");
    this.createAccountButton = page.getByRole("button", {
      name: /create account/i,
    });
    this.signInLink = page.getByRole("link", { name: /sign in/i });
  }

  async goto() {
    await this.page.goto("/auth/sign-up");
    await waitForHydration(this.page);
  }
}
