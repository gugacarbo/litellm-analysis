#!/usr/bin/env bash
# scripts/database.sh — Utilitários do banco PostgreSQL via Docker.
# Uso:
#   ./scripts/database.sh               # Cria um backup
#   ./scripts/database.sh list           # Lista backups existentes
#   ./scripts/database.sh restore <arquivo>  # Restaura um backup (cuidado!)
#   ./scripts/database.sh migrate        # Executa migrações do banco

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/shared.sh"
ROOT="$(repo_root)"
cd "$ROOT"

# ── Carrega variáveis de ambiente ──
set -a
[ -f .env.local ] && . ./.env.local
[ -f .env ] && . ./.env
set +a

: "${DB_USER:=llmproxy}"
: "${DB_PASSWORD:=dbpassword9090}"
: "${DB_NAME:=model_proxy}"
: "${DB_PORT:=5432}"
: "${DB_HOST:=localhost}"

BACKUP_DIR="${ROOT}/backups"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_${TIMESTAMP}.sql.gz"
BACKUP_FILE_PLAIN="${BACKUP_DIR}/${DB_NAME}_${TIMESTAMP}.sql"

# ── Garante diretório de backups ──
ensure_backup_dir() {
  mkdir -p "$BACKUP_DIR"
}

# ── Cria backup via pg_dump dentro do container Docker ──
do_backup() {
  ensure_backup_dir

  CONTAINER="lite-llm-analytics-postgres"

  # Verifica se o container está rodando
  if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER}$"; then
    echo "Erro: container '$CONTAINER' não está rodando." >&2
    echo "Execute 'pnpm db:up' primeiro." >&2
    exit 1
  fi

  echo "==> Criando backup: ${BACKUP_FILE}"
  docker exec "$CONTAINER" \
    pg_dump "postgresql://${DB_USER}:${DB_PASSWORD}@localhost:${DB_PORT}/${DB_NAME}" \
    --clean --if-exists --no-owner \
  | gzip > "$BACKUP_FILE"

  # Tamanho do arquivo
  SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
  echo "==> Backup concluído: ${BACKUP_FILE} (${SIZE})"
}

# ── Lista backups existentes ──
do_list() {
  ensure_backup_dir
  local files
  files=$(find "$BACKUP_DIR" -maxdepth 1 \( -name "*.sql.gz" -o -name "*.sql" \) | sort -r)

  if [ -z "$files" ]; then
    echo "Nenhum backup encontrado em ${BACKUP_DIR}/"
    exit 0
  fi

  echo "Backups disponíveis:"
  echo "────────────────────────────────────────────────────────"
  printf "%-30s %12s  %s\n" "ARQUIVO" "TAMANHO" "DATA"
  echo "────────────────────────────────────────────────────────"
  while IFS= read -r f; do
    local name
    name=$(basename "$f")
    local size
    size=$(du -h "$f" | cut -f1)
    local date
    date=$(date -r "$f" "+%Y-%m-%d %H:%M" 2>/dev/null || stat -c "%y" "$f" 2>/dev/null | cut -d. -f1 | cut -d' ' -f1,2)
    printf "%-30s %12s  %s\n" "$name" "$size" "$date"
  done <<< "$files"
}

# ── Restaura um backup (perigoso!) ──
do_restore() {
  local file="$1"
  if [ ! -f "$file" ]; then
    echo "Erro: arquivo não encontrado: $file" >&2
    exit 1
  fi

  CONTAINER="lite-llm-analytics-postgres"
  if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER}$"; then
    echo "Erro: container '$CONTAINER' não está rodando." >&2
    exit 1
  fi

  echo "⚠️  ATENÇÃO: Isso vai SUBSTITUIR o banco '${DB_NAME}' com o conteúdo de:"
  echo "   ${file}"
  echo ""
  read -rp "Tem certeza? Digite 'sim' para confirmar: " confirm
  if [ "$confirm" != "sim" ]; then
    echo "Restauração cancelada."
    exit 0
  fi

  echo "==> Restaurando backup..."
  if [[ "$file" == *.gz ]]; then
    gunzip -c "$file" | docker exec -i "$CONTAINER" \
      psql "postgresql://${DB_USER}:${DB_PASSWORD}@localhost:${DB_PORT}/${DB_NAME}"
  else
    docker exec -i "$CONTAINER" \
      psql "postgresql://${DB_USER}:${DB_PASSWORD}@localhost:${DB_PORT}/${DB_NAME}" < "$file"
  fi

  echo "==> Restauração concluída!"
}

# ── Executa migrações do banco ──
do_migrate() {
  CONTAINER="lite-llm-analytics-postgres"

  if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER}$"; then
    echo "Erro: container '$CONTAINER' não está rodando." >&2
    echo "Execute 'pnpm db:up' primeiro." >&2
    exit 1
  fi

  echo "==> Executando migrações..."
  pnpm --filter database db:migrate
  echo "==> Migrações concluídas!"
}

# ── Dispatch ──
case "${1:-}" in
  list|ls)
    do_list
    ;;
  restore)
    do_restore "${2:-}"
    ;;
  ""|backup)
    do_backup
    ;;
  *)
    echo "Uso: $0 [list|backup|restore <arquivo>]" >&2
    exit 1
    ;;
esac
