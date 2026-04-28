<script lang="ts">
  import { watch } from "runed";
  import { createManualLead, getLeads } from "$lib/remote/leads.remote";
  import {
    addLeadsToProject,
    getProjects,
  } from "$lib/remote/projects.remote";
  import { Button, Dialog, Field, Input, Tabs } from "@leader/ui";
  import HiddenInput from "./hidden-input.svelte";
  import { getTextFieldName } from "$lib/utils/form-helpers";

  type LeadManualCreateFormProps = {
    projectId?: string;
    linkedLeadPlaceIds?: string[];
  };

  let { projectId, linkedLeadPlaceIds = [] }: LeadManualCreateFormProps =
    $props();

  // The dialog is closed by default, so use the query resources directly
  // instead of top-level async deriveds that would trigger await_waterfall.
  const projectsQuery = getProjects();
  const leadsQuery = getLeads();
  const projects = $derived(
    (projectsQuery.current ?? []) as NonNullable<
      typeof projectsQuery.current
    >
  );
  const leads = $derived(
    (leadsQuery.current ?? []) as NonNullable<typeof leadsQuery.current>
  );
  const existingAddLeadForm = addLeadsToProject.for(
    "project-existing-lead"
  );
  const isSubmittingManual = $derived(createManualLead.pending > 0);
  const isSubmittingExisting = $derived(existingAddLeadForm.pending > 0);
  const availableLeads = $derived(
    projectId
      ? leads.filter((lead) => !linkedLeadPlaceIds.includes(lead.placeId))
      : []
  );
  const selectedLead = $derived(
    availableLeads.find((lead) => lead.id === selectedLeadId) ?? null
  );
  const modeTabs = $derived([
    {
      value: "existing",
      label: "Existing",
      disabled: !projectId || availableLeads.length === 0,
    },
    { value: "new", label: "New" },
  ]);

  let open = $state(false);
  let errorMessage = $state("");
  let mode = $state<"existing" | "new">("new");
  let selectedLeadId = $state("");

  watch([() => projectId, () => availableLeads], ([pid, leads]) => {
    if (!pid) return;

    if (leads.length === 0) {
      mode = "new";
      selectedLeadId = "";
      return;
    }

    if (!selectedLeadId || !leads.some((lead) => lead.id === selectedLeadId)) {
      selectedLeadId = leads[0]?.id ?? "";
    }
  });

  const closeDialog = () => {
    open = false;
    errorMessage = "";
  };

  const openDialog = () => {
    errorMessage = "";
    mode = projectId && availableLeads.length > 0 ? "existing" : "new";
    selectedLeadId = availableLeads[0]?.id ?? "";
    createManualLead.fields.set({
      projectId: projectId ?? projects[0]?.id ?? "",
      name: "",
      address: undefined,
      website: undefined,
      email: undefined,
      phone: undefined,
    });
    open = true;
  };

  const manualLeadForm = createManualLead.enhance(async ({ submit }) => {
    errorMessage = "";

    if (!projectId && projects.length === 0) {
      errorMessage = "Create a project first to add a lead.";
      return;
    }

    try {
      await submit();
      closeDialog();
    } catch (error) {
      console.error(error);
      errorMessage = "Unable to create lead. Try again.";
    }
  });

  const existingLeadForm = existingAddLeadForm.enhance(
    async ({ submit }) => {
      errorMessage = "";

      if (!projectId) {
        errorMessage = "Project is required.";
        return;
      }

      if (!selectedLead) {
        errorMessage = "Select an existing lead to continue.";
        return;
      }

      try {
        await submit();
        closeDialog();
      } catch (error) {
        console.error(error);
        errorMessage = "Unable to add lead. Try again.";
      }
    }
  );

  const handleExistingLeadChange = (event: Event) => {
    selectedLeadId = (event.currentTarget as HTMLSelectElement).value;
  };
</script>

<Button size="sm" onclick={openDialog}>Add lead</Button>

