---
status: draft
date: 2026-07-01
builds-on:
  - docs/litellm-removal-batch-3-settings-registry-credentials.md
  - docs/litellm-removal-migration-plan.md
implemented-by: []
---

# Provider-scoped model routing with default provider resolution and database as single source of truth

## Objective

Allow multiple providers to register models with the same logical name (e.g.
`glm-5.1` on both `provider-a` and `provider-b`). Requests using only the model
name (`glm-5.1`) resolve to the model marked as the default provider for that
name. Requests using the `provider/model` prefix (`provider-a/glm-5.1`) resolve
to the specific provider's model. Additionally, formalize the database
(`model_proxy_*` tables) as the single source of truth for provider and model
configuration, removing the `@settings/models/models.jsonc` file and its
associated import/export/schema-generation tooling.

## Flow

### Provider-scoped model routing

1. An operator registers two models with the same `modelName` (e.g. `glm-5.1`)
   in `model_proxy_models`, each with a different `providerName` (e.g.
   `openai-main` and `deepseek-main`). One row has `is_default_provider = true`.
2. A client sends `POST /v1/chat/completions` with `{ "model": "glm-5.1" }`.
3. The proxy resolver looks up `model_proxy_models` by `modelName = "glm-5.1"`.
   It finds two rows. It selects the row with `is_default_provider = true` and
   resolves the upstream target from that row's provider.
4. A client sends `POST /v1/chat/completions` with
   `{ "model": "deepseek-main/glm-5.1" }`.
5. The proxy resolver parses the `provider/model` prefix, looks up
   `model_proxy_models` by `(modelName = "glm-5.1", providerName = "deepseek-main")`,
   and resolves the upstream target from that specific row.
6. A client sends `POST /v1/chat/completions` with
   `{ "model": "unknown-provider/glm-5.1" }`. The resolver finds no row matching
   that `(modelName, providerName)` pair and returns a 404 error.
7. A client sends `POST /v1/chat/completions` with `{ "model": "glm-5.1" }` when
   two rows exist but neither has `is_default_provider = true`. The resolver
   returns an ambiguity error (400).

### Database as single source of truth

8. The `@settings/models/models.jsonc` file and its generated schema
   (`models.schema.json`) are deleted.
9. The file-based `ModelsRepository` class and its `createRepository` factory
   are removed from `repositories/models-repository/`.
10. The `createRepositoryClient` factory in
    `repositories/models-repository/src/client.ts` is simplified to directly
    return `createDbRepository()` without the file-path option.
11. The `settings:import` script no longer imports models or providers from
    `models.jsonc`. Agent and plugin import is preserved.
12. The `settings:export` script no longer exports models to `models.jsonc`.
    Agent and plugin export is preserved.
13. The `generate-schema` script no longer generates `models.schema.json`.
14. All documentation references to `models.jsonc` as a source of truth are
    updated to reflect the database-only model.

## Contract

### Database schema changes

**`model_proxy_models` table:**

| Change | Detail |
|--------|--------|
| Drop unique constraint | Remove `modelName @unique` |
| Add composite unique | `@@unique([model_name, provider_name])` — nullable `provider_name` treated as distinct (two NULLs are not duplicates per PostgreSQL semantics; application layer enforces at-most-one NULL per `modelName`) |
| Add column | `is_default_provider Boolean @default(false)` |
| Add partial unique index | `CREATE UNIQUE INDEX ON model_proxy_models (model_name) WHERE is_default_provider = true` — guarantees at most one default per model name |
| Add foreign key | `providerName` references `model_proxy_providers(name)` with `ON DELETE SET NULL` |

**Migration file:** `repositories/model-proxy-repository/prisma/migrations/20260701XXXXXX_provider_scoped_models/migration.sql`

### Resolver contract (`resolveUpstreamTarget`)

**Input:** `modelName: string` — may contain a `/` prefix (e.g. `"provider-a/glm-5.1"`).

**Resolution algorithm:**

