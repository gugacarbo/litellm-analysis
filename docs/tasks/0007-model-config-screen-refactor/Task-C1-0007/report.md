# Task C1-0007 Report

## Status: DONE

## Files created
- `apps/web/src/features/models/components/tabs/reasoning-section.tsx`
- `apps/web/src/features/models/components/tabs/model-general-tab.tsx`

## Typecheck result
No type errors in the created files. The 2 pre-existing errors in `benchmark-types.test.ts` and `benchmark-utils.test.ts` are unrelated.

## Details
- `reasoning-section.tsx` — Collapsible section (default closed) with Reasoning Effort select, Reasoning API Mode select, Enable Thinking switch, Include Reasoning in Request switch. Props: `reasoning`, `onUpdateReasoning`.
- `model-general-tab.tsx` — Card layout with Model Name (disabled), Display Name, Family, Owned By (English hint), API Mode select, Thinking Levels input, Vision switch, Enabled switch, and `<ReasoningSection>` at bottom. Props: `modelName`, `formData`, `onFormDataChange`.
- Both use `ModelConfigFormData` from `@/features/models/use-model-config-page`.
- No existing files were modified.
