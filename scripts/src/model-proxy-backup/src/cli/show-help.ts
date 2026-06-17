export function showHelp(): void {
  console.log(`
LiteLLM PostgreSQL Backup Script

Usage:
  pnpm backup [options]

Options:
  -r, --retention <days>    Number of days to retain backups (default: 7)
  -o, --output-dir <dir>    Backup output directory (default: ./backups)
  --fast                    Fast preset (no gzip + pg_dump -Z 0)
  --no-gzip                 Disable gzip (faster, larger output .dump)
  -p, --parallel <n>        Enable parallel dump (n>1 uses -Fd -j n)
  -j, --jobs <n>            Alias of --parallel (backward compatibility)
  -z, --compress-level <0-9>
                            pg_dump compression level (default: 0)
  -h, --help                Show this help message

Environment Variables:
  DATABASE_URL    PostgreSQL connection string (optional override)
                 By default uses DB_* values from @lite-llm/config
  PG_DUMP_IMAGE   Docker image used for pg_dump (default: postgres:16)
  BACKUP_FAST     Set to 1 to force --fast preset
  PG_DUMP_PARALLEL
                  Overrides --parallel
  PG_DUMP_JOBS    Overrides --jobs
  PG_DUMP_COMPRESS_LEVEL
                  Overrides --compress-level

Examples:
  pnpm backup
  pnpm backup --fast
  pnpm backup --parallel 4
  pnpm backup --no-gzip -j 4
  pnpm backup -j 4 -z 1
  RETENTION_DAYS=14 pnpm backup -o ./backups
  DATABASE_URL="postgresql://user:pass@localhost:5432/litellm" pnpm backup
`);
}
