<script lang="ts">
  export type BreadcrumbItem = {
    label: string;
    href?: string;
  };

  let { items, class: className = "" } = $props<{
    items: BreadcrumbItem[];
    class?: string;
  }>();
</script>

<nav
  aria-label="Breadcrumb"
  class={["flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-neutral-500", className]}
>
  <span class="inline-block h-3 w-3 bg-primary-500"></span>
  {#each items as item, i (i)}
    {@const isLast = i === items.length - 1}
    {#if i > 0}
      <span aria-hidden="true" class="text-neutral-400">//</span>
    {/if}
    {#if isLast || !item.href}
      <span
        class="font-bold text-neutral-900"
        aria-current={isLast ? "page" : undefined}
      >
        {item.label}
      </span>
    {:else}
      <a href={item.href} class="transition-colors hover:text-primary-600">
        {item.label}
      </a>
    {/if}
  {/each}
</nav>
