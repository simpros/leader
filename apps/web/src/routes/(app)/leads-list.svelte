<script lang="ts">
  import type { Lead } from "$lib/leads/types";
  import { Badge, Button, Card, FloatingPill } from "@leader/ui";
  import { SvelteSet } from "svelte/reactivity";
  import { discoverLeads } from "$lib/remote/leads.remote";
  import LeadProjectModal from "./lead-project-modal.svelte";

  const selectedLeads = new SvelteSet<Lead>();

  let isModalOpen = $state(false);

  const isLoading = $derived(discoverLeads.pending > 0);
  const leads = $derived(discoverLeads.result?.leads ?? []);
  const leadCount = $derived(leads.length);
  const hasLeads = $derived(leadCount > 0);
  const showEmptyState = $derived(!isLoading && leadCount === 0);
  const showLoadingState = $derived(isLoading && leadCount === 0);
  const selectedCount = $derived(selectedLeads.size);
  const hasSelection = $derived(selectedCount > 0);
  const selectionLabel = $derived(
    `${selectedCount} ${selectedCount === 1 ? "lead" : "leads"} selected`
  );

  const formatTypes = (types?: string[]) =>
    types && types.length ? types.slice(0, 4).join(" · ") : "";

  const clearSelection = () => selectedLeads.clear();
</script>

