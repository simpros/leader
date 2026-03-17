<script lang="ts">
  import type { HTMLInputAttributes } from "svelte/elements";
  import { tv } from "tailwind-variants";

  type InputSize = "sm" | "md" | "lg";

  type InputProps = Omit<
    HTMLInputAttributes,
    "value" | "size" | "class"
  > & {
    value?: string | number;
    size?: InputSize;
    className?: string;
    class?: string;
  };

  let {
    value = $bindable<string | number>(""),
    type = "text",
    size = "md",
    disabled = false,
    className = "",
    class: restClass = "",
    ...restProps
  }: InputProps = $props();

  const input = tv({
    base: "w-full border-2 border-neutral-800 bg-surface px-3 py-2 font-mono text-sm text-neutral-900 transition-all duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/40 focus-visible:border-primary-600 focus-visible:ring-offset-2 ring-offset-background placeholder:text-neutral-400 disabled:cursor-not-allowed disabled:opacity-50",
    variants: {
      size: {
        sm: "h-8",
        md: "h-10",
        lg: "h-12 text-base",
      },
    },
    defaultVariants: {
      size: "md",
    },
  });
</script>

<input
  class={[input({ size }), className, restClass]}
  bind:value
  {type}
  {disabled}
  {...restProps}
/>
