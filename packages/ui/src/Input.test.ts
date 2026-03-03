import { describe, it, expect } from "bun:test";
import { render, screen } from "@testing-library/svelte";
import Input from "./Input.svelte";

describe("Input", () => {
  it("renders an input element", () => {
    render(Input);
    expect(screen.getByRole("textbox")).toBeTruthy();
  });

  it("has type=text by default", () => {
    render(Input);
    expect(screen.getByRole("textbox").getAttribute("type")).toBe("text");
  });

  it("can be disabled", () => {
    render(Input, { disabled: true });
    const input = screen.getByRole("textbox");
    expect(input.hasAttribute("disabled")).toBe(true);
  });

  it("accepts placeholder", () => {
    render(Input, { placeholder: "Enter text..." });
    expect(screen.getByPlaceholderText("Enter text...")).toBeTruthy();
  });

  it("applies size variant classes", () => {
    render(Input, { size: "sm" });
    const input = screen.getByRole("textbox");
    expect(input.className).toContain("h-8");
  });

  it("applies large size classes", () => {
    render(Input, { size: "lg" });
    const input = screen.getByRole("textbox");
    expect(input.className).toContain("h-12");
  });

  it("passes id attribute", () => {
    render(Input, { id: "my-input" });
    expect(document.getElementById("my-input")).toBeTruthy();
  });

  it("accepts name attribute", () => {
    render(Input, { name: "email" });
    const input = screen.getByRole("textbox");
    expect(input.getAttribute("name")).toBe("email");
  });
});
