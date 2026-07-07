# Task-B-0009: Harden the HTTP/orchestration boundary

## 1. What was changed and why

### Step 1: Enforce canonical request parsing

**`packages/server/src/orchestration/registry-models-bridge.ts`**
- Imported `RouteParams` from `@lite-llm/llm-config-service`.
- Tightened `routeUpdateFromBody` signature from `Record<string, unknown>` to `RouteParams` (which is `Partial<Pick<ModelRoute, ReservedRouteParamKey>>`). This ensures only canonical camelCase keys are accepted at the type level.

**`packages/server/src/routes/model-routes.ts`**
- Added 4xx error classification in `POST /models` and `PUT /models/:name` catch blocks. Validation errors from `resolveModelRouteFromBody` and `parseModelRouteFromApi` (e.g., "modelRoute is required", "Legacy model route fields are no longer supported", "Unsupported model route fields") now return HTTP 400 instead of 500.

### Step 2: Remove residual legacy normalization

**`packages/server/src/orchestration/route-params.ts`**
- Changed `getProviderNameFromParams` parameter type from `Record<string, unknown>` to `ModelRoute`. Removed the `as string` cast on `params.providerName` since it's now properly typed as `string | undefined`.
- Changed `resolveModelProvider` parameter type from `Record<string, unknown>` to `ModelRoute`.
- Removed the `route as unknown as Record<string, unknown>` cast in `normalizeModelRoute` — it now passes `route` directly to `resolveModelProvider`.
- `coerceRouteParams` kept as-is per task instructions (it operates on arbitrary form/query input before adapter processing).

**`packages/server/src/orchestration/__tests__/route-params.test.ts`**
- Updated tests to use `ModelRoute`-shaped objects (added required `modelName` field).
- Removed `litellm_provider_name` test cases since `ModelRoute` doesn't have that field and the boundary now rejects legacy keys.

### Step 3: Add boundary regression coverage

**`apps/server/src/__tests__/registry-integration.test.ts`**
- Added `rejects legacy litellmParams in model create request` — sends `litellmParams` in `modelRoute`, asserts HTTP 400 with "Unsupported model route fields" error.
- Added `rejects snake_case model_name in model create request` — sends `model_name` and `input_cost_per_token` in `modelRoute`, asserts HTTP 400 with "Legacy model route fields are no longer supported" error.
- Update-request boundary tests were attempted but cannot work with the current in-memory DB test infrastructure (`getResolvedDefaultProvider()` calls the real Drizzle DB before `resolveModelRouteFromBody()` in the PUT handler). The create-request tests adequately cover the boundary validation since both paths use the same `resolveModelRouteFromBody` → `parseModelRouteFromApi` chain.

## 2. Verification results

### route-params unit tests (packages/server)
```
✓ src/orchestration/__tests__/route-params.test.ts (4 tests) — all passed
```

### model-routes-save integration tests (apps/server)
```
✓ src/__tests__/model-routes-save.test.ts (3 tests) — all passed
```

### registry-integration tests (apps/server)
```
✓ rejects legacy litellmParams in model create request
✓ rejects snake_case model_name in model create request
✓ exports consumer configs via POST /models/export-configs
✗ 15 pre-existing failures (in-memory DB mock doesn't support Drizzle select/insert)
```

### Typecheck
- `@lite-llm/server` — passed
- `@lite-llm/llm-config-service` — passed
- `@lite-llm/llm-gateway` — pre-existing failures (unrelated)

## 3. Concerns for downstream tasks

- **Update-request boundary tests**: The PUT `/models/:name` handler calls `getResolvedDefaultProvider()` (which hits the real DB via `SettingsRepository.findByKey`) before `resolveModelRouteFromBody()`. The in-memory DB mock in `registry-test-stack.ts` doesn't support Drizzle's `select()`/`insert()` methods. This is a pre-existing test infrastructure gap. The create-request tests cover the same validation path, but if full update-path coverage is desired, the test stack needs to be updated to mock the Drizzle DB properly or the PUT handler should be restructured to validate before DB calls.
- **Error classification in PUT handler**: The validation error checks were added before the "not found" check in the catch block. This is correct because validation errors should take precedence over "not found" errors.
