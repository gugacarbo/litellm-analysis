# Task-A-0009 Report: Canonicalize shared ModelRoute contract and adapter semantics

## What was changed and why

### Step 1: Tightened the canonical route type (`model-route.ts`)

- **`RouteParams`** (line 67): Replaced `Record<string, unknown>` with `Partial<Pick<ModelRoute, ReservedRouteParamKey>>`. This derives the type directly from `ModelRoute` fields, making it a proper typed shape instead of a generic record. All downstream consumers now get compile-time enforcement of canonical field names.

- **`MODEL_ROUTE_TO_SNAKE_PARAM`** → **`MODEL_ROUTE_TO_ROUTE_PARAM`** (line 119): Renamed because the constant maps `ModelRoute` fields to camelCase route param keys, not snake_case. The old name was misleading. Also tightened the value type from `string` to `ReservedRouteParamKey` for additional type safety.

### Step 2: Simplified adapter semantics (`model-route-adapter.ts`)

- Updated the import and usage of the renamed constant (`MODEL_ROUTE_TO_ROUTE_PARAM`).
- `fromModelRoute` now uses a local `Record<string, unknown>` accumulator with a terminal `as RouteParams` cast — necessary because `Object.entries()` doesn't narrow key types, but the cast is safe since all mapped keys are valid `RouteParams` keys.
- Legacy rejection (`LEGACY_ROUTE_PARAM_KEYS`, `assertCanonicalRouteParams`) preserved unchanged.

### Step 3: Replaced generic shared contract usage (`analytics.ts`)

- Defined a typed `ModelRoute` interface in `packages/contracts/src/analytics.ts` matching the canonical shape from `llm-config-service`. This avoids adding a dependency from the shared contracts package to a service package.
- `ModelConfig.modelRoute` changed from `Record<string, unknown>` to `ModelRoute`.
- `ModelDetail` left as-is (snake_case is acceptable at the persistence boundary per conventions).

### Test updates

- `model-route-adapter.test.ts`: Added `RouteParams` import. Legacy-key rejection tests now use `as RouteParams` casts since the tightened type correctly rejects unknown keys at compile time — the runtime rejection assertions remain intact.

### Barrel exports

- `types/index.ts` and `index.ts` in `llm-config-service`: Updated `MODEL_ROUTE_TO_SNAKE_PARAM` → `MODEL_ROUTE_TO_ROUTE_PARAM`.

## Verification results

```
@lite-llm/llm-config-service:
  typecheck: PASS (tsc --noEmit)
  test: 6 files passed, 40 tests passed

@lite-llm/contracts:
  typecheck: PASS (tsc --noEmit)
  test: 1 file passed, 2 tests passed
```

## Concerns for downstream tasks

- **Task-B / Task-C (model-routes.ts refactor)**: The `PersistedModelConfigSpec` type in `packages/server/src/routes/model-routes.ts` and `apps/server/src/__tests__/model-routes-save.test.ts` still uses its own local type. These should be aligned with the canonical `ModelRoute` from `llm-config-service` in their respective tasks.

- **Web app `ModelRoute`**: `apps/web/src/shared/lib/api-client/models.ts` defines its own `ModelRoute` type (lines 14-31) that is structurally identical but lacks `metadata`. This is a separate concern for the web app's own task.

- **`coerceRouteParams`** in `packages/server/src/orchestration/route-params.ts` still uses `Record<string, unknown>` — this is a coercion utility that operates on arbitrary input before it reaches the adapter, so the loose type is appropriate there.
