<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLLabelAttributes } from "svelte/elements";

  type LabelProps = HTMLLabelAttributes & {
    children: Snippet;
  };

  let {
    children,
    class: className = "",
    ...restProps
  }: LabelProps = $props();
</script>

<label
  class={[
    "font-mono text-xs font-bold tracking-wider text-neutral-800 uppercase",
    className,
  ]}
  {...restProps}
>
  {@render children()}
</label>
