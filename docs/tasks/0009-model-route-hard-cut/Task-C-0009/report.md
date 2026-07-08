# Task-C-0009: Collapse parallel route and config handling in the server runtime

## 1. What was changed and why

### Step 1: Route-centric server flows (`packages/server/src/routes/model-routes.ts`)

- **Line 388**: `modelRoute: registryRoute ?? { modelName }` → `modelRoute: registryRoute ?? ({ modelName } as ModelRoute)`. The fallback object was a plain `{ modelName: string }` literal; now explicitly typed as `ModelRoute` to ensure the `listModelsWithConfig` response carries canonical route types throughout.
- **Line 890-892**: `existingRoute = existingModel?.modelRoute ?? { modelName: name }` → `existingRoute = existingModel?.modelRoute ?? ({ modelName: name } as ModelRoute)`. Same rationale — the PUT handler's fallback route must be typed as `ModelRoute` for downstream consumers (`buildModelSpecForConfigWrite`, `normalizeModelRoute`).
- **Verified**: `listMergedRegistryModels` returns `RegistryModelEntry[]` (via `listRegistryModels`), which is correct — each entry carries a typed `ModelRoute`.
- **Kept as-is**: `PersistedModelConfigSpec` (config type, not route), `buildModelSpecForConfigWrite` (route→config merge), PUT handler display-metadata stripping (lines 908-915). All confirmed correct per spec.

### Step 2: Analytics-facing registry mapping (`services/analytics-service/`)

**`types/index.ts`:**

- Added `import type { ModelRoute } from "@lite-llm/llm-config-service"`.
- `ModelInfo.modelRoute`: `Record<string, unknown>` → `ModelRoute`.
- `AnalyticsDataSource.createModel` param: `modelRoute?: Record<string, unknown>` → `modelRoute?: ModelRoute`.
- `AnalyticsDataSource.updateModel` param: `modelRoute?: Record<string, unknown>` → `modelRoute?: ModelRoute`.

**`data-source/registry-methods.ts`:**

- Added `import type { ModelRoute } from "@lite-llm/llm-config-service"`.
- `getRegistryModelsImpl` (line 79): Removed `as unknown as Record<string, unknown>` cast — `dbModelToRoute(row)` now flows directly as `ModelRoute` into `ModelEntry.modelRoute`.
- `createRegistryModelImpl` param: `modelRoute?: Record<string, unknown>` → `modelRoute?: ModelRoute`. Restructured to destructure `modelName` out before spreading to avoid TS2783 (duplicate property).
- `updateRegistryModelImpl` param: `modelRoute?: Record<string, unknown>` → `modelRoute?: ModelRoute`. Same destructuring fix applied. Also fixed the `mergedRoute` spread on the rename path (line 148).
- **Kept as-is**: `ModelDetail` (snake_case, DB/analytics boundary), `routeToCreateData` casts for `requestOptions`/`metadata` (these are `Record<string, unknown>` in `ModelRoute`).

### Step 3: Test refresh

- `model-routes-save.test.ts`: No changes needed — tests use `ModelRoute` already, and the `PersistedModelConfigSpec` duplication is fine for test isolation.
- `registry-integration.test.ts` line 426: Left as `Record<string, unknown>` — this is a JSON response type assertion; using `Record<string, unknown>` for parsed JSON is correct and doesn't need updating.

## 2. Verification results

```
pnpm --filter @lite-llm/analytics-service typecheck
```

- Only remaining error: `secretRef` property on `modelProxyProviders` row type (line 197) — **pre-existing**, confirmed via `git stash` baseline.

```
pnpm --filter server exec vitest run src/__tests__/model-routes-save.test.ts
```

- **3/3 passed** (all green).

```
pnpm --filter server exec vitest run src/__tests__/model-routes-aliases.test.ts src/__tests__/registry-integration.test.ts
```

- 20 failures — **all pre-existing** `this.db.select/insert is not a function` errors (DB mock issues in test environment). Confirmed identical failure count via `git stash` baseline.
- 3 non-DB tests in `registry-integration.test.ts` pass (legacy rejection + export-configs).

## 3. Concerns for downstream tasks

- **None.** The `secretRef` pre-existing type error in `getRegistryProvidersImpl` is unrelated to route handling and should be addressed separately (likely a schema drift between the Drizzle schema and the actual DB column).
- The `ModelEntryConfig` type (line 379) still uses `Record<string, unknown> | null` for `modelRoute` but is unused in the codebase — low priority, can be cleaned up in a future pass.
