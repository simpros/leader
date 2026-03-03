<script lang="ts">
  import { authClient } from "@leader/auth/client";
  import { Button, Card } from "@leader/ui";
  import type { OrgMember, StatusMessage } from "./organisation.svelte.js";

  type OrganisationMembersTableProps = {
    members: OrgMember[];
    loading: boolean;
    currentUserId: string | undefined;
    onReload: () => Promise<void>;
  };

  let { members, loading, currentUserId, onReload }: OrganisationMembersTableProps =
    $props();

  let message = $state<StatusMessage | null>(null);

  const handleRoleChange = async (memberId: string, newRole: string) => {
    const { error } = await authClient.organization.updateMemberRole({
      memberId,
      role: newRole,
    });
    await onReload();
    if (error) {
      message = {
        type: "error",
        text: error.message ?? "Failed to update member role",
      };
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!confirm(`Remove ${memberName} from the organisation?`)) return;

    const { error } = await authClient.organization.removeMember({
      memberIdOrEmail: memberId,
    });
    await onReload();
    if (error) {
      message = {
        type: "error",
        text: error.message ?? "Failed to remove member",
      };
    }
  };
</script>

<Card variant="flat" class="p-6">
  <h2
    class="mb-4 text-lg font-bold tracking-tight text-neutral-950 uppercase"
  >
    Members
  </h2>
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
  {#if loading}
    <p class="text-sm text-neutral-500">Loading members…</p>
  {:else if members.length === 0}
    <p class="text-sm text-neutral-500">No members found.</p>
  {:else}
    <div class="overflow-x-auto">
      <table class="w-full text-left text-sm">
        <thead>
          <tr class="border-b-2 border-neutral-800">
            <th
              class="pr-4 pb-2 font-mono text-xs font-bold tracking-wider text-neutral-600 uppercase"
              >Name</th
            >
            <th
              class="pr-4 pb-2 font-mono text-xs font-bold tracking-wider text-neutral-600 uppercase"
              >Email</th
            >
            <th
              class="pr-4 pb-2 font-mono text-xs font-bold tracking-wider text-neutral-600 uppercase"
              >Role</th
            >
            <th
              class="pb-2 font-mono text-xs font-bold tracking-wider text-neutral-600 uppercase"
            ></th>
          </tr>
        </thead>
        <tbody>
          {#each members as member (member.id)}
            <tr class="border-b border-neutral-200">
              <td class="py-3 pr-4 font-medium text-neutral-950">
                {member.user.name}
              </td>
              <td class="py-3 pr-4 text-neutral-600"
                >{member.user.email}</td
              >
              <td class="py-3 pr-4">
                {#if member.role === "owner"}
                  <span
                    class="font-mono text-xs font-bold text-neutral-500 uppercase"
                    >Owner</span
                  >
                {:else}
                  <select
                    class="bg-surface border-2 border-neutral-800 px-2 py-1 font-mono text-xs uppercase"
                    value={member.role}
                    onchange={(e) =>
                      handleRoleChange(member.id, e.currentTarget.value)}
                  >
                    <option value="admin">Admin</option>
                    <option value="member">Member</option>
                  </select>
                {/if}
              </td>
              <td class="py-3">
                {#if member.role !== "owner" && member.userId !== currentUserId}
                  <Button
                    variant="ghost"
                    color="destructive"
                    size="sm"
                    onclick={() =>
                      handleRemoveMember(member.id, member.user.name)}
                  >
                    Remove
                  </Button>
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</Card>
