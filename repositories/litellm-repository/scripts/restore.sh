#!/usr/bin/env bash
set -euo pipefail

# LiteLLM PostgreSQL Restore Script
# Restores from a backup file created by backup.sh
#
# Usage:
#   DATABASE_URL="postgresql://..." ./scripts/restore.sh <backup_file>
#   DATABASE_URL="postgresql://..." ./scripts/restore.sh ./backups/litellm_db_20260518_120000.sql.gz

BACKUP_DIR="${BACKUP_DIR:-./backups}"

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "ERROR: DATABASE_URL environment variable is not set"
  echo "Usage: DATABASE_URL='postgresql://...' ./scripts/restore.sh <backup_file>"
  exit 1
fi

if [[ $# -lt 1 ]]; then
  echo "ERROR: Missing backup file argument"
  echo ""
  echo "Usage: DATABASE_URL='postgresql://...' ./scripts/restore.sh <backup_file>"
  echo ""
  echo "Available backups:"
  ls -lh "$BACKUP_DIR"/*.sql.gz 2>/dev/null || echo "  No backups found in $BACKUP_DIR"
  exit 1
fi

BACKUP_FILE="$1"

if [[ ! -f "$BACKUP_FILE" ]]; then
  echo "ERROR: Backup file not found: $BACKUP_FILE"
  exit 1
fi

# Confirm before restoring
echo "WARNING: This will overwrite the current database!"
echo "Backup file: $BACKUP_FILE"
echo "Target database: $DATABASE_URL"
echo ""
read -p "Are you sure you want to continue? (yes/no): " -r

if [[ "$REPLY" != "yes" ]]; then
  echo "Restore cancelled."
  exit 0
fi

echo "Starting restore..."

# Restore using pg_restore
# -c = drop database objects before recreating
# --create = create database before restoring into it
gunzip -c "$BACKUP_FILE" | pg_restore "$DATABASE_URL" --clean --if-exists

echo "Restore complete!"
