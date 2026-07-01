# Task-C-0001 Re-Review Fix Report

## Status

Fixed on 2026-07-01.

## Requirements Covered

- P1: Alias-load failure no longer resets `hydratedAliasesModelRef`, preventing the ref from being cleared and allowing correct hydration on subsequent request.
- P2: `useEffect` body reordered from `pending → error → data` to `data → error → pending`, ensuring data hydration takes priority and existing aliases are not clobbered by stale pending state.
- Fixed `initialFormData` on data hydrate to use `shouldHydrateAliases` flag instead of unconditionally overwriting aliases (matching the `formData` path).

## Changes Made

### `apps/web/src/features/models/use-model-config-page.ts`

**Before (buggy effect body):**
1. `if (!modelName)` — reset → return
2. `if (isPending && !data && hydratedModel !== modelName)` — show loading → return
3. `if (isError)` — set error, reset `hydratedAliasesModelRef`, show toast
4. `if (data)` — hydrate, set `hydratedAliasesModelRef = modelName`

**Problems:**
- **P1**: `hydratedAliasesModelRef` is reset in the error branch (`= null`), so after an error the ref no longer remembers the current model. A subsequent successful refetch won't hydrate because the ref is cleared.
- **P2**: The `isPending` branch is evaluated before `data`. When `isPending` becomes true (e.g., refetch) but `data` still holds old results, the effect sets loading state and returns early — the old data is never seen. The effect also misses re-runs because `isSuccess` wasn't in the dependency array.
- **P2-cont**: `initialFormData` in the data branch unconditionally set `aliases: nextAliases`, overwriting any user edits even when `shouldHydrateAliases` was false.

**After (fixed effect body):**
1. `if (!modelName)` — reset → return
2. `if (data)` — hydrate (with `shouldHydrateAliases` guard on BOTH `formData` and `initialFormData`) → set ref → return
3. `if (isError)` — set error, **preserve** `hydratedAliasesModelRef` instead of resetting it → show toast once
4. `if (isPending)` — show loading (no condition on data, no ref check)

## Verification

- `pnpm --filter web typecheck` — passed
- `pnpm --filter web test -- --run models` — 135 tests passed, 20 test files
