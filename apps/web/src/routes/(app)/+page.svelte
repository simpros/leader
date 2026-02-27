<script lang="ts">
  import LeadsList from "./leads-list.svelte";
  import LeadsSearchForm from "./leads-search-form.svelte";

  let source = $state("");
</script>

<div class="bg-surface-strong border-b-2 border-neutral-800">
  <div class="mx-auto max-w-6xl px-4 py-6 sm:px-6">
    <div class="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <p
          class="text-primary-700 font-mono text-[10px] font-bold tracking-[0.3em] uppercase"
        >
          Discover
        </p>
        <h1
          class="text-2xl font-bold tracking-tight text-neutral-950 uppercase sm:text-3xl"
        >
          Find Customers
        </h1>
      </div>
      <p class="max-w-md text-xs leading-relaxed text-neutral-500">
        Search with a direct term or describe what your project does, then
        turn high-potential businesses into project-ready leads.
      </p>
    </div>
    <LeadsSearchForm {source} />
  </div>
</div>

<div class="leader-page">
  <LeadsList />
</div>
