<script lang="ts">
  import { authClient } from "@leader/auth/client";
  import { Button, Card, Input } from "@leader/ui";
  import * as v from "valibot";
  import { inviteMemberSchema } from "$lib/schemas/settings";
  import type { StatusMessage } from "./organisation.svelte.js";

  type OrganisationInviteFormProps = {
    onReload: () => Promise<void>;
  };

  let { onReload }: OrganisationInviteFormProps = $props();

  let email = $state("");
  let role = $state<"member" | "admin">("member");
  let saving = $state(false);
  let message = $state<StatusMessage | null>(null);

  const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault();
    message = null;

    const result = v.safeParse(inviteMemberSchema, { email, role });
    if (!result.success) {
      message = {
        type: "error",
        text: result.issues[0]?.message ?? "Invalid input",
      };
      return;
    }

    saving = true;
    const { error } = await authClient.organization.inviteMember({
      email: result.output.email,
      role: result.output.role,
    });
    saving = false;

    if (error) {
      message = {
        type: "error",
        text: error.message ?? "Failed to send invitation",
      };
    } else {
      message = {
        type: "success",
        text: `Invitation sent to ${email}`,
      };
      email = "";
      role = "member";
      await onReload();
    }
  };
</script>

<Card variant="flat" class="p-6">
  <h2
    class="mb-4 text-lg font-bold tracking-tight text-neutral-950 uppercase"
  >
    Invite Member
  </h2>
  <form class="flex flex-col gap-4" onsubmit={handleSubmit}>
    <div class="flex flex-col gap-1.5">
      <label
        class="text-sm font-semibold text-neutral-700"
        for="invite-email">Email Address</label
      >
      <Input
        id="invite-email"
        type="email"
        bind:value={email}
        required
      />
    </div>
    <div class="flex flex-col gap-1.5">
      <label
        class="text-sm font-semibold text-neutral-700"
        for="invite-role">Role</label
      >
      <select
        id="invite-role"
        class="bg-surface h-10 border-2 border-neutral-800 px-3 text-sm"
        bind:value={role}
      >
        <option value="member">Member</option>
        <option value="admin">Admin</option>
      </select>
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
    <div>
      <Button type="submit" disabled={saving}>
        {saving ? "Sending…" : "Send Invitation"}
      </Button>
    </div>
  </form>
</Card>
