<script lang="ts">
  import { Badge, Breadcrumbs, Button, Card } from "@leader/ui";
  import { getProjects } from "$lib/remote/projects.remote";
  import { resolve } from "$app/paths";

  const projects = $derived(await getProjects());
</script>

<div class="leader-page">
  <div class="leader-stack">
    <header class="space-y-2">
      <Breadcrumbs items={[{ label: "Projects" }]} />
      <h1 class="leader-headline">Your Projects</h1>
      <p class="leader-copy max-w-2xl">
        Organize outreach by campaign or client and keep lead execution
        structured from draft to delivery.
      </p>
    </header>

    {#if projects.length === 0}
      <Card variant="flat" class="p-8 text-center">
        <div class="mx-auto max-w-sm space-y-3">
          <div
            class="mx-auto flex h-16 w-16 items-center justify-center border-2 border-dashed border-neutral-400 bg-neutral-100 text-neutral-500"
          >
            <span class="font-mono text-2xl font-bold">+</span>
          </div>
          <h3 class="text-base font-bold uppercase tracking-wider text-neutral-900">
            No projects yet
          </h3>
          <p class="font-mono text-xs text-neutral-500">
            Discover leads and add them to a project to get started.
          </p>
          <div class="pt-2">
            <a href={resolve("/")}>
              <Button size="sm">Discover Leads</Button>
            </a>
          </div>
        </div>
      </Card>
    {:else}
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {#each projects as project (project.id)}
          <a href={resolve(`/projects/${project.id}`)} class="group block h-full">
            <Card
              variant="flat"
              class="flex h-full flex-col justify-between p-5 transition-colors group-hover:border-primary-500"
            >
              <div class="space-y-3">
                <div class="flex items-start justify-between gap-3">
                  <h3 class="text-base font-bold uppercase tracking-wide text-neutral-900 group-hover:text-primary-600 transition-colors">
                    {project.name}
                  </h3>
                  <Badge variant="soft" tone="accent" size="sm">
                    {project.leadCount}
                    {project.leadCount === 1 ? "lead" : "leads"}
                  </Badge>
                </div>
                {#if project.description}
                  <p class="text-sm text-neutral-500 line-clamp-2 leading-relaxed">
                    {project.description}
                  </p>
                {:else}
                  <p class="font-mono text-xs text-neutral-400 italic">No description</p>
                {/if}
              </div>
              <div class="mt-4 border-t-2 border-neutral-800 pt-3 font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-400 group-hover:text-primary-500 transition-colors">
                View Details →
              </div>
            </Card>
          </a>
        {/each}
      </div>
    {/if}
  </div>
</div>
