import { expect, STORAGE_STATE_USER, test } from "./fixtures";

test.describe("Leads", () => {
  test.use({ storageState: STORAGE_STATE_USER });

  test("should display leads page", async ({ leadsPage }) => {
    await leadsPage.goto();
    await expect(leadsPage.pageHeading).toBeVisible();
  });

  test("should show empty state or lead list", async ({ leadsPage }) => {
    await leadsPage.goto();

    const hasLeads = await leadsPage.leadCards
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
    const hasEmptyState = await leadsPage.page
      .getByText(/no leads yet/i)
      .isVisible({ timeout: 1_000 })
      .catch(() => false);

    expect(hasLeads || hasEmptyState).toBeTruthy();
  });

  test("should have add-lead button", async ({ leadsPage }) => {
    await leadsPage.goto();
    await expect(leadsPage.addLeadButton).toBeVisible();
  });
});
