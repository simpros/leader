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

<p class={["text-neutral-500 text-xs", className]} {...restProps}>
  {@render children()}
</p>