```
1. Parse modelName:
   - If modelName contains exactly one "/" and the segment before "/" is not empty:
     providerPrefix = segment before "/"
     bareModelName = segment after "/"
   - Else:
     providerPrefix = undefined
     bareModelName = modelName

2. If providerPrefix is defined:
   - Look up model_proxy_models WHERE model_name = bareModelName AND provider_name = providerPrefix
   - If found: resolve using that row
   - If not found: return 404 "Model 'providerPrefix/bareModelName' not found"

3. If providerPrefix is undefined:
   - Look up ALL model_proxy_models WHERE model_name = bareModelName
   - If 0 rows: return 404 "Model 'bareModelName' not found"
   - If 1 row: resolve using that row
   - If >1 rows:
     - Select row WHERE is_default_provider = true
     - If exactly one: resolve using that row
     - If zero: return 400 "Ambiguous model 'bareModelName' — use provider/model prefix"
     - If >1: return 500 (constraint violation — should never happen)
```

**Output:** `ResolvedUpstreamTarget` (unchanged shape).

**Existing resolution logic preserved:** After the row is selected, the
existing `findUpstreamProvider()` + credential resolution + baseUrl/apiKey
priority chain runs unchanged.

### Hebo gateway catalog

`buildHeboGatewayConfig()` in `services/model-proxy-service/src/hebo/build-config.ts`:

- For each model name that has exactly one row in `model_proxy_models`, register
  it under its bare `modelName` (backward compatible).
- For each model name that has multiple rows, register each row under
  `providerName/modelName` as the canonical id. The default provider's row is
  additionally registered under the bare `modelName`.

### File removals

| File | Action |
|------|--------|
| `@settings/models/models.jsonc` | Delete |
| `@settings/models/models.schema.json` | Delete |
| `repositories/models-repository/src/repository.ts` | Delete (file-based `ModelsRepository`) |
| `repositories/models-repository/src/storage.ts` | Delete (file storage abstraction) |
| `repositories/models-repository/src/repository.test.ts` | Delete (file-based tests) |

### Code changes

| File | Change |
|------|--------|
| `repositories/models-repository/src/index.ts` | Remove exports of `repository` and `storage` |
| `repositories/models-repository/src/client.ts` | Remove `modelsFilePath` option; always return `createDbRepository()` |
| `services/models-service/src/repository/client.ts` | Remove `modelsFilePath` option passthrough |
| `scripts/src/settings-import/import-models.ts` | Delete entire file |
| `scripts/src/settings-import/index.ts` | Remove models import step; keep agents + plugins |
| `scripts/src/settings-import/parse.ts` | Remove `readModelsFile` and `collectAgentReferencedModels` |
| `scripts/src/settings-import/paths.ts` | Remove `modelsFile` from resolved paths |
| `scripts/src/settings-import/types.ts` | Remove models-related fields from `ImportSummary` |
| `scripts/src/settings-export/index.ts` | Remove models export step; keep agents + plugins |
| `scripts/src/generate-schema/index.ts` | Remove `models.schema.json` generation |
| `@settings/AGENTS.md` | Update to reflect DB-only model config |
| `AGENTS.md` | Update model config references |
| `docs/litellm-removal-migration-plan.md` | Update source-of-truth references |
| `docs/batch-3-*.md` | Update `models.jsonc` references |
| `packages/server/src/routes/model-routes.ts` | Remove comment referencing `models.jsonc` as config source |
| `services/model-proxy-registry-service/src/types/model-route.ts` | Remove comment referencing `models.jsonc` |
| `services/model-proxy-registry-service/src/types/sync-status.ts` | Remove `models.jsonc` references from sync types |

### Preserved (not removed)

- `@settings/agents/` — agents remain file-based (separate concern).
- `@settings/plugins/` — plugins remain file-based (separate concern).
- `repositories/models-repository/src/schemas/` — Zod schemas remain for type
  contracts and DB row ↔ spec conversion (`modelSpecFromRow`, `modelRowFromSpec`).
