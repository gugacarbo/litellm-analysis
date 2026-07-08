# Model Registry Schema Simplification Implementation Plan

> **For agentic workers:** use subagent-driven development to implement this plan task-by-task.
> The executable source of truth is `docs/tasks/0010-model-registry-schema-simplification/super-plan.json`.

**Goal:** complete the model-registry hard cut so the repo persists, exposes, imports, and renders the new OpenRouter-first model schema with `modelId`, `contextLength`, `architecture`, `reasoning`, `pricing`, and shared `reasoningApi` relations, with no operational support for removed or renamed legacy fields.

**Architecture:** first change the Drizzle schema and repository/domain contracts so the database and shared types represent the new model shape, including `jsonb` fields for `architecture`, `reasoning`, and `pricing` plus a relational `reasoning_api` entity. Then update service, server, importer, analytics, and plugin/runtime consumers to use the new shape end-to-end. Finally, refactor the web models surface and regression coverage so every impacted consumer reads the new contract directly and no compatibility layers remain.

**Tech Stack:** TypeScript, PostgreSQL, Drizzle ORM, Express, React 19, TanStack React Query, Zod, Vitest.

## Global Constraints

- PostgreSQL continua sendo a única source of truth.
- Drizzle schema continua sendo a fonte da verdade para migrations.
- `snake_case` permanece restrito à persistência.
- O contrato público de API, services e frontend usa apenas `camelCase`.
- Este trabalho é um hard cut: não devem permanecer aliases operacionais de compatibilidade para os campos removidos/renomeados.
- Nenhum adapter, service, route, fixture ou componente deve manter leitura ou escrita de formatos deprecated como estratégia de transição.
- Todo consumer impactado no repo deve ser atualizado para o novo contrato na mesma implementação.

## File Structure

