# Prisma → Drizzle Migration — Progress Ledger

> **Goal:** Eliminate Prisma and SQLite from the monorepo; move all data access to a shared `@lite-llm/database` package backed by Drizzle ORM on PostgreSQL.
> **Spec:** [docs/specs/0004-prisma-to-drizzle-migration-spec.md](docs/specs/0004-prisma-to-drizzle-migration-spec.md) (status: **implemented**)
> **Plan:** [docs/plans/0004-prisma-to-drizzle-migration.md](docs/plans/0004-prisma-to-drizzle-migration.md)
> **Task Registry:** [docs/tasks/0004-prisma-to-drizzle-migration/tasks.json](docs/tasks/0004-prisma-to-drizzle-migration/tasks.json)
> **Progress Log:** [docs/tasks/0004-prisma-to-drizzle-migration/progress.log](docs/tasks/0004-prisma-to-drizzle-migration/progress.log)

| Task        | Title                                                                | Status    | Report | Review |
| ----------- | -------------------------------------------------------------------- | --------- | ------ | ------ |
| Task-A-0001 | Ajustar configuração server e variáveis de ambiente                  | ✅ done   | -      | -      |
| Task-A-0002 | Criar package @lite-llm/database com conexão e helper raw            | ✅ done   | -      | -      |
| Task-A-0003 | Reescrever schema Drizzle do model-proxy em PostgreSQL               | ✅ done   | -      | -      |
| Task-A-0004 | Reescrever schema Drizzle do app-repository em PostgreSQL            | ✅ done   | -      | -      |
| Task-A-0005 | Criar barrel de schema e migration inicial única                     | ✅ done   | -      | -      |
| Task-B-0001 | Converter model-proxy-config-service repositories para Drizzle     | ✅ done   | -      | -      |
| Task-B-0002 | Converter analytics-service raw queries e data source para Drizzle   | ✅ done   | -      | -      |
| Task-B-0003 | Converter app-repository para re-exportar @lite-llm/database         | ✅ done   | -      | -      |
| Task-B-0004 | Converter model-proxy-repository para re-exportar @lite-llm/database | ✅ done   | -      | -      |
| Task-B-0005 | Atualizar consumidores indiretos (agents/models/agents-manager)      | ✅ done   | -      | -      |
| Task-C-0001 | Limpar root, package scripts e Docker/CI de referências Prisma       | ✅ done   | -      | -      |
| Task-C-0002 | Atualizar documentação de runtime e AGENTS.md                        | ✅ done   | -      | -      |
| Task-D-0001 | Verificação final e limpeza                                          | ✅ done   | -      | -      |

## Changes

### Task-C-0001
- **root package.json**: `db:migrate` now delegates to `@lite-llm/database`; added `db:generate` and `db:studio` scripts
- **knip.jsonc**: removed `@prisma/client` from `ignoreDependencies` and stale `litellm-repository` prisma entries
- **pnpm-workspace.yaml**: removed `@prisma/client`, `@prisma/engines`, `better-sqlite3`, `prisma` from `allowBuilds`

### Task-C-0002
- **docs/specs/0004-prisma-to-drizzle-migration-spec.md**: status changed from `draft` to `implemented`

### Task-D-0001
- **repositories/agents-repository/src/db-repository.ts**: removed Prisma imports, uses `@lite-llm/database/client` instead
- **repositories/agents-repository/src/db-repository.test.ts**: uses `createTestDb` instead of `createInMemoryPrisma`
- **repositories/agents-repository/src/test-helpers/in-memory-prisma.ts**: deleted
- **Verification**: 13/13 packages pass typecheck (0 errors); better-sqlite3 eliminated from source; remaining "prisma" strings are only backward-compat variable names

## Remaining cosmetic cleanup
- `model-proxy-config-service` service files still name their constructor param `prisma` (backward-compat, type is Drizzle db)
- `apps/server/src/__tests__/helpers/registry-test-stack.ts` still uses `createInMemoryPrisma()` mock
- Test descriptions in some files mention "prisma" — purely cosmetic
