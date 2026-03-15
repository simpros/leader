# Environment and database

## Environment

Create a `.env` file in the repo root with:

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/leader
BETTER_AUTH_SECRET=replace-me
BETTER_AUTH_BASE_URL=http://localhost:5173
GOOGLE_PLACES_API_KEY=replace-me
OPENROUTER_API_KEY=optional
OPENROUTER_MODEL=openai/gpt-4o-mini
BRAVE_API_KEY=optional
LEADER_TELEMETRY=true
DYNATRACE_OTLP_ENDPOINT=https://{env-id}.live.dynatrace.com/api/v2/otlp
DYNATRACE_API_TOKEN=dt0c01.XXXXX
ALLOW_SIGN_UP=false
```

### Telemetry environment variables

| Variable | Required | Description |
|---|---|---|
| `LEADER_TELEMETRY` | No | Set to `false` to disable telemetry. Defaults to enabled. |
| `DYNATRACE_OTLP_ENDPOINT` | No | Base OTLP endpoint for Dynatrace (e.g. `https://{env-id}.live.dynatrace.com/api/v2/otlp`). SDK appends `/v1/traces` and `/v1/logs`. |
| `DYNATRACE_API_TOKEN` | No | Dynatrace API token. Needs scopes: `logs.ingest`, `openTelemetryTrace.ingest`. |

Both `DYNATRACE_OTLP_ENDPOINT` and `DYNATRACE_API_TOKEN` must be set for telemetry export. When missing, only console logging is active.

### Multi-org / sign-up variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `ALLOW_SIGN_UP` | No | `false` | Set to `true` to enable public sign-up (creates user + org). Requires tracing to be configured. |

Organisation SMTP passwords are encrypted at rest using a key derived from `BETTER_AUTH_SECRET` (via HKDF). No additional encryption key is needed.

**Important:** When `ALLOW_SIGN_UP=true`, the server will refuse to start unless `DYNATRACE_OTLP_ENDPOINT` and `DYNATRACE_API_TOKEN` are set and `LEADER_TELEMETRY` is not `false`.

## Database

- Start local Postgres: `docker compose up -d db`
- Generate Better Auth schema: `bun run auth:generate`
- Generate migration: `bun run db:generate`
- Run migrations: `bun run db:migrate`
