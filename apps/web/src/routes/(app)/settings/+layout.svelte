<script lang="ts">
  import { page } from "$app/state";
  import { resolve } from "$app/paths";

  let { children } = $props();

  const isOrgAdmin = $derived(
    page.data.memberRole === "owner" || page.data.memberRole === "admin"
  );

  const navLinks = $derived([
    { href: "/settings/profile" as const, label: "Profile" },
    ...(isOrgAdmin
      ? [
          {
            href: "/settings/organisation" as const,
            label: "Organisation",
          },
        ]
      : []),
  ]);
</script>

<div class="leader-page">
  <div class="mb-8">
    <p
      class="text-primary-700 font-mono text-[10px] font-bold tracking-[0.3em] uppercase"
    >
      Account
    </p>
    <h1
      class="text-2xl font-bold tracking-tight text-neutral-950 uppercase sm:text-3xl"
    >
      Settings
    </h1>
  </div>

  <div class="flex flex-col gap-8 sm:flex-row">
    <nav
      class="flex shrink-0 flex-row gap-1 sm:w-48 sm:flex-col"
      aria-label="Settings navigation"
    >
      {#each navLinks as link (link.href)}
        <a
          href={resolve(link.href)}
          class={[
            "transition-snappy border-2 px-4 py-2 font-mono text-xs font-bold tracking-wider uppercase",
            page.url.pathname.startsWith(link.href)
              ? "bg-primary-500 border-neutral-800 text-white"
              : "border-transparent text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950",
          ]}
        >
          {link.label}
        </a>
      {/each}
    </nav>

    <div class="min-w-0 flex-1">
      {@render children()}
    </div>
  </div>
</div>
