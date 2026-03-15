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

# Testing rule

**MANDATORY**: When adding a new feature or modifying an existing one, always add or update unit tests for the affected code. No feature is considered complete without corresponding test coverage.

- New schemas (`$lib/schemas/`) must have validation tests (valid input, boundary values, rejection cases).
- New server-side utilities or services (`$lib/server/`) must have unit tests with appropriate mocking.
- New ID kinds (`packages/db/src/id.ts`) must be added to the `ALL_KINDS` array and named schemas list in `id.test.ts`.
- When mocking modules in bun tests, spread the real module's exports to avoid breaking other test files (`mock.module` leaks process-wide in bun).
- Run `bun run test` from the repo root to verify all tests pass before considering a change complete.
- See [docs/testing.md](docs/testing.md) for the full testing guide.