| File/Directory | Owner Task | Notes |
| --- | --- | --- |
| `database/src/schema/model-proxy.ts` | `Task-A-0010` | Primary registry schema changes for `model_proxy_models` and new `reasoning_api` relation |
| `database/src/schema/index.ts` | `Task-A-0010` | Export new schema entities |
| `database/drizzle/` | `Task-A-0010` | Generated migration/snapshot updates for the hard cut |
| `repositories/models-repository/src/schemas/model.ts` | `Task-A-0010` | Canonical model spec schema must reflect renamed/removed fields |
| `repositories/models-repository/src/schemas/thinking.ts` | `Task-A-0010` | Replace legacy reasoning/thinking config shape with unified reasoning contract |
| `repositories/models-repository/src/schemas/index.ts` | `Task-A-0010` | Export updated schemas and new reasoning API types if needed |
| `repositories/models-repository/src/interfaces.ts` | `Task-A-0010` | Repository-level model contract updates |
| `services/llm-config-service/src/types/model-route.ts` | `Task-A-0010` | Shared model contract used across services/server/web |
| `packages/contracts/src/analytics.ts` | `Task-A-0010` | Shared API contract for models list/detail payloads |
| `repositories/models-repository/src/db-repository.ts` | `Task-B-0010` | Read/write mapping between DB rows and canonical model contract |
| `repositories/models-repository/src/metadata.ts` | `Task-B-0010` | Remove metadata bridge and replace with direct reasoning mapping |
| `services/llm-config-service/src/repositories/models-repository.ts` | `Task-B-0010` | Service-facing repository contract alignment |
| `services/llm-config-service/src/services/registry-models.service.ts` | `Task-B-0010` | Create/update/list model flows for new schema |
| `services/llm-config-service/src/services/__tests__/in-memory-repositories.ts` | `Task-B-0010` | In-memory repository fixtures must match the new canonical shape |
| `packages/server/src/orchestration/openrouter-models.ts` | `Task-C-0010` | OpenRouter importer/normalizer must map directly to the new schema |
| `packages/server/src/orchestration/registry-models-bridge.ts` | `Task-C-0010` | HTTP/server bridge should accept and emit only the new contract |
| `packages/server/src/routes/model-routes.ts` | `Task-C-0010` | Model routes hard cut for request/response payloads |
| `packages/server/src/types/index.ts` | `Task-C-0010` | Server-local model config/view types |
| `services/llm-config-service/src/services/openai-oauth.service.ts` | `Task-C-0010` | Remove legacy `owned_by` assumptions when importing discovered models |
| `services/analytics-service/src/data-source/registry-methods.ts` | `Task-C-0010` | Analytics-facing registry mapping must read the new schema |
| `services/analytics-service/src/queries/proxy/model-queries.ts` | `Task-C-0010` | Remove analytics dependence on `owned_by`/legacy model columns |
| `services/agent-plugins/src/plugins/opencode/adapters/model-adapter.ts` | `Task-D-0010` | Plugin export must consume unified `reasoning` semantics |
| `services/agent-plugins/src/plugins/opencode/__tests__/plugin.test.ts` | `Task-D-0010` | Regression coverage for reasoning export semantics |
| `apps/web/src/shared/lib/api-client/models.ts` | `Task-E-0010` | Web API client contract for model list/detail/update |
| `apps/web/src/features/models/hooks/use-model-config-form.ts` | `Task-E-0010` | Form normalization must reflect `architecture`, unified `reasoning`, and removed routing fields |
| `apps/web/src/features/models/hooks/use-model-config-save.ts` | `Task-E-0010` | Save payload must stop sending removed fields |
| `apps/web/src/features/models/model-form-data.ts` | `Task-E-0010` | Field inventory for model forms/sync diffing |
| `apps/web/src/features/models/model-display.ts` | `Task-E-0010` | Model display/view-model composition for new fields |
| `apps/web/src/features/models/models-utils.ts` | `Task-E-0010` | Table/detail derivation for architecture/pricing/context changes |
| `apps/web/src/features/models/components/tabs/model-general-tab.tsx` | `Task-E-0010` | Replace `vision`/legacy reasoning controls with new fields |
| `apps/web/src/features/models/components/tabs/model-routing-tab.tsx` | `Task-E-0010` | Remove model-level upstream editing UI now owned by provider relation |
| `apps/web/src/features/models/components/tabs/reasoning-section.tsx` | `Task-E-0010` | Render unified reasoning config without nested `apiMode` |
| `apps/web/src/features/models/components/sync-models-dialog.tsx` | `Task-E-0010` | Sync diff labels must match the new imported field names |
| `apps/web/src/features/models/detail/model-detail-settings-tab.tsx` | `Task-E-0010` | Detail surface must stop showing removed settings |
| `packages/contracts/src/__tests__/api-contracts.test.ts` | `Task-F-0010` | Contract-level regression coverage |
| `repositories/models-repository/src/db-repository.test.ts` | `Task-F-0010` | Repository mapping and `jsonb` round-trip coverage |
| `services/llm-config-service/src/services/__tests__/registry-models.service.test.ts` | `Task-F-0010` | Service-level regression coverage |
| `services/analytics-service/src/data-source/registry-methods.test.ts` | `Task-F-0010` | Analytics registry read/write coverage |
| `apps/web/src/features/models/hooks/use-model-config-form.test.ts` | `Task-F-0010` | Form normalization coverage |
| `apps/web/src/features/models/hooks/use-model-config-save.test.tsx` | `Task-F-0010` | Save payload hard-cut coverage |
| `apps/web/src/pages/__tests__/models-gates.test.tsx` | `Task-F-0010` | End-to-end web contract expectations |
| `docs/specs/0010-model-registry-schema-simplification-spec.md` | `Task-G-0010` | Verification/status updates at close |
| `docs/context/CONVENTIONS.md` | `Task-G-0010` | Only if implementation exposes stale guidance around the new schema |
| `docs/specs/README.md`, `docs/index.json` | `Task-G-0010` | Regenerated documentation indexes |

## Structured Registry

