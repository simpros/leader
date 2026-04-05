import { describe, it, expect } from "bun:test";
import { render, screen } from "@testing-library/svelte";
import { createRawSnippet } from "svelte";
import Button from "./button.svelte";

const textSnippet = (text: string) =>
  createRawSnippet(() => ({
    render: () => `<span>${text}</span>`,
  }));

describe("Button", () => {
  it("renders a button element", () => {
    render(Button);
    expect(screen.getByRole("button")).toBeTruthy();
  });

  it("renders with children text", () => {
    render(Button, { children: textSnippet("Click me") });
    expect(screen.getByText("Click me")).toBeTruthy();
  });

  it("has type=button by default", () => {
    render(Button);
    expect(screen.getByRole("button").getAttribute("type")).toBe("button");
  });

  it("accepts type=submit", () => {
    render(Button, { type: "submit" });
    expect(screen.getByRole("button").getAttribute("type")).toBe("submit");
  });

  it("can be disabled", () => {
    render(Button, { disabled: true });
    const btn = screen.getByRole("button");
    expect(btn.hasAttribute("disabled")).toBe(true);
  });

  it("applies size variant classes", () => {
    render(Button, { size: "sm" });
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("h-8");
  });

  it("applies large size classes", () => {
    render(Button, { size: "lg" });
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("h-12");
  });

  it("passes extra attributes to the button", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    render(Button, { "aria-label": "Test" } as any);
    expect(screen.getByRole("button").getAttribute("aria-label")).toBe(
      "Test"
    );
  });

  describe("loading prop", () => {
    it("renders a spinner when loading=true", () => {
      render(Button, { loading: true });
      const btn = screen.getByRole("button");
      expect(btn.querySelector(".animate-spin")).toBeTruthy();
    });

    it("renders children alongside the spinner when loading=true", () => {
      render(Button, { loading: true, children: textSnippet("Find") });
      expect(screen.getByText("Find")).toBeTruthy();
      const btn = screen.getByRole("button");
      expect(btn.querySelector(".animate-spin")).toBeTruthy();
    });

    it("disables the button when loading=true", () => {
      render(Button, { loading: true });
      expect(screen.getByRole("button").hasAttribute("disabled")).toBe(
        true
      );
    });

    it("does not render a spinner when loading=false", () => {
      render(Button, { loading: false });
      const btn = screen.getByRole("button");
      expect(btn.querySelector(".animate-spin")).toBeNull();
    });

    it("disables the button when both loading=true and disabled=true", () => {
      render(Button, { loading: true, disabled: true });
      expect(screen.getByRole("button").hasAttribute("disabled")).toBe(
        true
      );
    });
  });
});
