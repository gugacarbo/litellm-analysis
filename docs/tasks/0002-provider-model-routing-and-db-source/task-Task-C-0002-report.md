# Task-C-0002 Report

## Scope

Documentation/comments cleanup for DB-only model config on branch
`0002-provider-model-routing-and-db-source`, limited to wording updates and
historical-notes preservation. No behavior changes were made.

## Files changed

- `@settings/AGENTS.md`
- `docs/litellm-removal-migration-plan.md`
- `docs/batch-3-decisions.md`
- `docs/batch-3-field-mapping.md`
- `docs/batch-3-legacy-import.md`
- `packages/server/src/routes/model-routes.ts`
- `services/model-proxy-registry-service/src/types/model-route.ts`
- `services/model-proxy-registry-service/src/types/sync-status.ts`

## Files intentionally not changed

- `AGENTS.md`
  - Current file no longer contains the stale generated project-knowledge-base
    model-config guidance referenced by the task. No real `models.jsonc` source-of-truth
    reference remained there, so it was left untouched.

## What changed

### `@settings/AGENTS.md`

- Removed `@settings/models/` from the documented tree.
- Reworded overview and lookup guidance so agents/plugins remain file-backed,
  while model/provider routing is database-backed in
  `model_proxy_models` / `model_proxy_providers`.
- Updated schema/import/export notes to reflect agents+plugins only.

### Historical docs

- Restored `docs/litellm-removal-migration-plan.md`,
  `docs/batch-3-decisions.md`, `docs/batch-3-field-mapping.md`, and
  `docs/batch-3-legacy-import.md` with explicit historical/superseded notes.
- Preserved historical context where useful, but stopped presenting
  `models.jsonc` as the current source of truth.
- Updated wording that still implied provider/model truth lived in files or in
  `model_proxy_credentials` instead of the registry/provider tables.

### TS comments/types

- Reworded comments in `packages/server/src/routes/model-routes.ts` to avoid
  presenting `models.jsonc` as the authoritative routing source.
- Reworded `ModelRoute.metadata` docs in
  `services/model-proxy-registry-service/src/types/model-route.ts`.
- Reworded sync/config comments in
  `services/model-proxy-registry-service/src/types/sync-status.ts` to describe
  compatibility config payloads versus the registry.

## Search checks run

Commands run from repo root:

```bash
rtk rg -n "models\\.jsonc|models\\.schema\\.json|source of truth|file-based|DbModelsRepository|model_proxy_models|model_proxy_providers" AGENTS.md @settings/AGENTS.md docs/litellm-removal-migration-plan.md docs/batch-3-decisions.md docs/batch-3-field-mapping.md docs/batch-3-legacy-import.md packages/server/src/routes/model-routes.ts services/model-proxy-registry-service/src/types/model-route.ts services/model-proxy-registry-service/src/types/sync-status.ts
```

```bash
rtk rg -n "models\\.jsonc" @settings/AGENTS.md docs/litellm-removal-migration-plan.md docs/batch-3-decisions.md docs/batch-3-field-mapping.md docs/batch-3-legacy-import.md packages/server/src/routes/model-routes.ts services/model-proxy-registry-service/src/types/model-route.ts services/model-proxy-registry-service/src/types/sync-status.ts
```

```bash
rtk rg -n "model_proxy_credentials" docs/litellm-removal-migration-plan.md docs/batch-3-decisions.md docs/batch-3-legacy-import.md
```

## Verification

- Search-based verification only.
- No typecheck was run because the touched TypeScript files changed comments only
  and no symbols or behavior were modified.

## Residual historical references intentionally left

- The restored batch/migration docs still mention `models.jsonc` in a few
  places as part of historical migration context or compatibility narratives.
- Each of those docs now starts with an explicit note that those references are
  historical and superseded by spec 0002 / Task-C-0002.
