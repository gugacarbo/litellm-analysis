#!/bin/sh
# Load project env, then run compose with a provider that works on Podman hosts.
set -a
[ -f .env.local ] && . ./.env.local
[ -f .env ] && . ./.env
set +a

if command -v podman-compose >/dev/null 2>&1; then
  exec podman-compose "$@"
fi

if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
  if docker --version 2>&1 | grep -qi podman; then
    echo "podman-compose is required when Docker CLI is provided by Podman." >&2
    echo "Install: pip install podman-compose  (or use your distro package)" >&2
    exit 1
  fi
  exec docker compose "$@"
fi

echo "No compose provider found. Install podman-compose or Docker Compose v2." >&2
exit 1
