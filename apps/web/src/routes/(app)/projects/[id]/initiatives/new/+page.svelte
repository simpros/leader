<script lang="ts">
  import { goto } from "$app/navigation";
  import { resolve } from "$app/paths";
  import { Breadcrumbs, Card } from "@leader/ui";
  import { getProjectData } from "$lib/remote/projects.remote.js";
  import InitiativeEmailForm from "./initiative-email-form.svelte";
  import type { Lead } from "$lib/leads/types";

  const { params } = $props();
  const projectData = $derived(await getProjectData(params.id));

  const handleSuccess = async () => {
    await goto(resolve(`/projects/${projectData.project.id}`));
  };
</script>

<div class="leader-page">
  <div class="flex flex-col gap-6">
    <header class="space-y-1.5">
      <Breadcrumbs
        items={[
          { label: "Projects", href: resolve("/projects") },
          {
            label: projectData.project.name,
            href: resolve(`/projects/${projectData.project.id}`),
          },
          { label: "New Initiative" },
        ]}
      />
      <h1 class="text-2xl font-bold tracking-tight text-neutral-900">
        New Initiative
      </h1>
      <p class="max-w-2xl text-sm text-neutral-600">
        Create a new initiative email for leads in this project.
      </p>
    </header>

    <Card variant="flat" class="p-4">
      <InitiativeEmailForm
        projectId={projectData.project.id}
        leads={projectData.leads as Lead[]}
        onSuccess={handleSuccess}
      />
    </Card>
  </div>
</div>
