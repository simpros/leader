# Project

- leader is a Turborepo workspace using Bun with a SvelteKit app, Drizzle ORM, and Better Auth.
- Package manager: Bun (`bun install`, `bun run`).
- Build (repo): `bun run build`.
- Typecheck (apps/web): `bun run check`.

# Svelte development rule

**MANDATORY**: Invoke the `svelte-code-writer` skill BEFORE writing or modifying any code in the following situations — no exceptions:

- Any `.svelte`, `.svelte.ts`, or `.svelte.js` file
- SvelteKit-specific files: `+page.svelte`, `+layout.svelte`, `+page.ts`, `+page.server.ts`, `+layout.ts`, `+layout.server.ts`, `+server.ts`, `hooks.server.ts`, etc.
- Any file using Svelte 5 runes (`$state`, `$derived`, `$effect`, `$props`, `$bindable`, etc.)
- Remote functions (`.remote.ts` files) that interact with SvelteKit load functions or form actions
- Any code involving SvelteKit-specific APIs: `load`, `actions`, `RequestEvent`, `PageData`, `LayoutData`, `superforms`, etc.

# More instructions

- Commands: [docs/agents/commands.md](docs/agents/commands.md)
- Environment and DB: [docs/agents/environment.md](docs/agents/environment.md)
- apps/web notes: [docs/agents/apps-web.md](docs/agents/apps-web.md)
- Conventions: [docs/agents/conventions.md](docs/agents/conventions.md)
