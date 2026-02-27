<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";

  type DescriptionProps = HTMLAttributes<HTMLParagraphElement> & {
    children: Snippet;
  };

  let {
    children,
    class: className = "",
    ...restProps
  }: DescriptionProps = $props();
</script>

<p class={["text-xs text-neutral-500", className]} {...restProps}>
  {@render children()}
</p>
