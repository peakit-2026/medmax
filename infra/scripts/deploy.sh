#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/yarokb}"
COMPOSE_FILE="$APP_DIR/docker-compose.prod.yml"

cd "$APP_DIR"

echo "==> Pulling latest images..."
docker compose -f "$COMPOSE_FILE" pull backend sfu || true

echo "==> Starting services..."
docker compose -f "$COMPOSE_FILE" up -d --remove-orphans

echo "==> Waiting for backend healthcheck..."
for i in $(seq 1 30); do
    if docker compose -f "$COMPOSE_FILE" exec -T backend curl -sf http://localhost:8080/api/health > /dev/null 2>&1; then
        echo "==> Backend is healthy!"
        break
    fi
    if [ "$i" -eq 30 ]; then
        echo "==> ERROR: Backend failed healthcheck after 30s"
        docker compose -f "$COMPOSE_FILE" logs --tail=50 backend
        exit 1
    fi
    sleep 1
done

echo "==> Cleaning up old images..."
docker image prune -f

echo "==> Deploy complete!"
