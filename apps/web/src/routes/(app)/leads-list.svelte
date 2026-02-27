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
          class="bg-primary-100 text-primary-600 border-primary-500 mx-auto flex h-16 w-16 animate-pulse items-center justify-center border-2"
        >
          <span class="font-mono text-2xl font-bold">...</span>
        </div>
        <div class="space-y-1">
          <h3
            class="text-lg font-bold tracking-wider text-neutral-900 uppercase"
          >
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
    <Card variant="flat" class="border-dashed p-12 text-center">
      <div class="mx-auto max-w-sm space-y-4">
        <div
          class="mx-auto flex h-16 w-16 items-center justify-center border-2 border-dashed border-neutral-400 bg-neutral-100 text-neutral-500"
        >
          <span class="font-mono text-2xl font-bold">?</span>
        </div>
        <div class="space-y-1">
          <h3
            class="text-lg font-bold tracking-wider text-neutral-900 uppercase"
          >
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
      class="flex flex-wrap items-center gap-x-5 gap-y-2.5 border-t-2 border-neutral-800 pt-3.5 font-mono text-xs"
    >
      {#if lead.phone}
        <a
          href="tel:{lead.phone}"
          class="group hover:text-primary-600 flex items-center gap-2 font-bold text-neutral-600 transition-colors"
        >
          <span
            class="group-hover:bg-primary-50 group-hover:border-primary-300 border border-neutral-300 bg-neutral-100 p-1 transition-colors"
            >📞</span
          >
          <span>{lead.phone}</span>
        </a>
      {/if}
      {#if lead.email}
        <a
          href="mailto:{lead.email}"
          class="group hover:text-primary-600 flex items-center gap-2 font-bold text-neutral-600 transition-colors"
        >
          <span
            class="group-hover:bg-primary-50 group-hover:border-primary-300 border border-neutral-300 bg-neutral-100 p-1 transition-colors"
            >✉️</span
          >
          <span>{lead.email}</span>
        </a>
      {/if}
      {#if lead.website}
        <a
          href={lead.website}
          target="_blank"
          rel="noopener noreferrer external"
          class="group hover:text-primary-600 flex items-center gap-2 truncate font-bold text-neutral-600 transition-colors"
        >
          <span
            class="group-hover:bg-primary-50 group-hover:border-primary-300 border border-neutral-300 bg-neutral-100 p-1 transition-colors"
            >🌐</span
          >
          <span
            class="group-hover:decoration-primary-400 truncate underline decoration-neutral-400 underline-offset-2"
            >{lead.website}</span
          >
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
            class="text-primary-500 focus:ring-primary-400/30 accent-primary-500 h-5 w-5 cursor-pointer border-neutral-800 transition-colors"
          />
        </div>
        <div class="min-w-0 flex-1 space-y-4">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div class="min-w-0 flex-1 space-y-1">
              <h3
                class="group-hover:text-primary-600 text-lg leading-tight font-bold tracking-wide text-neutral-950 uppercase transition-colors"
              >
                {#if lead.googleMapsUrl}
                  <a
                    href={lead.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer external"
                    class="decoration-primary-400 decoration-2 underline-offset-2 hover:underline"
                  >
                    {lead.name}
                  </a>
                {:else}
                  {lead.name}
                {/if}
              </h3>
              {#if lead.address}
                <p class="font-mono text-xs font-bold text-neutral-500">
                  {lead.address}
                </p>
              {/if}
              <p
                class="font-mono text-[10px] font-bold tracking-[0.2em] text-neutral-400 uppercase"
              >
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
                  {lead.rating.toFixed(1)}
                  <span class="ml-0.5 text-[9px]">★</span>
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
      class="border-secondary-500 bg-secondary-100 text-secondary-800 border-2 px-4 py-3 font-mono text-xs font-bold tracking-wider uppercase"
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
        <div
          class="font-mono text-xs font-bold tracking-wider text-neutral-100 uppercase"
        >
          {selectionLabel}
        </div>
        <div class="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            class="text-neutral-300 hover:bg-neutral-800 hover:text-white"
            onclick={clearSelection}
          >
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
