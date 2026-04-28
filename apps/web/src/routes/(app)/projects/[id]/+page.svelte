<script lang="ts">
  import { Badge, Breadcrumbs, Button, Card, Tabs } from "@leader/ui";
  import {
    deleteProject,
    getProjectData,
    getProjects,
    unlinkLeadFromProject,
    updateProject,
  } from "$lib/remote/projects.remote.js";
  import {
    getProjectInitiatives,
    retryInitiativeLead,
    sendInitiative,
  } from "$lib/remote/initiatives.remote.js";
  import { goto } from "$app/navigation";
  import { resolve } from "$app/paths";
  import { page } from "$app/state";
  import { createSearchParamsSchema, useSearchParams } from "runed/kit";
  import { toast } from "svelte-sonner";
  import { fade, fly } from "svelte/transition";
  import LeadManualCreateForm from "../../lead-manual-create-form.svelte";

  const { params, data } = $props();
  const dateLocale = $derived(data.locale ?? "en-US");
  const projectPageData = $derived(
    await Promise.all([
      getProjectData(params.id),
      getProjectInitiatives(params.id),
    ])
  );
  const projectData = $derived(projectPageData[0]);
  const projectInitiatives = $derived(projectPageData[1]);
  const initiatives = $derived(projectInitiatives ?? []);

  const formatTypes = (types?: string[]) =>
    types && types.length ? types.slice(0, 4).join(" · ") : "";

  const formatDate = (value: Date | null) =>
    value ? new Date(value).toLocaleString(dateLocale) : "Not sent yet";

  const projectTabs: { value: "initiatives" | "leads"; label: string }[] =
    [
      { value: "initiatives", label: "Initiatives" },
      { value: "leads", label: "Leads" },
    ];

  let activeTab = $state<"initiatives" | "leads">("initiatives");
  let confirmingInitiativeId = $state<string | null>(null);
  let sendError = $state<string | null>(null);
  let retryError = $state<string | null>(null);
  let retryingLeadId = $state<string | null>(null);
  let unlinkError = $state<string | null>(null);
  let unlinkingLeadId = $state<string | null>(null);
  let confirmingDelete = $state(false);
  let deleteError = $state<string | null>(null);
  let isEditing = $state(false);
  let updateError = $state<string | null>(null);

  const isSending = $derived(sendInitiative.pending > 0);
  const isRetrying = $derived(retryInitiativeLead.pending > 0);
  const isUnlinking = $derived(unlinkLeadFromProject.pending > 0);
  const isDeleting = $derived(deleteProject.pending > 0);
  const isUpdating = $derived(updateProject.pending > 0);

  const deleteForm = deleteProject.enhance(async ({ submit }) => {
    deleteError = null;
    try {
      await submit().updates(getProjects());
      toast.success("Project deleted");
      await goto(resolve("/projects"));
    } catch (err) {
      console.error("Failed to delete project:", err);
      deleteError = "Failed to delete project. Please try again.";
    }
  });

  const editForm = updateProject.enhance(async ({ submit }) => {
    updateError = null;
    try {
      await submit();
      isEditing = false;
    } catch (err) {
      console.error("Failed to update project:", err);
      updateError = "Failed to update project. Please try again.";
    }
  });

  $effect(() => {
    updateProject.fields.set({
      projectId: projectData.project.id,
      name: projectData.project.name,
      description: projectData.project.description ?? undefined,
    });
  });

  const sendForm = sendInitiative.enhance(async ({ submit }) => {
    sendError = null;
    try {
      await submit();
      confirmingInitiativeId = null;
    } catch (err) {
      console.error("Failed to send initiative:", err);
      sendError = "Failed to send initiative. Please try again.";
    }
  });

  const retryForm = retryInitiativeLead.enhance(
    async ({ submit, data }) => {
      retryError = null;
      retryingLeadId = data.initiativeLeadId;
      try {
        await submit();
        retryingLeadId = null;
      } catch (err) {
        console.error("Failed to retry email:", err);
        retryError = "Failed to retry email. Please try again.";
      }
    }
  );

  const getUnlinkLeadForm = (leadId: string) =>
    unlinkLeadFromProject.for(leadId).enhance(async ({ submit, data }) => {
      unlinkError = null;
      unlinkingLeadId = data.leadId;
      try {
        await submit();
        unlinkingLeadId = null;
      } catch (err) {
        console.error("Failed to unlink lead:", err);
        unlinkError = "Failed to unlink lead. Please try again.";
      }
    });

  const getStatusTone = (status: string) => {
    if (status === "sent") return "success" as const;
    if (status === "missing-email") return "neutral" as const;
    return "accent" as const;
  };

  const stripHtml = (value: string) =>
    value
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const previewHtml = (value: string) => {
    const text = stripHtml(value);
    if (text.length <= 180) return text;
    return `${text.slice(0, 177)}...`;
  };

  const countByStatus = (
    leads: { status: string }[],
    status: "sent" | "missing-email" | "error"
  ) => leads.filter((lead) => lead.status === status).length;

  const summarizeInitiatives = (
    initiatives: { status: string; leads: { status: string }[] }[]
  ) => {
    let drafts = 0;
    let sent = 0;
    let leadCount = 0;
    let failedDeliveries = 0;

    for (const initiative of initiatives) {
      if (initiative.status === "draft") {
        drafts += 1;
      } else {
        sent += 1;
      }

      leadCount += initiative.leads.length;
      failedDeliveries += countByStatus(initiative.leads, "error");
    }

    return {
      total: initiatives.length,
      drafts,
      sent,
      leadCount,
      failedDeliveries,
    };
  };

  const formatInitiativeDate = (value: Date | null) =>
    value ? new Date(value).toLocaleString(dateLocale) : "Draft";

  const initiativeSearchParams = useSearchParams(
    createSearchParamsSchema({
      initiative: { type: "string", default: "" },
    })
  );

  const selectedInitiativeId = $derived(
    page.url.searchParams.get("initiative") ?? null
  );

  const selectedInitiative = $derived(
    initiatives.find(
      (initiative) => initiative.id === selectedInitiativeId
    ) ?? null
  );

  const openInitiativeDetails = (initiativeId: string) => {
    if (selectedInitiativeId === initiativeId) return;

    initiativeSearchParams.initiative = initiativeId;
  };

  const closeInitiativeDetails = () => {
    if (!selectedInitiativeId) return;

    initiativeSearchParams.initiative = "";
  };

  const handlePanelBackdropClick = (event: MouseEvent) => {
    if (event.currentTarget === event.target) {
      closeInitiativeDetails();
    }
  };

  const handlePanelBackdropKeydown = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      closeInitiativeDetails();
      return;
    }

    if (
      (event.key === "Enter" || event.key === " ") &&
      event.currentTarget === event.target
    ) {
      event.preventDefault();
      closeInitiativeDetails();
    }
  };

  const handleWindowKeydown = (event: KeyboardEvent) => {
    if (event.key === "Escape" && selectedInitiativeId) {
      closeInitiativeDetails();
    }
  };
