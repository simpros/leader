<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";

  type ErrorProps = HTMLAttributes<HTMLParagraphElement> & {
    children: Snippet;
  };

  let {
    children,
    class: className = "",
    ...restProps
  }: ErrorProps = $props();
</script>

<p
  class={[
    "text-destructive-600 font-mono text-xs font-bold uppercase",
    className,
  ]}
  {...restProps}
>
  {@render children()}
</p>
