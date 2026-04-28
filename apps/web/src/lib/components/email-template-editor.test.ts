import { describe, expect, it } from "bun:test";
import { render, screen, waitFor } from "@testing-library/svelte";

const { default: EmailTemplateEditor } =
  await import("./email-template-editor.svelte");

describe("EmailTemplateEditor", () => {
  it("syncs external value changes into the editor", async () => {
    const { container, rerender } = render(EmailTemplateEditor, {
      name: "htmlBody",
      value: "<p>Hello {{lead.name}}</p>",
    });

    await waitFor(() => {
      expect(
        document.querySelector(
          '[data-type="template-variable"][data-variable-id="lead.name"]'
        )
      ).toBeTruthy();

      const hiddenInput = container.querySelector(
        'input[type="hidden"][name="htmlBody"]'
      ) as HTMLInputElement | null;
      expect(hiddenInput?.value).toBe("<p>Hello {{lead.name}}</p>");
    });

    await rerender({
      name: "htmlBody",
      value: "<p>Hello {{lead.email}}</p>",
    });

    await waitFor(() => {
      expect(
        document.querySelector(
          '[data-type="template-variable"][data-variable-id="lead.email"]'
        )
      ).toBeTruthy();
      expect(
        document.querySelector(
          '[data-type="template-variable"][data-variable-id="lead.name"]'
        )
      ).toBeNull();

      const hiddenInput = container.querySelector(
        'input[type="hidden"][name="htmlBody"]'
      ) as HTMLInputElement | null;
      expect(hiddenInput?.value).toBe("<p>Hello {{lead.email}}</p>");
    });
  });

  it("renders a preview lead selector when leads are available", async () => {
    render(EmailTemplateEditor, {
      name: "htmlBody",
      value: "<p>Hello</p>",
      leads: [
        {
          id: "lead-1",
          placeId: "place-1",
          name: "Acme Corp",
          email: "hello@acme.com",
        },
      ],
    });

    await waitFor(() => {
      expect(screen.getByText("Preview lead")).toBeTruthy();
    });

    const previewSelect = screen.getByRole(
      "combobox"
    ) as HTMLSelectElement;
    expect(previewSelect.options).toHaveLength(2);
    expect(previewSelect.options[0]?.textContent).toBe("No preview");
    expect(previewSelect.options[1]?.textContent).toBe("Acme Corp");
  });

  it("updates external AI-style content when preview controls are present", async () => {
    const { container, rerender } = render(EmailTemplateEditor, {
      name: "htmlBody",
      value: "<p>Hello {{lead.name}}</p>",
      leads: [
        {
          id: "lead-1",
          placeId: "place-1",
          name: "Acme Corp",
          email: "hello@acme.com",
        },
      ],
    });

    await waitFor(() => {
      expect(screen.getByText("Preview lead")).toBeTruthy();
    });

    await rerender({
      name: "htmlBody",
      value: "<p>Hello {{lead.email}}</p>",
      leads: [
        {
          id: "lead-1",
          placeId: "place-1",
          name: "Acme Corp",
          email: "hello@acme.com",
        },
      ],
    });

    await waitFor(() => {
      const variable = document.querySelector(
        '[data-type="template-variable"][data-variable-id="lead.email"]'
      );

      expect(variable).toBeTruthy();

      const hiddenInput = container.querySelector(
        'input[type="hidden"][name="htmlBody"]'
      ) as HTMLInputElement | null;
      expect(hiddenInput?.value).toBe("<p>Hello {{lead.email}}</p>");
    });
  });

  it("updates external AI-style content while a preview lead is selected", async () => {
    const leads = [
      {
        id: "lead-1",
        placeId: "place-1",
        name: "Acme Corp",
        email: "hello@acme.com",
      },
    ];

    const { container, rerender } = render(EmailTemplateEditor, {
      name: "htmlBody",
      value: "<p>Hello {{lead.name}}</p>",
      leads,
    });

    await waitFor(() => {
      expect(screen.getByText("Preview lead")).toBeTruthy();
    });

    const previewSelect = screen.getByRole("combobox") as HTMLSelectElement;
    previewSelect.value = "lead-1";
    previewSelect.dispatchEvent(new Event("change", { bubbles: true }));

    await waitFor(() => {
      expect(previewSelect.value).toBe("lead-1");
    });

    await rerender({
      name: "htmlBody",
      value: "<p>Hello {{lead.email}}</p>",
      leads,
    });

    await waitFor(() => {
      const variable = document.querySelector(
        '[data-type="template-variable"][data-variable-id="lead.email"]'
      );

      expect(variable).toBeTruthy();

      const hiddenInput = container.querySelector(
        'input[type="hidden"][name="htmlBody"]'
      ) as HTMLInputElement | null;
      expect(hiddenInput?.value).toBe("<p>Hello {{lead.email}}</p>");
    });
  });

  it("warns when placeholders are missing for some leads", async () => {
    render(EmailTemplateEditor, {
      name: "htmlBody",
      value: "<p>Hi {{lead.email}}</p>",
      leads: [
        {
          id: "lead-1",
          placeId: "place-1",
          name: "Acme Corp",
          email: "hello@acme.com",
        },
        {
          id: "lead-2",
          placeId: "place-2",
          name: "Beta Inc",
          email: null,
        },
      ],
    });

    await waitFor(
      () => {
        expect(screen.getByText("Missing placeholder data")).toBeTruthy();
      },
      { timeout: 2000 }
    );

    const missingTokens = screen.getAllByText("{{lead.email}}");
    expect(missingTokens).toHaveLength(2);
    expect(screen.getByText(/empty for 1 of 2 leads/i)).toBeTruthy();
  });
});
