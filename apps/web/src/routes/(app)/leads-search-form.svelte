<script lang="ts">
  import { Badge, Button, Field, Input, Tabs } from "@leader/ui";
  import { discoverLeads, getDiscoveryCapabilities } from "$lib/remote/leads.remote";

  let isLoading = $derived(discoverLeads.pending > 0);
  let inputMode = $state<"search-term" | "project-description">("search-term");
  let responseMessage = $derived(discoverLeads.result?.message ?? "");

  const capabilities = $derived(await getDiscoveryCapabilities());
  const canDescribe = $derived(capabilities.openRouterAvailable);

  const discoveryModeTabs = $derived(
    [
      { value: "search-term", label: "Search term" },
      { value: "project-description", label: "Describe project", disabled: !canDescribe },
    ]
  );

  const leadForm = discoverLeads.enhance(async ({ submit }) => {
    await submit();
  });

  let { source = "" }: { source?: string } = $props();

  discoverLeads.fields.maxResults.set(20);

  $effect(() => {
    if (!canDescribe && inputMode === "project-description") {
      inputMode = "search-term";
    }
  });

  $effect(() => {
    if (inputMode === "search-term") {
      discoverLeads.fields.projectDescription.set("");
      return;
    }

    discoverLeads.fields.searchTerm.set("");
  });
</script>

  <form class="space-y-4" {...leadForm}>
    <div class="flex flex-wrap items-center gap-3">
      <div class="relative">
        <Tabs tabs={discoveryModeTabs} bind:value={inputMode} className="w-fit" />
        {#if !canDescribe}
          <div class="group/tip absolute -top-1 -right-1">
            <div
              class="flex h-4 w-4 cursor-help items-center justify-center border border-neutral-400 bg-neutral-100 font-mono text-[9px] font-bold text-neutral-500"
            >
              ?
            </div>
            <div
              class="pointer-events-none absolute left-1/2 bottom-full mb-2 -translate-x-1/2 opacity-0 transition-opacity group-hover/tip:opacity-100"
            >
              <div
                class="whitespace-nowrap border-2 border-neutral-800 bg-neutral-950 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-neutral-100"
              >
                OPENROUTER_API_KEY not configured
              </div>
            </div>
          </div>
        {/if}
      </div>
      {#if source}
        <Badge variant="soft" tone="accent" size="sm">{source}</Badge>
      {/if}
    </div>

    <div class="grid gap-3 sm:grid-cols-[1fr_160px_80px_auto]">
      {#if inputMode === "search-term"}
        <Field.Field>
          <Input
            id="searchTerm"
            aria-label="Search term"
            placeholder="Boutique gyms"
            {...discoverLeads.fields.searchTerm.as("text")}
          />
          {#if discoverLeads.fields.searchTerm.issues()}
            <Field.Error>
              {discoverLeads.fields.searchTerm.issues()![0].message}
            </Field.Error>
          {/if}
        </Field.Field>
      {:else}
        <Field.Field>
          <Input
            id="projectDescription"
            aria-label="Project description"
            placeholder="AI analytics platform for boutique gyms"
            {...discoverLeads.fields.projectDescription.as("text")}
          />
          {#if discoverLeads.fields.projectDescription.issues()}
            <Field.Error>
              {discoverLeads.fields.projectDescription.issues()![0].message}
            </Field.Error>
          {/if}
        </Field.Field>
      {/if}

      <Field.Field>
        <Input
          id="location"
          aria-label="Location"
          placeholder="Austin, TX"
          {...discoverLeads.fields.location.as("text")}
        />
        {#if discoverLeads.fields.location.issues()}
          <Field.Error>
            {discoverLeads.fields.location.issues()![0].message}
          </Field.Error>
        {/if}
      </Field.Field>

      <Field.Field>
        <Input
          id="maxResults"
          aria-label="Max results"
          min="1"
          max="50"
          {...discoverLeads.fields.maxResults.as("number")}
        />
        {#if discoverLeads.fields.maxResults.issues()}
          <Field.Error>
            {discoverLeads.fields.maxResults.issues()![0].message}
          </Field.Error>
        {/if}
      </Field.Field>

      <Button class="h-10 self-start active:scale-[0.98] transition-all" type="submit" disabled={isLoading}>
        {isLoading ? "Searching…" : "Find"}
      </Button>
    </div>

    {#if responseMessage}
      <p
        class="border-2 border-secondary-500 bg-secondary-100 text-secondary-800 px-3 py-2 font-mono text-xs font-bold"
      >
        {responseMessage}
      </p>
    {/if}
  </form>
