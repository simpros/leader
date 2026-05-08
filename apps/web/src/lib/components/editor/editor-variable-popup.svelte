<script lang="ts">
  import { watch } from "runed";
  import type { SuggestionItem } from "./tiptap-variable-suggestion.js";
  import { groupItemsByGroup } from "./group-items-by-group.js";

  type EditorVariablePopupProps = {
    items: SuggestionItem[];
    command: (item: SuggestionItem) => void;
    clientRect: (() => DOMRect | null) | null;
  };

  let { items, command, clientRect }: EditorVariablePopupProps = $props();

  let selectedIndex = $state(0);

  watch(() => items, () => { selectedIndex = 0; }, { lazy: true });

  const position = $derived.by(() => {
    if (!clientRect) return { top: 0, left: 0 };
    const rect = clientRect();
    if (!rect) return { top: 0, left: 0 };
    return {
      top: rect.bottom + 4,
      left: rect.left,
    };
  });

  type IndexedSuggestionItem = {
    group: string;
    item: SuggestionItem;
    flatIndex: number;
  };

  const grouped = $derived.by(() =>
    groupItemsByGroup(
      items.map(
        (item, flatIndex): IndexedSuggestionItem => ({
          group: item.group,
          item,
          flatIndex,
        })
      )
    )
  );

  export function handleKeyDown(event: KeyboardEvent): boolean {
    if (event.key === "ArrowDown") {
      selectedIndex = (selectedIndex + 1) % items.length;
      return true;
    }
    if (event.key === "ArrowUp") {
      selectedIndex = (selectedIndex - 1 + items.length) % items.length;
      return true;
    }
    if (event.key === "Enter") {
      const item = items[selectedIndex];
      if (item) command(item);
      return true;
    }
    if (event.key === "Escape") {
      return true;
    }
    return false;
  }
</script>

{#if items.length > 0}
  <div
    class="fixed z-50 max-h-72 w-72 overflow-y-auto border-2 border-neutral-800 bg-white py-1 shadow-lg"
    style="top: {position.top}px; left: {position.left}px;"
  >
    {#each grouped as { group, items: groupItems } (group)}
      <div
        class="px-3 pt-2 pb-1 text-[10px] font-semibold tracking-widest text-neutral-400 uppercase"
      >
        {group}
      </div>
      {#each groupItems as { item, flatIndex } (item.id)}
        <button
          type="button"
          class={[
            "flex w-full flex-col gap-0.5 px-3 py-2 text-left transition-colors",
            flatIndex === selectedIndex
              ? "bg-secondary-50 text-secondary-800"
              : "text-neutral-800 hover:bg-neutral-50",
          ]}
          onmouseenter={() => {
            selectedIndex = flatIndex;
          }}
          onclick={() => command(item)}
        >
          <span class="font-mono text-sm font-medium">{item.label}</span>
          {#if item.description}
            <span class="text-xs text-neutral-400">{item.description}</span
            >
          {/if}
        </button>
      {/each}
    {/each}
  </div>
{/if}
