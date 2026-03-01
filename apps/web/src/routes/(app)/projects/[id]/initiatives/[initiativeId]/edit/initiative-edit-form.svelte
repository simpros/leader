<script lang="ts">
  import {
    generateInitiativeEmail,
    sendInitiativeTestEmail,
    updateInitiativeEmail,
  } from "$lib/remote/initiatives.remote.js";
  import { getInitiativeCapabilities } from "$lib/remote/initiatives.remote.js";
  import { Button, Input } from "@leader/ui";
  import EmailTemplateEditor from "$lib/components/email-template-editor.svelte";
  import { slide } from "svelte/transition";

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
  let showAiGenerate = $state(false);
  let aiPrompt = $state("");
  let aiErrorMessage = $state("");
  let aiGenerating = $state(false);
  let testSendMode = $state<"my-email" | "lead" | "custom">("my-email");
  let selectedTestLeadId = $state("");
  let customTestEmail = $state("");
  let testSendSuccessMessage = $state("");
  let testSendErrorMessage = $state("");

  const capabilities = $derived(await getInitiativeCapabilities());
  const isSubmitting = $derived(updateInitiativeEmail.pending > 0);
  const isSendingTestEmail = $derived(sendInitiativeTestEmail.pending > 0);
  const selectableLeads = $derived(
    leads.filter((lead): lead is Lead & { id: string } => Boolean(lead.id))
  );

  $effect(() => {
    updateInitiativeEmail.fields.set({
      initiativeId: initiative.id,
      title: initiative.title,
      subject: initiative.subject,
      htmlBody: initiative.htmlBody,
    });
  });

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

  const testInitiativeEmailForm = sendInitiativeTestEmail.enhance(
    async ({ submit }) => {
      testSendSuccessMessage = "";
      testSendErrorMessage = "";

      try {
        await submit();
        testSendSuccessMessage = "Test email sent successfully.";
      } catch (error) {
        console.error(error);
        testSendErrorMessage = "Unable to send test email. Try again.";
      }
    }
  );
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
    <div class="flex items-center gap-2">
      {#if !capabilities.aiGenerationAvailable}
        <span class="text-xs text-neutral-400"
          >OPENROUTER_API_KEY not set</span
        >
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
          <code class="rounded bg-neutral-100 px-1 py-0.5 font-mono"
            >{"{{lead.name}}"}</code
          >
          in the generated email.
        </p>
        {#if aiErrorMessage}
          <p
            class="border-destructive-200 bg-destructive-50/90 text-destructive-700 rounded-xl border px-3 py-2 text-sm"
          >
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

<form
  class="mt-4 space-y-3 rounded-xl border border-neutral-200 p-4"
  {...testInitiativeEmailForm}
>
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
  <input
    type="hidden"
    name={sendInitiativeTestEmail.fields.mode.as("text").name}
    value={testSendMode}
  />

  <div class="flex flex-col gap-2">
    <span class="text-sm font-semibold text-neutral-700">
      Send Test Email
    </span>
    <p class="text-xs text-neutral-500">
      Send a test of this initiative to preview how it looks.
    </p>
  </div>

  <fieldset class="flex flex-col gap-2">
    <span class="text-xs font-medium text-neutral-600">Send to</span>
    <label class="flex items-center gap-2 text-sm text-neutral-700">
      <input
        type="radio"
        bind:group={testSendMode}
        value="my-email"
        class="accent-primary-600"
      />
      My email (signed-in account)
    </label>
    <label class="flex items-center gap-2 text-sm text-neutral-700">
      <input
        type="radio"
        bind:group={testSendMode}
        value="lead"
        class="accent-primary-600"
      />
      Lead's email
    </label>
    <label class="flex items-center gap-2 text-sm text-neutral-700">
      <input
        type="radio"
        bind:group={testSendMode}
        value="custom"
        class="accent-primary-600"
      />
      Custom email
    </label>
  </fieldset>

  {#if testSendMode === "custom"}
    <label class="flex flex-col gap-2">
      <span class="text-xs font-medium text-neutral-600">Email address</span>
      <Input
        type="email"
        placeholder="someone@example.com"
        bind:value={customTestEmail}
        name={sendInitiativeTestEmail.fields.customEmail.as("text").name}
      />
    </label>
  {/if}

  {#if selectableLeads.length > 0}
    <label class="flex flex-col gap-2">
      <span class="text-xs font-medium text-neutral-600">
        {testSendMode === "lead"
          ? "Send to lead"
          : "Preview lead (for variable replacement)"}
      </span>
      <select
        name={sendInitiativeTestEmail.fields.leadId.as("text").name}
        bind:value={selectedTestLeadId}
        class="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900"
      >
        {#each selectableLeads as lead (lead.id)}
          <option value={lead.id}>
            {lead.name}
            {#if testSendMode === "lead"}
              {lead.email ? `(${lead.email})` : "(no email)"}
            {/if}
          </option>
        {/each}
      </select>
    </label>
  {:else if testSendMode === "lead" && selectableLeads.length === 0}
    <p class="text-xs text-amber-700">
      Add a lead to this project before sending to a lead's email.
    </p>
  {/if}

  {#if testSendSuccessMessage}
    <p
      class="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700"
    >
      {testSendSuccessMessage}
    </p>
  {/if}

  {#if testSendErrorMessage}
    <p
      class="border-destructive-200 bg-destructive-50/90 text-destructive-700 rounded-xl border px-3 py-2 text-sm"
    >
      {testSendErrorMessage}
    </p>
  {/if}

  <div class="flex justify-end">
    <Button
      type="submit"
      variant="ghost"
      color="secondary"
      disabled={isSendingTestEmail ||
        (testSendMode === "lead" && !selectedTestLeadId) ||
        (testSendMode === "custom" && !customTestEmail.trim())}
    >
      {isSendingTestEmail ? "Sending Test..." : "Send Test Email"}
    </Button>
  </div>
</form>
