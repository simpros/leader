<script lang="ts">
  import type { Snippet } from "svelte";
  import { tv } from "tailwind-variants";

  type CardVariant = "glass" | "flat";

  let {
    variant = "flat",
    className = "",
    class: restClass = "",
    children,
    ...restProps
  } = $props<{
    variant?: CardVariant;
    className?: string;
    class?: string;
    children?: Snippet;
  }>();

  const card = tv({
    base: "border-2 border-neutral-800 p-4 transition-[background-color,border-color,box-shadow] duration-100 ease-out",
    variants: {
      variant: {
        glass: "bg-surface/90 backdrop-blur-sm",
        flat: "bg-surface",
      },
    },
    defaultVariants: {
      variant: "flat",
    },
  });
</script>

<div class={[card({ variant }), className, restClass]} {...restProps}>
  {@render children?.()}
</div>
