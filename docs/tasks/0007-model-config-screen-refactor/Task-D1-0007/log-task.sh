#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_SCRIPT="/home/gustavo/Apps/lite-llm-analytics/.super-planning/log-task.sh"

exec bash "$ROOT_SCRIPT" \
  --plan "0007-model-config-screen-refactor" \
  --task "Task-D1-0007" \
  --log-dir "$SCRIPT_DIR" \
  "$@"
