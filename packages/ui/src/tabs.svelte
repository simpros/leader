<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";

  type TabItem = {
    value: string;
    label: string;
    disabled?: boolean;
  };

  type TabsProps = Omit<HTMLAttributes<HTMLDivElement>, "class"> & {
    tabs: TabItem[];
    value?: string;
    className?: string;
    class?: string;
  };

  let {
    tabs,
    value = $bindable(tabs[0]?.value ?? ""),
    className = "",
    class: restClass = "",
    ...restProps
  }: TabsProps = $props();
</script>

<div
  role="tablist"
  class={[
    "inline-flex items-end gap-0 border-b-2 border-neutral-800",
    className,
    restClass,
  ]}
  {...restProps}
>
  {#each tabs as tab (tab.value)}
    <button
      type="button"
      role="tab"
      aria-selected={tab.value === value}
      disabled={tab.disabled}
      onclick={() => (value = tab.value)}
      class={[
        "focus-visible:ring-primary-400/40 focus-visible:ring-offset-background relative border-2 border-b-0 px-5 py-2.5 font-mono text-xs font-bold tracking-wider uppercase transition-colors duration-100 ease-out focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none",
        tab.value === value
          ? "bg-surface -mb-[2px] border-neutral-800 text-neutral-950"
          : "border-transparent text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800",
        {
          "cursor-not-allowed opacity-50": tab.disabled,
        },
      ]}
    >
      {tab.label}
    </button>
  {/each}
</div>
