<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";

  type FieldProps = HTMLAttributes<HTMLDivElement> & {
    children: Snippet;
    orientation?: "vertical" | "horizontal" | "responsive";
  };

  let {
    children,
    orientation = "vertical",
    class: className = "",
    ...restProps
  }: FieldProps = $props();

  const orientationClasses = {
    vertical: "flex flex-col gap-2",
    horizontal: "flex flex-row items-center gap-3",
    responsive:
      "flex flex-col gap-2 @container/field sm:flex-row sm:items-center sm:gap-3",
  };
</script>

<div
  role="group"
  class={[orientationClasses[orientation], className]}
  {...restProps}
>
  {@render children()}
</div>
