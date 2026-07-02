# Provider-Scoped Model Routing & DB as Single Source Implementation Plan

> **For agentic workers:** Use subagent-driven development to implement this plan task-by-task.
> The executable source of truth is `docs/tasks/0002-provider-model-routing-and-db-source/tasks.json`.

**Goal:** Allow `provider/model` prefixed routing with default-provider fallback, and formalize `model_proxy_*` DB tables as the single source of truth by removing `models.jsonc` and its file-based repository.

**Architecture:** Modify the canonical resolver `resolveUpstreamTarget()` to parse `provider/model` prefixes and select rows by `(modelName, providerName)` or by `modelName` + `is_default_provider` flag. Add a Prisma migration with composite unique `(model_name, provider_name)`, `is_default_provider` column, partial unique index, and FK to `model_proxy_providers`. Remove the file-based `ModelsRepository`, `models.jsonc`, and the settings import/export model steps, leaving `DbModelsRepository` as the only `IModelsRepository` implementation.

**Tech Stack:** Prisma (PostgreSQL), TypeScript, Express, Vitest, Hebo gateway (AI SDK), Zod schemas.

## Global Constraints

- `model_proxy_models.modelName` is no longer globally unique; uniqueness is `(modelName, providerName)` with NULL treated as a distinct value.
- At most one row per `modelName` may have `is_default_provider = true` (enforced by partial unique index).
- Provider names MUST NOT contain `/` (validated at write time).
- Model names containing `/` are discouraged and validated against at write time.
- The resolver treats only the FIRST `/` in a model identifier as the provider separator.
- `providerName` FK references `model_proxy_providers(name)` with `ON DELETE SET NULL`.
- Existing models without `providerName` (NULL) continue to resolve by bare name (backward compatible).
- The `DbModelsRepository` is the only `IModelsRepository` implementation after this plan.
- `@settings/agents/` and `@settings/plugins/` are NOT affected — they remain file-based.
- Zod schemas in `repositories/models-repository/src/schemas/` are preserved for type contracts and DB row ↔ spec conversion.
- No `as any`, `@ts-ignore`, or `@ts-expect-error` — use proper typing.
- No `TODO`/`FIXME`/`HACK` comments — resolve or track externally.

## File Structure

| File/Directory | Owner Task | Notes |
| -------------- | ---------- | ----- |
| `repositories/model-proxy-repository/prisma/schema.prisma` | `Task-A-0001` | Drop `@unique` on `modelName`, add composite `@@unique([model_name, provider_name])`, add `is_default_provider`, add FK, add partial index via `@@index` or raw SQL. |
| `repositories/model-proxy-repository/prisma/migrations/20260701XXXXXX_provider_scoped_models/migration.sql` | `Task-A-0001` | Migration SQL for the above changes. |
| `repositories/models-repository/src/db-repository.ts` | `Task-A-0001` | Update `modelSpecFromRow` to include `providerName` and `is_default_provider`; update `modelRowFromSpec` to accept and write these fields; update `read()` to include `providerName` in model keys when non-null. |
| `services/llm-gateway/src/resolver/upstream-provider.ts` | `Task-B-0001` | Add `parseProviderModel()` helper; update `resolveUpstreamTarget()` to accept raw model name, parse prefix, and query by `(modelName, providerName)` or `modelName` + default flag. |
| `services/llm-gateway/src/resolver/upstream-provider.test.ts` | `Task-B-0001` | Add tests for prefix parsing, default resolution, ambiguity error, unknown provider, NULL provider backward compat. |
| `services/llm-gateway/src/hebo/build-config.ts` | `Task-B-0002` | Update `buildHeboGatewayConfig()` to register `provider/model` canonical ids for ambiguous models and bare names for unique/default models. |
| `repositories/models-repository/src/repository.ts` | `Task-C-0001` | **DELETE** — file-based `ModelsRepository` class. |
| `repositories/models-repository/src/storage.ts` | `Task-C-0001` | **DELETE** — file storage abstraction. |
| `repositories/models-repository/src/repository.test.ts` | `Task-C-0001` | **DELETE** — file-based tests. |
| `repositories/models-repository/src/index.ts` | `Task-C-0001` | Remove exports of `repository` and `storage`. |
| `repositories/models-repository/src/client.ts` | `Task-C-0001` | Remove `modelsFilePath` option; always return `createDbRepository()`. |
| `services/models-service/src/repository/client.ts` | `Task-C-0001` | Remove `modelsFilePath` option passthrough. |
| `@settings/models/models.jsonc` | `Task-C-0001` | **DELETE**. |
| `@settings/models/models.schema.json` | `Task-C-0001` | **DELETE**. |
| `scripts/src/settings-import/import-models.ts` | `Task-C-0001` | **DELETE**. |
| `scripts/src/settings-import/index.ts` | `Task-C-0001` | Remove models import step; keep agents + plugins. |
| `scripts/src/settings-import/parse.ts` | `Task-C-0001` | Remove `readModelsFile` and `collectAgentReferencedModels`. |
| `scripts/src/settings-import/paths.ts` | `Task-C-0001` | Remove `modelsFile` from resolved paths. |
| `scripts/src/settings-import/types.ts` | `Task-C-0001` | Remove models-related fields from `ImportSummary`. |
| `scripts/src/settings-export/index.ts` | `Task-C-0001` | Remove models export step; keep agents + plugins. |
| `scripts/src/generate-schema/index.ts` | `Task-C-0001` | Remove `models.schema.json` generation. |
| `@settings/AGENTS.md` | `Task-C-0002` | Update to reflect DB-only model config. |
| `AGENTS.md` | `Task-C-0002` | Update model config references. |
| `docs/litellm-removal-migration-plan.md` | `Task-C-0002` | Update source-of-truth references. |
| `docs/batch-3-decisions.md` | `Task-C-0002` | Update `models.jsonc` references. |
| `docs/batch-3-field-mapping.md` | `Task-C-0002` | Update `models.jsonc` references. |
| `docs/batch-3-legacy-import.md` | `Task-C-0002` | Update `models.jsonc` references. |
| `packages/server/src/routes/model-routes.ts` | `Task-C-0002` | Remove comment referencing `models.jsonc` as config source. |
| `services/model-proxy-config-service/src/types/model-route.ts` | `Task-C-0002` | Remove comment referencing `models.jsonc`. |
| `services/model-proxy-config-service/src/types/sync-status.ts` | `Task-C-0002` | Remove `models.jsonc` references from sync types. |

## Task Registry

- **Registry:** `docs/tasks/0002-provider-model-routing-and-db-source/tasks.json`
- **Progress log:** `docs/tasks/0002-provider-model-routing-and-db-source/progress.log`
- **Progress ledger:** `docs/tasks/0002-provider-model-routing-and-db-source/progress-ledger.md`

---
