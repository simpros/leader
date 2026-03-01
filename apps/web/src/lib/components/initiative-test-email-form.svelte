<script lang="ts">
  import { sendInitiativeTestEmail } from "$lib/remote/initiatives.remote.js";
  import { Button, Input } from "@leader/ui";

  import type { Lead } from "$lib/leads/types";

  type InitiativeTestEmailFormProps = {
    projectId: string;
    subject: string;
    htmlBody: string;
    leads?: Lead[];
  };

  let {
    projectId,
    subject,
    htmlBody,
    leads = [],
  }: InitiativeTestEmailFormProps = $props();

  let testSendMode = $state<"my-email" | "lead" | "custom">("my-email");
  let selectedTestLeadId = $state("");
  let customTestEmail = $state("");
  let feedback = $state<{ type: "success" | "error"; text: string } | null>(
    null
  );

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

  const testInitiativeEmailForm = sendInitiativeTestEmail.enhance(
    async ({ submit }) => {
      feedback = null;

      try {
        await submit();
        feedback = { type: "success", text: "Test email sent successfully." };
      } catch (error) {
        console.error(error);
        feedback = {
          type: "error",
          text: "Unable to send test email. Try again.",
        };
      }
    }
  );
</script>

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

  {#if feedback?.type === "success"}
    <p
      class="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700"
    >
      {feedback.text}
    </p>
  {/if}

  {#if feedback?.type === "error"}
    <p
      class="border-destructive-200 bg-destructive-50/90 text-destructive-700 rounded-xl border px-3 py-2 text-sm"
    >
      {feedback.text}
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
