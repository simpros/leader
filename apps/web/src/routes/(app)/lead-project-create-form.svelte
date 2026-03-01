<script lang="ts">
  import type { Lead } from "$lib/leads/types";
  import { createProjectWithLeads } from "$lib/remote/projects.remote";
  import { Button, Input } from "@leader/ui";
  import HiddenInput from "./hidden-input.svelte";
  import type { SvelteSet } from "svelte/reactivity";
  import { getTextFieldName } from "$lib/utils/form-helpers";

  type LeadProjectCreateFormProps = {
    selectedLeads: SvelteSet<Lead>;
    onCancel: () => void;
    onSuccess: () => void;
  };

  let { selectedLeads, onCancel, onSuccess }: LeadProjectCreateFormProps =
    $props();

  let errorMessage = $state("");

  const isSubmitting = $derived(createProjectWithLeads.pending > 0);
  const selectedLeadsList = $derived(Array.from(selectedLeads));

  const createProjectAndAddLeadsForm = createProjectWithLeads.enhance(
    async ({ submit }) => {
      errorMessage = "";

      if (selectedLeads.size === 0) {
        errorMessage = "Select at least one lead.";
        return;
      }

      try {
        await submit();
        onSuccess();
      } catch (error) {
        console.error(error);
        errorMessage = "Unable to create project. Try again.";
      }
    }
  );
</script>

<div class="mt-4 space-y-3">
  <form class="space-y-3" {...createProjectAndAddLeadsForm}>
    {#each selectedLeadsList as lead, leadIndex (leadIndex)}
      <input
        {...createProjectWithLeads.fields.leads[leadIndex].placeId.as(
          "hidden",
          lead.placeId
        )}
      />
      <input
        {...createProjectWithLeads.fields.leads[leadIndex].name.as(
          "hidden",
          lead.name
        )}
      />

      <HiddenInput
        name={getTextFieldName(
          createProjectWithLeads.fields.leads[leadIndex].address
        )}
        value={lead.address}
      />

      {#each lead.types as type, typeIndex (typeIndex)}
        <input
          {...createProjectWithLeads.fields.leads[leadIndex].types[
            typeIndex
          ].as("hidden", type)}
        />
      {/each}

      <HiddenInput
        name={getTextFieldName(
          createProjectWithLeads.fields.leads[leadIndex].website
        )}
        value={lead.website}
      />

      <HiddenInput
        name={getTextFieldName(
          createProjectWithLeads.fields.leads[leadIndex].email
        )}
        value={lead.email}
      />

      <HiddenInput
        name={getTextFieldName(
          createProjectWithLeads.fields.leads[leadIndex].phone
        )}
        value={lead.phone}
      />

      <HiddenInput
        name={createProjectWithLeads.fields.leads[leadIndex].rating.as(
          "number"
        ).name}
        value={lead.rating}
      />

      <HiddenInput
        name={createProjectWithLeads.fields.leads[
          leadIndex
        ].ratingsTotal.as("number").name}
        value={lead.ratingsTotal}
      />
      <HiddenInput
        name={getTextFieldName(
          createProjectWithLeads.fields.leads[leadIndex].googleMapsUrl
        )}
        value={lead.googleMapsUrl}
      />

      <HiddenInput
        name={getTextFieldName(
          createProjectWithLeads.fields.leads[leadIndex].businessStatus
        )}
        value={lead.businessStatus}
      />
    {/each}

    <div class="space-y-2">
      <label
        class="text-sm font-semibold text-neutral-700"
        for="project-name"
      >
        Project name
      </label>
      <Input
        placeholder="e.g. Growth outreach"
        {...createProjectWithLeads.fields.name.as("text")}
      />
    </div>
    <div class="space-y-2">
      <label
        class="text-sm font-semibold text-neutral-700"
        for="project-description"
      >
        Description (optional)
      </label>
      <textarea
        class="focus-visible:border-primary-500 focus-visible:ring-primary-500/20 min-h-24 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 transition-all duration-200 placeholder:text-neutral-400 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
        placeholder="Target audience, notes, or goals"
        {...createProjectWithLeads.fields.description.as("text")}
      ></textarea>
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