<section class="space-y-4">
  {#snippet loadingState()}
    <Card variant="flat" class="p-8 text-center">
      <div class="mx-auto max-w-sm space-y-4">
        <div
          class="bg-primary-100 text-primary-600 mx-auto flex h-16 w-16 items-center justify-center border-2 border-primary-500 animate-pulse"
        >
          <span class="font-mono text-2xl font-bold">...</span>
        </div>
        <div class="space-y-1">
          <h3 class="text-lg font-bold uppercase tracking-wider text-neutral-900">
            Searching for leads
          </h3>
          <p class="font-mono text-xs text-neutral-500">
            We are scanning your sources. New results will appear here
            shortly.
          </p>
        </div>
      </div>
    </Card>
  {/snippet}

  {#snippet emptyState()}
    <Card variant="flat" class="p-12 text-center border-dashed">
      <div class="mx-auto max-w-sm space-y-4">
        <div
          class="bg-neutral-100 text-neutral-500 mx-auto flex h-16 w-16 items-center justify-center border-2 border-neutral-400 border-dashed"
        >
          <span class="font-mono text-2xl font-bold">?</span>
        </div>
        <div class="space-y-1">
          <h3 class="text-lg font-bold uppercase tracking-wider text-neutral-900">
            No results yet
          </h3>
          <p class="font-mono text-xs text-neutral-500">
            Configure your search parameters and click "Find Customers" to
            discover potential leads.
          </p>
        </div>
      </div>
    </Card>
  {/snippet}

  {#snippet contactRow(lead: Lead)}
    <div
      class="border-neutral-800 flex flex-wrap items-center gap-x-5 gap-y-2.5 border-t-2 pt-3.5 font-mono text-xs"
    >
      {#if lead.phone}
        <a
          href="tel:{lead.phone}"
          class="group flex items-center gap-2 text-neutral-600 hover:text-primary-600 transition-colors font-bold"
        >
          <span class="bg-neutral-100 border border-neutral-300 p-1 group-hover:bg-primary-50 group-hover:border-primary-300 transition-colors">📞</span>
          <span>{lead.phone}</span>
        </a>
      {/if}
      {#if lead.email}
        <a
          href="mailto:{lead.email}"
          class="group flex items-center gap-2 text-neutral-600 hover:text-primary-600 transition-colors font-bold"
        >
          <span class="bg-neutral-100 border border-neutral-300 p-1 group-hover:bg-primary-50 group-hover:border-primary-300 transition-colors">✉️</span>
          <span>{lead.email}</span>
        </a>
      {/if}
      {#if lead.website}
        <a
          href={lead.website}
          target="_blank"
          rel="noopener noreferrer external"
          class="group flex items-center gap-2 truncate text-neutral-600 hover:text-primary-600 transition-colors font-bold"
        >
          <span class="bg-neutral-100 border border-neutral-300 p-1 group-hover:bg-primary-50 group-hover:border-primary-300 transition-colors">🌐</span>
          <span class="truncate underline decoration-neutral-400 underline-offset-2 group-hover:decoration-primary-400">{lead.website}</span>
        </a>
      {/if}
      {#if !lead.phone && !lead.email && !lead.website}
        <p class="text-sm text-neutral-400 italic">
          No contact information available
        </p>
      {/if}
    </div>
  {/snippet}

  {#snippet leadCard(lead: Lead)}
    <Card
      variant="flat"
      class="group hover:border-primary-500 p-5 transition-all duration-100"
    >
      <div class="flex gap-4">
        <div class="flex pt-1">
          <input
            type="checkbox"
            aria-label={"Select " + lead.name}
            checked={selectedLeads.has(lead)}
            onchange={() =>
              selectedLeads.has(lead)
                ? selectedLeads.delete(lead)
                : selectedLeads.add(lead)}
            class="border-neutral-800 text-primary-500 focus:ring-primary-400/30 h-5 w-5 cursor-pointer transition-colors accent-primary-500"
          />
        </div>
        <div class="min-w-0 flex-1 space-y-4">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div class="min-w-0 flex-1 space-y-1">
              <h3 class="text-lg font-bold uppercase tracking-wide text-neutral-950 leading-tight group-hover:text-primary-600 transition-colors">
                {#if lead.googleMapsUrl}
                  <a
                    href={lead.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer external"
                    class="hover:underline decoration-2 underline-offset-2 decoration-primary-400"
                  >
                    {lead.name}
                  </a>
                {:else}
                  {lead.name}
                {/if}
              </h3>
              {#if lead.address}
                <p class="font-mono text-xs text-neutral-500 font-bold">{lead.address}</p>
              {/if}
              <p class="font-mono text-[10px] text-neutral-400 font-bold uppercase tracking-[0.2em]">
                {formatTypes(lead.types ?? [])}
              </p>
            </div>
            <div class="flex flex-wrap items-center gap-2">
              {#if lead.businessStatus && lead.businessStatus !== "OPERATIONAL"}
                <Badge variant="soft" tone="neutral" size="sm">
                  {lead.businessStatus.toLowerCase().replace(/_/g, " ")}
                </Badge>
              {/if}
              {#if lead.rating}
                <Badge variant="soft" tone="success" size="sm">
                  {lead.rating.toFixed(1)} <span class="text-[9px] ml-0.5">★</span>
                </Badge>
              {/if}
            </div>
          </div>

          {@render contactRow(lead)}
        </div>
      </div>
    </Card>
  {/snippet}

  {#if showLoadingState}
    {@render loadingState()}
  {:else if showEmptyState}
    {@render emptyState()}
  {/if}

  {#if hasLeads}
    <div class="space-y-3">
      {#each leads as lead (lead.placeId)}
        {@render leadCard(lead)}
      {/each}
    </div>
  {/if}

  {#if isLoading && hasLeads}
    <div
      class="border-2 border-secondary-500 bg-secondary-100 text-secondary-800 px-4 py-3 font-mono text-xs font-bold uppercase tracking-wider"
    >
      Searching for more leads…
    </div>
  {/if}
</section>

{#if hasSelection}
  <div
    class="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 sm:left-4 sm:translate-x-0"
  >
    <FloatingPill
      role="region"
      aria-label="Lead selection actions"
      className="w-[min(28rem,calc(100vw-2rem))] justify-between border-neutral-800 bg-neutral-950"
    >
      <div
        class="flex w-full flex-wrap items-center justify-between gap-3"
      >
        <div class="font-mono text-xs font-bold uppercase tracking-wider text-neutral-100">
          {selectionLabel}
        </div>
        <div class="flex items-center gap-2">
          <Button variant="ghost" size="sm" class="text-neutral-300 hover:text-white hover:bg-neutral-800" onclick={clearSelection}>
            Discard
          </Button>
          <Button size="sm" onclick={() => (isModalOpen = true)}>
            Add
          </Button>
        </div>
      </div>
    </FloatingPill>
  </div>
{/if}

<LeadProjectModal
  open={isModalOpen}
  {selectedLeads}
  onClose={(type) => {
    if (type === "success") {
      clearSelection();
    }
    isModalOpen = false;
  }}
/>
