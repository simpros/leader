import {
	expect,
	STORAGE_STATE_GUEST,
	STORAGE_STATE_USER,
	TEST_INVITATION,
	test,
} from "./fixtures";

test.describe("Accept Invitation", () => {
	test.describe("Guest (unauthenticated)", () => {
		test.use({ storageState: STORAGE_STATE_GUEST });

		test("should show invitation page with registration form", async ({
			acceptInvitationPage,
		}) => {
			await acceptInvitationPage.goto(TEST_INVITATION.id);
			await expect(acceptInvitationPage.heading).toBeVisible();
			await expect(acceptInvitationPage.nameInput).toBeVisible();
			await expect(acceptInvitationPage.emailInput).toHaveValue(
				TEST_INVITATION.email,
			);
			await expect(acceptInvitationPage.emailInput).toBeDisabled();
			await expect(acceptInvitationPage.passwordInput).toBeVisible();
			await expect(acceptInvitationPage.confirmPasswordInput).toBeVisible();
			await expect(acceptInvitationPage.createAccountButton).toBeVisible();
		});

		test("should show sign-in link for existing users", async ({
			acceptInvitationPage,
		}) => {
			await acceptInvitationPage.goto(TEST_INVITATION.id);
			await expect(acceptInvitationPage.signInLink).toBeVisible();
			await expect(acceptInvitationPage.signInLink).toHaveAttribute(
				"href",
				new RegExp(`/auth/login.*redirectTo.*${TEST_INVITATION.id}`),
			);
		});

		test("should show 404 for invalid invitation ID", async ({ page }) => {
			const response = await page.goto(
				"/accept-invitation/nonexistent-id-000",
			);
			expect(response?.status()).toBe(404);
		});
	});

	test.describe("Authenticated user", () => {
		test.use({ storageState: STORAGE_STATE_USER });

		test("should show accept and decline buttons", async ({
			acceptInvitationPage,
		}) => {
			await acceptInvitationPage.goto(TEST_INVITATION.id);
			await expect(acceptInvitationPage.heading).toBeVisible();
			await expect(acceptInvitationPage.acceptButton).toBeVisible();
			await expect(acceptInvitationPage.declineButton).toBeVisible();
		});

		test("should not show registration form", async ({
			acceptInvitationPage,
		}) => {
			await acceptInvitationPage.goto(TEST_INVITATION.id);
			await expect(acceptInvitationPage.nameInput).not.toBeVisible();
			await expect(acceptInvitationPage.createAccountButton).not.toBeVisible();
		});

		test("should display organisation name in invitation", async ({
			acceptInvitationPage,
		}) => {
			await acceptInvitationPage.goto(TEST_INVITATION.id);
			await expect(acceptInvitationPage.page.getByText("Leader")).toBeVisible();
		});
	});
});
