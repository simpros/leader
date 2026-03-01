<script lang="ts">
  import {
    updateInitiativeEmail,
    getInitiativeCapabilities,
  } from "$lib/remote/initiatives.remote.js";
  import { Button, Input } from "@leader/ui";
  import EmailTemplateEditor from "$lib/components/email-template-editor.svelte";
  import AiDraftPanel from "$lib/components/initiative-ai-draft-panel.svelte";
  import TestEmailForm from "$lib/components/initiative-test-email-form.svelte";

  import type { Lead } from "$lib/leads/types";

  type Initiative = {
    id: string;
    title: string;
    subject: string;
    htmlBody: string;
    status: string;
  };

  type InitiativeEditFormProps = {
    initiative: Initiative;
    projectId: string;
    leads?: Lead[];
    onSuccess: () => void;
  };

  let {
    initiative,
    projectId,
    leads = [],
    onSuccess,
  }: InitiativeEditFormProps = $props();

  let errorMessage = $state("");
  let htmlBody = $state(initiative.htmlBody);
  let subject = $state(initiative.subject);

  const capabilities = $derived(await getInitiativeCapabilities());
  const isSubmitting = $derived(updateInitiativeEmail.pending > 0);

  $effect(() => {
    updateInitiativeEmail.fields.set({
      initiativeId: initiative.id,
      title: initiative.title,
      subject: initiative.subject,
      htmlBody: initiative.htmlBody,
    });
  });

  const handleAiGenerated = (result: {
    subject: string;
    htmlBody: string;
  }) => {
    subject = result.subject;
    htmlBody = result.htmlBody;
  };

  const editForm = updateInitiativeEmail.enhance(async ({ submit }) => {
    errorMessage = "";

    try {
      await submit();
      onSuccess();
    } catch (error) {
      console.error(error);
      errorMessage = "Unable to update initiative. Try again.";
    }
  });
</script>

<form class="space-y-4" {...editForm}>
  <input
    {...updateInitiativeEmail.fields.initiativeId.as(
      "hidden",
      initiative.id
    )}
  />

  <label class="flex flex-col gap-2">
    <span class="text-sm font-semibold text-neutral-700"
      >Initiative Title</span
    >
    <Input
      placeholder="e.g. February outreach"
      {...updateInitiativeEmail.fields.title.as("text")}
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
    name={updateInitiativeEmail.fields.htmlBody.as("text").name}
    bind:subject
    subjectName={updateInitiativeEmail.fields.subject.as("text").name}
    {projectId}
    {leads}
    placeholder="<p>Hello,</p>

<p>Your message here...</p>

<p>Best regards</p>"
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
      {isSubmitting ? "Saving..." : "Save Changes"}
    </Button>
  </div>
</form>

<TestEmailForm {projectId} {subject} {htmlBody} {leads} />
