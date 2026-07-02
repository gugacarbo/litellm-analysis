# 0004 — Migrar camada de dados de Prisma para Drizzle, unificando PostgreSQL

> **Spec:** [docs/specs/0004-prisma-to-drizzle-migration-spec.md](docs/specs/0004-prisma-to-drizzle-migration-spec.md)
> **Tarefas:** [docs/tasks/0004-prisma-to-drizzle-migration/tasks.json](docs/tasks/0004-prisma-to-drizzle-migration/tasks.json)
> **Ledger:** [docs/tasks/0004-prisma-to-drizzle-migration/progress-ledger.md](docs/tasks/0004-prisma-to-drizzle-migration/progress-ledger.md)
> **Log:** [docs/tasks/0004-prisma-to-drizzle-migration/progress.log](docs/tasks/0004-prisma-to-drizzle-migration/progress.log)

**Goal:** Eliminar o Prisma do monorepo, migrar toda a camada de acesso a dados para Drizzle ORM sobre PostgreSQL, unificar o banco do `app-repository` (hoje SQLite) no mesmo PostgreSQL do `model-proxy-repository`, e remover `better-sqlite3`. Ao final, nenhum código Prisma deve sobreviver no repositório e o único ORM do monorepo é Drizzle.

**Architecture:** Criar um novo package compartilhado `@lite-llm/database` (`repositories/database`) que encapsula o pool PostgreSQL, os schemas Drizzle de `model_proxy_*` e `app_*`, o client singleton `db`, o helper `queryRaw<T>()`, disconnect e helper de teste `createTestDb()` com `pg-mem`. Os repositórios de domínio (`model-proxy-repository`, `app-repository`) tornam-se thin barrels re-exportando `./client`, `./schema`, `./queries` de `@lite-llm/database`, preservando a API pública para não quebrar consumers.

**Tech Stack:** `pg` + `drizzle-orm/node-postgres` + `drizzle-kit` + `drizzle-orm/pg-core`; `pg-mem` para testes; remoção de `prisma`, `@prisma/client`, `better-sqlite3` e `@types/better-sqlite3`.

## Global Constraints

- **Big-bang, sem fallback/legacy/deprecated.** A spec exige migração limpa. Nenhuma variável `MODEL_PROXY_DATABASE_URL`, `APP_DB_PATH`, script `prisma` ou driver SQLite deve permanecer.
- **Dados não são preservados.** Banco pode ser resetado; migrations são descartáveis; schema Drizzle é a fonte de verdade.
- **Database URL única:** `DATABASE_URL` via `@lite-llm/config/server`. Substitui `MODEL_PROXY_DATABASE_URL` e `APP_DB_PATH`.
- **IDs:** `@default(cuid())` do Prisma vira `defaultRandom()` do Drizzle; formato não precisa ser compatível com IDs antigos.
- **`@updatedAt`:** coluna com `defaultNow()` + `.$onUpdate(() => new Date())`. Repositórios ainda devem setar `updatedAt: new Date()` quando a lógica construir o payload fora do statement SQL.
- **JSON do Prisma:** viram `jsonb()` com `.$type<T>()` quando a forma for conhecida; consumidores trocam `Prisma.JsonValue` por `unknown` ou tipo `Json` do Drizzle.
- **SQLite → PostgreSQL:** tabelas `app_*` são movidas de `better-sqlite3` para o mesmo PostgreSQL; tipos adaptados (`text` JSON → `jsonb`, `real` → `doublePrecision` ou `real`, `integer` epoch → `timestamp` ou `integer` conforme semântica atual).
- **Raw queries do `analytics-service`:** SQL permanece idêntico; apenas o executor troca `prisma.$queryRawUnsafe<T>` por `queryRaw<T>(sql, params)` do `@lite-llm/database`.
- **Transações Prisma:** todas trocadas por `db.transaction(...)` do Drizzle.
- **Tests:** `in-memory-prisma.ts` é substituído por `createTestDb()` do `@lite-llm/database` usando `pg-mem`.
- **Definition of Done:** `pnpm typecheck`, `pnpm test`, `pnpm docs-check` passam; grep vazio para `prisma` e `better-sqlite3` (excluindo `node_modules`/`dist`).

## Task Registry

