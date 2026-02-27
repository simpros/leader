<script lang="ts">
  import { Popover } from "bits-ui";

  export type MenuItem = {
    value: string;
    label: string;
    description?: string;
    group?: string;
  };

  type MenuProps = {
    open?: boolean;
    items: MenuItem[];
    onSelect: (value: string) => void;
    onClose: () => void;
    x?: number;
    y?: number;
    className?: string;
    class?: string;
  };

  let {
    open = false,
    items,
    onSelect,
    onClose,
    x = 0,
    y = 0,
    className = "",
    class: restClass = "",
  }: MenuProps = $props();

  let activeIndex = $state(0);
  let itemEls = $state<(HTMLButtonElement | null)[]>([]);

  const groups = $derived.by((): [string | undefined, MenuItem[]][] => {
    const result: [string | undefined, MenuItem[]][] = [];
    for (const item of items) {
      const key = item.group;
      const existing = result.find(([g]) => g === key);
      if (existing) {
        existing[1].push(item);
      } else {
        result.push([key, [item]]);
      }
    }
    return result;
  });

  const flatItems = $derived(items);

  $effect(() => {
    if (open) {
      activeIndex = 0;
    }
  });

  $effect(() => {
    if (open && itemEls[activeIndex]) {
      itemEls[activeIndex]?.scrollIntoView({ block: "nearest" });
    }
  });

  const handleOpenChange = (value: boolean) => {
    if (!value) {
      onClose();
    }
  };

  const handleKeydown = (e: KeyboardEvent) => {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      activeIndex = (activeIndex + 1) % flatItems.length;
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      activeIndex =
        (activeIndex - 1 + flatItems.length) % flatItems.length;
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = flatItems[activeIndex];
      if (item) {
        onSelect(item.value);
      }
    }
  };
</script>

<svelte:window onkeydown={handleKeydown} />

<Popover.Root {open} onOpenChange={handleOpenChange}>
  <Popover.ContentStatic
    role="menu"
    aria-label="Variable picker"
    class={[
      "leader-menu fixed z-50 max-h-72 w-72 overflow-y-auto rounded-xl border border-neutral-200 bg-white py-1 shadow-lg",
      className,
      restClass,
    ]}
    style="left: {x}px; top: {y}px;"
    interactOutsideBehavior="close"
  >
    {#each groups as [group, groupItems] (group ?? "__ungrouped__")}
      {#if group}
        <div
          class="px-3 pt-2 pb-1 text-[10px] font-semibold tracking-widest text-neutral-400 uppercase"
        >
          {group}
        </div>
      {/if}
      {#each groupItems as item (item.value)}
        {@const idx = flatItems.indexOf(item)}
        <button
          bind:this={itemEls[idx]}
          role="menuitem"
          type="button"
          class={[
            "flex w-full flex-col gap-0.5 px-3 py-2 text-left transition-colors",
            idx === activeIndex
              ? "bg-secondary-50 text-secondary-800"
              : "text-neutral-800 hover:bg-neutral-50",
          ]}
          onpointerenter={() => (activeIndex = idx)}
          onclick={() => onSelect(item.value)}
        >
          <span class="text-sm font-medium">{item.label}</span>
          {#if item.description}
            <span class="text-xs text-neutral-400">{item.description}</span>
          {/if}
        </button>
      {/each}
    {/each}
  </Popover.ContentStatic>
</Popover.Root>
