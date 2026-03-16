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

  const configQuery = getSmtpConfig();
  const loaded = $derived(configQuery.ready);
  const testing = $derived(testSmtpConnection.pending > 0);
  const isSubmitting = $derived(saveSmtpConfig.pending > 0);

  let lastActionOutcome = $state<StatusMessage | null>(null);

  const message = $derived.by((): StatusMessage | null => {
    if (isSubmitting || testing) return null;
    if (lastActionOutcome) return lastActionOutcome;
    if (saveSmtpConfig.result?.success)
      return { type: "success", text: "SMTP configuration saved" };
    return null;
  });

  const loadConfig = async () => {
    const config = await configQuery;
    if (config) {
      saveSmtpConfig.fields.set({
        smtpHost: config.smtpHost,
        smtpPort: config.smtpPort,
        smtpUser: config.smtpUser,
        _smtpPass: "",
        emailFrom: config.emailFrom,
      });
    } else {
      saveSmtpConfig.fields.set({
        smtpHost: "",
        smtpPort: 587,
        smtpUser: "",
        _smtpPass: "",
        emailFrom: "",
      });
    }
  };

  loadConfig();

  const smtpForm = saveSmtpConfig.enhance(async ({ submit }) => {
    lastActionOutcome = null;
    try {
      await submit();
    } catch (err) {
      lastActionOutcome = {
        type: "error",
        text:
          err instanceof Error
            ? err.message
            : "Failed to save SMTP configuration",
      };
    }
  });

  const handleTest = async () => {
    lastActionOutcome = null;

    const values = saveSmtpConfig.fields.value();
    const result = v.safeParse(organizationSmtpConfigSchema, {
      ...values,
      smtpPort: Number(values.smtpPort),
    });
    if (!result.success) {
      lastActionOutcome = {
        type: "error",
        text: result.issues[0]?.message ?? "Invalid input",
      };
      return;
    }

    try {
      await testSmtpConnection(result.output);
      lastActionOutcome = {
        type: "success",
        text: "SMTP connection successful",
      };
    } catch (err) {
      lastActionOutcome = {
        type: "error",
        text:
          err instanceof Error
            ? err.message
            : "SMTP connection test failed",
      };
    }
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
    <form class="flex flex-col gap-4" {...smtpForm}>
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div class="flex flex-col gap-1.5">
          <label
            class="text-sm font-semibold text-neutral-700"
            for="smtp-host">SMTP Host</label
          >
          <Input
            id="smtp-host"
            {...saveSmtpConfig.fields.smtpHost.as("text")}
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
            {...saveSmtpConfig.fields.smtpPort.as("number")}
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
            {...saveSmtpConfig.fields.smtpUser.as("text")}
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
            {...saveSmtpConfig.fields._smtpPass.as("password")}
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
          {...saveSmtpConfig.fields.emailFrom.as("email")}
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
        <Button type="submit" disabled={isSubmitting || testing}>
          {isSubmitting ? "Saving…" : "Save"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={isSubmitting || testing}
          onclick={handleTest}
        >
          {testing ? "Testing…" : "Test Connection"}
        </Button>
      </div>
    </form>
  {/if}
</Card>
