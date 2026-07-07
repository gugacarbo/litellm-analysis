# Task-D1-0007: Rewrite use-model-config-page.ts as thin composer

**Status:** DONE

## Files modified

- `apps/web/src/features/models/use-model-config-page.ts` — completely rewritten

## Summary

Replaced the 603-line monolithic `useModelConfigPage` with a 92-line thin composer that delegates to extracted hooks:

- `ModelConfigController` interface defined as specified
- `useModelConfigPage()` composes `useModelConfigForm`, `useModelAliases`, and `useModelConfigSave`
- `useModelConfigPageFromContext()` calls `useModelConfigPage()` and spreads `formActions` for backward compatibility with the consumer in `model-detail-settings-tab.tsx`
- `ModelConfigFormData` re-exported from `use-model-config-form` for backward compat
- All old code (`modelToFormData`, `buildConfigFromFormData`, `normalizeAliases`, `getAliasValidationError`, `handleSave`, old types) deleted

## Typecheck result

```
pnpm --filter web typecheck
```

Only pre-existing errors remain (unrelated benchmark test files and a `modelName` prop issue in `model-detail-settings-tab.tsx`). No new type errors introduced.

## Concerns

None.
