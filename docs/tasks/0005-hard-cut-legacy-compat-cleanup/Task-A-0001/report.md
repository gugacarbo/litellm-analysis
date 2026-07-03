# Task-A-0001 Report

## Summary

- Verified that the current `ModelRoute` / sync contract files in this branch are aligned to the hard-cut requirement: canonical camelCase-only route fields, no legacy sync-label normalization, and adapter-level rejection of legacy model-route payload keys.
- Tightened `packages/server/src/orchestration/route-params.ts` so provider resolution reads only the canonical `providerName` field and no longer falls back to deprecated provider aliases.
- Reworked focused tests so this task now covers the hard-break behavior explicitly: canonical route parsing, canonical route emission, legacy payload rejection, and sync-label rejection.

## Files changed

- `packages/server/src/orchestration/route-params.ts`
- `packages/server/src/orchestration/__tests__/route-params.test.ts`
- `services/llm-config-service/src/adapters/__tests__/model-route-adapter.test.ts`
- `services/llm-config-service/src/types/__tests__/sync-status.test.ts`
- `docs/tasks/0005-hard-cut-legacy-compat-cleanup/Task-A-0001/report.md`

## Verified in place

- `services/llm-config-service/src/types/model-route.ts`
- `services/llm-config-service/src/types/sync-status.ts`
- `services/llm-config-service/src/adapters/model-route-adapter.ts`

These files already matched the hard-cut contract in the current branch state after inspection, so no additional diff was required there.

## Tests run / results

- `rtk pnpm exec vitest run services/llm-config-service/src/adapters/__tests__/model-route-adapter.test.ts services/llm-config-service/src/types/__tests__/sync-status.test.ts`
  - Passed: 2 test files, 14 tests.
- `rtk pnpm exec vitest run packages/server/src/orchestration/__tests__/route-params.test.ts`
  - Passed: 1 test file, 4 tests.
- `rtk pnpm exec tsc -p packages/server/tsconfig.json --noEmit`
  - Passed.
- `rtk pnpm exec tsc -p services/llm-config-service/tsconfig.json --noEmit`
  - Failed for pre-existing out-of-scope test typing in `services/llm-config-service/src/services/__tests__/providers.service.test.ts` (`apiKey` no longer exists on `ProviderCreateInput` / `ProviderUpdateInput`).

## Follow-up risks

- `packages/server/src/routes/model-routes.ts` still contains out-of-scope legacy sync directions (`config-to-litellm`, `litellm-to-config`) and still constructs config-only routes with legacy snake_case fields before calling `toModelRoute`. Updating that runtime path would require crossing the write boundary for Task-A-0001.
