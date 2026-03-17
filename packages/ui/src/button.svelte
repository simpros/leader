<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLButtonAttributes } from "svelte/elements";
  import { tv } from "tailwind-variants";

  type ButtonVariant = "solid" | "outline" | "ghost";
  type ButtonColor = "primary" | "secondary" | "destructive" | "neutral";
  type ButtonSize = "sm" | "md" | "lg";

  type ButtonProps = Omit<HTMLButtonAttributes, "class"> & {
    variant?: ButtonVariant;
    color?: ButtonColor;
    size?: ButtonSize;
    className?: string;
    class?: string;
    children?: Snippet;
  };

  let {
    variant = "solid",
    color = "primary",
    size = "md",
    disabled = false,
    type = "button",
    className = "",
    class: restClass = "",
    children,
    ...restProps
  }: ButtonProps = $props();

  const button = tv({
    base: "inline-flex items-center justify-center border-2 border-neutral-800 font-bold uppercase tracking-wider transition-all duration-100 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ring-offset-background active:translate-y-px",
    variants: {
      variant: {
        solid: "",
        outline: "bg-transparent",
        ghost: "border-transparent bg-transparent",
      },
      color: {
        primary: "",
        secondary: "",
        destructive: "",
        neutral: "",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-5 text-sm",
        lg: "h-12 px-7 text-base",
      },
    },
    compoundVariants: [
      {
        variant: "solid",
        color: "primary",
        class:
          "bg-primary-500 text-white border-primary-700 hover:bg-primary-600 active:bg-primary-700 focus-visible:ring-primary-400/40",
      },
      {
        variant: "solid",
        color: "secondary",
        class:
          "bg-secondary-400 text-neutral-950 border-secondary-600 hover:bg-secondary-500 active:bg-secondary-600 focus-visible:ring-secondary-400/40",
      },
      {
        variant: "solid",
        color: "destructive",
        class:
          "bg-destructive-500 text-white border-destructive-700 hover:bg-destructive-600 active:bg-destructive-700 focus-visible:ring-destructive-400/40",
      },
      {
        variant: "solid",
        color: "neutral",
        class:
          "bg-neutral-950 text-neutral-50 border-neutral-800 hover:bg-neutral-800 active:bg-neutral-900 focus-visible:ring-neutral-400/40",
      },
      {
        variant: "outline",
        color: "primary",
        class:
          "border-primary-600 text-primary-700 hover:bg-primary-50 focus-visible:ring-primary-400/40",
      },
      {
        variant: "outline",
        color: "secondary",
        class:
          "border-secondary-500 text-secondary-700 hover:bg-secondary-50 focus-visible:ring-secondary-400/40",
      },
      {
        variant: "outline",
        color: "destructive",
        class:
          "border-destructive-500 text-destructive-700 hover:bg-destructive-50 focus-visible:ring-destructive-400/40",
      },
      {
        variant: "outline",
        color: "neutral",
        class:
          "border-neutral-800 text-neutral-800 hover:bg-neutral-100 focus-visible:ring-neutral-400/40",
      },
      {
        variant: "ghost",
        color: "primary",
        class:
          "text-primary-700 hover:bg-primary-100 hover:text-primary-800 focus-visible:ring-primary-400/40",
      },
      {
        variant: "ghost",
        color: "secondary",
        class:
          "text-secondary-600 hover:bg-secondary-100 hover:text-secondary-700 focus-visible:ring-secondary-400/40",
      },
      {
        variant: "ghost",
        color: "destructive",
        class:
          "text-destructive-600 hover:bg-destructive-100 hover:text-destructive-700 focus-visible:ring-destructive-400/40",
      },
      {
        variant: "ghost",
        color: "neutral",
        class:
          "text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 focus-visible:ring-neutral-400/40",
      },
    ],
    defaultVariants: {
      variant: "solid",
      color: "primary",
      size: "md",
    },
  });
</script>

<button
  class={[button({ variant, color, size }), className, restClass]}
  {disabled}
  {type}
  {...restProps}
>
  {@render children?.()}
</button>
