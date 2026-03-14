<script lang="ts">
  import { invalidateAll } from "$app/navigation";
  import { DropdownMenu } from "bits-ui";
  import { authClient } from "@leader/auth/client";

  type Props = {
    organizations: { id: string; name: string; slug: string }[];
    activeOrganizationId: string | null;
  };

  let { organizations, activeOrganizationId }: Props = $props();

  const activeOrg = $derived(
    organizations.find((o) => o.id === activeOrganizationId)
  );

  let switching = $state(false);

  const handleSwitch = async (orgId: string) => {
    if (orgId === activeOrganizationId || switching) return;
    switching = true;

    await authClient.organization.setActive({ organizationId: orgId });
    await invalidateAll();

    switching = false;
  };
</script>

{#if organizations.length > 1}
  <DropdownMenu.Root>
    <DropdownMenu.Trigger
      class="transition-snappy flex items-center gap-1.5 px-3 py-2 font-mono text-[10px] font-bold tracking-wider text-neutral-600 uppercase hover:bg-neutral-100 hover:text-neutral-950 sm:text-xs"
      disabled={switching}
    >
      {activeOrg?.name ?? "Org"}
      <svg
        class="size-3 text-neutral-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2.5"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M19 9l-7 7-7-7"
        />
      </svg>
    </DropdownMenu.Trigger>
    <DropdownMenu.Portal>
      <DropdownMenu.Content
        class="bg-surface z-50 min-w-48 border-2 border-neutral-800 py-1 shadow-lg"
        sideOffset={4}
        align="start"
      >
        {#each organizations as org (org.id)}
          <DropdownMenu.Item
            class={[
              "flex w-full cursor-pointer items-center px-3 py-2 text-sm transition-colors hover:bg-neutral-100 focus:bg-neutral-100 focus:outline-none",
              org.id === activeOrganizationId
                ? "font-semibold text-neutral-950"
                : "text-neutral-600",
            ]}
            onSelect={() => handleSwitch(org.id)}
          >
            {org.name}
            {#if org.id === activeOrganizationId}
              <svg
                class="text-primary-500 ml-auto size-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2.5"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            {/if}
          </DropdownMenu.Item>
        {/each}
      </DropdownMenu.Content>
    </DropdownMenu.Portal>
  </DropdownMenu.Root>
{:else if activeOrg}
  <span
    class="px-3 py-2 font-mono text-[10px] font-bold tracking-wider text-neutral-500 uppercase sm:text-xs"
  >
    {activeOrg.name}
  </span>
{/if}
