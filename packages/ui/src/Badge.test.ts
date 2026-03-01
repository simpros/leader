import { describe, it, expect } from "bun:test";
import { render, screen } from "@testing-library/svelte";
import { createRawSnippet } from "svelte";
import Badge from "./Badge.svelte";

const textSnippet = (text: string) =>
  createRawSnippet(() => ({
    render: () => `<span>${text}</span>`,
  }));

describe("Badge", () => {
  it("renders a span element", () => {
    const { container } = render(Badge, { children: textSnippet("New") });
    const span = container.querySelector("span");
    expect(span).toBeTruthy();
  });

  it("renders children text", () => {
    render(Badge, { children: textSnippet("Draft") });
    expect(screen.getByText("Draft")).toBeTruthy();
  });

  it("applies soft variant by default", () => {
    const { container } = render(Badge, { children: textSnippet("Tag") });
    // soft + neutral is default → should contain neutral classes
    const outer = container.firstElementChild as HTMLElement;
    expect(outer.className).toContain("ring-1");
  });

  it("applies solid variant classes", () => {
    const { container } = render(Badge, {
      variant: "solid",
      tone: "neutral",
      children: textSnippet("Solid"),
    });
    const outer = container.firstElementChild as HTMLElement;
    expect(outer.className).toContain("bg-neutral-950");
  });

  it("applies accent tone", () => {
    const { container } = render(Badge, {
      variant: "solid",
      tone: "accent",
      children: textSnippet("Accent"),
    });
    const outer = container.firstElementChild as HTMLElement;
    expect(outer.className).toContain("bg-secondary-400");
  });

  it("applies success tone", () => {
    const { container } = render(Badge, {
      variant: "solid",
      tone: "success",
      children: textSnippet("Success"),
    });
    const outer = container.firstElementChild as HTMLElement;
    expect(outer.className).toContain("bg-emerald-700");
  });

  it("applies md size classes", () => {
    const { container } = render(Badge, {
      size: "md",
      children: textSnippet("MD"),
    });
    const outer = container.firstElementChild as HTMLElement;
    expect(outer.className).toContain("px-3");
  });
});
