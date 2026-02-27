<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";

  type FloatingPillProps = Omit<
    HTMLAttributes<HTMLDivElement>,
    "class"
  > & {
    className?: string;
    class?: string;
    children?: Snippet;
  };

  let {
    className = "",
    class: restClass = "",
    children,
    ...restProps
  }: FloatingPillProps = $props();
</script>

<div
  class={[
    "flex w-fit items-center gap-1 border-2 border-neutral-800 bg-surface px-2 py-1",
    className,
    restClass,
  ]}
  {...restProps}
>
  {@render children?.()}
</div>
