<script lang="ts">
  import type { Snippet } from "svelte";
  import { Dialog } from "bits-ui";

  type DialogProps = {
    open?: boolean;
    className?: string;
    class?: string;
    children?: Snippet;
    onClose?: () => void;
    id?: string;
  };

  let {
    open = $bindable(false),
    className = "",
    class: restClass = "",
    children,
    onClose,
    id,
  }: DialogProps = $props();

  const handleOpenChange = (value: boolean) => {
    if (!value) {
      onClose?.();
    }
  };
</script>

<Dialog.Root {open} onOpenChange={handleOpenChange}>
  <Dialog.Portal>
    <Dialog.Overlay
      class="fixed inset-0 z-50 bg-[rgba(26,16,8,0.6)]"
    />
    <Dialog.Content
      {id}
      class={[
        "fixed top-1/2 left-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 border-2 border-neutral-800 bg-surface p-0 focus:outline-none",
        className,
        restClass,
      ]}
    >
      {@render children?.()}
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
