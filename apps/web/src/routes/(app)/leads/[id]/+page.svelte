<script lang="ts">
  import { resolve } from "$app/paths";
  import { goto } from "$app/navigation";
  import {
    Badge,
    Breadcrumbs,
    Button,
    Card,
    Field,
    Input,
  } from "@leader/ui";
  import {
    createProjectCustomField,
    deleteLead,
    getLeadData,
    updateLeadCore,
    upsertLeadCustomFieldValue,
  } from "$lib/remote/leads.remote.js";

  const { params } = $props();
  const leadData = $derived(await getLeadData(params.id));

  let confirmingDelete = $state(false);
  let deleteError = $state<string | null>(null);

  const isDeleting = $derived(deleteLead.pending > 0);

  const deleteForm = deleteLead.enhance(async ({ submit }) => {
    deleteError = null;
    try {
      await submit();
      await goto(resolve("/leads"));
    } catch (err) {
      console.error("Failed to delete lead:", err);
      deleteError = "Failed to delete lead. Please try again.";
    }
  });

  const coreForm = updateLeadCore.enhance(async ({ submit }) => {
    await submit();
  });

  const createFieldForm = createProjectCustomField.enhance(
    async ({ submit }) => {
      await submit();
    }
  );

  const customFieldValueForm = upsertLeadCustomFieldValue.enhance(
    async ({ submit }) => {
      await submit();
    }
  );

  const emailSourceOptions = [
    "",
    "website",
    "brave",
  ] as const;

  $effect(() => {
    updateLeadCore.fields.set({
      leadId: leadData.lead.id,
      name: leadData.lead.name,
      email: leadData.lead.email ?? undefined,
      phone: leadData.lead.phone ?? undefined,
      website: leadData.lead.website ?? undefined,
      address: leadData.lead.address ?? undefined,
      emailSource: leadData.lead.emailSource as
        | (typeof emailSourceOptions)[number]
        | undefined,
    });
  });
</script>

