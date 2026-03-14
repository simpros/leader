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

    // Wait for the page to fully render, then assert one of the two states
    await expect(
      projectsPage.projectCards
        .first()
        .or(projectsPage.page.getByText(/no projects yet/i)),
    ).toBeVisible();
  });

  test("should navigate to project detail when clicking a project", async ({
    projectsPage,
  }) => {
    await projectsPage.goto();

    const firstProject = projectsPage.projectCards.first();
    // Only run this test when projects exist (seeded data includes a project)
    const visible = await firstProject
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
    test.skip(!visible, "No projects seeded — skipping detail navigation");

    await firstProject.click();
    await expect(projectsPage.page).toHaveURL(/\/projects\/.+/);
  });
});
