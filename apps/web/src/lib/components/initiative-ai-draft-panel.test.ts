import { beforeEach, describe, expect, it, mock, spyOn } from "bun:test";
import { render, screen, waitFor } from "@testing-library/svelte";
import {
  createCommandMock,
  createFormMock,
  createQueryMock,
} from "../../test-helpers/sveltekit-mocks";

const mockGenerateInitiativeEmail = createCommandMock({
  subject: "Fresh idea for {{lead.name}}",
  htmlBody: "<p>Hello {{lead.name}}</p>",
});

mock.module("$lib/remote/initiatives.remote.js", () => ({
  generateInitiativeEmail: mockGenerateInitiativeEmail,
  sendInitiativeTestEmail: createFormMock(),
  getProjectInitiatives: createQueryMock([]),
  getInitiativeCapabilities: createQueryMock({
    aiGenerationAvailable: true,
  }),
  createInitiativeEmail: createFormMock(),
  updateInitiativeEmail: createFormMock(),
  sendInitiative: createFormMock(),
  retryInitiativeLead: createFormMock(),
  getInitiative: createQueryMock(null),
}));

mock.module("$app/server", () => ({
  query: (fn: (...args: unknown[]) => unknown) => fn,
  form: () => createFormMock(),
  command: () => createCommandMock(),
  getRequestEvent: () => ({}),
}));

const { default: AiDraftPanel } =
  await import("./initiative-ai-draft-panel.svelte");

describe("AiDraftPanel", () => {
  const click = (element: Element) => {
    if (element instanceof HTMLElement) {
      element.click();
      return;
    }

    element.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  };

  const animate = mock(() => ({
    finished: Promise.resolve(),
    cancel: () => {},
    finish: () => {},
    play: () => {},
    reverse: () => {},
    pause: () => {},
    commitStyles: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    currentTime: 0,
    playState: "finished",
  }));

  beforeEach(() => {
    animate.mockClear();
    Element.prototype.animate =
      animate as typeof Element.prototype.animate;

    mockGenerateInitiativeEmail.mockClear();
    mockGenerateInitiativeEmail.mockImplementation(() =>
      Promise.resolve({
        subject: "Fresh idea for {{lead.name}}",
        htmlBody: "<p>Hello {{lead.name}}</p>",
      })
    );
  });

  it("opens the draft panel from the trigger button", async () => {
    render(AiDraftPanel, {
      projectId: "project-1",
      aiGenerationAvailable: true,
      onGenerated: () => {},
    });

    click(screen.getByRole("button", { name: "✨ AI Draft" }));

    await waitFor(() => {
      expect(
        screen.getByText("Shape the draft before it writes")
      ).toBeTruthy();
      expect(screen.getByLabelText("Prompt")).toBeTruthy();
    });
  });

  it("applies a quick-start prompt to the textarea", async () => {
    render(AiDraftPanel, {
      projectId: "project-1",
      aiGenerationAvailable: true,
      onGenerated: () => {},
    });

    click(screen.getByRole("button", { name: "✨ AI Draft" }));

    await waitFor(() => {
      expect(screen.getByText("Warm intro")).toBeTruthy();
    });

    const warmIntroButton = screen
      .getByText("Warm intro")
      .closest("button");
    expect(warmIntroButton).toBeTruthy();

    click(warmIntroButton!);

    await waitFor(() => {
      expect(
        (screen.getByLabelText("Prompt") as HTMLTextAreaElement).value
      ).toBe(
        "Write a short first-touch outreach email that feels personal and approachable. Mention {{lead.name}} when it feels natural, focus on one clear pain point, and end with a low-pressure call to action."
      );
    });
  });

  it("sends the generated result and closes the panel", async () => {
    const onGenerated = mock(() => {});

    render(AiDraftPanel, {
      projectId: "project-1",
      aiGenerationAvailable: true,
      onGenerated,
    });

    click(screen.getByRole("button", { name: "✨ AI Draft" }));

    await waitFor(() => {
      expect(screen.getByLabelText("Prompt")).toBeTruthy();
    });

    const valueFirstButton = screen
      .getByText("Value-first")
      .closest("button");
    expect(valueFirstButton).toBeTruthy();

    click(valueFirstButton!);

    await waitFor(() => {
      expect(
        (
          screen.getByRole("button", {
            name: "Generate draft",
          }) as HTMLButtonElement
        ).disabled
      ).toBe(false);
    });

    click(screen.getByRole("button", { name: "Generate draft" }));

    await waitFor(() => {
      expect(mockGenerateInitiativeEmail).toHaveBeenCalledTimes(1);
    });

    expect(mockGenerateInitiativeEmail).toHaveBeenCalledWith({
      projectId: "project-1",
      prompt:
        "Write a concise outreach email that leads with one clear value proposition or outcome we can help with. Keep the tone confident and helpful, avoid sounding salesy, and invite a quick reply.",
    });
    expect(onGenerated).toHaveBeenCalledWith({
      subject: "Fresh idea for {{lead.name}}",
      htmlBody: "<p>Hello {{lead.name}}</p>",
    });

    await waitFor(() => {
      expect(
        screen
          .getByRole("button", { name: "✨ AI Draft" })
          .getAttribute("aria-expanded")
      ).toBe("false");
    });
  });

  it("shows an error when generation fails", async () => {
    const consoleSpy = spyOn(console, "error").mockImplementation(
      () => {}
    );
    mockGenerateInitiativeEmail.mockImplementation(() =>
      Promise.reject(new Error("AI unavailable"))
    );

    render(AiDraftPanel, {
      projectId: "project-1",
      aiGenerationAvailable: true,
      onGenerated: () => {},
    });

    click(screen.getByRole("button", { name: "✨ AI Draft" }));

    await waitFor(() => {
      expect(screen.getByLabelText("Prompt")).toBeTruthy();
    });

    const textarea = screen.getByLabelText(
      "Prompt"
    ) as HTMLTextAreaElement;
    textarea.value = "Write a direct outreach email for a busy founder.";
    textarea.dispatchEvent(new Event("input", { bubbles: true }));

    await waitFor(() => {
      expect(
        (
          screen.getByRole("button", {
            name: "Generate draft",
          }) as HTMLButtonElement
        ).disabled
      ).toBe(false);
    });

    click(screen.getByRole("button", { name: "Generate draft" }));

    await waitFor(() => {
      expect(screen.getByRole("alert").textContent).toContain(
        "Failed to generate email. Try refining the prompt and trying again."
      );
    });

    consoleSpy.mockRestore();
  });

  it("shows an unavailable helper when AI drafting is disabled", () => {
    render(AiDraftPanel, {
      projectId: "project-1",
      aiGenerationAvailable: false,
      onGenerated: () => {},
    });

    const trigger = screen.getByRole("button", { name: "✨ AI Draft" });

    expect((trigger as HTMLButtonElement).disabled).toBe(true);
    expect(
      screen.getByText(
        "AI drafting is unavailable until OpenRouter is configured."
      )
    ).toBeTruthy();
  });
});
