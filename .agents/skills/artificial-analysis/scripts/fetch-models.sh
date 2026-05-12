#!/usr/bin/env bash
set -euo pipefail

# Artificial Analysis model fetcher with local rate limiting and minimum response time.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
ENV_FILE="${ENV_FILE:-${SKILL_DIR}/.env}"
CACHE_DIR="${CACHE_DIR:-${SKILL_DIR}/.cache}"
CACHE_FILE="${CACHE_FILE:-${CACHE_DIR}/models.json}"
STATE_FILE="${STATE_FILE:-${CACHE_DIR}/rate-limit-state.tsv}"

API_URL="${ARTIFICIAL_ANALYSIS_API_URL:-https://artificialanalysis.ai/api/v2/data/llms/models}"

# Configurable limits
RATE_LIMIT_QPM="${RATE_LIMIT_QPM:-5}"   # queries per minute
MIN_RESPONSE_SECONDS="${MIN_RESPONSE_SECONDS:-1}"  # minimum total script duration

usage() {
  cat <<USAGE
Usage: $(basename "$0") [--force-refresh] [--no-cache]

Options:
  --force-refresh  ignore existing cache and fetch from API
  --no-cache       do not write/read cache file

Environment variables:
  ARTIFICIAL_ANALYSIS_API_KEY  required API key (or present in .env)
  RATE_LIMIT_QPM               requests per minute (default: 5)
  MIN_RESPONSE_SECONDS          minimum script runtime in seconds (default: 1)
  ENV_FILE, CACHE_DIR, CACHE_FILE, STATE_FILE, ARTIFICIAL_ANALYSIS_API_URL
USAGE
}

FORCE_REFRESH=0
USE_CACHE=1

while [[ $# -gt 0 ]]; do
  case "$1" in
    --force-refresh)
      FORCE_REFRESH=1
      shift
      ;;
    --no-cache)
      USE_CACHE=0
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

if [[ -f "$ENV_FILE" ]]; then
  # shellcheck disable=SC1090
  set -a; source "$ENV_FILE"; set +a
fi

if [[ -z "${ARTIFICIAL_ANALYSIS_API_KEY:-}" ]]; then
  echo "Missing ARTIFICIAL_ANALYSIS_API_KEY (set in env or $ENV_FILE)." >&2
  exit 1
fi

if ! [[ "$RATE_LIMIT_QPM" =~ ^[0-9]+$ ]] || [[ "$RATE_LIMIT_QPM" -le 0 ]]; then
  echo "RATE_LIMIT_QPM must be a positive integer." >&2
  exit 1
fi

if ! [[ "$MIN_RESPONSE_SECONDS" =~ ^[0-9]+([.][0-9]+)?$ ]]; then
  echo "MIN_RESPONSE_SECONDS must be a non-negative number." >&2
  exit 1
fi

mkdir -p "$CACHE_DIR"

START_TS="$(date +%s.%N)"

sleep_for_min_response() {
  local end_ts elapsed remaining
  end_ts="$(date +%s.%N)"
  elapsed="$(awk -v s="$START_TS" -v e="$end_ts" 'BEGIN {printf "%.6f", (e - s)}')"
  remaining="$(awk -v min="$MIN_RESPONSE_SECONDS" -v el="$elapsed" 'BEGIN {r=min-el; if (r < 0) r=0; printf "%.6f", r}')"
  awk -v r="$remaining" 'BEGIN {exit (r > 0 ? 0 : 1)}' && sleep "$remaining" || true
}

if [[ "$USE_CACHE" -eq 1 && "$FORCE_REFRESH" -eq 0 && -s "$CACHE_FILE" ]]; then
  cat "$CACHE_FILE"
  sleep_for_min_response
  exit 0
fi

apply_local_rate_limit() {
  local now window_start min_ts
  now="$(date +%s)"
  window_start=$((now - 60))

  if [[ -f "$STATE_FILE" ]]; then
    awk -F'\t' -v ws="$window_start" '$1 >= ws {print $0}' "$STATE_FILE" > "${STATE_FILE}.tmp" || true
    mv "${STATE_FILE}.tmp" "$STATE_FILE"
  else
    : > "$STATE_FILE"
  fi

  local current_count
  current_count="$(wc -l < "$STATE_FILE" | tr -d ' ')"

  if [[ "$current_count" -ge "$RATE_LIMIT_QPM" ]]; then
    min_ts="$(awk -F'\t' 'NR==1 {print $1}' "$STATE_FILE")"
    local wait_seconds
    wait_seconds=$((60 - (now - min_ts)))
    if [[ "$wait_seconds" -gt 0 ]]; then
      sleep "$wait_seconds"
    fi

    now="$(date +%s)"
    window_start=$((now - 60))
    awk -F'\t' -v ws="$window_start" '$1 >= ws {print $0}' "$STATE_FILE" > "${STATE_FILE}.tmp" || true
    mv "${STATE_FILE}.tmp" "$STATE_FILE"
  fi

  now="$(date +%s)"
  printf '%s\t%s\n' "$now" "fetch" >> "$STATE_FILE"
}

apply_local_rate_limit

HTTP_AND_BODY_FILE="$(mktemp)"
HTTP_CODE="$(
  curl -sS \
    -w '%{http_code}' \
    -o "$HTTP_AND_BODY_FILE" \
    -X GET "$API_URL" \
    -H "x-api-key: $ARTIFICIAL_ANALYSIS_API_KEY"
)"

if [[ "$HTTP_CODE" != "200" ]]; then
  echo "API request failed with HTTP $HTTP_CODE" >&2
  head -c 1000 "$HTTP_AND_BODY_FILE" >&2 || true
  rm -f "$HTTP_AND_BODY_FILE"
  sleep_for_min_response
  exit 1
fi

if [[ "$USE_CACHE" -eq 1 ]]; then
  cp "$HTTP_AND_BODY_FILE" "$CACHE_FILE"
fi

cat "$HTTP_AND_BODY_FILE"
rm -f "$HTTP_AND_BODY_FILE"

sleep_for_min_response
