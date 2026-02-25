#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/yarokb}"
BACKUP_DIR="$APP_DIR/backups"
RETENTION_DAYS=14
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/oculus_${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

echo "==> Creating backup: $BACKUP_FILE"
docker compose -f "$APP_DIR/docker-compose.prod.yml" exec -T db \
    pg_dump -U "${DB_USER:-oculus}" "${DB_NAME:-oculus}" | gzip > "$BACKUP_FILE"

if [ ! -s "$BACKUP_FILE" ]; then
    echo "==> ERROR: Backup file is empty"
    rm -f "$BACKUP_FILE"
    exit 1
fi

echo "==> Backup size: $(du -h "$BACKUP_FILE" | cut -f1)"

echo "==> Removing backups older than ${RETENTION_DAYS} days..."
find "$BACKUP_DIR" -name "oculus_*.sql.gz" -mtime "+$RETENTION_DAYS" -delete

if [ -n "${BACKUP_S3_BUCKET:-}" ] && [ -n "${BACKUP_S3_ENDPOINT:-}" ]; then
    echo "==> Uploading to S3..."
    aws s3 cp "$BACKUP_FILE" "s3://${BACKUP_S3_BUCKET}/backups/" \
        --endpoint-url "$BACKUP_S3_ENDPOINT"
    echo "==> S3 upload complete"
fi

echo "==> Backup complete!"
