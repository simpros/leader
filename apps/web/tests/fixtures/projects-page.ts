import { type Locator, type Page } from "@playwright/test";
import { waitForHydration } from "./utils";

export class ProjectsPage {
  readonly page: Page;
  readonly pageHeading: Locator;
  readonly projectCards: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageHeading = page.getByRole("heading", { name: "Your Projects" });
    this.projectCards = page.locator("a[href*='/projects/']");
  }

  async goto() {
    await this.page.goto("/projects");
    await waitForHydration(this.page);
  }

  async getProjectByName(name: string) {
    return this.projectCards.filter({ hasText: name });
  }
}