- **Registry:** [docs/tasks/0004-prisma-to-drizzle-migration/tasks.json](docs/tasks/0004-prisma-to-drizzle-migration/tasks.json)
- **Progress log:** [docs/tasks/0004-prisma-to-drizzle-migration/progress.log](docs/tasks/0004-prisma-to-drizzle-migration/progress.log)
- **Progress ledger:** [docs/tasks/0004-prisma-to-drizzle-migration/progress-ledger.md](docs/tasks/0004-prisma-to-drizzle-migration/progress-ledger.md)

## Batches de execução

| Batch | Tarefas | Foco |
| ----- | ------- | ---- |
| **A — Foundation** | Task-A-0001 … Task-A-0005 | Configuração, schema compartilhado, migration inicial e helpers de teste |
| **B — Repositories & Services** | Task-B-0001 … Task-B-0005 | Adaptar registries, analytics e re-exportar database pelos repositórios de domínio |
| **C — Cleanup root/docs/CI** | Task-C-0001 … Task-C-0002 | Remover comandos Prisma/configurações obsoletas; atualizar docs |
| **D — Final verification** | Task-D-0001 | typecheck + tests + docs-check + grep de ausência |

Dado o alto grau de dependência entre arquivos, a execução será **sequencial dentro de cada batch**. Batches dependentes (B após A, C após B, D após C) não rodam em paralelo. O subagente de review é acionado ao final de cada task.

## File Structure