</script>

<div class="leader-page">
  <div class="flex flex-col gap-6">
    <header class="space-y-1.5">
      <Breadcrumbs
        items={[
          { label: "Projects", href: resolve("/projects") },
          { label: projectData.project.name },
        ]}
      />

      {#if isEditing}
        <form class="space-y-3" {...editForm}>
          <input
            {...updateProject.fields.projectId.as(
              "hidden",
              projectData.project.id
            )}
          />
          <input
            class="focus-visible:border-primary-600 focus-visible:ring-primary-400/40 bg-surface ring-offset-background h-10 w-full border-2 border-neutral-800 px-3 py-2 text-lg font-bold tracking-tight text-neutral-950 uppercase transition-all duration-100 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            {...updateProject.fields.name.as("text")}
          />
          <input
            class="focus-visible:border-primary-600 focus-visible:ring-primary-400/40 bg-surface ring-offset-background h-10 w-full border-2 border-neutral-800 px-3 py-2 text-sm text-neutral-500 transition-all duration-100 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            placeholder="Description (optional)"
            {...updateProject.fields.description.as("text")}
          />
          {#if updateError}
            <p class="text-xs text-red-600">{updateError}</p>
          {/if}
          <div class="flex gap-2">
            <Button type="submit" size="sm" disabled={isUpdating}>
              {isUpdating ? "Saving…" : "Save"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              color="neutral"
              size="sm"
              onclick={() => {
                isEditing = false;
                updateError = null;
              }}
              disabled={isUpdating}
            >
              Cancel
            </Button>
          </div>
        </form>
      {:else}
        <div class="flex flex-wrap items-center gap-2">
          <h1
            class="text-2xl font-bold tracking-tight text-neutral-950 uppercase"
          >
            {projectData.project.name}
          </h1>
          <Badge variant="soft" tone="accent" size="sm">
            {projectData.leads.length}
            {projectData.leads.length === 1 ? "lead" : "leads"}
          </Badge>
        </div>
        {#if projectData.project.description}
          <p class="max-w-2xl text-sm text-neutral-500">
            {projectData.project.description}
          </p>
        {/if}
        <div class="flex flex-wrap items-center gap-2 pt-1">
          <Button
            variant="ghost"
            color="neutral"
            size="sm"
            onclick={() => (isEditing = true)}
          >
            Edit
          </Button>
          {#if confirmingDelete}
            <div class="flex items-center gap-2">
              <span class="font-mono text-xs font-bold text-red-700"
                >Delete this project and all its data?</span
              >
              <form {...deleteForm}>
                <input
                  {...deleteProject.fields.projectId.as(
                    "hidden",
                    projectData.project.id
                  )}
                />
                <Button
                  type="submit"
                  size="sm"
                  color="secondary"
                  disabled={isDeleting}
                >
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
      {/if}
    </header>

    <Tabs tabs={projectTabs} bind:value={activeTab} className="w-fit" />

    {#if activeTab === "initiatives"}
      <div class="space-y-4">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div class="space-y-1">
            <h2
              class="text-lg font-bold tracking-wider text-neutral-950 uppercase"
            >
              Initiatives
            </h2>
            <p class="text-sm text-neutral-500">
              Project initiative history and lead delivery status.
            </p>
          </div>
          <a
            href={resolve(
              `/projects/${projectData.project.id}/initiatives/new`
            )}
          >
            <Button size="sm">New Initiative</Button>
          </a>
        </div>

        {#if initiatives.length === 0}
          <Card variant="flat" class="p-6 text-center">
            <p class="text-sm text-neutral-500">No initiatives yet.</p>
          </Card>
        {:else}
          {@const summary = summarizeInitiatives(initiatives)}
          <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Card variant="flat" class="space-y-1 p-4">
              <p
                class="text-primary-700 font-mono text-[10px] font-bold tracking-[0.3em] uppercase"
              >
                Initiatives
              </p>
              <p class="font-mono text-3xl font-bold text-neutral-950">
                {summary.total}
              </p>
            </Card>
            <Card variant="flat" class="space-y-1 p-4">
              <p
                class="text-primary-700 font-mono text-[10px] font-bold tracking-[0.3em] uppercase"
              >
                Drafts
              </p>
              <p class="font-mono text-3xl font-bold text-neutral-950">
                {summary.drafts}
              </p>
            </Card>
            <Card variant="flat" class="space-y-1 p-4">
              <p
                class="text-primary-700 font-mono text-[10px] font-bold tracking-[0.3em] uppercase"
              >
                Leads Contacted
              </p>
              <p class="font-mono text-3xl font-bold text-neutral-950">
                {summary.leadCount}
              </p>
            </Card>
            <Card variant="flat" class="space-y-1 p-4">
              <p
                class="text-primary-700 font-mono text-[10px] font-bold tracking-[0.3em] uppercase"
              >
                Failed Deliveries
              </p>
              <p class="font-mono text-3xl font-bold text-neutral-950">
                {summary.failedDeliveries}
              </p>
            </Card>
          </div>

          <div class="space-y-4">
            {#each initiatives as initiative (initiative.id)}
              <button
                type="button"
                class="group w-full text-left"
                onclick={() => openInitiativeDetails(initiative.id)}
              >
                <Card
                  variant="flat"
                  class="group-hover:bg-surface-hover group-active:bg-surface-active space-y-4 p-5 transition-colors"
                >
                  <div
                    class="flex flex-wrap items-start justify-between gap-3"
                  >
                    <div class="min-w-0 flex-1 space-y-2">
                      <div class="flex items-center gap-2">
                        <h3
                          class="truncate text-base font-bold tracking-wide text-neutral-900 uppercase"
                        >
                          {initiative.title}
                        </h3>
                        {#if initiative.status === "draft"}
                          <Badge variant="soft" tone="neutral" size="sm">
                            Draft
                          </Badge>
                        {:else}
                          <Badge variant="soft" tone="success" size="sm">
                            Sent
                          </Badge>
                        {/if}
                      </div>
                      <p class="truncate text-sm text-neutral-600">
                        {initiative.subject}
                      </p>
                      <p class="text-xs text-neutral-500">
                        {initiative.status === "draft"
                          ? "Not sent yet"
                          : `Sent ${formatInitiativeDate(initiative.sentAt)}`}
                      </p>
                    </div>
                    <div class="flex flex-wrap items-center gap-2">
                      <Badge variant="soft" tone="accent" size="sm">
                        {initiative.leads.length}
                        {initiative.leads.length === 1
                          ? " lead"
                          : " leads"}
                      </Badge>
                      {#if initiative.status === "sent"}
                        <Badge variant="soft" tone="success" size="sm">
                          {countByStatus(initiative.leads, "sent")} sent
                        </Badge>
                        <Badge variant="soft" tone="accent" size="sm">
                          {countByStatus(initiative.leads, "error")} failed
                        </Badge>
                      {/if}
                    </div>
                  </div>

                  <div
                    class="border-2 border-neutral-800 bg-neutral-100 px-3 py-2"
                  >
                    <p
                      class="font-mono text-[10px] font-bold tracking-[0.3em] text-neutral-500 uppercase"
                    >
                      Message preview
                    </p>
                    <p class="mt-1 text-sm text-neutral-600">
                      {previewHtml(initiative.htmlBody)}
                    </p>
                  </div>
                </Card>
              </button>
            {/each}
          </div>
        {/if}
      </div>
    {:else}
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div class="space-y-1">
          <h2
            class="text-lg font-bold tracking-wider text-neutral-950 uppercase"
          >
            Leads
          </h2>
          <p class="text-sm text-neutral-500">
            Add leads manually or from discovery to this project.
          </p>
        </div>
        <LeadManualCreateForm
          projectId={projectData.project.id}
          linkedLeadPlaceIds={projectData.leads.map(
            (lead) => lead.placeId
          )}
        />
      </div>

      {#if projectData.leads.length === 0}
        <Card variant="flat" class="p-8 text-center">
          <div class="mx-auto max-w-sm space-y-3">
            <div
              class="mx-auto flex h-16 w-16 items-center justify-center border-2 border-dashed border-neutral-400 bg-neutral-100 text-neutral-500"
            >
              <span class="font-mono text-2xl font-bold">?</span>
            </div>
            <h3
              class="text-base font-bold tracking-wider text-neutral-900 uppercase"
            >
              No leads yet
            </h3>
            <p class="font-mono text-xs text-neutral-500">
              Discover leads and add them to this project to get started.
            </p>
          </div>
        </Card>
      {:else}
        <div class="space-y-3">
          {#each projectData.leads as lead (lead.placeId)}
            <Card
              variant="flat"
              class="hover:bg-surface-hover active:bg-surface-active p-5 transition-colors"
            >
              <div class="space-y-3">
                <div
                  class="flex flex-wrap items-start justify-between gap-3"
                >
                  <div class="min-w-0 flex-1 space-y-1.5">
                    <h3
                      class="text-base font-bold tracking-wide text-neutral-900 uppercase"
                    >
                      {#if lead.googleMapsUrl}
                        <a
                          href={lead.googleMapsUrl}
                          target="_blank"
                          rel="noopener noreferrer external"
                          class="hover:text-primary-600 transition-colors"
                        >
                          {lead.name}
                        </a>
                      {:else}
                        {lead.name}
                      {/if}
                    </h3>
                    {#if lead.address}
                      <p class="text-sm text-neutral-500">
                        {lead.address}
                      </p>
                    {/if}
                    {#if formatTypes(lead.types)}
                      <p class="text-xs text-neutral-400">
                        {formatTypes(lead.types)}
                      </p>
                    {/if}
                  </div>
                  <div class="flex flex-wrap items-center gap-2">
                    <form {...getUnlinkLeadForm(lead.id)}>
                      <input
                        {...unlinkLeadFromProject.fields.projectId.as(
                          "hidden",
                          projectData.project.id
                        )}
                      />
                      <input
                        {...unlinkLeadFromProject.fields.leadId.as(
                          "hidden",
                          lead.id
                        )}
                      />
                      <Button
                        type="submit"
                        variant="ghost"
                        color="neutral"
                        size="sm"
                        disabled={isUnlinking}
                      >
                        {isUnlinking && unlinkingLeadId === lead.id
                          ? "Unlinking..."
                          : "Unlink"}
                      </Button>
                    </form>
                    {#if lead.businessStatus && lead.businessStatus !== "OPERATIONAL"}
                      <Badge variant="soft" tone="neutral" size="sm">
                        {lead.businessStatus
                          .toLowerCase()
                          .replace(/_/g, " ")}
                      </Badge>
                    {/if}
                    {#if lead.rating}
                      <Badge variant="soft" tone="success" size="sm">
                        {lead.rating.toFixed(1)}
                      </Badge>
                    {/if}
                  </div>
                </div>

                <div
                  class="flex flex-wrap items-center gap-x-4 gap-y-2 border-t-2 border-neutral-800 pt-3 font-mono text-xs"
                >
                  {#if lead.phone}
                    <a
                      href="tel:{lead.phone}"
                      class="hover:text-primary-600 flex items-center gap-1.5 text-neutral-600 transition-colors"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-4 w-4 shrink-0"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        ><path
                          d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6.08 6.08l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"
                        /></svg
                      >
                      <span>{lead.phone}</span>
                    </a>
                  {/if}
                  {#if lead.email}
                    <a
                      href="mailto:{lead.email}"
                      class="hover:text-primary-600 flex items-center gap-1.5 text-neutral-600 transition-colors"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-4 w-4 shrink-0"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        ><rect
                          width="20"
                          height="16"
                          x="2"
                          y="4"
                          rx="2"
                        /><path
                          d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"
                        /></svg
                      >
                      <span>{lead.email}</span>
                    </a>
                  {/if}
                  {#if lead.website}
                    <a
                      href={lead.website}
                      target="_blank"
                      rel="noopener noreferrer external"
                      class="hover:text-primary-600 flex items-center gap-1.5 truncate text-neutral-600 transition-colors"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-4 w-4 shrink-0"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        ><circle cx="12" cy="12" r="10" /><path
                          d="M12 2a14.5 14.5 0 0 1 0 20 14.5 14.5 0 0 1 0-20"
                        /><path d="M2 12h20" /></svg
                      >
                      <span class="truncate">{lead.website}</span>
                    </a>
                  {/if}
                  {#if !lead.phone && !lead.email && !lead.website}
                    <p class="text-sm text-neutral-400 italic">
                      No contact information available
                    </p>
                  {/if}
                </div>
                {#if unlinkError && unlinkingLeadId === lead.id}
                  <p class="text-xs text-red-600">{unlinkError}</p>
                {/if}
              </div>
            </Card>
          {/each}
        </div>
      {/if}
    {/if}
  </div>
</div>

<svelte:window onkeydown={handleWindowKeydown} />

{#if selectedInitiative}
  <div
    class="fixed inset-0 z-50 bg-neutral-950/60"
    role="button"
    tabindex="0"
    onclick={handlePanelBackdropClick}
    onkeydown={handlePanelBackdropKeydown}
    transition:fade={{ duration: 120 }}
  >
    <aside
      class="bg-surface absolute inset-y-0 right-0 z-50 flex h-full w-full max-w-2xl flex-col border-l-2 border-neutral-800"
      transition:fly={{ x: 320, duration: 180 }}
    >
      <div
        class="flex items-start justify-between gap-3 border-b-2 border-neutral-800 px-6 py-5"
      >
        <div class="min-w-0 space-y-2">
          <div class="flex flex-wrap items-center gap-2">
            <h2
              class="truncate text-lg font-bold tracking-wide text-neutral-900 uppercase"
            >
              {selectedInitiative.title}
            </h2>
            {#if selectedInitiative.status === "draft"}
              <Badge variant="soft" tone="neutral" size="sm">Draft</Badge>
            {:else}
              <Badge variant="soft" tone="success" size="sm">Sent</Badge>
            {/if}
          </div>
          <p class="text-sm text-neutral-600">
            {selectedInitiative.subject}
          </p>
          <p class="text-xs text-neutral-500">
            {selectedInitiative.status === "draft"
              ? "Not sent yet"
              : `Sent ${formatInitiativeDate(selectedInitiative.sentAt)}`}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          color="neutral"
          size="sm"
          onclick={closeInitiativeDetails}
        >
          Close
        </Button>
      </div>

      <div class="flex-1 space-y-4 overflow-y-auto p-6">
        <div class="border-2 border-neutral-800 bg-neutral-100 px-4 py-3">
          <p
            class="font-mono text-[10px] font-bold tracking-[0.3em] text-neutral-500 uppercase"
          >
            Message preview
          </p>
          <p class="mt-1 text-sm whitespace-pre-wrap text-neutral-700">
            {stripHtml(selectedInitiative.htmlBody)}
          </p>
        </div>

        {#if selectedInitiative.status === "draft"}
          <div
            class="bg-surface flex items-center justify-between border-2 border-neutral-800 px-4 py-3"
          >
            <p class="text-sm text-neutral-600">
              This initiative is still a draft.
            </p>
            <div class="flex items-center gap-2">
              <a
                href={resolve(
                  `/projects/${projectData.project.id}/initiatives/${selectedInitiative.id}/edit`
                )}
              >
                <Button variant="ghost" color="neutral" size="sm">
                  Edit
                </Button>
              </a>
              <Button
                variant="ghost"
                color="neutral"
                size="sm"
                onclick={() =>
                  (confirmingInitiativeId = selectedInitiative.id)}
                disabled={isSending}
              >
                Send to Leads
              </Button>
            </div>
          </div>

          {#if confirmingInitiativeId === selectedInitiative.id}
            <div
              class="border-secondary-500 bg-secondary-100 border-2 px-4 py-3"
            >
              <p
                class="text-secondary-800 mb-3 font-mono text-xs font-bold"
              >
                Send this initiative to all leads in this project? This
                cannot be undone.
              </p>
              {#if sendError}
                <p class="mb-2 text-xs text-red-600">{sendError}</p>
              {/if}
              <form class="flex gap-2" {...sendForm}>
                <input
                  {...sendInitiative.fields.initiativeId.as(
                    "hidden",
                    selectedInitiative.id
                  )}
                />
                <Button type="submit" size="sm" disabled={isSending}>
                  {isSending ? "Sending..." : "Confirm Send"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  color="neutral"
                  size="sm"
                  onclick={() => {
                    confirmingInitiativeId = null;
                    sendError = null;
                  }}
                  disabled={isSending}
                >
                  Cancel
                </Button>
              </form>
            </div>
          {/if}
        {:else}
          <div class="flex flex-wrap gap-2">
            <Badge variant="soft" tone="accent" size="sm">
              {selectedInitiative.leads.length}
              {selectedInitiative.leads.length === 1 ? " lead" : " leads"}
            </Badge>
            <Badge variant="soft" tone="success" size="sm">
              {countByStatus(selectedInitiative.leads, "sent")} sent
            </Badge>
            <Badge variant="soft" tone="neutral" size="sm">
              {countByStatus(selectedInitiative.leads, "missing-email")} missing
              email
            </Badge>
            <Badge variant="soft" tone="accent" size="sm">
              {countByStatus(selectedInitiative.leads, "error")} failed
            </Badge>
          </div>

          {#if selectedInitiative.leads.length === 0}
            <Card variant="flat" class="p-4 text-center">
              <p class="text-sm text-neutral-500">
                No lead deliveries yet.
              </p>
            </Card>
          {:else}
            <div
              class="bg-surface space-y-2 border-2 border-neutral-800 p-2"
            >
              {#each selectedInitiative.leads as lead (lead.id)}
                <div
                  class="border-2 border-neutral-800 bg-neutral-100 px-3 py-2"
                >
                  <div
                    class="flex flex-wrap items-center justify-between gap-2"
                  >
                    <div class="min-w-0">
                      <a
                        href={resolve(`/leads/${lead.leadId}`)}
                        class="hover:text-primary-600 truncate text-sm font-medium text-neutral-900 transition-colors"
                        >{lead.leadName}</a
                      >
                      {#if lead.leadEmail}
                        <p class="truncate text-xs text-neutral-500">
                          {lead.leadEmail}
                        </p>
                      {/if}
                    </div>
                    <div class="flex flex-wrap items-center gap-2">
                      <span class="text-xs text-neutral-500"
                        >{formatDate(lead.lastEmailSentAt)}</span
                      >
                      {#if lead.status === "error"}
                        <form {...retryForm}>
                          <input
                            {...retryInitiativeLead.fields.initiativeLeadId.as(
                              "hidden",
                              lead.id
                            )}
                          />
                          <Button
                            type="submit"
                            variant="ghost"
                            color="secondary"
                            size="sm"
                            disabled={isRetrying}
                          >
                            {isRetrying && retryingLeadId === lead.id
                              ? "Retrying..."
                              : "Retry"}
                          </Button>
                        </form>
                      {/if}
                      <Badge
                        variant="soft"
                        tone={getStatusTone(lead.status)}
                        size="sm"
                      >
                        {lead.status}
                      </Badge>
                    </div>
                  </div>
                  {#if retryError && retryingLeadId === lead.id}
                    <p class="mt-2 text-xs text-red-600">{retryError}</p>
                  {/if}
                </div>
              {/each}
            </div>
          {/if}
        {/if}
      </div>
    </aside>
  </div>
{/if}