- **Registry:** `docs/tasks/0010-model-registry-schema-simplification/super-plan.json`
- **Progress ledger:** `docs/tasks/0010-model-registry-schema-simplification/progress-ledger.md` (created in Phase 4 and regenerated on every `super-plan.json` write)
- **Task directories:** `docs/tasks/0010-model-registry-schema-simplification/<task-id>/` (materialized in Phase 6)
- **Task-local logs:** `docs/tasks/0010-model-registry-schema-simplification/<task-id>/progress.log` (materialized in Phase 6)
- **Task-local logger:** `docs/tasks/0010-model-registry-schema-simplification/<task-id>/log-task.sh` (materialized in Phase 6)

---

## Task Summary

| Task ID | Batch | Phase | Description | Depends On |
| --- | --- | --- | --- | --- |
| `Task-A-0010` | A | foundation | Redefine database and shared model schemas for the OpenRouter-first hard cut | — |
| `Task-B-0010` | B | core | Rewrite repository and config-service persistence around the new model contract | `Task-A-0010` |
| `Task-C-0010` | C | core | Update importer, server, and analytics surfaces to consume the new schema directly | `Task-B-0010` |
| `Task-D-0010` | D | core | Refactor plugin/runtime reasoning consumers around unified `reasoning` and `reasoningApi` semantics | `Task-B-0010`, `Task-C-0010` |
| `Task-E-0010` | E | surface | Rebuild the web models surface around the new contract with removed routing/upstream fields | `Task-B-0010`, `Task-C-0010` |
| `Task-F-0010` | F | surface | Refresh regression coverage across contracts, repository, services, analytics, and web | `Task-C-0010`, `Task-D-0010`, `Task-E-0010` |
| `Task-G-0010` | G | final | Close docs/index/status updates and final verification hooks | `Task-F-0010` |

**Execution order:** A → B → C → D → E → F → G. This should run sequentially because the schema hard cut changes shared contracts that cascade through the same server, repository, plugin, and web surfaces.

---

## Task-A-0010 — Redefine database and shared model schemas

**Batch:** A · **Phase:** foundation · **Depends on:** none

Make the database and shared types represent the new model registry shape before any runtime layer starts adapting to it.

### Steps

1. Update `database/src/schema/model-proxy.ts` so `model_proxy_models` drops `owned_by`, `vision`, `context_window_size`, `input_cost_per_token`, `output_cost_per_token`, `upstream_model`, `upstream_base_url`, `provider_name`, and `metadata`; renames `model_name` to `model_id`; adds `canonical_slug`, `description`, `context_length`, `max_completion_tokens`, `knowledge_cutoff`, `expiration_date`, `architecture`, `reasoning`, `supported_parameters`, `default_parameters`, `per_request_limits`, and `pricing`; and enforces `UNIQUE(provider_id, model_id)`.
2. Introduce the relational `reasoning_api` schema in the same Drizzle module, including explicit version identity, provider reference, `requestParams`, and `requestShape`, plus the FK path from models to the shared reasoning API record.
3. Regenerate the Drizzle migration artifacts so the schema hard cut is encoded in migrations/snapshots with no compatibility columns left behind.
4. Rewrite repository/domain schemas in `repositories/models-repository/src/schemas/model.ts`, `repositories/models-repository/src/schemas/thinking.ts`, `repositories/models-repository/src/interfaces.ts`, `services/llm-config-service/src/types/model-route.ts`, and `packages/contracts/src/analytics.ts` so the canonical model contract uses `modelId`, `contextLength`, `architecture`, unified `reasoning`, OpenRouter-style pricing/capability fields, and no removed legacy keys.

### Verification

- `pnpm --filter @lite-llm/database typecheck`
- `pnpm --filter @lite-llm/models-repository typecheck`
- `pnpm --filter @lite-llm/contracts typecheck`

---

## Task-B-0010 — Rewrite repository and config-service persistence

**Batch:** B · **Phase:** core · **Depends on:** `Task-A-0010`

Make the persistence layer read and write the new shape directly so the rest of the repo can stop depending on legacy mapping helpers.

### Steps

