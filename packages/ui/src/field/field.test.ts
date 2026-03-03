import { describe, it, expect } from "bun:test";
import { render, screen } from "@testing-library/svelte";
import { createRawSnippet } from "svelte";
import Field from "./Field.svelte";
import Label from "./Label.svelte";
import ErrorComp from "./Error.svelte";
import Description from "./Description.svelte";
import Group from "./Group.svelte";

const textSnippet = (text: string) =>
  createRawSnippet(() => ({
    render: () => `<span>${text}</span>`,
  }));

describe("Field", () => {
  it("renders with role=group", () => {
    render(Field, { children: textSnippet("Content") });
    expect(screen.getByRole("group")).toBeTruthy();
  });

  it("applies vertical orientation by default", () => {
    render(Field, { children: textSnippet("V") });
    const group = screen.getByRole("group");
    expect(group.className).toContain("flex-col");
  });

  it("applies horizontal orientation", () => {
    render(Field, {
      orientation: "horizontal",
      children: textSnippet("H"),
    });
    const group = screen.getByRole("group");
    expect(group.className).toContain("flex-row");
  });
});

describe("Label", () => {
  it("renders a label element", () => {
    const { container } = render(Label, { children: textSnippet("Email") });
    const label = container.querySelector("label");
    expect(label).toBeTruthy();
    expect(label!.textContent).toContain("Email");
  });

  it("passes for attribute", () => {
    const { container } = render(Label, {
      for: "email-input",
      children: textSnippet("Email"),
    });
    const label = container.querySelector("label");
    expect(label!.getAttribute("for")).toBe("email-input");
  });
});

describe("Error", () => {
  it("renders error text in a paragraph", () => {
    const { container } = render(ErrorComp, {
      children: textSnippet("Required field"),
    });
    const p = container.querySelector("p");
    expect(p).toBeTruthy();
    expect(p!.textContent).toContain("Required field");
  });

  it("applies destructive styling", () => {
    const { container } = render(ErrorComp, {
      children: textSnippet("Error"),
    });
    const p = container.querySelector("p");
    expect(p!.className).toContain("destructive");
  });
});

describe("Description", () => {
  it("renders description text", () => {
    const { container } = render(Description, {
      children: textSnippet("Help text"),
    });
    const p = container.querySelector("p");
    expect(p).toBeTruthy();
    expect(p!.textContent).toContain("Help text");
  });

  it("applies neutral styling", () => {
    const { container } = render(Description, {
      children: textSnippet("Info"),
    });
    const p = container.querySelector("p");
    expect(p!.className).toContain("text-neutral-500");
  });
});

describe("Group", () => {
  it("renders children in a div", () => {
    const { container } = render(Group, {
      children: textSnippet("Group content"),
    });
    expect(container.querySelector("div")).toBeTruthy();
    expect(screen.getByText("Group content")).toBeTruthy();
  });

  it("applies spacing class", () => {
    const { container } = render(Group, {
      children: textSnippet("Spaced"),
    });
    const div = container.querySelector("div");
    expect(div!.className).toContain("space-y-3");
  });
});
