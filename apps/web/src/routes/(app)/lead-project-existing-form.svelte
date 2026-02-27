<script lang="ts">
  import type { Lead } from "$lib/leads/types";
  import { addLeadsToProject } from "$lib/remote/projects.remote";
  import type { Project } from "$lib/projects/types";
  import { Button } from "@leader/ui";
  import HiddenInput from "./hidden-input.svelte";
  import type { SvelteSet } from "svelte/reactivity";
  import { getTextFieldName } from "$lib/utils/form-helpers";

  type LeadProjectExistingFormProps = {
    selectedLeads: SvelteSet<Lead>;
    projects: Project[];
    onCancel: () => void;
    onSuccess: () => void;
  };

  let {
    selectedLeads,
    projects,
    onCancel,
    onSuccess,
  }: LeadProjectExistingFormProps = $props();

  let errorMessage = $state("");
  let selectedProjectId = $derived(projects[0]?.id ?? "");

  const existingAddLeadsForm = addLeadsToProject.for("existing-project");
  const isSubmitting = $derived(existingAddLeadsForm.pending > 0);
  const selectedLeadsList = $derived(Array.from(selectedLeads));

  const addLeadsToExistingProjectForm = existingAddLeadsForm.enhance(
    async ({ submit }) => {
      errorMessage = "";

      if (selectedLeads.size === 0) {
        errorMessage = "Select at least one lead.";
        return;
      }

      if (!selectedProjectId) {
        errorMessage = "Select a project to continue.";
        return;
      }

      try {
        await submit();
        onSuccess();
      } catch (error) {
        console.error(error);
        errorMessage = "Unable to add leads. Try again.";
      }
    }
  );

  const handleExistingProjectChange = (event: Event) => {
    selectedProjectId = (event.currentTarget as HTMLSelectElement).value;
  };
</script>

<div class="mt-4 space-y-3">
  <form class="space-y-3" {...addLeadsToExistingProjectForm}>
    <HiddenInput
      name={getTextFieldName(existingAddLeadsForm.fields.projectId)}
      value={selectedProjectId}
    />

    {#each selectedLeadsList as lead, leadIndex (leadIndex)}
      <input
        {...existingAddLeadsForm.fields.leads[leadIndex].placeId.as(
          "hidden",
          lead.placeId
        )}
      />
      <input
        {...existingAddLeadsForm.fields.leads[leadIndex].name.as(
          "hidden",
          lead.name
        )}
      />

      <HiddenInput
        name={getTextFieldName(
          existingAddLeadsForm.fields.leads[leadIndex].address
        )}
        value={lead.address}
      />

      {#each lead.types as type, typeIndex (typeIndex)}
        <input
          {...existingAddLeadsForm.fields.leads[leadIndex].types[
            typeIndex
          ].as("hidden", type)}
        />
      {/each}

      <HiddenInput
        name={getTextFieldName(
          existingAddLeadsForm.fields.leads[leadIndex].website
        )}
        value={lead.website}
      />

      <HiddenInput
        name={getTextFieldName(
          existingAddLeadsForm.fields.leads[leadIndex].email
        )}
        value={lead.email}
      />

      <HiddenInput
        name={getTextFieldName(
          existingAddLeadsForm.fields.leads[leadIndex].emailSource
        )}
        value={lead.emailSource}
      />

      <HiddenInput
        name={getTextFieldName(
          existingAddLeadsForm.fields.leads[leadIndex].phone
        )}
        value={lead.phone}
      />
      <HiddenInput
        name={existingAddLeadsForm.fields.leads[leadIndex].rating.as(
          "number"
        ).name}
        value={lead.rating}
      />
      <HiddenInput
        name={existingAddLeadsForm.fields.leads[leadIndex].ratingsTotal.as(
          "number"
        ).name}
        value={lead.ratingsTotal}
      />
      <HiddenInput
        name={getTextFieldName(
          existingAddLeadsForm.fields.leads[leadIndex].googleMapsUrl
        )}
        value={lead.googleMapsUrl}
      />

      <HiddenInput
        name={getTextFieldName(
          existingAddLeadsForm.fields.leads[leadIndex].businessStatus
        )}
        value={lead.businessStatus}
      />
    {/each}

    <div class="space-y-2">
      <label class="text-sm font-semibold text-neutral-700" for="project">
        Project
      </label>
      <select
        id="project"
        class="border-neutral-200 focus-visible:border-primary-500 focus-visible:ring-primary-500/20 w-full rounded-xl border bg-white px-3 py-2 text-sm text-neutral-900 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
        value={selectedProjectId}
        onchange={handleExistingProjectChange}
        disabled={projects.length === 0}
      >
        {#if projects.length === 0}
          <option value="">No projects yet</option>
        {:else}
          {#each projects as project (project.id)}
            <option value={project.id}>{project.name}</option>
          {/each}
        {/if}
      </select>
    </div>

    <div class="mt-4 flex flex-wrap items-center justify-end gap-2">
      <Button
        variant="ghost"
        type="button"
        onclick={onCancel}
        disabled={isSubmitting}
      >
        Cancel
      </Button>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Adding..." : "Add to project"}
      </Button>
    </div>
  </form>

  {#if errorMessage}
    <p
      class="border-destructive-200 bg-destructive-50/90 text-destructive-700 rounded-xl border px-3 py-2 text-sm"
    >
      {errorMessage}
    </p>
  {/if}
</div>
