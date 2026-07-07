# Task-D2-0007: Rewrite ModelConfigForm as tab shell

**Status:** DONE  
**Try:** 1  

## Summary

Rewrote `apps/web/src/features/models/components/model-config-form.tsx` from a 572-line monolithic form into a 102-line tab shell.

## Changes

- **Deleted** `GlobalSettingsSection`, `ReasoningSettingsSection`, `DatabaseSettingsSection` components and all their imports (`lucide-react` icons, `Card`, `Input`, `Label`, `Select`, `Switch`, `ModelAliasesEditor`, `useCallback`)
- **Added** `ModelConfigController` interface with: `model`, `formData`, `isDirty`, `saving`, `providers`, `aliasesState`, `formActions`, `onSave`, `onBack`
- **Added** shadcn `Tabs` shell with three tabs: General, Routing, Advanced
- **Wired** `ModelGeneralTab`, `ModelRoutingTab`, `ModelAdvancedTab` with correct props from controller
- **Kept** sticky footer with dirty indicator, Back button, and Save button (disabled when saving, aliases loading, or not dirty)

## Files modified

- `apps/web/src/features/models/components/model-config-form.tsx` (572 → 102 lines)

## Typecheck

The file itself compiles. The 3 errors in `model-detail-settings-tab.tsx` are expected — that file still passes individual props instead of `controller` and will be fixed by Task D3.

## Concerns

- `ModelConfigController` is defined in this file. Task D1 (rewrite `use-model-config-page.ts`) should re-export or align with this interface.
- `model-detail-settings-tab.tsx` needs updating (Task D3) to pass `controller` instead of individual props.
