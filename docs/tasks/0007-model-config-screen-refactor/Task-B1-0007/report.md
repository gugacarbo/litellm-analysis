# Task-B1-0007 Report: Extract useModelConfigSave hook

## Status
DONE

## Files touched
- Created `apps/web/src/features/models/hooks/use-model-config-save.ts`

## Implementation summary
- Created a dedicated save-orchestration hook for the model config screen.
- Exports `UseModelConfigSaveArgs`, `UseModelConfigSaveResult`, and `useModelConfigSave`.
- Builds the `ModelRouteUpdate` payload from the current model route and form data, preserving existing fields and overriding only `upstreamBaseUrl`, `providerName`, `enabled`, `inputCostPerToken`, `outputCostPerToken`, and `requestOptions`.
- Parses and validates non-negative finite numeric costs, surfacing the same toast error messages as today.
- Converts extra params via `parseExtraParamValue` and prunes empty keys, matching current behavior.
- Calls `updateModel(...)` first; then, when aliases are loaded and valid, calls `updateModelAliases(...)`.
- Preserves the current partial-failure behavior: if aliases are not loaded, it saves the route/config, invalidates relevant queries, warns the user, and now also calls `onSaved()` so the composer clears dirty state (matching current UX).
- If the alias save fails after a successful route save, it invalidates queries and shows the current partial-failure toast.
- Exposes `saving: boolean` and `save(): Promise<void>`.

## Validation
- `pnpm --filter web typecheck` passes for the new file; only pre-existing benchmark test fixture errors remain.
- `pnpm --filter web test` passes: 122 tests across 20 files.

## Acceptance criteria
- [x] New hook file created and exports `useModelConfigSave`.
- [x] Receives `model`, `formData`, `aliasesState`, `queryClient`, and `onSaved`.
- [x] Builds the same `ModelRouteUpdate` payload as the current page hook.
- [x] Validates costs and surfaces toast errors.
- [x] Calls `updateModel` then `updateModelAliases` in sequence.
- [x] Preserves partial-failure toasts and query invalidation.
- [x] Calls `onSaved` after successful save to clear dirty state.

## Notes
- `use-model-config-page.ts` and `model-config-form.tsx` were not modified in this task.
- Pre-existing typecheck failures in `src/features/benchmarks/__tests__/` are unrelated to this hook.
