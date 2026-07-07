# Task-D-0009 Report: Refactor web models surface around typed route and table-row data

## 1. What was changed and why

### `apps/web/src/shared/lib/api-client/models.ts`
- Added `metadata?: Record<string, unknown>` to the `ModelRoute` type (line 31) to match the canonical type in `llm-config-service`.

### `apps/web/src/features/models/models-utils.ts`
- Added `import type { ModelRoute }` from `@/shared/lib/api-client/models`.
- Changed `getInputCost`, `getOutputCost`, `getContextWindow`, and `getMaxOutput` to accept `ModelRoute` instead of `Record<string, unknown>`.
- Replaced legacy snake_case key reads (`input_cost_per_token`, `output_cost_per_token`, `context_window_size`, `max_tokens`) with direct camelCase field access (`inputCostPerToken`, `outputCostPerToken`, `contextWindowSize`, `maxOutputTokens`).

### `apps/web/src/features/models/components/models-table-card.tsx`
- No changes needed. The component already passes `routeParams` (typed `ModelRoute` from `resolveModelRoute`) to the utility functions.

### `apps/web/src/features/models/model-display.ts`
- No changes needed. `ModelDisplayCandidate.modelRoute` is a minimal display type for alias merging, not table rendering.

## 2. Verification results

- `pnpm --filter web typecheck`: 3 pre-existing errors in unrelated files (`benchmarks/__tests__/`, `model-general-tab.tsx`). No new errors from these changes.
- `pnpm --filter web exec vitest run src/pages/__tests__/models-gates.test.tsx`: **3/3 passed**.

## 3. Concerns for downstream tasks

- None. The only caller of these utility functions (`models-table-card.tsx`) already passes typed `ModelRoute` data. The change is a drop-in type tightening with no behavioral impact.
