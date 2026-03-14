import { expect, STORAGE_STATE_USER, test } from "./fixtures";

test.describe("Leads", () => {
  test.use({ storageState: STORAGE_STATE_USER });

  test("should display leads page", async ({ leadsPage }) => {
    await leadsPage.goto();
    await expect(leadsPage.pageHeading).toBeVisible();
  });

  test("should show empty state or lead list", async ({ leadsPage }) => {
    await leadsPage.goto();

    // Wait for the page to fully render, then assert one of the two states
    await expect(
      leadsPage.leadCards.first().or(leadsPage.page.getByText(/no leads/i)),
    ).toBeVisible();
  });

  test("should have add-lead button", async ({ leadsPage }) => {
    await leadsPage.goto();
    await expect(leadsPage.addLeadButton).toBeVisible();
  });
});
