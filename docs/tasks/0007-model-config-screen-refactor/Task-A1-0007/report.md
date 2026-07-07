# Task-A1-0007 Report: Extract useModelConfigForm hook

## Status
DONE

## Files touched
- Created `apps/web/src/features/models/hooks/use-model-config-form.ts`

## Implementation summary
- Defined and exported `ModelConfigFormData` without alias-loading flags (`aliasesLoaded`, `aliasesLoading`, `aliasesLoadError`).
- Implemented `getEmptyFormData()` returning the initial shape.
- Copied `modelToFormData(model: ModelWithStatus)` from `use-model-config-page.ts`, preserving all field mappings and validation fallbacks for `apiMode` and `reasoning.effort`.
- Copied `buildConfigFromFormData(formData)` producing a `ModelConfig["config"]` matching current behavior.
- Implemented dirty tracking via `getComparableFormData` and `areFormDataEqual` using JSON-stringified deep equality over a stable projection.
- Implemented `handleFormDataChange`, `handleAddExtraParam`, `handleRemoveExtraParam`, and `handleUpdateExtraParam` with immutable updates.
- Added `resetFormForModel(model)` effect to initialize/clear form state when the model changes.
- Exported `UseModelConfigFormResult` and `useModelConfigForm`.

## Validation
Command: `pnpm --filter @lite-llm/web typecheck`
Result: exit code 0 for this file; pre-existing TypeScript errors in `benchmarks/__tests__` remain.

## Acceptance criteria
- [x] New hook file created and exports `ModelConfigFormData`, `UseModelConfigFormResult`, and `useModelConfigForm`.
- [x] `ModelConfigFormData` no longer contains alias load flags.
- [x] `modelToFormData` and `buildConfigFromFormData` match current behavior.
- [x] Extra-param add/remove/update helpers exported.
- [x] Dirty tracking implemented via comparable projection.
- [x] Form resets on model change.
- [x] No alias logic or TanStack mutations in the hook.

## Notes
- `use-model-config-page.ts` and `model-config-form.tsx` were intentionally not modified in this task; they will be updated in later tasks.
- One `blocked` log entry was emitted while the subagent observed the unrelated benchmark test type errors, but the task itself is complete.
