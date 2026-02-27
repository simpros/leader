<script lang="ts">
  import { page } from "$app/state";
  import { onMount } from "svelte";
  import { authClient } from "@leader/auth/client";
  import { Button, Card, Input } from "@leader/ui";
  import * as v from "valibot";
  import {
    updateOrganisationSchema,
    inviteMemberSchema,
  } from "$lib/schemas/settings";

  // Org details
  let orgName = $state(page.data.organization?.name ?? "");
  let orgSlug = $state(page.data.organization?.slug ?? "");
  let orgSaving = $state(false);
  let orgMessage = $state<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Members
  type OrgMember = {
    id: string;
    userId: string;
    role: string;
    createdAt: string;
    user: { id: string; name: string; email: string; image: string | null };
  };

  let members = $state<OrgMember[]>([]);
  let membersLoading = $state(true);

  // Invite
  let inviteEmail = $state("");
  let inviteRole = $state<"member" | "admin">("member");
  let inviteSaving = $state(false);
  let inviteMessage = $state<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const currentUserId = $derived(page.data.user?.id);

  const loadMembers = async () => {
    membersLoading = true;
    const { data } = await authClient.organization.getFullOrganization();
    if (data?.members) {
      members = data.members as unknown as OrgMember[];
    }
    membersLoading = false;
  };

  onMount(() => {
    loadMembers();
  });

  const handleOrgSubmit = async (e: SubmitEvent) => {
    e.preventDefault();
    orgMessage = null;

    const result = v.safeParse(updateOrganisationSchema, {
      name: orgName,
      slug: orgSlug,
    });
    if (!result.success) {
      orgMessage = {
        type: "error",
        text: result.issues[0]?.message ?? "Invalid input",
      };
      return;
    }

    orgSaving = true;
    const { error } = await authClient.organization.update({
      data: {
        name: result.output.name,
        slug: result.output.slug,
      },
    });
    orgSaving = false;

    if (error) {
      orgMessage = {
        type: "error",
        text: error.message ?? "Failed to update organisation",
      };
    } else {
      orgMessage = { type: "success", text: "Organisation updated" };
    }
  };

  const handleInvite = async (e: SubmitEvent) => {
    e.preventDefault();
    inviteMessage = null;

    const result = v.safeParse(inviteMemberSchema, {
      email: inviteEmail,
      role: inviteRole,
    });
    if (!result.success) {
      inviteMessage = {
        type: "error",
        text: result.issues[0]?.message ?? "Invalid input",
      };
      return;
    }

    inviteSaving = true;
    const { error } = await authClient.organization.inviteMember({
      email: result.output.email,
      role: result.output.role,
    });
    inviteSaving = false;

    if (error) {
      inviteMessage = {
        type: "error",
        text: error.message ?? "Failed to send invitation",
      };
    } else {
      inviteMessage = {
        type: "success",
        text: `Invitation sent to ${inviteEmail}`,
      };
      inviteEmail = "";
      inviteRole = "member";
    }
  };

  const handleRoleChange = async (memberId: string, newRole: string) => {
    const { error } = await authClient.organization.updateMemberRole({
      memberId,
      role: newRole,
    });
    await loadMembers();
    if (error) {
      orgMessage = {
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
    await loadMembers();
    if (error) {
      orgMessage = {
        type: "error",
        text: error.message ?? "Failed to remove member",
      };
    }
  };
</script>

<div class="flex flex-col gap-8">
  <Card variant="flat" class="p-6">
    <h2
      class="mb-4 text-lg font-bold uppercase tracking-tight text-neutral-950"
    >
      Organisation Details
    </h2>
    <form class="flex flex-col gap-4" onsubmit={handleOrgSubmit}>
      <div class="flex flex-col gap-1.5">
        <label class="text-sm font-semibold text-neutral-700" for="org-name"
          >Name</label
        >
        <Input id="org-name" bind:value={orgName} required />
      </div>
      <div class="flex flex-col gap-1.5">
        <label class="text-sm font-semibold text-neutral-700" for="org-slug"
          >Slug</label
        >
        <Input id="org-slug" bind:value={orgSlug} required />
        <p class="text-xs text-neutral-400">
          Lowercase letters, numbers, and hyphens only.
        </p>
      </div>
      {#if orgMessage}
        <p
          class={[
            "border px-3 py-2 text-sm",
            orgMessage.type === "success"
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-destructive-200 bg-destructive-50 text-destructive-700",
          ]}
        >
          {orgMessage.text}
        </p>
      {/if}
      <div>
        <Button type="submit" disabled={orgSaving}>
          {orgSaving ? "Saving…" : "Save"}
        </Button>
      </div>
    </form>
  </Card>

  <Card variant="flat" class="p-6">
    <h2
      class="mb-4 text-lg font-bold uppercase tracking-tight text-neutral-950"
    >
      Members
    </h2>
    {#if membersLoading}
      <p class="text-sm text-neutral-500">Loading members…</p>
    {:else if members.length === 0}
      <p class="text-sm text-neutral-500">No members found.</p>
    {:else}
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead>
            <tr class="border-b-2 border-neutral-800">
              <th
                class="pb-2 pr-4 font-mono text-xs font-bold uppercase tracking-wider text-neutral-600"
                >Name</th
              >
              <th
                class="pb-2 pr-4 font-mono text-xs font-bold uppercase tracking-wider text-neutral-600"
                >Email</th
              >
              <th
                class="pb-2 pr-4 font-mono text-xs font-bold uppercase tracking-wider text-neutral-600"
                >Role</th
              >
              <th
                class="pb-2 font-mono text-xs font-bold uppercase tracking-wider text-neutral-600"
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
                      class="font-mono text-xs font-bold uppercase text-neutral-500"
                      >Owner</span
                    >
                  {:else}
                    <select
                      class="border-2 border-neutral-800 bg-surface px-2 py-1 font-mono text-xs uppercase"
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

  <Card variant="flat" class="p-6">
    <h2
      class="mb-4 text-lg font-bold uppercase tracking-tight text-neutral-950"
    >
      Invite Member
    </h2>
    <form class="flex flex-col gap-4" onsubmit={handleInvite}>
      <div class="flex flex-col gap-1.5">
        <label class="text-sm font-semibold text-neutral-700" for="invite-email"
          >Email Address</label
        >
        <Input
          id="invite-email"
          type="email"
          bind:value={inviteEmail}
          required
        />
      </div>
      <div class="flex flex-col gap-1.5">
        <label class="text-sm font-semibold text-neutral-700" for="invite-role"
          >Role</label
        >
        <select
          id="invite-role"
          class="h-10 border-2 border-neutral-800 bg-surface px-3 text-sm"
          bind:value={inviteRole}
        >
          <option value="member">Member</option>
          <option value="admin">Admin</option>
        </select>
      </div>
      {#if inviteMessage}
        <p
          class={[
            "border px-3 py-2 text-sm",
            inviteMessage.type === "success"
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-destructive-200 bg-destructive-50 text-destructive-700",
          ]}
        >
          {inviteMessage.text}
        </p>
      {/if}
      <div>
        <Button type="submit" disabled={inviteSaving}>
          {inviteSaving ? "Sending…" : "Send Invitation"}
        </Button>
      </div>
    </form>
  </Card>
</div>
