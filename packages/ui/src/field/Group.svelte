<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";

  type GroupProps = HTMLAttributes<HTMLDivElement> & {
    children: Snippet;
  };

  let {
    children,
    class: className = "",
    ...restProps
  }: GroupProps = $props();
</script>

<div class={["space-y-3", className]} {...restProps}>
  {@render children()}
</div>
