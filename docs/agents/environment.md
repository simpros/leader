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
DYNATRACE_LOG_INGEST_URL=optional
DYNATRACE_API_TOKEN=optional
```

## Database

- Start local Postgres: `docker compose up -d db`
- Generate Better Auth schema: `bun run auth:generate`
- Generate migration: `bun run db:generate`
- Run migrations: `bun run db:migrate`
