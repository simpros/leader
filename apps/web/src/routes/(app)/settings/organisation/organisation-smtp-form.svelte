<script lang="ts">
  import { Button, Card, Input } from "@leader/ui";
  import * as v from "valibot";
  import { organizationSmtpConfigSchema } from "$lib/schemas/settings";
  import {
    getSmtpConfig,
    saveSmtpConfig,
    testSmtpConnection,
  } from "$lib/remote/settings.remote";
  import type { StatusMessage } from "./organisation.svelte.js";

  let smtpHost = $state("");
  let smtpPort = $state(587);
  let smtpUser = $state("");
  let smtpPass = $state("");
  let emailFrom = $state("");

  let saving = $state(false);
  let testing = $state(false);
  let loaded = $state(false);
  let message = $state<StatusMessage | null>(null);

  const loadConfig = async () => {
    const config = await getSmtpConfig();
    if (config) {
      smtpHost = config.smtpHost;
      smtpPort = config.smtpPort;
      smtpUser = config.smtpUser;
      emailFrom = config.emailFrom;
      smtpPass = "";
    }
    loaded = true;
  };

  loadConfig();

  const getFormValues = () => ({
    smtpHost,
    smtpPort,
    smtpUser,
    smtpPass,
    emailFrom,
  });

  const handleSave = async (e: SubmitEvent) => {
    e.preventDefault();
    message = null;

    const result = v.safeParse(organizationSmtpConfigSchema, getFormValues());
    if (!result.success) {
      message = {
        type: "error",
        text: result.issues[0]?.message ?? "Invalid input",
      };
      return;
    }

    saving = true;
    try {
      await saveSmtpConfig(result.output);
      message = { type: "success", text: "SMTP configuration saved" };
    } catch (err) {
      message = {
        type: "error",
        text:
          err instanceof Error
            ? err.message
            : "Failed to save SMTP configuration",
      };
    }
    saving = false;
  };

  const handleTest = async () => {
    message = null;

    const result = v.safeParse(organizationSmtpConfigSchema, getFormValues());
    if (!result.success) {
      message = {
        type: "error",
        text: result.issues[0]?.message ?? "Invalid input",
      };
      return;
    }

    testing = true;
    try {
      await testSmtpConnection(result.output);
      message = { type: "success", text: "SMTP connection successful" };
    } catch (err) {
      message = {
        type: "error",
        text:
          err instanceof Error
            ? err.message
            : "SMTP connection test failed",
      };
    }
    testing = false;
  };
</script>

<Card variant="flat" class="p-6">
  <h2
    class="mb-4 text-lg font-bold tracking-tight text-neutral-950 uppercase"
  >
    SMTP Configuration
  </h2>
  <p class="mb-4 text-sm text-neutral-500">
    Configure the SMTP server used to send emails to leads from this
    organisation.
  </p>
  {#if loaded}
    <form class="flex flex-col gap-4" onsubmit={handleSave}>
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div class="flex flex-col gap-1.5">
          <label
            class="text-sm font-semibold text-neutral-700"
            for="smtp-host">SMTP Host</label
          >
          <Input
            id="smtp-host"
            bind:value={smtpHost}
            placeholder="smtp.example.com"
            required
          />
        </div>
        <div class="flex flex-col gap-1.5">
          <label
            class="text-sm font-semibold text-neutral-700"
            for="smtp-port">SMTP Port</label
          >
          <Input
            id="smtp-port"
            type="number"
            bind:value={smtpPort}
            min={1}
            max={65535}
            required
          />
        </div>
      </div>
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div class="flex flex-col gap-1.5">
          <label
            class="text-sm font-semibold text-neutral-700"
            for="smtp-user">SMTP User</label
          >
          <Input
            id="smtp-user"
            bind:value={smtpUser}
            placeholder="user@example.com"
            required
          />
        </div>
        <div class="flex flex-col gap-1.5">
          <label
            class="text-sm font-semibold text-neutral-700"
            for="smtp-pass">SMTP Password</label
          >
          <Input
            id="smtp-pass"
            type="password"
            bind:value={smtpPass}
            placeholder="Enter password"
            required
          />
        </div>
      </div>
      <div class="flex flex-col gap-1.5">
        <label
          class="text-sm font-semibold text-neutral-700"
          for="email-from">From Email</label
        >
        <Input
          id="email-from"
          type="email"
          bind:value={emailFrom}
          placeholder="noreply@example.com"
          required
        />
      </div>
      {#if message}
        <p
          class={[
            "border px-3 py-2 text-sm",
            message.type === "success"
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-destructive-200 bg-destructive-50 text-destructive-700",
          ]}
        >
          {message.text}
        </p>
      {/if}
      <div class="flex gap-3">
        <Button type="submit" disabled={saving || testing}>
          {saving ? "Saving…" : "Save"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={saving || testing}
          onclick={handleTest}
        >
          {testing ? "Testing…" : "Test Connection"}
        </Button>
      </div>
    </form>
  {/if}
</Card>
