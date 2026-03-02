#!/usr/bin/env bash
set -euo pipefail

COMPOSE_FILE="tests/docker-compose.e2e.yml"

cleanup() {
  echo "🧹 Stopping test containers..."
  docker compose -f "$COMPOSE_FILE" down -v
}
trap cleanup EXIT

echo "🔨 Building app..."
bun run build

echo "🐳 Starting test infrastructure..."
docker compose -f "$COMPOSE_FILE" down -v 2>/dev/null || true
docker compose -f "$COMPOSE_FILE" up -d --wait

echo "🧪 Running Playwright tests..."
playwright test "$@"
