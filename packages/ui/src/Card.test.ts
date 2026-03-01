import { describe, it, expect } from "bun:test";
import { render, screen } from "@testing-library/svelte";
import { createRawSnippet } from "svelte";
import Card from "./Card.svelte";

const textSnippet = (text: string) =>
  createRawSnippet(() => ({
    render: () => `<span>${text}</span>`,
  }));

describe("Card", () => {
  it("renders a div element", () => {
    render(Card, { children: textSnippet("Content") });
    expect(screen.getByText("Content")).toBeTruthy();
  });

  it("applies flat variant by default", () => {
    const { container } = render(Card, { children: textSnippet("Test") });
    const div = container.querySelector("div");
    expect(div?.className).toContain("bg-surface");
  });

  it("applies glass variant classes", () => {
    const { container } = render(Card, {
      variant: "glass",
      children: textSnippet("Glass"),
    });
    const div = container.querySelector("div");
    expect(div?.className).toContain("backdrop-blur");
  });

  it("passes extra attributes", () => {
    const { container } = render(Card, {
      "data-testid": "my-card",
      children: textSnippet("Test"),
    } as any);
    expect(screen.getByTestId("my-card")).toBeTruthy();
  });
});
