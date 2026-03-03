# Commands

## Repo-level (Turborepo)

- Install deps: `bun install`
- Dev (all packages): `bun run dev`
- Build (all packages): `bun run build`
- Lint (all packages): `bun run lint`
- Format (all packages): `bun run format`
- Unit & component tests (all packages): `bun run test`

## apps/web (SvelteKit)

- Dev: `bun run dev`
- Build: `bun run build`
- Preview: `bun run preview`
- Typecheck: `bun run check`
- Typecheck watch: `bun run check:watch`
- Unit & component tests: `bun run test` (uses `--conditions browser`)
- E2E tests: `bun run test:e2e` (requires Docker)

Note: From repo root, run `bun --cwd apps/web run <script>` or `cd apps/web` first.

## packages/db

- Unit tests: `bun run test`
- Integration tests (requires Docker): `bun run test:integration`

## Testing

See [docs/testing.md](../testing.md) for the full testing guide.
