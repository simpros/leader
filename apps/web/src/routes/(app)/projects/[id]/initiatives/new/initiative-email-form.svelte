<script lang="ts">
  import {
    createInitiativeEmail,
    getInitiativeCapabilities,
  } from "$lib/remote/initiatives.remote.js";
  import { Button, Input } from "@leader/ui";
  import EmailTemplateEditor from "$lib/components/email-template-editor.svelte";
  import AiDraftPanel from "$lib/components/initiative-ai-draft-panel.svelte";
  import TestEmailForm from "$lib/components/initiative-test-email-form.svelte";

  import type { Lead } from "$lib/leads/types";

  type InitiativeEmailFormProps = {
    projectId: string;
    leads?: Lead[];
    onSuccess: () => void;
  };

  let {
    projectId,
    leads = [],
    onSuccess,
  }: InitiativeEmailFormProps = $props();

  let errorMessage = $state("");
  let htmlBody = $state("");
  let subject = $state("");

  const capabilities = $derived(await getInitiativeCapabilities());
  const isSubmitting = $derived(createInitiativeEmail.pending > 0);

  const handleAiGenerated = (result: {
    subject: string;
    htmlBody: string;
  }) => {
    subject = result.subject;
    htmlBody = result.htmlBody;
  };

  const initiativeForm = createInitiativeEmail.enhance(
    async ({ submit }) => {
      errorMessage = "";

      try {
        await submit();
        onSuccess();
      } catch (error) {
        console.error(error);
        errorMessage = "Unable to create initiative. Try again.";
      }
    }
  );
</script>

<form class="space-y-4" {...initiativeForm}>
  <input
    {...createInitiativeEmail.fields.projectId.as("hidden", projectId)}
  />

  <label class="flex flex-col gap-2">
    <span class="text-sm font-semibold text-neutral-700"
      >Initiative Title</span
    >
    <Input
      placeholder="e.g. February outreach"
      {...createInitiativeEmail.fields.title.as("text")}
    />
  </label>

  <div class="flex items-center justify-between">
    <span class="text-sm font-semibold text-neutral-700">
      Email Template
    </span>
    <AiDraftPanel
      {projectId}
      aiGenerationAvailable={capabilities.aiGenerationAvailable}
      onGenerated={handleAiGenerated}
    />
  </div>

  <EmailTemplateEditor
    bind:value={htmlBody}
    name={createInitiativeEmail.fields.htmlBody.as("text").name}
    bind:subject
    subjectName={createInitiativeEmail.fields.subject.as("text").name}
    {projectId}
    {leads}
    placeholder="Start writing your email..."
  />

  {#if errorMessage}
    <p
      class="border-destructive-200 bg-destructive-50/90 text-destructive-700 rounded-xl border px-3 py-2 text-sm"
    >
      {errorMessage}
    </p>
  {/if}

  <div class="flex justify-end">
    <Button type="submit" disabled={isSubmitting}>
      {isSubmitting ? "Saving Draft..." : "Save as Draft"}
    </Button>
  </div>
</form>

<TestEmailForm {projectId} {subject} {htmlBody} {leads} />
