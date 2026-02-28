ARG COMMIT_SHA=unknown

FROM oven/bun:1.3.9-alpine AS base

WORKDIR /app

# ---- Prune monorepo ----
FROM base AS prepare

RUN bun add -g turbo@^2

COPY . .
RUN turbo prune @leader/web --docker

# ---- Install deps + build ----
FROM base AS builder

# Install dependencies (cached until lockfile/package.json changes)
COPY --from=prepare /app/out/json/ .
# turbo prune misses @leader/typescript-config (peer dep of @leader/ui)
COPY --from=prepare /app/bun.lock ./bun.lock
COPY --from=prepare /app/packages/typescript-config/package.json ./packages/typescript-config/package.json
RUN bun install --frozen-lockfile

# Build the project
COPY --from=prepare /app/out/full/ .
COPY --from=prepare /app/packages/typescript-config/ ./packages/typescript-config/
RUN bun run build --filter=@leader/web

# ---- Production runner ----
FROM base AS runner

ARG COMMIT_SHA
RUN --mount=type=secret,id=DYNATRACE_LOG_INGEST_URL \
    --mount=type=secret,id=DYNATRACE_API_TOKEN \
    printf '%s\n%s\n' \
    "DYNATRACE_LOG_INGEST_URL=$(cat /run/secrets/DYNATRACE_LOG_INGEST_URL)" \
    "DYNATRACE_API_TOKEN=$(cat /run/secrets/DYNATRACE_API_TOKEN)" > .env.telemetry

RUN addgroup --system --gid 1001 app && \
    adduser --system --uid 1001 -G app app
USER app

ENV NODE_ENV=production
ENV PORT=3000
ENV COMMIT_SHA=${COMMIT_SHA}

COPY --from=builder --chown=app:app /app/apps/web/build ./
# Migrations are resolved at runtime from server hooks via ../drizzle
COPY --from=builder --chown=app:app /app/packages/db/drizzle ./server/drizzle

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["sh", "-c", "set -a && . ./.env.telemetry && set +a && exec bun run index.js"]
