<script lang="ts">
  import { authClient } from "@leader/auth/client";
  import { Button, Card } from "@leader/ui";
  import type { OrgInvitation, StatusMessage } from "./organisation.svelte.js";

  type OrganisationInvitationsTableProps = {
    invitations: OrgInvitation[];
    loading: boolean;
    onReload: () => Promise<void>;
  };

  let { invitations, loading, onReload }: OrganisationInvitationsTableProps =
    $props();

  let resendingId = $state<string | null>(null);
  let cancellingId = $state<string | null>(null);
  let message = $state<StatusMessage | null>(null);

  const handleResend = async (invitation: OrgInvitation) => {
    resendingId = invitation.id;
    message = null;

    const { error: cancelError } =
      await authClient.organization.cancelInvitation({
        invitationId: invitation.id,
      });
    if (cancelError) {
      message = {
        type: "error",
        text: cancelError.message ?? "Failed to resend invitation",
      };
      resendingId = null;
      return;
    }

    const { error: inviteError } =
      await authClient.organization.inviteMember({
        email: invitation.email,
        role: (invitation.role as "member" | "admin") ?? "member",
      });
    resendingId = null;

    if (inviteError) {
      message = {
        type: "error",
        text: inviteError.message ?? "Failed to resend invitation",
      };
    } else {
      message = {
        type: "success",
        text: `Invitation resent to ${invitation.email}`,
      };
    }
    await onReload();
  };

  const handleCancel = async (invitation: OrgInvitation) => {
    cancellingId = invitation.id;
    message = null;

    const { error } = await authClient.organization.cancelInvitation({
      invitationId: invitation.id,
    });
    cancellingId = null;

    if (error) {
      message = {
        type: "error",
        text: error.message ?? "Failed to cancel invitation",
      };
    } else {
      message = {
        type: "success",
        text: `Invitation to ${invitation.email} cancelled`,
      };
    }
    await onReload();
  };
</script>

<Card variant="flat" class="p-6">
  <h2
    class="mb-4 text-lg font-bold tracking-tight text-neutral-950 uppercase"
  >
    Pending Invitations
  </h2>
  {#if loading}
    <p class="text-sm text-neutral-500">Loading invitations…</p>
  {:else if invitations.length === 0}
    <p class="text-sm text-neutral-500">No pending invitations.</p>
  {:else}
    {#if message}
      <p
        class={[
          "mb-4 border px-3 py-2 text-sm",
          message.type === "success"
            ? "border-green-200 bg-green-50 text-green-700"
            : "border-destructive-200 bg-destructive-50 text-destructive-700",
        ]}
      >
        {message.text}
      </p>
    {/if}
    <div class="overflow-x-auto">
      <table class="w-full text-left text-sm">
        <thead>
          <tr class="border-b-2 border-neutral-800">
            <th
              class="pr-4 pb-2 font-mono text-xs font-bold tracking-wider text-neutral-600 uppercase"
              >Email</th
            >
            <th
              class="pr-4 pb-2 font-mono text-xs font-bold tracking-wider text-neutral-600 uppercase"
              >Role</th
            >
            <th
              class="pr-4 pb-2 font-mono text-xs font-bold tracking-wider text-neutral-600 uppercase"
              >Expires</th
            >
            <th
              class="pb-2 font-mono text-xs font-bold tracking-wider text-neutral-600 uppercase"
            ></th>
          </tr>
        </thead>
        <tbody>
          {#each invitations as invitation (invitation.id)}
            <tr class="border-b border-neutral-200">
              <td class="py-3 pr-4 font-medium text-neutral-950">
                {invitation.email}
              </td>
              <td class="py-3 pr-4">
                <span
                  class="font-mono text-xs font-bold text-neutral-500 uppercase"
                  >{invitation.role ?? "member"}</span
                >
              </td>
              <td class="py-3 pr-4 text-neutral-600">
                {new Date(invitation.expiresAt).toLocaleDateString()}
              </td>
              <td class="flex gap-1 py-3">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={resendingId === invitation.id}
                  onclick={() => handleResend(invitation)}
                >
                  {resendingId === invitation.id ? "Resending…" : "Resend"}
                </Button>
                <Button
                  variant="ghost"
                  color="destructive"
                  size="sm"
                  disabled={cancellingId === invitation.id}
                  onclick={() => handleCancel(invitation)}
                >
                  {cancellingId === invitation.id
                    ? "Cancelling…"
                    : "Cancel"}
                </Button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</Card>
