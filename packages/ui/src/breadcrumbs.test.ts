import { describe, it, expect } from "bun:test";
import { render, screen } from "@testing-library/svelte";
import Breadcrumbs from "./breadcrumbs.svelte";

describe("Breadcrumbs", () => {
  it("renders a nav with breadcrumb label", () => {
    render(Breadcrumbs, { items: [{ label: "Home" }] });
    expect(screen.getByRole("navigation", { name: "Breadcrumb" })).toBeTruthy();
  });

  it("renders single item as current page", () => {
    render(Breadcrumbs, { items: [{ label: "Dashboard" }] });
    const item = screen.getByText("Dashboard");
    expect(item.getAttribute("aria-current")).toBe("page");
  });

  it("renders multiple items with links", () => {
    render(Breadcrumbs, {
      items: [
        { label: "Home", href: "/" },
        { label: "Projects", href: "/projects" },
        { label: "Detail" },
      ],
    });
    const homeLink = screen.getByText("Home");
    expect(homeLink.tagName.toLowerCase()).toBe("a");
    expect(homeLink.getAttribute("href")).toBe("/");

    const detailItem = screen.getByText("Detail");
    expect(detailItem.getAttribute("aria-current")).toBe("page");
  });

  it("renders separator between items", () => {
    const { container } = render(Breadcrumbs, {
      items: [
        { label: "A", href: "/a" },
        { label: "B" },
      ],
    });
    const separators = container.querySelectorAll('[aria-hidden="true"]');
    expect(separators.length).toBe(1);
    expect(separators[0]!.textContent).toBe("//");
  });

  it("last item is always a span, not a link", () => {
    render(Breadcrumbs, {
      items: [
        { label: "Home", href: "/" },
        { label: "Last", href: "/last" },
      ],
    });
    const last = screen.getByText("Last");
    expect(last.tagName.toLowerCase()).toBe("span");
  });
});
