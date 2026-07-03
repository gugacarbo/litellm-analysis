#!/usr/bin/env bash
set -euo pipefail

# Append-only task progress logger with file locking.
#
# Usage:
#   scripts/log-task.sh \
#     --plan 0003-auth-middleware \
#     --task Task-A-0001 \
#     --event started|ready_for_review|failed|blocked|completed \
#     [--try 1] \
#     [--max-tries 3] \
#     [--message "optional message"]
#
# The log file is written to <workspace-root>/docs/tasks/<plan>/<task>/progress.log.
# Prefer copying this script into each task directory and dispatching that
# task-local copy to workers.

PLAN=""
TASK=""
EVENT=""
TRY=""
MAX_TRIES=""
MESSAGE=""

usage() {
  echo "Usage: log-task.sh --plan <plan-ref> --task <task-id> --event <started|ready_for_review|failed|blocked|completed> [--try N] [--max-tries N] [--message \"text\"]"
  exit 1
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --plan)
      PLAN="$2"
      shift 2
      ;;
    --task)
      TASK="$2"
      shift 2
      ;;
    --event)
      EVENT="$2"
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
    --message)
      MESSAGE="$2"
      shift 2
      ;;
    *)
      usage
      ;;
  esac
done

if [[ -z "$PLAN" || -z "$TASK" || -z "$EVENT" ]]; then
  usage
fi

case "$EVENT" in
  started|ready_for_review|failed|blocked|completed)
    ;;
  *)
    echo "Invalid event: $EVENT" >&2
    usage
    ;;
esac

find_workspace_root() {
  local start_dir="${1:-$PWD}"
  local dir="$start_dir"

  # Allow override via environment variable
  if [[ -n "${WORKSPACE_ROOT:-}" ]]; then
    printf '%s\n' "$WORKSPACE_ROOT"
    return 0
  fi

  while [[ "$dir" != "/" ]]; do
    for marker in .git package.json pyproject.toml Cargo.toml go.mod AGENTS.md; do
      if [[ -e "$dir/$marker" ]]; then
        printf '%s\n' "$dir"
        return 0
      fi
    done
    dir="$(dirname "$dir")"
  done

  # Fall back to start_dir if nothing found
  printf '%s\n' "$start_dir"
}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_ROOT="$(find_workspace_root "$SCRIPT_DIR")"
TASKS_DIR="${AGENTS_SKILLS_TASKS_DIR:-$WORKSPACE_ROOT/docs/tasks}"
LOG_DIR="${AGENTS_SKILLS_TASK_DIR:-$TASKS_DIR/$PLAN/$TASK}"
LOG_FILE="$LOG_DIR/progress.log"

mkdir -p "$LOG_DIR"

TIMESTAMP="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

try_count() {
  if [[ -n "$TRY" ]]; then
    printf '%s' "$TRY"
  else
    printf 'null'
  fi
}

max_tries() {
  if [[ -n "$MAX_TRIES" ]]; then
    printf '%s' "$MAX_TRIES"
  else
    printf 'null'
  fi
}

message_json() {
  if [[ -n "$MESSAGE" ]]; then
    if command -v jq >/dev/null 2>&1; then
      printf '%s' "$MESSAGE" | jq -Rs .
    else
      # Safe manual JSON escape for the message string.
      local escaped="${MESSAGE//\\/\\\\}"
      escaped="${escaped//\"/\\\"}"
      escaped="${escaped//$'\r'/}"
      escaped="${escaped//$'\n'/\\n}"
      escaped="${escaped//$'\t'/\\t}"
      printf '"%s"' "$escaped"
    fi
  else
    printf 'null'
  fi
}

LOCK_FILE="$LOG_FILE.lock"

# Acquire exclusive lock; wait up to 10 seconds
exec 200>"$LOCK_FILE"
flock -x -w 10 200 || { echo "Could not acquire lock for $LOG_FILE" >&2; exit 1; }

printf '{"timestamp":"%s","task":"%s","event":"%s","try":%s,"maxTries":%s,"message":%s}\n' \
  "$TIMESTAMP" "$TASK" "$EVENT" "$(try_count)" "$(max_tries)" "$(message_json)" >> "$LOG_FILE"

# Release lock by closing descriptor
exec 200>&-
