#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_SCRIPT="$(cd "$SCRIPT_DIR" && cd "../../../../../../.agents/skills/super-planning/scripts" && pwd)/log-task.sh"

exec bash "$ROOT_SCRIPT" \
  --plan "0002-fundacao-ui-tanstack-start" \
  --task "Task-E-1" \
  --log-dir "$SCRIPT_DIR" \
  "$@"
