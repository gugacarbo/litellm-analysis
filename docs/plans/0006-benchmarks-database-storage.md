# Benchmarks Database Storage Implementation Plan

> **For agentic workers:** use subagent-driven development to implement this plan task-by-task.
> The executable source of truth is `docs/tasks/0006-benchmarks-database-storage/super-plan.json`.

**Goal:** Persistir dados de benchmark do Artificial Analysis (540 modelos, 27 métricas) no PostgreSQL via Drizzle ORM, substituindo a leitura de JSON estático por queries ao banco.

**Architecture:** Adiciona-se uma tabela `model_proxy_benchmarks` ao schema Drizzle existente, um novo pacote `repositories/benchmarks-repository/` com operações CRUD, atualiza-se o sync script para escrever no banco (mantendo JSON como cache), e adapta-se o endpoint `/benchmarks/models` para ler do banco com JOIN em `model_proxy_models`.

**Tech Stack:** TypeScript, Drizzle ORM, PostgreSQL, Zod, Vitest, Express.

## Global Constraints

- Drizzle ORM é o único ORM permitido (ADR-0004, CONVENTIONS.md)
- PostgreSQL é a única fonte de verdade (ADR-0006: dual-read/single-write)
- Schema Drizzle é a fonte de verdade para migrations
- Manter `@storage/benchmarks/*.json` como cache de fallback (não remover)
- Contracts em `packages/contracts/src/benchmarks.ts` não devem ser alterados
- Seguir prefixo `model_proxy_` para tabelas
- Testes de repositório usam `pg-mem` (CONVENTIONS.md)
- `pnpm typecheck` deve passar ao final de cada task

## File Structure

| File/Directory | Owner Task | Notes |
| --- | --- | --- |
| `database/src/schema/model-proxy.ts` | `Task-A-0001` | Adicionar definição da tabela `modelProxyBenchmarks` |
| `database/drizzle/` | `Task-A-0001` | Migration gerada automaticamente por `db:generate` |
| `repositories/benchmarks-repository/` | `Task-A-0002` | Novo pacote: `package.json`, `tsconfig.json`, `src/index.ts`, `src/interfaces.ts`, `src/db-repository.ts`, `src/db-repository.test.ts` |
| `scripts/src/sync-aa-benchmarks/index.ts` | `Task-B-0001` | Adicionar escrita no banco após normalização |
| `scripts/package.json` | `Task-B-0001` | Adicionar dependência `@lite-llm/benchmarks-repository` |
| `apps/server/src/runtime/api-server.ts` | `Task-C-0001` | Adaptar `GET /benchmarks/models` para ler do banco |
| `apps/server/src/application/benchmark-sync-application-service.ts` | `Task-C-0001` | Atualizar `datasetExists` para verificar banco |
| `apps/server/package.json` | `Task-C-0001` | Adicionar dependência `@lite-llm/benchmarks-repository` |
| `pnpm-workspace.yaml` | `Task-A-0002` | Já cobre `repositories/*` — verificar se precisa de ajuste |

## Structured Registry

- **Registry:** `docs/tasks/0006-benchmarks-database-storage/super-plan.json`
- **Progress ledger:** `docs/tasks/0006-benchmarks-database-storage/progress-ledger.md` (created in Phase 4 and regenerated on every `super-plan.json` write)
- **Task directories:** `docs/tasks/0006-benchmarks-database-storage/<task-id>/` (materialized in Phase 6)
- **Task-local logs:** `docs/tasks/0006-benchmarks-database-storage/<task-id>/progress.log` (materialized in Phase 6)
- **Task-local logger:** `docs/tasks/0006-benchmarks-database-storage/<task-id>/log-task.sh` (materialized in Phase 6)

---