1. Refactor `repositories/models-repository/src/db-repository.ts` so row-to-spec and spec-to-row mapping operate on the new columns and `jsonb` fields directly, including `architecture`, `reasoning`, `pricing`, capability arrays, and reasoning API relation keys.
2. Remove `repositories/models-repository/src/metadata.ts` as a runtime bridge and fold any still-needed reasoning mapping into first-class contract helpers that do not preserve `metadata` compatibility.
3. Align `services/llm-config-service/src/repositories/models-repository.ts` and `services/llm-config-service/src/services/registry-models.service.ts` with the new repository contract for list/detail/create/update/sync flows.
4. Update `services/llm-config-service/src/services/__tests__/in-memory-repositories.ts` and any closely related service fixtures so in-memory persistence mirrors the new schema instead of the removed fields.

### Verification

- `pnpm --filter @lite-llm/models-repository test`
- `pnpm --filter @lite-llm/llm-config-service exec vitest run src/services/__tests__/registry-models.service.test.ts`

---

## Task-C-0010 — Update importer, server, and analytics surfaces

**Batch:** C · **Phase:** core · **Depends on:** `Task-B-0010`

Propagate the new schema through ingestion and server boundaries so the app imports and emits only the new contract.

### Steps

1. Update `packages/server/src/orchestration/openrouter-models.ts` to map OpenRouter payloads into the new canonical shape, preserving semantic alignment while converting imported fields to the app’s `camelCase` contract.
2. Refactor `packages/server/src/orchestration/registry-models-bridge.ts`, `packages/server/src/routes/model-routes.ts`, and `packages/server/src/types/index.ts` so the HTTP layer accepts and emits only the new model schema, with explicit 4xx rejection for removed or renamed fields.
3. Remove `owned_by` assumptions from `services/llm-config-service/src/services/openai-oauth.service.ts` and any adjacent discovery/import code that still derives model identity or display state from deprecated upstream fields.
4. Rewrite `services/analytics-service/src/data-source/registry-methods.ts` and `services/analytics-service/src/queries/proxy/model-queries.ts` so analytics/model listings read provider identity from relations and consume the new architecture/pricing/context fields instead of removed columns.

### Verification

- `pnpm --filter server exec vitest run src/__tests__/registry-integration.test.ts src/__tests__/model-routes-save.test.ts`
- `pnpm --filter @lite-llm/analytics-service exec vitest run src/data-source/registry-methods.test.ts src/queries/proxy/model-queries.test.ts`

---

## Task-D-0010 — Refactor plugin and runtime reasoning consumers

**Batch:** D · **Phase:** core · **Depends on:** `Task-B-0010`, `Task-C-0010`

Bring downstream runtime exports in line with the unified reasoning model so model registry changes do not leave stale behavior in plugin output generation.

### Steps

1. Rewrite `services/agent-plugins/src/plugins/opencode/adapters/model-adapter.ts` so it consumes unified `reasoning` semantics plus the new reasoning API identity instead of legacy `thinking`, nested `apiMode`, `enableThinking`, or `includeReasoningInRequest` assumptions.
2. Adjust any plugin-facing helper types or schema assumptions needed by the adapter so plugin outputs still express the correct reasoning behavior without reintroducing compatibility translation inside the model registry contract.
3. Update plugin regression coverage in `services/agent-plugins/src/plugins/opencode/__tests__/plugin.test.ts` to lock the new reasoning export semantics and reject stale assumptions from the old metadata/thinking model.

### Verification

- `pnpm --filter @lite-llm/agent-plugins exec vitest run src/plugins/opencode/__tests__/plugin.test.ts`

---

## Task-E-0010 — Rebuild the web models surface

**Batch:** E · **Phase:** surface · **Depends on:** `Task-B-0010`, `Task-C-0010`

Update the administrative UI so every model screen reads and submits the new contract directly, without route/upstream fields or legacy reasoning controls.

### Steps

