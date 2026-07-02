#!/bin/sh
# Load project env, then run compose with a provider that works on Podman hosts.
set -a
[ -f .env.local ] && . ./.env.local
[ -f .env ] && . ./.env
set +a

if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
  exec docker compose "$@"
fi

echo "No compose provider found. Install podman-compose or Docker Compose v2." >&2
exit 1
