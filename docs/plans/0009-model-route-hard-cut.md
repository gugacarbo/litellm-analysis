# ModelRoute Hard Cut Implementation Plan

> **For agentic workers:** use subagent-driven development to implement this plan task-by-task.
> The executable source of truth is `docs/tasks/0009-model-route-hard-cut/super-plan.json`.

**Goal:** complete the model-contract hard cut so the repo accepts, emits, and renders only the canonical `ModelRoute` contract, with no operational compatibility for legacy model payloads or parallel route shapes.

**Architecture:** first consolidate the canonical route type across shared contracts and adapters; then harden the HTTP/server boundary so only the current contract enters the runtime; next collapse remaining parallel route/config shapes in the server; then simplify the web surface so model listing and editing consume typed, derived data instead of generic payloads; finally close the cut with regression tests and documentation alignment.

**Tech Stack:** TypeScript, Express, React 19, TanStack React Query, Drizzle ORM, Zod, Vitest.

## Global Constraints

- This is a hard cut: no backwards-compatible acceptance of `litellmParams`, public `snake_case`, or equivalent legacy model-route aliases.
- `ModelRoute` remains the only public route contract; if a second type survives, it must represent information outside routing semantics and have an explicit boundary.
- `snake_case` is allowed only at the PostgreSQL schema/persistence adapter boundary.
- `packages/contracts`, `packages/server`, `services/llm-config-service`, and `apps/web` must converge on the same canonical route semantics in this cut.
- The models table must render from a typed derived row shape, not from `Record<string, unknown>` or inline key probing.
- Tests and fixtures must be updated in the same cut; stale compatibility fixtures are not acceptable except as explicit rejection coverage.
- Preserve current product capabilities for listing, editing, creating, deleting, syncing, and health/status display of models, unless the behavior exists only for legacy compatibility.

## File Structure

| File/Directory | Owner Task | Notes |
| --- | --- | --- |
| `services/llm-config-service/src/types/model-route.ts` | `Task-A-0009` | Canonical route contract remains the single source of semantics |
| `services/llm-config-service/src/adapters/model-route-adapter.ts` | `Task-A-0009` | Keep only canonical parsing/mapping plus explicit legacy rejection |
| `packages/contracts/src/analytics.ts` | `Task-A-0009` | Replace generic `Record<string, unknown>` model-route contract |
| `packages/server/src/orchestration/registry-models-bridge.ts` | `Task-B-0009` | Enforce canonical request parsing at the HTTP boundary |
| `packages/server/src/orchestration/route-params.ts` | `Task-B-0009` | Remove remaining legacy route-param normalization paths |
| `packages/server/src/routes/model-routes.ts` | `Task-C-0009` | Collapse route/config parallelism and remove legacy payload acceptance |
| `services/analytics-service/src/data-source/registry-methods.ts` | `Task-C-0009` | Align analytics-facing registry mapping to canonical route type |
| `apps/web/src/shared/lib/api-client/models.ts` | `Task-D-0009` | Expose typed model-route surface to the web app |
| `apps/web/src/features/models/model-display.ts` | `Task-D-0009` | Normalize model display composition around typed route data |
| `apps/web/src/features/models/models-utils.ts` | `Task-D-0009` | Remove legacy key-reading helpers or replace with typed derivation |
| `apps/web/src/features/models/components/models-table-card.tsx` | `Task-D-0009` | Consume typed table-row/view-model instead of raw generic payload |
| `apps/web/src/features/models/use-models-page.ts` | `Task-D-0009` | Build typed table data and keep current page behavior intact |
| `apps/server/src/__tests__/` | `Task-E-0009` | Update route/request regression tests and add hard-cut rejection coverage |
| `apps/web/src/pages/__tests__/models-gates.test.tsx` | `Task-E-0009` | Align web-side fixtures and UI assumptions |
| `packages/contracts/src/__tests__/api-contracts.test.ts` | `Task-E-0009` | Ensure shared model contracts no longer permit generic route shape |
| `docs/context/CONVENTIONS.md` | `Task-F-0009` | Reflect the completed hard cut if any wording still implies compatibility |
| `docs/specs/README.md`, `docs/index.json` | `Task-F-0009` | Regenerate after docs updates |

