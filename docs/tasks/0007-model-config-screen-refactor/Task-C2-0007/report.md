# Task-C2-0007: Create ModelRoutingTab component

**Status:** DONE

## Files created
- `apps/web/src/features/models/components/tabs/model-routing-tab.tsx`

## Summary
Created a thin wrapper component `ModelRoutingTab` that renders a `Card` with title "Routing Aliases" and description "Aliases that route to this model. These are internal routing names only." It forwards props (`aliases`, `loading`, `error`, `disabled`, `onChange`) to the existing `ModelAliasesEditor`.

## Typecheck
`pnpm --filter web typecheck` — no errors in the new file. Pre-existing errors in `src/features/benchmarks/__tests__/` (unrelated).

## Concerns
None.
