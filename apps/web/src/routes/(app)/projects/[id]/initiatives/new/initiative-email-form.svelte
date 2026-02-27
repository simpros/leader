<script lang="ts">
  import {
    createInitiativeEmail,
    generateInitiativeEmail,
    getInitiativeCapabilities,
    sendInitiativeTestEmail,
  } from "$lib/remote/initiatives.remote.js";
  import { Button, Input } from "@leader/ui";
  import EmailTemplateEditor from "$lib/components/email-template-editor.svelte";
  import { slide } from "svelte/transition";

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
  let showAiGenerate = $state(false);
  let aiPrompt = $state("");
  let aiErrorMessage = $state("");
  let aiGenerating = $state(false);
  let selectedTestLeadId = $state("");
  let testSendSuccessMessage = $state("");
  let testSendErrorMessage = $state("");

  const capabilities = $derived(await getInitiativeCapabilities());
  const isSubmitting = $derived(createInitiativeEmail.pending > 0);
  const isSendingTestEmail = $derived(sendInitiativeTestEmail.pending > 0);
  const selectableLeads = $derived(
    leads.filter((lead): lead is Lead & { id: string } => Boolean(lead.id))
  );

  $effect(() => {
    if (!selectableLeads.length) {
      if (selectedTestLeadId) {
        selectedTestLeadId = "";
      }
      return;
    }

    if (
      !selectedTestLeadId ||
      !selectableLeads.some((lead) => lead.id === selectedTestLeadId)
    ) {
      selectedTestLeadId = selectableLeads[0].id;
    }
  });

  const handleAiGenerate = async () => {
    aiErrorMessage = "";
    aiGenerating = true;

    try {
      const result = await generateInitiativeEmail({
        projectId,
        prompt: aiPrompt.trim(),
      });
      subject = result.subject;
      htmlBody = result.htmlBody;
      showAiGenerate = false;
      aiPrompt = "";
    } catch (err) {
      console.error(err);
      aiErrorMessage = "Failed to generate email. Try again.";
    } finally {
      aiGenerating = false;
    }
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

  const testInitiativeEmailForm = sendInitiativeTestEmail.enhance(
    async ({ submit }) => {
      testSendSuccessMessage = "";
      testSendErrorMessage = "";

      try {
        await submit();
        testSendSuccessMessage = "Test email sent to your signed-in email.";
      } catch (error) {
        console.error(error);
        testSendErrorMessage = "Unable to send test email. Try again.";
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
    <div class="flex items-center gap-2">
      {#if !capabilities.aiGenerationAvailable}
        <span class="text-xs text-neutral-400">OPENROUTER_API_KEY not set</span>
      {/if}
      <Button
        type="button"
        variant="ghost"
        color="secondary"
        size="sm"
        disabled={!capabilities.aiGenerationAvailable}
        onclick={() => (showAiGenerate = !showAiGenerate)}
      >
        {showAiGenerate ? "Hide" : "✨ AI Draft"}
      </Button>
    </div>
  </div>

  {#if showAiGenerate}
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
            bind:value={aiPrompt}
            placeholder="e.g. A friendly introduction email offering our web design services, mentioning we noticed their website could use a refresh"
            rows="3"
            class="border-primary-200/70 focus-visible:border-primary-300 focus-visible:ring-primary-400/30 w-full rounded-xl border bg-white/90 px-3 py-2 text-sm text-neutral-900 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          ></textarea>
        </label>
        <p class="text-xs text-neutral-500">
          The AI will use available lead placeholders like
          <code class="rounded bg-neutral-100 px-1 py-0.5 font-mono">{"{{lead.name}}"}</code>
          in the generated email.
        </p>
        {#if aiErrorMessage}
          <p class="rounded-xl border border-destructive-200 bg-destructive-50/90 px-3 py-2 text-sm text-destructive-700">
            {aiErrorMessage}
          </p>
        {/if}
        <div class="flex justify-end">
          <Button
            type="button"
            size="sm"
            disabled={aiGenerating || !aiPrompt.trim()}
            onclick={handleAiGenerate}
          >
            {aiGenerating ? "Generating..." : "Generate Email"}
          </Button>
        </div>
      </div>
    </div>
  {/if}

  <EmailTemplateEditor
    bind:value={htmlBody}
    name={createInitiativeEmail.fields.htmlBody.as("text").name}
    bind:subject
    subjectName={createInitiativeEmail.fields.subject.as("text").name}
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
      {isSubmitting ? "Saving Draft..." : "Save as Draft"}
    </Button>
  </div>
</form>

<form class="mt-4 space-y-3 rounded-xl border border-neutral-200 p-4" {...testInitiativeEmailForm}>
  <input
    type="hidden"
    name={sendInitiativeTestEmail.fields.projectId.as("text").name}
    value={projectId}
  />
  <input
    type="hidden"
    name={sendInitiativeTestEmail.fields.subject.as("text").name}
    value={subject}
  />
  <input
    type="hidden"
    name={sendInitiativeTestEmail.fields.htmlBody.as("text").name}
    value={htmlBody}
  />

  <div class="flex flex-col gap-2">
    <span class="text-sm font-semibold text-neutral-700">
      Send Test Email
    </span>
    <p class="text-xs text-neutral-500">
      Sends the rendered initiative to your signed-in email using the selected lead for variable replacement.
    </p>
  </div>

  {#if selectableLeads.length > 0}
    <label class="flex flex-col gap-2">
      <span class="text-xs font-medium text-neutral-600">Preview lead</span>
      <select
        name={sendInitiativeTestEmail.fields.leadId.as("text").name}
        bind:value={selectedTestLeadId}
        class="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900"
      >
        {#each selectableLeads as lead (lead.id)}
          <option value={lead.id}>{lead.name}</option>
        {/each}
      </select>
    </label>
  {:else}
    <p class="text-xs text-amber-700">
      Add a lead to this project before sending a test email.
    </p>
  {/if}

  {#if testSendSuccessMessage}
    <p class="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
      {testSendSuccessMessage}
    </p>
  {/if}

  {#if testSendErrorMessage}
    <p class="rounded-xl border border-destructive-200 bg-destructive-50/90 px-3 py-2 text-sm text-destructive-700">
      {testSendErrorMessage}
    </p>
  {/if}

  <div class="flex justify-end">
    <Button
      type="submit"
      variant="ghost"
      color="secondary"
      disabled={isSendingTestEmail || !selectedTestLeadId}
    >
      {isSendingTestEmail ? "Sending Test..." : "Send Test Email"}
    </Button>
  </div>
</form>
