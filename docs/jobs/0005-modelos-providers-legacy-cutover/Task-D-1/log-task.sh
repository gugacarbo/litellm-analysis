#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_SCRIPT="$(cd "$SCRIPT_DIR" && cd "../../../../.super-planning" && pwd)/log-task.sh"

exec bash "$ROOT_SCRIPT" \
  --plan "docs/jobs/0005-modelos-providers-legacy-cutover/super-plan.json" \
  --task "Task-D-1" \
  --log-dir "$SCRIPT_DIR" \
  "$@"
