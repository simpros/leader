<script lang="ts">
  import type { Snippet } from "svelte";
  import { tv } from "tailwind-variants";

  type BadgeVariant = "solid" | "soft" | "outline";
  type BadgeTone = "neutral" | "accent" | "success";
  type BadgeSize = "sm" | "md";

  let {
    variant = "soft",
    tone = "neutral",
    size = "sm",
    className = "",
    class: restClass = "",
    children,
    ...restProps
  }: {
    variant?: BadgeVariant;
    tone?: BadgeTone;
    size?: BadgeSize;
    className?: string;
    class?: string;
    children?: Snippet;
  } = $props();

  const badge = tv({
    base: "inline-flex items-center gap-1 font-mono font-bold uppercase tracking-wider ring-1 ring-inset",
    variants: {
      variant: {
        solid: "",
        soft: "",
        outline: "",
      },
      tone: {
        neutral: "",
        accent: "",
        success: "",
      },
      size: {
        sm: "px-2 py-0.5 text-[10px]",
        md: "px-3 py-1 text-xs",
      },
    },
    compoundVariants: [
      {
        variant: "solid",
        tone: "neutral",
        class: "bg-neutral-950 text-neutral-50 ring-neutral-800",
      },
      {
        variant: "solid",
        tone: "accent",
        class: "bg-secondary-400 text-neutral-950 ring-secondary-600",
      },
      {
        variant: "solid",
        tone: "success",
        class: "bg-emerald-700 text-white ring-emerald-600",
      },
      {
        variant: "soft",
        tone: "neutral",
        class: "bg-neutral-100 text-neutral-800 ring-neutral-300",
      },
      {
        variant: "soft",
        tone: "accent",
        class: "bg-secondary-100 text-secondary-800 ring-secondary-300",
      },
      {
        variant: "soft",
        tone: "success",
        class: "bg-emerald-50 text-emerald-800 ring-emerald-300",
      },
      {
        variant: "outline",
        tone: "neutral",
        class:
          "border-2 border-neutral-800 bg-transparent text-neutral-800 ring-transparent",
      },
      {
        variant: "outline",
        tone: "accent",
        class:
          "border-2 border-secondary-500 bg-transparent text-secondary-700 ring-transparent",
      },
      {
        variant: "outline",
        tone: "success",
        class:
          "border-2 border-emerald-600 bg-transparent text-emerald-700 ring-transparent",
      },
    ],
    defaultVariants: {
      variant: "soft",
      tone: "neutral",
      size: "sm",
    },
  });
</script>

<span
  class={[badge({ variant, tone, size }), className, restClass]}
  {...restProps}
>
  {@render children?.()}
</span>
