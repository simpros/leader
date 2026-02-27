<script lang="ts">
  import { DropdownMenu } from "bits-ui";
  import { goto } from "$app/navigation";
  import { resolve } from "$app/paths";
  import { authClient } from "@leader/auth/client";

  type Props = {
    userName: string;
    userEmail: string;
  };

  let { userName, userEmail }: Props = $props();

  const initials = $derived(
    userName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?"
  );

  let signingOut = $state(false);

  const handleSignOut = async () => {
    signingOut = true;
    try {
      await authClient.signOut();
    } finally {
      signingOut = false;
      await goto(resolve("/auth/login"));
    }
  };
</script>

<DropdownMenu.Root>
  <DropdownMenu.Trigger
    class="flex size-9 items-center justify-center border-2 border-neutral-800 bg-primary-500 font-mono text-xs font-bold text-white transition-snappy hover:bg-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/40 focus-visible:ring-offset-2"
  >
    {initials}
  </DropdownMenu.Trigger>
  <DropdownMenu.Portal>
    <DropdownMenu.Content
      class="z-50 min-w-56 border-2 border-neutral-800 bg-surface py-1 shadow-lg"
      sideOffset={4}
      align="end"
    >
      <div class="border-b border-neutral-200 px-3 py-2">
        <p class="text-sm font-semibold text-neutral-950">{userName}</p>
        <p class="text-xs text-neutral-500">{userEmail}</p>
      </div>

      <DropdownMenu.Item
        class="flex w-full cursor-pointer items-center px-3 py-2 text-sm text-neutral-800 transition-colors hover:bg-neutral-100 focus:bg-neutral-100 focus:outline-none"
        onSelect={() => goto(resolve("/settings"))}
      >
        Settings
      </DropdownMenu.Item>

      <DropdownMenu.Separator class="my-1 h-px bg-neutral-200" />

      <DropdownMenu.Item
        class="flex w-full cursor-pointer items-center px-3 py-2 text-sm text-destructive-600 transition-colors hover:bg-destructive-50 focus:bg-destructive-50 focus:outline-none"
        disabled={signingOut}
        onSelect={handleSignOut}
      >
        {signingOut ? "Signing out…" : "Sign out"}
      </DropdownMenu.Item>
    </DropdownMenu.Content>
  </DropdownMenu.Portal>
</DropdownMenu.Root>
