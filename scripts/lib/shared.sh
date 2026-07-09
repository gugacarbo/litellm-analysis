#!/usr/bin/env bash
# scripts/lib/shared.sh — funções compartilhadas entre scripts do repositório.
# Uso: source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib/shared.sh"

# Detecta o gerenciador de pacotes: prefere pnpm, fallback para npm.
# Define a variável RUNNER com o nome do comando.
detect_runner() {
  if command -v pnpm >/dev/null 2>&1; then
    NODE_ENV_RUNNER="pnpm"
  elif command -v npm >/dev/null 2>&1; then
    NODE_ENV_RUNNER="npm"
  else
    echo "Erro: nem pnpm nem npm encontrados." >&2
    exit 1
  fi
}

# Retorna o caminho absoluto da raiz do repositório via git.
# Funciona independentemente de onde o script chamador está localizado.
repo_root() {
  git rev-parse --show-toplevel
}