- `repositories/models-repository/src/db-repository.ts` — `DbModelsRepository`
  becomes the canonical (and only) `IModelsRepository` implementation.
- `services/models-service/` — `ModelService` and `ProviderService` continue
  working over `IModelsRepository` (now always `DbModelsRepository`).

## Edge cases

| # | WHEN ⟨trigger⟩ | the system MUST ⟨response⟩ |
|---|---------------|---------------------------|
| 1 | A model name has exactly one row with `providerName = NULL` and no other rows | Resolve using that row (backward compatible — existing models without provider assignment continue working) |
| 2 | A model name has one row with `providerName = NULL` and one row with `providerName = "openai-main"` | Treat NULL as a distinct provider. Bare `modelName` resolves to the default-flagged row (or errors if ambiguous). `"openai-main/modelName"` resolves to the openai row. `"NULL/modelName"` is not a valid prefix — the NULL row is only reachable via bare name if it's the default or the only row. |
| 3 | A request uses `provider/model` prefix but the provider name contains a `/` | Provider names MUST NOT contain `/`. Validation at write time (API + import). |
| 4 | A request uses `model/name` where the model name itself contains a `/` | Only the FIRST `/` is treated as the provider separator. `"a/b/c"` → provider=`"a"`, model=`"b/c"`. |
| 5 | A provider row is deleted from `model_proxy_providers` | `ON DELETE SET NULL` on the FK — the model row's `providerName` becomes NULL. The model remains resolvable if it's the only one for that name or is the default. |
| 6 | `is_default_provider` is set to true on a row when another row for the same `modelName` already has it | The partial unique index rejects the write with a constraint violation. The API returns 409 Conflict. |
| 7 | A model row has `providerName = NULL` and `is_default_provider = true`, and another row for the same `modelName` also has `providerName = NULL` | Application-layer validation rejects the second NULL row for the same `modelName` (at most one NULL per `modelName`). |
| 8 | `models.jsonc` is deleted but a fresh install needs seed data | Seed data is provided via a SQL migration seed script or the registry API/UI. The `settings:import` script no longer handles models. |
| 9 | The Hebo gateway catalog is built while a model has ambiguous rows with no default | The ambiguous model is logged as a warning and excluded from the bare-name catalog; only its `provider/model` entries are registered. |
| 10 | A model name in `model_proxy_models` contains a `/` literally (not as a provider prefix) | The resolver treats the first `/` as a provider separator. Model names containing `/` are discouraged and validated against at write time. |

## Open questions

- [ ] Should the `settings:import` script be removed entirely (all three: agents, plugins, models) in favor of a unified DB seed script, or kept for agents/plugins only? **Decision needed before Phase 3.**
- [ ] Should the `@settings/models/` directory be deleted entirely, or kept empty with a README explaining the migration? **Decision needed before Phase 3.**

## Definition of Done

```bash
pnpm typecheck                 # exit 0 — all packages
pnpm test -- --run             # all tests pass (updated for new constraints)
pnpm lint                      # exit 0

# Verify schema
pnpm --filter @lite-llm/model-proxy-repository db:migrate  # migration applies cleanly

# Verify resolver
# Manual: POST /v1/chat/completions with bare model name → resolves to default
# Manual: POST /v1/chat/completions with provider/model → resolves to specific provider
# Manual: POST /v1/chat/completions with ambiguous bare name → 400 error
# Manual: POST /v1/chat/completions with unknown provider prefix → 404 error

# Verify file removal
test ! -f @settings/models/models.jsonc
test ! -f @settings/models/models.schema.json
test ! -f repositories/models-repository/src/repository.ts
test ! -f repositories/models-repository/src/storage.ts
```

## Human review

- The `models.jsonc` deletion and its impact on fresh-install workflows.
- The migration SQL (composite unique, partial index, FK) — review for PostgreSQL compatibility.
- The resolver's ambiguity error message — ensure it's actionable for API consumers.
- The Hebo gateway catalog naming — ensure `provider/model` canonical ids don't break existing consumers.

## Verification

```text
(fill in at close)
```
