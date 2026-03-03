import { type Locator, type Page } from "@playwright/test";
import { waitForHydration } from "./utils";

export class LeadsPage {
  readonly page: Page;
  readonly pageHeading: Locator;
  readonly addLeadButton: Locator;
  readonly leadCards: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageHeading = page.getByRole("heading", { name: "All Leads" });
    this.addLeadButton = page.getByRole("button", { name: /add lead/i });
    this.leadCards = page.locator("a[href*='/leads/']");
  }

  async goto() {
    await this.page.goto("/leads");
    await waitForHydration(this.page);
  }

  async getLeadByName(name: string) {
    return this.leadCards.filter({ hasText: name });
  }
}
