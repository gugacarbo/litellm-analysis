export function showHelp(): void {
  console.log(`
LiteLLM PostgreSQL Backup Script

Usage:
  pnpm backup [options]

Options:
  -r, --retention <days>    Number of days to retain backups (default: 7)
  -o, --output-dir <dir>    Backup output directory (default: ./backups)
  -h, --help                Show this help message

Environment Variables:
  DATABASE_URL    PostgreSQL connection string (optional override)
                 By default uses DB_* values from @lite-llm/config
  PG_DUMP_IMAGE   Docker image used for pg_dump (default: postgres:16)

Examples:
  pnpm backup
  RETENTION_DAYS=14 pnpm backup -o ./backups
  DATABASE_URL="postgresql://user:pass@localhost:5432/litellm" pnpm backup
`);
}