1. Tighten `apps/web/src/shared/lib/api-client/models.ts` so the web client exposes only the new model schema and stops parsing removed keys like `owned_by`, `vision`, `context_window_size`, `metadata`, or model-level upstream fields.
2. Refactor `apps/web/src/features/models/hooks/use-model-config-form.ts`, `apps/web/src/features/models/hooks/use-model-config-save.ts`, and `apps/web/src/features/models/model-form-data.ts` so form normalization, dirty-field tracking, and save payloads operate on `modelId`, `contextLength`, `architecture`, unified `reasoning`, and `pricing`.
3. Update `apps/web/src/features/models/components/tabs/model-general-tab.tsx` and `apps/web/src/features/models/components/tabs/reasoning-section.tsx` to render the new reasoning fields without nested `apiMode`, while removing `vision`-specific controls that are replaced by `architecture`.
4. Remove or repurpose `apps/web/src/features/models/components/tabs/model-routing-tab.tsx` and related detail/settings consumers so model-level upstream editing disappears and provider-owned routing information is no longer editable from the model contract.
5. Rewrite `apps/web/src/features/models/model-display.ts`, `apps/web/src/features/models/models-utils.ts`, `apps/web/src/features/models/components/sync-models-dialog.tsx`, and `apps/web/src/features/models/detail/model-detail-settings-tab.tsx` so table/detail/sync surfaces derive labels and diffs from the new context, architecture, pricing, and supported-parameter fields.

### Verification

- `pnpm --filter web typecheck`
- `pnpm --filter web exec vitest run src/features/models/hooks/use-model-config-form.test.ts src/features/models/hooks/use-model-config-save.test.tsx src/pages/__tests__/models-gates.test.tsx`

---

## Task-F-0010 — Refresh regression coverage across the cut

**Batch:** F · **Phase:** surface · **Depends on:** `Task-C-0010`, `Task-D-0010`, `Task-E-0010`

Make the hard cut durable by updating tests everywhere the old schema could silently reappear.

### Steps

1. Update `packages/contracts/src/__tests__/api-contracts.test.ts` so shared model payloads assert the new fields and reject removed ones.
2. Rewrite `repositories/models-repository/src/db-repository.test.ts` and `services/llm-config-service/src/services/__tests__/registry-models.service.test.ts` to cover `jsonb` persistence for `architecture`, `reasoning`, and `pricing`, plus the new reasoning API relation and the absence of metadata bridging.
3. Refresh `services/analytics-service/src/data-source/registry-methods.test.ts` and any focused server/analytics tests so provider resolution and model listing assertions no longer rely on `owned_by`, `vision`, or flattened cost/context fields.
4. Tighten `apps/web/src/features/models/hooks/use-model-config-form.test.ts`, `apps/web/src/features/models/hooks/use-model-config-save.test.tsx`, and `apps/web/src/pages/__tests__/models-gates.test.tsx` so stale form fields or removed payload keys fail loudly.

### Verification

- `pnpm --filter @lite-llm/contracts test`
- `pnpm --filter @lite-llm/models-repository test`
- `pnpm --filter @lite-llm/llm-config-service exec vitest run src/services/__tests__/registry-models.service.test.ts`
- `pnpm --filter @lite-llm/analytics-service exec vitest run src/data-source/registry-methods.test.ts src/queries/proxy/model-queries.test.ts`
- `pnpm --filter web exec vitest run src/features/models/hooks/use-model-config-form.test.ts src/features/models/hooks/use-model-config-save.test.tsx src/pages/__tests__/models-gates.test.tsx`

---

## Task-G-0010 — Close docs and verification state

**Batch:** G · **Phase:** final · **Depends on:** `Task-F-0010`

Finish the hard cut by leaving documentation, generated indexes, and spec status aligned with the implemented repo state.

### Steps

1. Update `docs/specs/0010-model-registry-schema-simplification-spec.md` with verification evidence and transition metadata once implementation is complete.
2. Update `docs/context/CONVENTIONS.md` only if the completed implementation reveals stale guidance about model-schema naming, reasoning API relations, or OpenRouter-aligned fields.
3. Regenerate docs indexes so `docs/specs/README.md` and `docs/index.json` reflect the new spec/plan/task artifacts.
4. Run the repo-level verification commands and collect the exact results needed to close the spec and implementation package cleanly.

### Verification

- `pnpm typecheck`
- `pnpm test`
- `scripts/docs-check --emit-index`
