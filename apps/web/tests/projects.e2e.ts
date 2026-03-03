import { expect, STORAGE_STATE_USER, test } from "./fixtures";

test.describe("Projects", () => {
  test.use({ storageState: STORAGE_STATE_USER });

  test("should display projects page", async ({ projectsPage }) => {
    await projectsPage.goto();
    await expect(projectsPage.pageHeading).toBeVisible();
  });

  test("should show empty state or project list", async ({
    projectsPage,
  }) => {
    await projectsPage.goto();

    const hasProjects = await projectsPage.projectCards
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
    const hasEmptyState = await projectsPage.page
      .getByText(/no projects yet/i)
      .isVisible({ timeout: 1_000 })
      .catch(() => false);

    expect(hasProjects || hasEmptyState).toBeTruthy();
  });

  test("should navigate to project detail when clicking a project", async ({
    projectsPage,
  }) => {
    await projectsPage.goto();

    const firstProject = projectsPage.projectCards.first();
    if (await firstProject.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await firstProject.click();
      await expect(projectsPage.page).toHaveURL(/\/projects\/.+/);
    }
  });
});
