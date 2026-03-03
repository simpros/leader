# Testing

Leader uses three layers of automated tests: **unit/component tests**, **integration tests** (real PostgreSQL via testcontainers), and **end-to-end tests** (Playwright against a production build). All tests run in CI on every pull request.

## Quick Reference

```bash
# Unit & component tests (all packages, via Turborepo)
bun run test

# Integration tests (packages/db — requires Docker)
bun --cwd packages/db run test:integration

# E2E tests (apps/web — requires Docker)
bun --cwd apps/web run test:e2e
```

## Test Runner

All unit, component, and integration tests use [Bun's built-in test runner](https://bun.sh/docs/test) (`bun:test`). There is **no vitest dependency**. E2E tests use [Playwright](https://playwright.dev/).

---

## Unit & Component Tests

The root `bun run test` command runs `turbo run test`, which executes the `test` script in every workspace package.

### Package test commands

| Package | Command | What it tests |
| --- | --- | --- |
| `packages/db` | `bun test ./**/*.test.ts` | ID generation, schema validation |
| `packages/auth` | `bun test` | Email template rendering |
| `packages/logging` | `bun test` | Dynatrace sink formatting, log filters |
| `packages/ui` | `bun test --conditions browser` | Svelte component rendering (Badge, Button, Card, etc.) |
| `apps/web` | `bun test --conditions browser` | Schemas, server utils, email logic, route components |

### Svelte Component Testing

Component tests use `@testing-library/svelte` with `happy-dom` for DOM emulation. A shared preload script at the repo root (`svelte-test-setup.ts`) handles:

- **DOM cleanup** between tests via `@happy-dom/global-registrator`
- **Svelte compilation** via a Bun plugin that compiles `.svelte` and `.svelte.ts` files on the fly
- **SvelteKit module mocks** for `$app/navigation`, `$app/stores`, `$app/environment`, and `$app/server`

Packages that run component tests (`packages/ui`, `apps/web`) reference this preload in their `bunfig.toml`:

```toml
[test]
preload = ["../../svelte-test-setup.ts"]
```

The `--conditions browser` flag is required so SvelteKit resolves browser-side exports.

> **Note**: `apps/web/bunfig.toml` also sets `root = "./src"` to prevent Bun's test discovery from picking up Playwright `.spec.ts` files in the `tests/` directory.

---

## Integration Tests

Integration tests in `packages/db` run against a real PostgreSQL instance managed by [testcontainers](https://testcontainers.com/). They require Docker to be running.

```bash
bun --cwd packages/db run test:integration
```

Testcontainers automatically:
1. Pulls and starts a PostgreSQL container
2. Runs Drizzle migrations
3. Executes tests against the live database
4. Tears down the container when done

These tests validate schema migrations, complex queries, and ORM behavior against a real database — no mocking.

---

## E2E Tests

End-to-end tests use Playwright against a production build of the SvelteKit app.

### Prerequisites

- Docker (for the E2E PostgreSQL instance)
- Playwright browsers: `bunx playwright install --with-deps chromium`

### Running

```bash
bun --cwd apps/web run test:e2e
```

This single command:
1. Builds the app with `vite build`
2. Copies Drizzle migration files into the build output
3. Starts a PostgreSQL container via `docker compose` (port 5433)
4. Runs Playwright tests against the production build served on port 3000
5. Tears down the database container

### Architecture

The E2E setup follows a **Page Object Model** pattern with Playwright projects for ordered setup:

```
apps/web/
├── playwright.config.ts          # Central config (4 projects)
└── tests/
    ├── docker-compose.e2e.yml    # PostgreSQL 18 on port 5433 (tmpfs)
    ├── config/
    │   ├── global.setup.ts       # Runs DB migrations + seeding via bun subprocess
    │   ├── global.teardown.ts    # Cleanup
    │   ├── setup-db.ts           # Standalone bun script (migrations + seed)
    │   └── seed.ts               # Creates test users via Better Auth API
    ├── auth.setup.ts             # Authenticates users, saves storage states
    ├── fixtures/
    │   ├── index.ts              # test.extend with POM fixtures + constants
    │   ├── utils.ts              # waitForHydration() helper
    │   ├── projects-page.ts      # Page Object Model for projects
    │   ├── leads-page.ts         # Page Object Model for leads
    │   └── settings-page.ts      # Page Object Model for settings
    ├── auth.spec.ts              # Authentication flow tests
    ├── navigation.spec.ts        # Navigation and routing tests
    ├── projects.spec.ts          # Project CRUD tests
    ├── leads.spec.ts             # Lead management tests
    └── settings.spec.ts          # Settings page tests
```

### Playwright Projects

The config defines 4 projects that run in order:

1. **setup** — Starts DB, runs migrations, seeds test users
2. **auth setup** — Logs in as test user/admin, saves browser storage states to `tests/.auth/`
3. **chromium** — Runs all `.spec.ts` tests using saved auth states
4. **teardown** — Cleanup

### Test Users

| Role | Email | Password |
| --- | --- | --- |
| User | `test@leader.local` | `Test@123456` |
| Admin | `testadmin@leader.local` | `Admin@123456` |
| Guest | _(no login)_ | _(empty storage state)_ |

> The app's bootstrap process creates `admin@leader.local` with a random password at startup. E2E tests use `testadmin@leader.local` to avoid collisions.

### Key Technical Details

- **Playwright runs on Node.js**, not Bun. Since `@leader/db` uses `import { SQL } from "bun"`, DB setup runs as a Bun subprocess via `execSync("bun run tests/config/setup-db.ts")`.
- **The database must be running before the web server starts** because `hooks.server.ts` runs migrations on startup.
- **Production build paths**: Drizzle migration files are copied to `build/server/drizzle/` after `vite build` because `import.meta.url` resolves differently in bundled code.

### Debugging E2E Tests

To run E2E tests manually (useful for debugging):

```bash
cd apps/web

# Start the E2E database
docker compose -f tests/docker-compose.e2e.yml up -d --wait

# Build the app
vite build && cp -r ../../packages/db/drizzle build/server/drizzle

# Run specific tests with UI mode
DATABASE_URL=postgres://test:test@localhost:5433/e2e_test bunx playwright test --ui

# Or run a single spec
DATABASE_URL=postgres://test:test@localhost:5433/e2e_test bunx playwright test auth.spec.ts

# Clean up
docker compose -f tests/docker-compose.e2e.yml down -v
```

---

## CI/CD

All test layers run automatically on pull requests via GitHub Actions (`.github/workflows/ci.yml`). The pipeline runs four parallel jobs:

1. **Lint, Typecheck & Build** — `bun run lint` + `bun run check` + `bun run build`
2. **Unit & Component Tests** — `bun run test` (all packages via Turborepo)
3. **Integration Tests** — `bun --cwd packages/db run test:integration` (testcontainers + Docker)
4. **E2E Tests** — `bun --cwd apps/web run test:e2e` (Playwright + Docker Compose)

All jobs must pass before a PR can be merged.
