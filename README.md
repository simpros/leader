# Leader

[![CI](https://github.com/simpros/leader/actions/workflows/ci.yml/badge.svg)](https://github.com/simpros/leader/actions/workflows/ci.yml)
[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL--3.0-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![Docker Image](https://img.shields.io/badge/ghcr.io-simpros%2Fleader-blue?logo=docker)](https://ghcr.io/simpros/leader)

**Open-source lead management & outreach platform.** Discover businesses, organize them into projects, and run email campaigns — all from a single self-hostable app.

## Features

- 🔍 **Lead Discovery** — Search for businesses via Google Places API and enrich them with contact details
- 📁 **Projects** — Organize leads into projects with custom fields and attributes
- 📧 **Email Campaigns** — Create and send HTML email campaigns to lead groups, track responses per lead
- 🤖 **AI-Powered Search** — Generate discovery queries using LLMs via OpenRouter
- 👥 **Multi-Org** — Role-based access with organization management and user invitations
- 🔒 **Self-Hostable** — Deploy with Docker in minutes, keep your data under your control

## Tech Stack

| Layer      | Technology                                               |
| ---------- | -------------------------------------------------------- |
| Framework  | [SvelteKit](https://svelte.dev/docs/kit)                 |
| Language   | TypeScript                                               |
| Database   | PostgreSQL + [Drizzle ORM](https://orm.drizzle.team)     |
| Auth       | [Better Auth](https://www.better-auth.com)               |
| Styling    | [Tailwind CSS v4](https://tailwindcss.com)               |
| Components | [Bits UI](https://bits-ui.com)                           |
| Monorepo   | [Turborepo](https://turbo.build) + [Bun](https://bun.sh) |
| Deployment | Docker (Node adapter)                                    |

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) ≥ 1.1
- [Docker](https://docs.docker.com/get-docker/) (for PostgreSQL)

### Local Development

```bash
# Clone the repository
git clone https://github.com/simpros/leader.git
cd leader

# Install dependencies
bun install

# Start PostgreSQL and Mailpit
docker compose up -d

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys

# Generate auth schema and run migrations
bun run auth:generate
bun run db:generate
bun run db:migrate

# Start the development server
bun run dev
```

The app is available at [http://localhost:5173](http://localhost:5173).

### Environment Variables

#### Core (required)

| Variable               | Description                              |
| ---------------------- | ---------------------------------------- |
| `DATABASE_URL`         | PostgreSQL connection string             |
| `BETTER_AUTH_SECRET`   | Secret key for session encryption        |
| `BETTER_AUTH_BASE_URL` | Public URL of the app                    |

#### API Keys

| Variable                | Required | Description                              |
| ----------------------- | -------- | ---------------------------------------- |
| `GOOGLE_PLACES_API_KEY` | Yes      | Google Places API key for lead discovery |
| `BRAVE_API_KEY`         | No       | Brave Search API key for enrichment      |
| `OPENROUTER_API_KEY`    | No       | OpenRouter API key for AI-powered search |
| `OPENROUTER_MODEL`      | No       | OpenRouter model name (default: `openai/gpt-4o-mini`) |

#### Email (SMTP)

| Variable    | Required | Description                                  |
| ----------- | -------- | -------------------------------------------- |
| `SMTP_HOST` | No       | SMTP server host                             |
| `SMTP_PORT` | No       | SMTP server port (default: `1025`)           |
| `SMTP_USER` | No       | SMTP username                                |
| `SMTP_PASS` | No       | SMTP password                                |
| `EMAIL_FROM`| No       | Sender email address (default: `noreply@example.com`) |

#### Telemetry

The official Docker image ships with anonymous telemetry that helps the maintainers identify bugs and prioritize improvements. **No personal data is collected** — only structured request logs (method, path, status code, duration) are sent to the maintainers' log aggregator.

You can opt out at any time by setting a single environment variable:

| Variable           | Default | Description                                      |
| ------------------ | ------- | ------------------------------------------------ |
| `LEADER_TELEMETRY` | _(on)_  | Set to `false` to disable telemetry completely   |

When telemetry is off, logs are still written to the console — only the remote reporting is disabled.

#### Bootstrap

On first startup the app automatically creates an initial admin user and organization. These env vars customize that behavior:

| Variable                       | Default            | Description                    |
| ------------------------------ | ------------------ | ------------------------------ |
| `BOOTSTRAP_USER_NAME`          | `Admin`            | Display name of the first user |
| `BOOTSTRAP_USER_EMAIL`         | `admin@leader.local` | Email / login of the first user |
| `BOOTSTRAP_ORGANIZATION_NAME`  | `Leader`           | Name of the default organization |
| `BOOTSTRAP_ORGANIZATION_SLUG`  | `leader`           | URL slug of the default organization |

A random password is generated and printed to the console on first run. After the initial user exists, subsequent restarts skip creation.

See [`.env.example`](.env.example) for defaults.

## Self-Hosting with Docker

Pull the latest image from GitHub Container Registry and run alongside PostgreSQL:

```bash
# Download the production compose file
curl -O https://raw.githubusercontent.com/simpros/leader/main/docker-compose.prod.yml

# Create your .env file (set a strong password for both DB vars)
PG_PASS=$(openssl rand -hex 16)
cat > .env <<EOF
POSTGRES_PASSWORD=$PG_PASS
DATABASE_URL=postgresql://postgres:$PG_PASS@db:5432/leader
BETTER_AUTH_SECRET=$(openssl rand -hex 32)
BETTER_AUTH_BASE_URL=https://your-domain.com
GOOGLE_PLACES_API_KEY=your-key-here
EOF

# Start everything
docker compose -f docker-compose.prod.yml up -d
```

The app is available on port `3000`.

## Project Structure

```
leader/
├── apps/
│   └── web/                 # SvelteKit application
│       └── src/
│           ├── routes/      # Pages and API endpoints
│           └── lib/         # Shared utilities
├── packages/
│   ├── auth/                # Authentication (Better Auth)
│   ├── db/                  # Database schema and migrations (Drizzle)
│   ├── ui/                  # Shared Svelte component library
│   ├── eslint-config/       # Shared ESLint configuration
│   ├── tailwind-config/     # Shared Tailwind configuration
│   └── typescript-config/   # Shared TypeScript configuration
├── Dockerfile               # Production Docker image
├── docker-compose.yml       # Local development services
└── docker-compose.prod.yml  # Self-hosting compose file
```

## Development

```bash
# Run the development server
bun run dev

# Lint
bun run lint

# Type-check
cd apps/web && bun run check

# Build for production
bun run build

# Format code
bun run format
```

### Database Commands

```bash
bun run db:generate   # Generate migration from schema changes
bun run db:migrate    # Apply pending migrations
bun run db:push       # Push schema directly (dev only)
bun run db:seed       # Seed the database
bun run db:studio     # Open Drizzle Studio
```

## Releasing

Docker images are published automatically when you push a git tag:

```bash
# Tag a release (uses apps/web/package.json version)
git tag web@0.1.0
git push origin web@0.1.0
```

This builds and pushes to `ghcr.io/simpros/leader:0.1.0` and `ghcr.io/simpros/leader:latest`.

## Contributing

Contributions are welcome! Please open an issue or pull request.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes
4. Push to your fork and open a pull request

### Maintainer: Telemetry Build Configuration

The official Docker image embeds Dynatrace credentials at **build time** so end users don't need to configure them. These are stored as GitHub Actions secrets and passed as Docker build args during CI:

| Build Arg                    | GitHub Secret                | Description                                           |
| ---------------------------- | ---------------------------- | ----------------------------------------------------- |
| `DYNATRACE_LOG_INGEST_URL`  | `DYNATRACE_LOG_INGEST_URL`  | Dynatrace log ingest endpoint (`/api/v2/logs/ingest`) |
| `DYNATRACE_API_TOKEN`       | `DYNATRACE_API_TOKEN`       | Dynatrace API token with `logs.ingest` scope          |

To build locally with telemetry:

```bash
docker build \
  --build-arg DYNATRACE_LOG_INGEST_URL=https://xyz.live.dynatrace.com/api/v2/logs/ingest \
  --build-arg DYNATRACE_API_TOKEN=dt0c01.XXXX \
  -t leader apps/web
```

If neither arg is provided, the image runs with console-only logging (telemetry becomes a no-op regardless of `LEADER_TELEMETRY`).

## License

This project is licensed under the [GNU Affero General Public License v3.0](LICENSE).
