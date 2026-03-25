<script lang="ts">
  import { resolve } from "$app/paths";
  import { page } from "$app/state";
  import UserAvatarMenu from "./user-avatar-menu.svelte";
  import OrgSwitcher from "./org-switcher.svelte";

  let { children } = $props();

  const links = [
    { href: "/", label: "Discover" },
    { href: "/projects", label: "Projects" },
    { href: "/leads", label: "Leads" },
  ] as const;

  const isActive = (href: string) =>
    href === "/"
      ? page.url.pathname === "/"
      : page.url.pathname.startsWith(href);
</script>

<div class="leader-shell">
  <header
    class="bg-surface sticky top-0 z-40 border-b-4 border-neutral-800"
  >
    <div
      class="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6"
    >
      <div class="flex items-center">
        <a
          href={resolve("/")}
          class="hover:text-primary-600 shrink-0 py-3 font-mono text-base font-bold tracking-[0.2em] text-neutral-950 uppercase transition-colors sm:text-lg sm:tracking-[0.3em]"
        >
          Leader
        </a>
        <div class="border-l-2 border-neutral-800">
          <OrgSwitcher
            organizations={page.data.organizations ?? []}
            activeOrganizationId={page.data.session?.activeOrganizationId ??
              null}
          />
        </div>
      </div>
      <div class="flex items-center">
        <nav
          class="flex flex-wrap items-center"
          aria-label="Main navigation"
        >
          {#each links as link (link.href)}
            <a
              href={resolve(link.href)}
              class={[
                "transition-snappy relative border-l-2 border-neutral-800 px-3 py-4 font-mono text-[10px] font-bold tracking-wider uppercase sm:px-5 sm:text-xs",
                isActive(link.href)
                  ? "bg-primary-500 text-white"
                  : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950",
              ]}
            >
              {link.label}
            </a>
          {/each}
        </nav>
        {#if page.data.user}
          <div class="border-l-2 border-neutral-800 py-1.5 pl-3 sm:pl-5">
            <UserAvatarMenu
              userName={page.data.user.name}
              userEmail={page.data.user.email}
            />
          </div>
        {/if}
      </div>
    </div>
  </header>

  <main class="relative">
    <svelte:boundary>
      {@render children()}

      {#snippet pending()}
        <div class="leader-page">
          <div class="flex items-center justify-center py-24">
            <p
              class="font-mono text-xs font-bold tracking-wider text-neutral-400 uppercase"
            >
              Loading…
            </p>
          </div>
        </div>
      {/snippet}

      {#snippet failed(error, reset)}
        <div class="leader-page">
          <div
            class="mx-auto max-w-sm space-y-4 py-24 text-center"
          >
            <p
              class="font-mono text-xs font-bold tracking-wider text-red-600 uppercase"
            >
              Something went wrong
            </p>
            <p class="font-mono text-xs text-neutral-500">
              {error instanceof Error ? error.message : "An unexpected error occurred"}
            </p>
            <button
              onclick={reset}
              class="bg-primary-500 px-4 py-2 font-mono text-xs font-bold tracking-wider text-white uppercase transition-colors hover:bg-primary-600"
            >
              Try again
            </button>
          </div>
        </div>
      {/snippet}
    </svelte:boundary>
  </main>
</div>
