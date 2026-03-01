<script lang="ts">
  import { generateInitiativeEmail } from "$lib/remote/initiatives.remote.js";
  import { Button } from "@leader/ui";
  import { slide } from "svelte/transition";

  type AiDraftPanelProps = {
    projectId: string;
    aiGenerationAvailable: boolean;
    onGenerated: (result: { subject: string; htmlBody: string }) => void;
  };

  let { projectId, aiGenerationAvailable, onGenerated }: AiDraftPanelProps =
    $props();

  let showPanel = $state(false);
  let prompt = $state("");
  let errorMessage = $state("");

  const generating = $derived(generateInitiativeEmail.pending > 0);

  const handleGenerate = async () => {
    errorMessage = "";

    try {
      const result = await generateInitiativeEmail({
        projectId,
        prompt: prompt.trim(),
      });
      onGenerated(result);
      showPanel = false;
      prompt = "";
    } catch (err) {
      console.error(err);
      errorMessage = "Failed to generate email. Try again.";
    }
  };
</script>

<div class="flex items-center gap-2">
  {#if !aiGenerationAvailable}
    <span class="text-xs text-neutral-400">OPENROUTER_API_KEY not set</span>
  {/if}
  <Button
    type="button"
    variant="ghost"
    color="secondary"
    size="sm"
    disabled={!aiGenerationAvailable}
    onclick={() => (showPanel = !showPanel)}
  >
    {showPanel ? "Hide" : "✨ AI Draft"}
  </Button>
</div>

{#if showPanel}
  <div
    transition:slide={{ duration: 200 }}
    class="rounded-xl border border-neutral-200 bg-neutral-50 p-4"
  >
    <div class="flex flex-col gap-3">
      <label class="flex flex-col gap-1.5">
        <span class="text-sm font-medium text-neutral-700">
          Describe the email you want
        </span>
        <textarea
          bind:value={prompt}
          placeholder="e.g. A friendly introduction email offering our web design services, mentioning we noticed their website could use a refresh"
          rows="3"
          class="border-primary-200/70 focus-visible:border-primary-300 focus-visible:ring-primary-400/30 w-full rounded-xl border bg-white/90 px-3 py-2 text-sm text-neutral-900 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
        ></textarea>
      </label>
      <p class="text-xs text-neutral-500">
        The AI will use available lead placeholders like
        <code class="rounded bg-neutral-100 px-1 py-0.5 font-mono"
          >{"{{lead.name}}"}</code
        >
        in the generated email.
      </p>
      {#if errorMessage}
        <p
          class="border-destructive-200 bg-destructive-50/90 text-destructive-700 rounded-xl border px-3 py-2 text-sm"
        >
          {errorMessage}
        </p>
      {/if}
      <div class="flex justify-end">
        <Button
          type="button"
          size="sm"
          disabled={generating || !prompt.trim()}
          onclick={handleGenerate}
        >
          {generating ? "Generating..." : "Generate Email"}
        </Button>
      </div>
    </div>
  </div>
{/if}
