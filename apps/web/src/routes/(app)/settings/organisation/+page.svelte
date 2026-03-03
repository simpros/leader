<script lang="ts">
  import { page } from "$app/state";
  import { onMount } from "svelte";
  import { createOrganizationState } from "./organisation.svelte.js";
  import OrganisationDetailsForm from "./organisation-details-form.svelte";
  import OrganisationMembersTable from "./organisation-members-table.svelte";
  import OrganisationInvitationsTable from "./organisation-invitations-table.svelte";
  import OrganisationInviteForm from "./organisation-invite-form.svelte";

  const org = createOrganizationState();
  const currentUserId = $derived(page.data.user?.id);

  onMount(() => {
    org.load();
  });
</script>

<div class="flex flex-col gap-8">
  <OrganisationDetailsForm organization={page.data.organization} />
  <OrganisationMembersTable
    members={org.members}
    loading={org.loading}
    {currentUserId}
    onReload={org.load}
  />
  <OrganisationInvitationsTable
    invitations={org.pendingInvitations}
    loading={org.loading}
    onReload={org.load}
  />
  <OrganisationInviteForm onReload={org.load} />
</div>