<Dialog {open} onClose={closeDialog} className="max-w-lg">
  <div class="space-y-4 p-6">
    <div class="space-y-1">
      <h2 class="text-lg font-semibold text-neutral-900">Add lead</h2>
      <p class="text-sm text-neutral-500">
        {#if projectId}
          Select an existing lead or create a new one.
        {:else}
          Add a lead directly and link it to one of your projects.
        {/if}
      </p>
    </div>

    {#if projectId}
      <Tabs tabs={modeTabs} bind:value={mode} />
    {/if}

    {#if projectId && mode === "existing"}
      <form class="space-y-3" {...existingLeadForm}>
        <HiddenInput
          name={getTextFieldName(existingAddLeadForm.fields.projectId)}
          value={projectId}
        />

        {#if selectedLead}
          <input
            {...existingAddLeadForm.fields.leads[0].placeId.as(
              "hidden",
              selectedLead.placeId
            )}
          />
          <input
            {...existingAddLeadForm.fields.leads[0].name.as(
              "hidden",
              selectedLead.name
            )}
          />
          <HiddenInput
            name={getTextFieldName(
              existingAddLeadForm.fields.leads[0].website
            )}
            value={selectedLead.website}
          />
          <HiddenInput
            name={getTextFieldName(
              existingAddLeadForm.fields.leads[0].email
            )}
            value={selectedLead.email}
          />
          <HiddenInput
            name={getTextFieldName(
              existingAddLeadForm.fields.leads[0].phone
            )}
            value={selectedLead.phone}
          />
          <HiddenInput
            name={existingAddLeadForm.fields.leads[0].rating.as("number")
              .name}
            value={selectedLead.rating}
          />
        {/if}

        <Field.Field>
          <Field.Label for="existing-lead">Existing lead</Field.Label>
          <select
            id="existing-lead"
            class="border-secondary-200/70 focus-visible:border-secondary-300 focus-visible:ring-secondary-400/30 w-full rounded-xl border bg-white px-3 py-2 text-sm text-neutral-900 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            value={selectedLeadId}
            onchange={handleExistingLeadChange}
            disabled={availableLeads.length === 0}
          >
            {#if availableLeads.length === 0}
              <option value="">No available leads</option>
            {:else}
              {#each availableLeads as lead (lead.id)}
                <option value={lead.id}>
                  {lead.name}
                  {lead.email ? ` (${lead.email})` : ""}
                </option>
              {/each}
            {/if}
          </select>
        </Field.Field>

        {#if availableLeads.length === 0}
          <p class="text-sm text-neutral-500">
            No unlinked leads available. Create a new lead instead.
          </p>
        {/if}

        <div class="flex justify-end gap-2 pt-1">
          <Button
            type="button"
            variant="ghost"
            onclick={closeDialog}
            disabled={isSubmittingExisting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmittingExisting ||
              availableLeads.length === 0 ||
              !selectedLeadId}
          >
            {isSubmittingExisting ? "Adding..." : "Add lead"}
          </Button>
        </div>
      </form>
    {:else}
      <form class="space-y-3" {...manualLeadForm}>
        {#if projectId}
          <HiddenInput
            name={getTextFieldName(createManualLead.fields.projectId)}
            value={projectId}
          />
        {:else}
          <Field.Field>
            <Field.Label for="manual-lead-project">Project</Field.Label>
            <select
              id="manual-lead-project"
              class="border-secondary-200/70 focus-visible:border-secondary-300 focus-visible:ring-secondary-400/30 w-full rounded-xl border bg-white px-3 py-2 text-sm text-neutral-900 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              {...createManualLead.fields.projectId.as("text")}
              disabled={projects.length === 0}
            >
              {#if projects.length === 0}
                <option value="">No projects available</option>
              {:else}
                {#each projects as project (project.id)}
                  <option value={project.id}>{project.name}</option>
                {/each}
              {/if}
            </select>
            {#if createManualLead.fields.projectId.issues()}
              <Field.Error>
                {createManualLead.fields.projectId.issues()?.[0]?.message}
              </Field.Error>
            {/if}
          </Field.Field>
        {/if}

        <Field.Field>
          <Field.Label for="manual-lead-name">Name</Field.Label>
          <Input
            id="manual-lead-name"
            placeholder="Acme Corp"
            {...createManualLead.fields.name.as("text")}
          />
          {#if createManualLead.fields.name.issues()}
            <Field.Error>
              {createManualLead.fields.name.issues()?.[0]?.message}
            </Field.Error>
          {/if}
        </Field.Field>

        <Field.Field>
          <Field.Label for="manual-lead-email">Email</Field.Label>
          <Input
            id="manual-lead-email"
            placeholder="name@company.com"
            {...createManualLead.fields.email.as("email")}
          />
        </Field.Field>

        <Field.Field>
          <Field.Label for="manual-lead-phone">Phone</Field.Label>
          <Input
            id="manual-lead-phone"
            placeholder="+1 555 123 4567"
            {...createManualLead.fields.phone.as("text")}
          />
        </Field.Field>

        <Field.Field>
          <Field.Label for="manual-lead-website">Website</Field.Label>
          <Input
            id="manual-lead-website"
            placeholder="https://example.com"
            {...createManualLead.fields.website.as("url")}
          />
        </Field.Field>

        <Field.Field>
          <Field.Label for="manual-lead-address">Address</Field.Label>
          <Input
            id="manual-lead-address"
            placeholder="123 Main St, New York"
            {...createManualLead.fields.address.as("text")}
          />
        </Field.Field>

        <div class="flex justify-end gap-2 pt-1">
          <Button
            type="button"
            variant="ghost"
            onclick={closeDialog}
            disabled={isSubmittingManual}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmittingManual ||
              (!projectId && projects.length === 0)}
          >
            {isSubmittingManual ? "Creating..." : "Create lead"}
          </Button>
        </div>
      </form>
    {/if}

    {#if errorMessage}
      <p
        class="border-destructive-200 bg-destructive-50/90 text-destructive-700 rounded-xl border px-3 py-2 text-sm"
      >
        {errorMessage}
      </p>
    {/if}
  </div>
</Dialog>
