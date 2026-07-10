#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="$SCRIPT_DIR/progress.log"

EVENT=""
MESSAGE=""
TRY=""
MAX_TRIES=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --event)
      EVENT="$2"
      shift 2
      ;;
    --message)
      MESSAGE="$2"
      shift 2
      ;;
    --try)
      TRY="$2"
      shift 2
      ;;
    --max-tries)
      MAX_TRIES="$2"
      shift 2
      ;;
    *)
      if [[ -z "$MESSAGE" ]]; then
        MESSAGE="$1"
      fi
      shift
      ;;
  esac
done

if [[ -z "$EVENT" ]]; then
  echo "Usage: $0 --event <started|ready_for_review|failed|blocked|completed> [--message \"text\"] [--try N] [--max-tries N]" >&2
  exit 1
fi

TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
printf '{"timestamp":"%s","task":"Task-B-1","event":"%s","try":%s,"maxTries":%s,"message":"%s"}\n' \
  "$TIMESTAMP" "$EVENT" "${TRY:-1}" "${MAX_TRIES:-3}" "${MESSAGE:-}" >> "$LOG_FILE"
