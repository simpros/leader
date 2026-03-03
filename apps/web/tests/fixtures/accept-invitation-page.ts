import { type Locator, type Page } from "@playwright/test";
import { waitForHydration } from "./utils";

export class AcceptInvitationPage {
	readonly page: Page;

	readonly heading: Locator;
	readonly acceptButton: Locator;
	readonly declineButton: Locator;

	// Registration form (shown for unauthenticated users)
	readonly nameInput: Locator;
	readonly emailInput: Locator;
	readonly passwordInput: Locator;
	readonly confirmPasswordInput: Locator;
	readonly createAccountButton: Locator;

	readonly signInLink: Locator;

	constructor(page: Page) {
		this.page = page;

		this.heading = page.getByRole("heading", {
			name: /organisation invitation/i,
		});
		this.acceptButton = page.getByRole("button", { name: /^accept$/i });
		this.declineButton = page.getByRole("button", { name: /^decline$/i });

		// Registration form
		this.nameInput = page.locator("#reg-name");
		this.emailInput = page.locator("#reg-email");
		this.passwordInput = page.locator("#reg-password");
		this.confirmPasswordInput = page.locator("#reg-confirm-password");
		this.createAccountButton = page.getByRole("button", {
			name: /create account/i,
		});

		this.signInLink = page.getByRole("link", { name: /sign in/i });
	}

	async goto(invitationId: string) {
		await this.page.goto(`/accept-invitation/${invitationId}`);
		await waitForHydration(this.page);
	}
}
