<script lang="ts">
  import { Badge, Breadcrumbs, Button, Card } from "@leader/ui";
  import { resolve } from "$app/paths";
  import { getLeads } from "$lib/remote/leads.remote";
  import LeadManualCreateForm from "../lead-manual-create-form.svelte";

  const leads = $derived(await getLeads());
</script>

<div class="leader-page">
  <div class="leader-stack">
    <header class="space-y-2">
      <Breadcrumbs items={[{ label: "Leads" }]} />
      <div class="flex flex-wrap items-center justify-between gap-3">
        <h1 class="leader-headline">All Leads</h1>
        <LeadManualCreateForm />
      </div>
      <p class="leader-copy max-w-2xl">
        Review every saved lead, enrich details, and jump directly into follow
        up actions from one place.
      </p>
    </header>

    {#if leads.length === 0}
      <Card variant="flat" class="p-8 text-center border-dashed">
        <div class="mx-auto max-w-sm space-y-3">
          <div
            class="mx-auto flex h-16 w-16 items-center justify-center border-2 border-dashed border-neutral-400 bg-neutral-100 text-neutral-500"
          >
            <span class="font-mono text-2xl font-bold">?</span>
          </div>
          <h3 class="text-base font-bold uppercase tracking-wider text-neutral-900">
            No leads yet
          </h3>
          <p class="font-mono text-xs text-neutral-500">
            Discover leads and add them to your projects to manage them
            here.
          </p>
          <a href={resolve("/")}>
            <Button size="sm">Discover Leads</Button>
          </a>
        </div>
      </Card>
    {:else}
      <div class="space-y-3">
        {#each leads as lead (lead.id)}
          <a href={resolve(`/leads/${lead.id}`)} class="group block">
            <Card
              variant="flat"
              class="p-5 transition-colors group-hover:border-primary-500"
            >
              <div class="space-y-3">
                <div
                  class="flex flex-wrap items-start justify-between gap-3"
                >
                  <div class="min-w-0 flex-1 space-y-1">
                    <h3 class="text-base font-bold uppercase tracking-wide text-neutral-900 group-hover:text-primary-600 transition-colors">
                      {lead.name}
                    </h3>
                    <p class="font-mono text-xs text-neutral-500 font-bold">{lead.placeId}</p>
                  </div>
                  <Badge variant="soft" tone="accent" size="sm">
                    {lead.projectCount}
                    {lead.projectCount === 1 ? "project" : "projects"}
                  </Badge>
                </div>

                <div
                  class="border-neutral-800 flex flex-wrap items-center gap-x-5 gap-y-2 border-t-2 pt-3 font-mono text-xs"
                >
                  {#if lead.email}
                    <span
                      class="flex items-center gap-2 text-neutral-600 font-bold"
                      ><span class="bg-neutral-100 border border-neutral-300 p-1">✉️</span>
                      {lead.email}</span
                    >
                  {/if}
                  {#if lead.phone}
                    <span
                      class="flex items-center gap-2 text-neutral-600 font-bold"
                      ><span class="bg-neutral-100 border border-neutral-300 p-1">📞</span>
                      {lead.phone}</span
                    >
                  {/if}
                  {#if lead.website}
                    <span
                      class="flex items-center gap-2 truncate text-neutral-600 font-bold"
                      ><span class="bg-neutral-100 border border-neutral-300 p-1">🌐</span>
                      <span class="truncate">{lead.website}</span></span
                    >
                  {/if}
                  {#if !lead.email && !lead.phone && !lead.website}
                    <p class="text-neutral-400 italic">
                      No contact details yet
                    </p>
                  {/if}
                </div>
              </div>
            </Card>
          </a>
        {/each}
      </div>
    {/if}
  </div>
</div>
