<script lang="ts">
  import type { Lead } from "$lib/leads/types";
  import { getProjects } from "$lib/remote/projects.remote";
  import type { Project } from "$lib/projects/types";
  import { untrack } from "svelte";
  import LeadProjectCreateForm from "./lead-project-create-form.svelte";
  import LeadProjectExistingForm from "./lead-project-existing-form.svelte";
  import { Dialog, Tabs } from "@leader/ui";
  import type { SvelteSet } from "svelte/reactivity";

  type LeadProjectModalProps = {
    open: boolean;
    selectedLeads: SvelteSet<Lead>;
    onClose: (type: "cancel" | "success") => void;
  };

  let { open, selectedLeads, onClose }: LeadProjectModalProps = $props();

  const projectsResource = getProjects();
  const projects = $derived((projectsResource.current ?? []) as Project[]);
  let mode = $state<"existing" | "create">(
    untrack(() => (projects.length > 0 ? "existing" : "create"))
  );

  const selectedCount = $derived(selectedLeads.size);
  const tabs = $derived([
    {
      value: "existing",
      label: "Existing",
      disabled: projects.length === 0,
    },
    { value: "create", label: "New" },
  ]);

  const onCancel = () => {
    onClose("cancel");
  };

  const onSuccess = () => {
    onClose("success");
  };

  const handleWindowKeydown = (event: KeyboardEvent) => {
    if (event.key === "Escape" && open) {
      onCancel();
    }
  };
</script>

<svelte:window onkeydown={handleWindowKeydown} />

<Dialog {open} onClose={onCancel} className="max-w-lg">
  <div class="p-6">
    <div class="space-y-2">
      <p
        class="text-secondary-600 text-xs font-bold tracking-widest uppercase"
      >
        Add leads to a project
      </p>
      <h2 class="text-xl font-bold font-display text-neutral-900">
        Choose where to save {selectedCount} lead{selectedCount === 1
          ? ""
          : "s"}
      </h2>
      <p class="text-sm text-neutral-500">
        Switch tabs to use an existing project or create a new one.
      </p>
    </div>

    <div class="mt-5">
      <Tabs {tabs} bind:value={mode} />
    </div>

    {#if mode === "existing"}
      <LeadProjectExistingForm
        {selectedLeads}
        {projects}
        {onCancel}
        {onSuccess}
      />
    {:else}
      <LeadProjectCreateForm {selectedLeads} {onCancel} {onSuccess} />
    {/if}
  </div>
</Dialog>
