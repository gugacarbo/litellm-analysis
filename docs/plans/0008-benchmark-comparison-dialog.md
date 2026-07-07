# Benchmark Comparison Dialog Implementation Plan

> **For agentic workers:** Use subagent-driven development to implement this plan task-by-task.
> The executable source of truth is `docs/tasks/0008-benchmark-comparison-dialog/super-plan.json`.

**Goal:** Add a "Comparar Benchmarks" button on the model settings screen that opens a dialog comparing AA and OpenRouter data with per-field import.

**Architecture:** New backend endpoint aggregates data from 3 sources (AA benchmarks DB, OpenRouter benchmarks DB, OpenRouter Models API) into a normalized comparison response. Frontend dialog renders a side-by-side table with per-field import buttons that update the local form state.

**Tech Stack:** Express (backend), React 19 + shadcn/ui Dialog + TanStack React Query + Sonner toast (frontend), Zod (validation), Drizzle (DB queries)

## Global Constraints

- Feature isolation: new code in `apps/web/src/features/models/`, never imports from other features
- shadcn/ui primitives from `@/shared/components/ui`
- API calls through `fetchApi` from `@/shared/lib/api-client/core`
- Backend routes follow `packages/server/src/routes/` pattern
- No new dependencies without explicit approval
- TypeScript strict mode, Biome linting

## File Structure

| File/Directory | Owner Task | Notes |
|---|---|---|
| `packages/contracts/src/benchmarks.ts` | Task-A-0001 | Add `OpenRouterModelData` and `BenchmarkComparisonResponse` types |
| `packages/server/src/routes/model-routes.ts` | Task-A-0002 | Add `GET /models/:name/benchmark-comparison` route |
| `apps/web/src/shared/lib/api-client/models.ts` | Task-B-0001 | Add `fetchBenchmarkComparison` API function |
| `apps/web/src/features/models/hooks/use-benchmark-comparison.ts` | Task-B-0001 | React Query hook for comparison data |
| `apps/web/src/features/models/components/benchmark-comparison-dialog.tsx` | Task-B-0002 | Dialog component with comparison table |
| `apps/web/src/features/models/detail/model-detail-settings-tab.tsx` | Task-B-0003 | Add button + wire dialog |

## Structured Registry

- **Registry:** `docs/tasks/0008-benchmark-comparison-dialog/super-plan.json`
- **Progress ledger:** `docs/tasks/0008-benchmark-comparison-dialog/progress-ledger.md` (created in Phase 4 and regenerated on every `super-plan.json` write)
- **Task directories:** `docs/tasks/0008-benchmark-comparison-dialog/<task-id>/` (materialized in Phase 6)
- **Task-local logs:** `docs/tasks/0008-benchmark-comparison-dialog/<task-id>/progress.log` (materialized in Phase 6)
- **Task-local logger:** `docs/tasks/0008-benchmark-comparison-dialog/<task-id>/log-task.sh` (materialized in Phase 6)

---

## Task Summary

| Task ID | Batch | Phase | Description | Depends On |
|---|---|---|---|---|
| Task-A-0001 | A | foundation | OpenRouter Models API types + service | — |
| Task-A-0002 | A | core | Benchmark comparison endpoint | Task-A-0001 |
| Task-B-0001 | B | surface | useBenchmarkComparison hook + API client | Task-A-0002 |
| Task-B-0002 | B | surface | BenchmarkComparisonDialog component | Task-B-0001 |
| Task-B-0003 | B | surface | Integrate into ModelDetailSettingsTab | Task-B-0002 |

**Execution order:** Batch A (sequential: 0001 → 0002) → Batch B (sequential: 0001 → 0002 → 0003)
