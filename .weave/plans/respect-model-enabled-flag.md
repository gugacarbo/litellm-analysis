# Respect `enabled` flag on models

## Goal
Make the system respect `models.jsonc`'s `enabled` property: disabled models should not be health-checked or routed, but should still appear in analytics with a visual indicator.

## What NOT to do
- **Do NOT filter analytics data** — always show usage stats for all models, even disabled
- **Do NOT change existing `getAll()` signature** — add new method instead
- **Do NOT modify alias-router core functions** — filter happens in the plugin layer

---

## Steps

### 1. `models-manager`: Add `getEnabledModelNames()`
**File:** `packages/models-manager/src/services/model.service.ts`

Add new public method:
```typescript
async getEnabledModelNames(): Promise<Set<string>> {
  const config = await this.repository.read();
  return new Set(
    Object.entries(config.models)
      .filter(([, spec]) => spec.enabled !== false)
      .map(([name]) => name)
  );
}
```
Also update `IModelService` interface if one exists for this class.

### 2. Health check: filter probes to enabled models only
**Files:**
- `packages/monitor/src/services/monitor-types.ts` — add `enabledModelNames?: string[]` to `HealthCheckServiceOptions`
- `packages/monitor/src/services/health-check-service.ts` — filter `getConfiguredModels()` when `enabledModelNames` is provided
- `apps/server/src/runtime/health-check-runtime.ts` — accept `enabledModelNames` in options and pass through
- `apps/server/src/runtime/app-runtime.ts` — call `modelsService.getEnabledModelNames()` and pass result to `createHealthCheckRuntime()`

### 3. Alias router: exclude disabled models from routing
**File:** `packages/agents-manager/src/plugins/external/litellm-alias.plugin.ts`

In `buildOutput()`, where `ctx.allModels: Record<string, ModelSpec>` is available:
- Build `enabledSet` from `ctx.allModels` entries where `spec.enabled !== false`
- Filter `agent.model` — skip if disabled
- Filter `agent.fallbackModels[]` — remove disabled entries
- Filter `category.model` — same
- Filter `category.fallbackModels[]` — same
- Filter `effectiveFallback` (global fallback model)

### 4. Frontend: add visual badge to model-stats tables
**Files:**
- `apps/web/src/components/model-stats/model-stats-data-table.tsx`
- `apps/web/src/components/model-stats/model-stats-top-tables.tsx` (if it shows model names)

The `ModelStats` type from the API doesn't include `enabled`. Two options:
- **Option A (simpler):** Add `enabled?: boolean` to the `ModelStats` type returned by the API (server adds it from config)
- **Option B (pure frontend):** Fetch model config separately and cross-reference in a `useMemo`

Recommend **Option A** — modify the analytics endpoint(s) to include `enabled` on each model row (from config lookup, not from DB). Then frontend checks `row.enabled === false` to show `Badge variant="secondary"` with "Disabled" text.

**Note:** Do NOT hide rows — just add the badge. User wants to see all data.
