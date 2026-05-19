#!/usr/bin/env bash
set -euo pipefail

# LiteLLM PostgreSQL Backup Script
# Creates compressed SQL dumps with 7-day retention
#
# Usage:
#   DATABASE_URL="postgresql://..." pnpm backup
#   BACKUP_DIR="./backups" RETENTION_DAYS=14 pnpm backup

BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"

# Validate DATABASE_URL is set
if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "ERROR: DATABASE_URL environment variable is not set"
  echo "Usage: DATABASE_URL='postgresql://user:pass@host:5432/db' pnpm backup"
  exit 1
fi

# Extract database name from URL for naming
DB_NAME=$(echo "$DATABASE_URL" | sed -n 's|.*/\([^?]*\).*|\1|p')
HOST=$(echo "$DATABASE_URL" | sed -n 's|.*@\([^:]*\):.*|\1|p')

echo "Starting backup of database '$DB_NAME' on host '$HOST'..."
echo "Retention: $RETENTION_DAYS days"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Generate timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/litellm_${DB_NAME}_${TIMESTAMP}.sql.gz"

# Create the backup using pg_dump
# -Fc = custom format (compressed, allows parallel restore)
# -j = parallel jobs for large databases (optional, can increase)
pg_dump "$DATABASE_URL" -Fc -j 4 | gzip > "$BACKUP_FILE"

# Get file size for logging
FILE_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)

echo "Backup created: $BACKUP_FILE ($FILE_SIZE)"

# Remove backups older than RETENTION_DAYS
echo "Cleaning up backups older than $RETENTION_DAYS days..."
FIND_COUNT=$(find "$BACKUP_DIR" -name "litellm_${DB_NAME}_*.sql.gz" -type f -mtime +"$RETENTION_DAYS" | wc -l)
find "$BACKUP_DIR" -name "litellm_${DB_NAME}_*.sql.gz" -type f -mtime +"$RETENTION_DAYS" -delete

if [[ "$FIND_COUNT" -gt 0 ]]; then
  echo "Removed $FIND_COUNT old backup(s)"
fi

# Count remaining backups
REMAINING=$(find "$BACKUP_DIR" -name "litellm_${DB_NAME}_*.sql.gz" -type f | wc -l)
echo "Backup complete. $REMAINING backup(s) retained."

# List recent backups
echo ""
echo "Recent backups:"
ls -lh "$BACKUP_DIR"/litellm_"${DB_NAME}"_*.sql.gz 2>/dev/null | tail -5 || echo "No backups found"