## Structured Registry

- **Registry:** `docs/tasks/0009-model-route-hard-cut/super-plan.json`
- **Progress ledger:** `docs/tasks/0009-model-route-hard-cut/progress-ledger.md` (created in Phase 4 and regenerated on every `super-plan.json` write)
- **Task directories:** `docs/tasks/0009-model-route-hard-cut/<task-id>/` (materialized in Phase 6)
- **Task-local logs:** `docs/tasks/0009-model-route-hard-cut/<task-id>/progress.log` (materialized in Phase 6)
- **Task-local logger:** `docs/tasks/0009-model-route-hard-cut/<task-id>/log-task.sh` (materialized in Phase 6)

---

## Task Summary

| Task ID | Batch | Phase | Description | Depends On |
| --- | --- | --- | --- | --- |
| `Task-A-0009` | A | foundation | Canonicalize the shared `ModelRoute` contract and adapter semantics | — |
| `Task-B-0009` | B | foundation | Harden the HTTP/orchestration boundary to reject legacy route payloads | `Task-A-0009` |
| `Task-C-0009` | C | core | Collapse remaining parallel route/config handling in the server runtime | `Task-B-0009` |
| `Task-D-0009` | D | surface | Refactor the web models surface to consume typed route and table-row data | `Task-A-0009`, `Task-C-0009` |
| `Task-E-0009` | E | surface | Refresh contracts, server, and web regression coverage for the hard cut | `Task-B-0009`, `Task-C-0009`, `Task-D-0009` |
| `Task-F-0009` | F | final | Close docs/index alignment and final verification hooks | `Task-E-0009` |

**Execution order:** A → B → C → D → E → F. This should run sequentially because the touched files are highly coupled across the same surface.

---

## Task-A-0009 — Canonicalize shared `ModelRoute` contract and adapter semantics

**Batch:** A · **Phase:** foundation · **Depends on:** none

Unify route semantics at the source so downstream layers stop inventing their own partial contracts.

### Steps

1. Audit the canonical `ModelRoute` definition in `services/llm-config-service/src/types/model-route.ts` and remove any remaining public mapping helpers or comments that imply operational legacy compatibility instead of explicit rejection.
2. Update `services/llm-config-service/src/adapters/model-route-adapter.ts` so create/update parsing and DB mapping operate only on the canonical contract plus explicit rejection of legacy keys.
3. Replace `modelRoute: Record<string, unknown>` in `packages/contracts/src/analytics.ts` with a shared typed contract or a strongly typed alias derived from the canonical route type.
4. Update any imports or inferred types broken by the stricter route contract so the shared package surface becomes the authoritative type source for current model flows.

### Verification

- `pnpm --filter @lite-llm/llm-config-service test`
- `pnpm --filter @lite-llm/contracts test`

---

## Task-B-0009 — Harden the HTTP/orchestration boundary

**Batch:** B · **Phase:** foundation · **Depends on:** `Task-A-0009`

Make sure legacy payloads are rejected at the boundary instead of being normalized deeper in the stack.

### Steps

1. Update `packages/server/src/orchestration/registry-models-bridge.ts` so request parsing accepts only `modelRoute` in the current shape and emits explicit 4xx failures for legacy payloads or public `snake_case`.
2. Simplify `packages/server/src/orchestration/route-params.ts` to remove residual LiteLLM-era normalization and keep only canonical route construction helpers that still serve live code paths.
3. Review model route request/response typing in the server orchestration layer and align it with the shared typed contract from Task A.
4. Ensure route-parsing helper tests cover both accepted canonical payloads and rejected legacy payloads.

### Verification

- `pnpm --filter server exec vitest run src/__tests__/registry-integration.test.ts src/__tests__/model-routes-save.test.ts`

---

## Task-C-0009 — Collapse parallel route/config handling in the server runtime

**Batch:** C · **Phase:** core · **Depends on:** `Task-B-0009`