| File/Directory | Owner Task | Notes |
| --- | --- | --- |
| `packages/config/src/server.ts` | Task-A-0001 | Renomeia `MODEL_PROXY_DATABASE_URL` → `DATABASE_URL`; remove `APP_DB_PATH`; atualiza `getBackupDatabaseUrlFromEnv`. |
| `.env.example`, `.env.test`, `.env.local` | Task-A-0001 | Atualiza variáveis de ambiente. |
| `repositories/database/package.json` | Task-A-0002 | Novo package `@lite-llm/database`. Depende de `pg`, `drizzle-orm`, `drizzle-kit`, `@lite-llm/config`. |
| `repositories/database/tsconfig.json` | Task-A-0002 | Configuração TypeScript do package. |
| `repositories/database/drizzle.config.ts` | Task-A-0002, Task-A-0005 | Config do drizzle-kit apontando para `src/schema/index.ts` e `drizzle/`. |
| `repositories/database/src/client.ts` | Task-A-0002 | Pool `pg`, singleton `db`, `disconnectDb()`, `queryRaw<T>()`. Lê `DATABASE_URL`. |
| `repositories/database/src/index.ts` | Task-A-0002 | Barrel principal. |
| `repositories/database/src/queries.ts` | Task-A-0002 | Helpers compartilhados (paginação, filtros). |
| `repositories/database/src/test-helpers/createTestDb.ts` | Task-A-0002 | `createTestDb()` usando `pg-mem` + migrations. |
| `repositories/database/src/schema/model-proxy.ts` | Task-A-0003 | 8/9 tabelas `model_proxy_*` em `pgTable`; índices, unique, cascades, enums, jsonb. |
| `repositories/database/src/schema/app.ts` | Task-A-0004 | Tabelas `app_*` migradas do SQLite para PostgreSQL. |
| `repositories/database/src/schema/index.ts` | Task-A-0005 | Re-exporta `model-proxy` e `app`. |
| `repositories/database/drizzle/*` | Task-A-0005 | Migration inicial Drizzle criando todas as tabelas do zero. |
| `services/model-proxy-registry-service/src/repositories/api-keys-repository.ts` | Task-B-0001 | Migra queries Prisma para Drizzle; garante `updatedAt` em updates. |
| `services/model-proxy-registry-service/src/repositories/models-repository.ts` | Task-B-0001 | Migra queries Prisma para Drizzle; garante `updatedAt` em updates. |
| `services/model-proxy-registry-service/src/repositories/providers-repository.ts` | Task-B-0001 | Migra queries Prisma para Drizzle; garante `updatedAt` em updates. |
| `services/model-proxy-registry-service/src/repositories/settings-repository.ts` | Task-B-0001 | Migra queries Prisma para Drizzle; garante `updatedAt` em upserts. |
| `services/analytics-service/src/data-source/index.ts` | Task-B-0002 | Trocar `getModelProxyPrisma()` por `db`; migrar interface interna. |
| `services/analytics-service/src/queries/proxy/*.ts` | Task-B-0002 | Substituir `prisma.$queryRawUnsafe<T>` por `queryRaw<T>`; SQL idêntico. |
| `services/analytics-service/src/queries/proxy/spend-queries.ts` | Task-B-0002 | Migrar Prisma Client queries para Drizzle. |
| `repositories/app-repository/package.json` | Task-B-0003 | Remove `better-sqlite3`, `@types/better-sqlite3`; adiciona `@lite-llm/database`. |
| `repositories/app-repository/src/client.ts` | Task-B-0003 | Re-exporta de `@lite-llm/database/client`; remove lógica SQLite e `ensureHealthCheckColumns`. |
| `repositories/app-repository/src/schema.ts` | Task-B-0003 | Re-exporta de `@lite-llm/database/schema/app`. |
| `repositories/app-repository/src/queries.ts` | Task-B-0003 | Adapta queries para PostgreSQL (timestamp, jsonb, serial/identity). |
| `repositories/app-repository/drizzle.config.ts` | Task-B-0003 | Deletar (SQLite legado). |
| `repositories/app-repository/drizzle/` | Task-B-0003 | Deletar migrations SQLite. |
| `repositories/model-proxy-repository/package.json` | Task-B-0004 | Remove `@prisma/client`, `prisma`, scripts Prisma; adiciona `@lite-llm/database`. |
| `repositories/model-proxy-repository/src/client.ts` | Task-B-0004 | Re-exporta de `@lite-llm/database/client`. |
| `repositories/model-proxy-repository/src/schema.ts` | Task-B-0004 | Re-exporta de `@lite-llm/database/schema/model-proxy`. |
| `repositories/model-proxy-repository/src/queries.ts` | Task-B-0004 | Re-exporta ou mantém helpers específicos. |
| `repositories/model-proxy-repository/src/index.ts` | Task-B-0004 | Barrel re-exportando `./client`, `./schema`, `./queries`. |
| `repositories/model-proxy-repository/prisma/` | Task-B-0004 | Deletar schema, migrations, seed. |
| `repositories/model-proxy-repository/src/generated/prisma/` | Task-B-0004 | Deletar cliente gerado. |
| `repositories/agents-repository/src/test-helpers/in-memory-prisma.ts` | Task-B-0005 | Deletar. |
| `repositories/agents-repository/src/db-repository.test.ts` | Task-B-0005 | Adaptar para `pg-mem`. |
| `repositories/agents-repository/package.json` | Task-B-0005 | Remove `@prisma/client`; adiciona `@lite-llm/database`. |
| `repositories/models-repository/src/db-repository.test.ts` | Task-B-0005 | Adaptar para `pg-mem`. |
| `repositories/models-repository/package.json` | Task-B-0005 | Remove `@prisma/client`; adiciona `@lite-llm/database`. |
| `packages/agents-manager/src/repository/client.ts` | Task-B-0005 | Ajustar imports se necessário. |
| `packages/agents-manager/src/AGENTS.md` | Task-B-0005 | Atualizar se mencionar Prisma. |
| `package.json` root | Task-C-0001 | Remove scripts Prisma e deps; `db:migrate` delega a `@lite-llm/database`. |
| `pnpm-workspace.yaml` | Task-C-0001 | Remove `allowBuilds` de `prisma`/`@prisma/engines`/`better-sqlite3`. |
| `knip.jsonc` | Task-C-0001 | Remove ignores de `@prisma/client` e `generated/prisma`. |
| `docker-compose.yml`, `scripts/db-compose.sh` | Task-C-0001 | Remove entrypoints/comandos Prisma; mantém PostgreSQL. |
| `AGENTS.md` | Task-C-0002 | Atualiza referências a Prisma/SQLite para Drizzle/database. |
| `docs/specs/0004-prisma-to-drizzle-migration-spec.md` | Task-C-0002 | Status `implemented` e data de fechamento. |

## Perguntas em aberto (todos resolvidos na spec)

- `pg-mem` é suficiente para raw queries do analytics: **sim**.
- `cuid()` pode virar `defaultRandom()`: **sim**; banco será resetado.