<div class="leader-page">
  <div class="flex flex-col gap-6">
    <header class="space-y-1.5">
      <Breadcrumbs
        items={[
          { label: "Leads", href: resolve("/leads") },
          { label: leadData.lead.name },
        ]}
      />
      <div class="flex flex-wrap items-center gap-2">
        <h1 class="text-2xl font-bold uppercase tracking-tight text-neutral-950">
          {leadData.lead.name}
        </h1>
        <Badge variant="soft" tone="neutral" size="sm">
          {leadData.lead.placeId}
        </Badge>
      </div>
      {#if leadData.lead.googleMapsUrl}
        <a
          href={leadData.lead.googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer external"
          class="text-primary-500 hover:text-primary-600 hover:underline decoration-primary-400 underline-offset-4 inline-block font-mono text-xs font-bold uppercase tracking-wider transition-all"
        >
          Open in Google Maps →
        </a>
      {/if}
      <div class="flex flex-wrap items-center gap-2 pt-1">
        {#if confirmingDelete}
          <div class="flex items-center gap-2">
            <span class="font-mono text-xs font-bold text-red-700">Delete this lead from all projects?</span>
            <form {...deleteForm}>
              <input
                {...deleteLead.fields.leadId.as("hidden", leadData.lead.id)}
              />
              <Button type="submit" size="sm" color="secondary" disabled={isDeleting}>
                {isDeleting ? "Deleting…" : "Confirm Delete"}
              </Button>
            </form>
            <Button
              variant="ghost"
              color="neutral"
              size="sm"
              onclick={() => {
                confirmingDelete = false;
                deleteError = null;
              }}
              disabled={isDeleting}
            >
              Cancel
            </Button>
          </div>
        {:else}
          <Button
            variant="ghost"
            color="secondary"
            size="sm"
            onclick={() => (confirmingDelete = true)}
          >
            Delete
          </Button>
        {/if}
        {#if deleteError}
          <p class="text-xs text-red-600">{deleteError}</p>
        {/if}
      </div>
    </header>

    <div class="grid gap-6 lg:grid-cols-[1fr_1fr]">
      <Card variant="flat" class="space-y-4 p-5">
        <div class="space-y-1">
          <h2 class="text-lg font-bold uppercase tracking-wider text-neutral-950">Core Fields</h2>
          <p class="font-mono text-xs text-neutral-500">
            Changes here update this lead everywhere it appears.
          </p>
        </div>

        <form class="space-y-3" {...coreForm}>
          <input
            {...updateLeadCore.fields.leadId.as("hidden", leadData.lead.id)}
          />

          <Field.Field>
            <Field.Label for="name">Name</Field.Label>
            <Input id="name" {...updateLeadCore.fields.name.as("text")} />
            {#if updateLeadCore.fields.name.issues()}
              <Field.Error>
                {updateLeadCore.fields.name.issues()?.[0]?.message}
              </Field.Error>
            {/if}
          </Field.Field>

          <Field.Field>
            <Field.Label for="email">Email</Field.Label>
            <Input
              id="email"
              placeholder="name@company.com"
              {...updateLeadCore.fields.email.as("email")}
            />
            {#if updateLeadCore.fields.email.issues()}
              <Field.Error>
                {updateLeadCore.fields.email.issues()?.[0]?.message}
              </Field.Error>
            {/if}
          </Field.Field>

          <Field.Field>
            <Field.Label for="phone">Phone</Field.Label>
            <Input
              id="phone"
              placeholder="+1 555 123 4567"
              {...updateLeadCore.fields.phone.as("text")}
            />
            {#if updateLeadCore.fields.phone.issues()}
              <Field.Error>
                {updateLeadCore.fields.phone.issues()?.[0]?.message}
              </Field.Error>
            {/if}
          </Field.Field>

          <Field.Field>
            <Field.Label for="website">Website</Field.Label>
            <Input
              id="website"
              placeholder="https://example.com"
              {...updateLeadCore.fields.website.as("url")}
            />
            {#if updateLeadCore.fields.website.issues()}
              <Field.Error>
                {updateLeadCore.fields.website.issues()?.[0]?.message}
              </Field.Error>
            {/if}
          </Field.Field>

          <Field.Field>
            <Field.Label for="address">Address</Field.Label>
            <Input
              id="address"
              {...updateLeadCore.fields.address.as("text")}
            />
            {#if updateLeadCore.fields.address.issues()}
              <Field.Error>
                {updateLeadCore.fields.address.issues()?.[0]?.message}
              </Field.Error>
            {/if}
          </Field.Field>

          <label class="flex flex-col gap-2">
            <span class="font-mono text-xs font-bold uppercase tracking-wider text-neutral-800"
              >Email Source</span
            >
            <select
              name={updateLeadCore.fields.emailSource.as("text").name}
              value={leadData.lead.emailSource ?? ""}
              class="border-2 border-neutral-800 focus-visible:border-primary-600 focus-visible:ring-primary-400/40 h-10 w-full bg-surface px-3 py-2 font-mono text-sm text-neutral-900 transition-all duration-100 focus-visible:ring-2 focus-visible:ring-offset-2 ring-offset-background focus-visible:outline-none"
            >
              {#each emailSourceOptions as source (source)}
                <option value={source}>
                  {source || "Not set"}
                </option>
              {/each}
            </select>
            {#if updateLeadCore.fields.emailSource.issues()}
              <p class="font-mono text-xs font-bold uppercase text-destructive-600">
                {updateLeadCore.fields.emailSource.issues()?.[0]?.message}
              </p>
            {/if}
          </label>

          <div class="flex justify-end">
            <Button type="submit" disabled={updateLeadCore.pending > 0}>
              {updateLeadCore.pending > 0 ? "Saving…" : "Save Core Fields"}
            </Button>
          </div>
        </form>
      </Card>

      <Card variant="flat" class="space-y-4 p-5">
        <div class="space-y-1">
          <h2 class="text-lg font-bold uppercase tracking-wider text-neutral-950">
            Custom Fields
          </h2>
          <p class="font-mono text-xs text-neutral-500">
            Add project-specific fields and set values for this lead.
          </p>
        </div>

        <form
          class="space-y-3"
          {...createFieldForm}
        >
          <input
            {...createProjectCustomField.fields.leadId.as(
              "hidden",
              leadData.lead.id
            )}
          />

          <Field.Field>
            <Field.Label for="field-name">Field Name</Field.Label>
            <Input
              id="field-name"
              placeholder="e.g. Outreach status"
              {...createProjectCustomField.fields.name.as("text")}
            />
            {#if createProjectCustomField.fields.name.issues()}
              <Field.Error>
                {createProjectCustomField.fields.name.issues()?.[0]?.message}
              </Field.Error>
            {/if}
          </Field.Field>

          <div class="grid gap-3 sm:grid-cols-[1fr_auto]">
            <label class="flex flex-col gap-2">
              <span class="font-mono text-xs font-bold uppercase tracking-wider text-neutral-800">
                Project
              </span>
              <select
                class="border-2 border-neutral-800 focus-visible:border-primary-600 focus-visible:ring-primary-400/40 h-10 w-full bg-surface px-3 py-2 font-mono text-sm text-neutral-900 transition-all duration-100 focus-visible:ring-2 focus-visible:ring-offset-2 ring-offset-background focus-visible:outline-none"
                {...createProjectCustomField.fields.projectId.as("text")}
              >
                {#each leadData.customFieldSections as section (section.projectId)}
                  <option value={section.projectId}>
                    {section.projectName}
                  </option>
                {/each}
              </select>
            </label>

            <div class="flex items-end">
              <Button
                type="submit"
                class="w-full"
                disabled={createProjectCustomField.pending > 0}
              >
                {createProjectCustomField.pending > 0
                  ? "Adding…"
                  : "Add Field"}
              </Button>
            </div>
          </div>
        </form>

        <div class="space-y-4">
          {#each leadData.customFieldSections as section (section.projectId)}
            <div class="border-2 border-neutral-800 bg-neutral-50 p-4">
              <div class="mb-4 flex items-center justify-between gap-3">
                <h3 class="text-sm font-bold text-neutral-900">
                  {section.projectName}
                </h3>
                <Badge variant="soft" tone="accent" size="sm">
                  {section.fields.length}
                </Badge>
              </div>

              {#if section.fields.length === 0}
                <p class="text-sm text-neutral-400 italic">
                  No custom fields yet
                </p>
              {:else}
                <div class="space-y-2">
                  {#each section.fields as field (field.id)}
                    <form
                      class="grid gap-2 sm:grid-cols-[120px_1fr_auto]"
                      {...customFieldValueForm}
                    >
                      <input
                        {...upsertLeadCustomFieldValue.fields.leadId.as(
                          "hidden",
                          leadData.lead.id
                        )}
                      />
                      <input
                        {...upsertLeadCustomFieldValue.fields.projectCustomFieldId.as(
                          "hidden",
                          field.id
                        )}
                      />

                      <label
                        for={field.id}
                        class="self-center font-mono text-xs font-bold uppercase tracking-wider text-neutral-800"
                      >
                        {field.name}
                      </label>
                      <Input
                        id={field.id}
                        name={upsertLeadCustomFieldValue.fields.value.as(
                          "text"
                        ).name}
                        value={field.value ?? ""}
                        placeholder={field.name}
                      />
                      <Button
                        type="submit"
                        variant="outline"
                        color="secondary"
                        disabled={upsertLeadCustomFieldValue.pending > 0}
                      >
                        Save
                      </Button>
                    </form>
                  {/each}
                </div>
              {/if}
            </div>
          {/each}
        </div>
      </Card>
    </div>
  </div>
</div>
