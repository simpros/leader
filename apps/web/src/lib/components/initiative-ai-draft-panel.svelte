<script lang="ts">
  import { tick } from "svelte";
  import { slide } from "svelte/transition";
  import { Button, Field } from "@leader/ui";
  import { generateInitiativeEmail } from "$lib/remote/initiatives.remote.js";

  const promptIdeas = [
    {
      label: "Warm intro",
      description: "Friendly first outreach with a low-pressure CTA.",
      prompt:
        "Write a short first-touch outreach email that feels personal and approachable. Mention {{lead.name}} when it feels natural, focus on one clear pain point, and end with a low-pressure call to action.",
    },
    {
      label: "Value-first",
      description: "Lead with one concrete outcome or business win.",
      prompt:
        "Write a concise outreach email that leads with one clear value proposition or outcome we can help with. Keep the tone confident and helpful, avoid sounding salesy, and invite a quick reply.",
    },
    {
      label: "Follow-up",
      description: "A brief nudge after no response to the first email.",
      prompt:
        "Write a short follow-up email for someone who did not reply to the first message. Keep it respectful, reference the original outreach indirectly, and offer one simple next step.",
    },
  ] as const;

  type AiDraftPanelProps = {
    projectId: string;
    aiGenerationAvailable: boolean;
    onGenerated: (result: { subject: string; htmlBody: string }) => void;
  };

  let {
    projectId,
    aiGenerationAvailable,
    onGenerated,
  }: AiDraftPanelProps = $props();

  let open = $state(false);
  let prompt = $state("");
  let errorMessage = $state("");
  let generating = $state(false);

  const hasPrompt = $derived(prompt.trim().length > 0);
  const getPanelId = () => `initiative-ai-draft-panel-${projectId}`;
  const getPromptFieldId = () => `${getPanelId()}-prompt`;

  const closeComposer = () => {
    errorMessage = "";
    open = false;
  };

  const toggleComposer = async () => {
    if (open) {
      closeComposer();
      return;
    }

    errorMessage = "";
    open = true;
    await tick();

    const promptField = document.getElementById(getPromptFieldId());
    if (promptField instanceof HTMLTextAreaElement) {
      promptField.focus();
    }
  };

  const applyPromptIdea = (nextPrompt: string) => {
    prompt = nextPrompt;
    errorMessage = "";
  };

  const handleGenerate = async () => {
    const trimmedPrompt = prompt.trim();

    if (generating || !trimmedPrompt) {
      return;
    }

    errorMessage = "";
    generating = true;

    try {
      const result = await generateInitiativeEmail({
        projectId,
        prompt: trimmedPrompt,
      });
      onGenerated(result);
      prompt = "";
      closeComposer();
    } catch (err) {
      console.error(err);
      errorMessage =
        "Failed to generate email. Try refining the prompt and trying again.";
    } finally {
      generating = false;
    }
  };
</script>

<div class="space-y-3">
  <div class="flex items-center justify-between gap-3">
    <span class="text-sm font-semibold text-neutral-700"
      >Email Template</span
    >
    <Button
      type="button"
      variant="outline"
      color="secondary"
      size="sm"
      disabled={!aiGenerationAvailable}
      aria-controls={getPanelId()}
      aria-expanded={open}
      className={open ? "bg-secondary-50" : ""}
      onclick={toggleComposer}
    >
      ✨ AI Draft
    </Button>
  </div>

  {#if !aiGenerationAvailable}
    <p class="text-xs text-neutral-500">
      AI drafting is unavailable until OpenRouter is configured.
    </p>
  {/if}

  {#if open}
    <section
      id={getPanelId()}
      aria-label="AI Draft"
      transition:slide={{ duration: 220 }}
      class="bg-surface overflow-hidden border-2 border-neutral-800"
    >
      <div class="bg-secondary-50 border-b-2 border-neutral-800 px-4 py-3">
        <div class="flex items-start justify-between gap-3">
          <div class="space-y-1">
            <p
              class="text-secondary-700 font-mono text-[11px] font-bold tracking-[0.2em] uppercase"
            >
              AI Draft
            </p>
            <h2 class="font-display text-lg font-bold text-neutral-950">
              Shape the draft before it writes
            </h2>
          </div>

          <button
            type="button"
            class="font-mono text-[11px] font-bold tracking-widest text-neutral-500 uppercase transition-colors hover:text-neutral-900 focus-visible:outline-none"
            onclick={closeComposer}
          >
            Close
          </button>
        </div>

        <p class="mt-2 max-w-2xl text-sm text-neutral-600">
          Guide the angle, tone, and goal. The AI will generate a subject
          line and email body you can still edit before saving.
        </p>
      </div>

      <div class="space-y-4 p-4">
        <div class="space-y-2">
          <p
            class="font-mono text-[11px] font-bold tracking-widest text-neutral-500 uppercase"
          >
            Quick starts
          </p>
          <div class="grid gap-2 sm:grid-cols-3">
            {#each promptIdeas as idea (idea.label)}
              <button
                type="button"
                class={[
                  "focus-visible:ring-secondary-400/40 border-2 border-neutral-800 p-3 text-left transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
                  prompt.trim() === idea.prompt
                    ? "bg-secondary-50"
                    : "bg-surface hover:bg-surface-hover active:bg-surface-active",
                ]}
                onclick={() => applyPromptIdea(idea.prompt)}
              >
                <span class="block text-sm font-semibold text-neutral-900">
                  {idea.label}
                </span>
                <span
                  class="mt-1 block text-xs leading-5 text-neutral-500"
                >
                  {idea.description}
                </span>
              </button>
            {/each}
          </div>
        </div>

        <Field.Field>
          <Field.Label for={getPromptFieldId()}>Prompt</Field.Label>
          <textarea
            id={getPromptFieldId()}
            bind:value={prompt}
            placeholder="Describe the audience, tone, problem to solve, and the kind of next step you want."
            rows="5"
            oninput={() => {
              if (errorMessage) {
                errorMessage = "";
              }
            }}
            class="bg-surface focus-visible:border-primary-600 focus-visible:ring-primary-400/40 min-h-36 w-full border-2 border-neutral-800 px-4 py-3 text-sm text-neutral-900 transition-all duration-100 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          ></textarea>
          <Field.Description class="leading-5">
            Mention what you want to offer, how direct the tone should
            feel, and any useful context. Placeholders like
            <code
              class="bg-neutral-100 px-1.5 py-0.5 font-mono text-[11px] text-neutral-700"
              >{"{{lead.name}}"}</code
            >
            and your custom lead fields can be used automatically when they fit.
          </Field.Description>
        </Field.Field>

        {#if errorMessage}
          <p
            role="alert"
            class="border-destructive-500 bg-destructive-50 text-destructive-700 border-2 px-4 py-3 text-sm"
          >
            {errorMessage}
          </p>
        {/if}

        <div
          class="flex flex-col gap-3 border-t-2 border-neutral-800 pt-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <p class="max-w-sm text-xs leading-5 text-neutral-500">
            Generating a draft will replace the current subject and email
            body in the editor.
          </p>

          <div class="flex flex-col-reverse gap-2 sm:flex-row">
            <Button
              type="button"
              variant="ghost"
              color="neutral"
              size="sm"
              onclick={closeComposer}
            >
              Close
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={generating || !hasPrompt}
              onclick={handleGenerate}
            >
              {generating ? "Generating draft..." : "Generate draft"}
            </Button>
          </div>
        </div>
      </div>
    </section>
  {/if}
</div>
