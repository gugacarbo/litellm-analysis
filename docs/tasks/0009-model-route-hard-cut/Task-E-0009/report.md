# Task-E-0009: Refresh regression coverage for the hard cut

## 1. What was changed and why

### Step 1: Align shared contract tests
**File:** `packages/contracts/src/__tests__/api-contracts.test.ts`

- Added `ModelRoute` to imports (line 19)
- Added a type-level assertion at line 223: `const _route: ModelRoute = modelConfig.modelRoute;` — this verifies at compile time that `ModelConfig.modelRoute` is the typed `ModelRoute` interface, not `Record<string, unknown>`. If the type were ever widened back to a generic record, this assignment would fail to compile.

### Step 2: Expand server rejection coverage
**File:** `apps/server/src/__tests__/registry-integration.test.ts`

- Added `"rejects legacy model field in model create request"` test (after line 553). This test sends a create request with `modelRoute: { model: "gpt-4", modelName: "legacy-model-field" }` and asserts 400 with the legacy rejection error message. The `model` field is in `LEGACY_ROUTE_PARAM_KEYS` and must be rejected.
- Existing rejection tests for `litellmParams` and `snake_case model_name` were verified — both pass correctly.

### Step 3: Refresh web fixtures and table coverage
**File:** `apps/web/src/pages/__tests__/models-gates.test.tsx`

- Added `"renders cost and context values from typed camelCase modelRoute fields"` test. This verifies that the table renders formatted cost values derived from camelCase `inputCostPerToken`/`outputCostPerToken` fields (e.g., `$30.00/Mi`, `$60.00/Mi` for gpt-4; `$15.00/Mi`, `$75.00/Mi` for claude-3-opus). This locks the contract that the web layer consumes typed camelCase fields, not snake_case.

## 2. Verification results

```
pnpm --filter @lite-llm/contracts test
  ✅ 2 passed (2 tests)

pnpm --filter server exec vitest run src/__tests__/registry-integration.test.ts src/__tests__/model-routes-save.test.ts src/__tests__/model-routes-aliases.test.ts
  ✅ 7 passed (rejection tests + model-routes-save + export-configs)
  ⚠️ 20 pre-existing failures (all `this.db.select is not a function` — DB infra, unrelated)

pnpm --filter web exec vitest run src/pages/__tests__/models-gates.test.tsx
  ✅ 4 passed (4 tests)
```

All new and relevant existing tests pass. The 20 server test failures are pre-existing database connection issues (`this.db.select is not a function`, `this.db.insert is not a function`) affecting tests that require a real Drizzle DB client — these are not caused by this task.

## 3. Concerns for downstream tasks

- **None.** The hard cut is locked: contracts enforce typed `ModelRoute`, server rejects all legacy payload forms (`litellmParams`, `snake_case`, `model`), and web tests verify camelCase cost rendering. The `model-routes-aliases.test.ts` failures are pre-existing DB infra issues that need a separate fix (likely a test DB setup task).