Remove the remaining runtime duplication where the server carries an alternate shape for information already owned by `ModelRoute`.

### Steps

1. Refactor `packages/server/src/routes/model-routes.ts` so route-related request/update/list flows use the canonical typed route instead of parallel payload structures wherever the semantics overlap.
2. Isolate any truly non-route configuration data into explicitly named types and helpers instead of letting `PersistedModelConfigSpec` or equivalent shapes blur the contract boundary.
3. Align `services/analytics-service/src/data-source/registry-methods.ts` and any server-facing registry mappers so analytics/listing surfaces emit the canonical route shape consistently.
4. Remove dead compatibility branches, comments, or merge code that only existed to bridge old route names or mixed payloads.

### Verification

- `pnpm --filter server exec vitest run src/__tests__/model-routes-save.test.ts src/__tests__/model-routes-aliases.test.ts src/__tests__/registry-integration.test.ts`

---

## Task-D-0009 — Refactor the web models surface around typed route and table-row data

**Batch:** D · **Phase:** surface · **Depends on:** `Task-A-0009`, `Task-C-0009`

Simplify the frontend so it consumes typed route data and a derived table-row model instead of probing generic payloads.

### Steps

1. Tighten `apps/web/src/shared/lib/api-client/models.ts` so list/detail/update helpers expose typed `modelRoute` data matching the hard-cut contract.
2. Update `apps/web/src/features/models/model-display.ts` and related feature types so display composition preserves typed route semantics instead of falling back to generic route blobs.
3. Replace `apps/web/src/features/models/models-utils.ts` legacy key probing with typed derivation helpers, or fold that logic into a dedicated table-row builder.
4. Refactor `apps/web/src/features/models/use-models-page.ts` to build a typed model table row/view-model that already contains render-ready context, max output, and cost fields.
5. Update `apps/web/src/features/models/components/models-table-card.tsx` to render only from the typed row shape and remove inline compatibility logic.

### Verification

- `pnpm --filter web typecheck`
- `pnpm --filter web exec vitest run src/pages/__tests__/models-gates.test.tsx`

---

## Task-E-0009 — Refresh regression coverage for the hard cut

**Batch:** E · **Phase:** surface · **Depends on:** `Task-B-0009`, `Task-C-0009`, `Task-D-0009`

Lock the cut with tests so the repo cannot silently reintroduce generic or legacy route handling.

### Steps

1. Update `packages/contracts/src/__tests__/api-contracts.test.ts` and any related fixtures so model-route contracts are strongly typed and no longer modeled as generic records.
2. Expand server tests to assert explicit rejection of `litellmParams`, public `snake_case`, and other removed aliases at the API boundary.
3. Update web fixtures/tests that still construct generic `modelRoute` payloads so they reflect the canonical typed shape.
4. Add or tighten regression coverage around the models table/view-model builder so legacy key-reading cannot quietly return.

### Verification

- `pnpm --filter @lite-llm/contracts test`
- `pnpm --filter server exec vitest run src/__tests__/registry-integration.test.ts src/__tests__/model-routes-save.test.ts src/__tests__/model-routes-aliases.test.ts`
- `pnpm --filter web exec vitest run src/pages/__tests__/models-gates.test.tsx`

---

## Task-F-0009 — Close docs and final verification hooks

**Batch:** F · **Phase:** final · **Depends on:** `Task-E-0009`

Finish the hard cut with documentation that matches the implemented state and leaves no compatibility ambiguity behind.

### Steps

1. Update `docs/context/CONVENTIONS.md` only if implementation details revealed any stale language around model-route compatibility or public naming.
2. Update any spec/plan references that still imply tolerated legacy model payloads after the hard cut.
3. Run the docs index regeneration flow so `docs/specs/README.md` and `docs/index.json` reflect the new spec/plan state.
4. Prepare the verification block inputs needed to transition the spec from `draft` toward `implemented` once execution is complete.

### Verification

- `pnpm typecheck`
- `pnpm test`
- `scripts/docs-check --emit-index`
