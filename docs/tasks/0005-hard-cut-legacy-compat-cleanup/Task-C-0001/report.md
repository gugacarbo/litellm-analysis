# Task-C-0001 Report

## Summary

Aligned the frontend and analytics layers to the clean post-hard-cut contract. Removed all legacy type aliases, deprecated fields, normalization functions, and fallback reads that existed only for backward compatibility with LiteLLM-era payloads.

## Files changed

### Frontend API clients
- `apps/web/src/shared/lib/api-client/models.ts` — Removed `litellmOnly` field from `ModelsWithConfigCounts`; removed `LegacySyncDirection` type; removed `litellmValue` from `ModelSyncDiffItem`; removed `normalizeSyncPresenceStatus()` and `normalizeSyncDirection()` functions; simplified `normalizeModelsCounts`, `normalizeModelSyncDiffItem`, and `normalizeModelWithStatus` to use only canonical fields; removed `apiKey` from `ModelProviderConfig`
- `apps/web/src/shared/lib/api-client/providers.ts` — Removed deprecated `LiteLLMProvider` type alias
- `apps/web/src/shared/lib/api-client/spend.ts` — Removed legacy fallbacks `raw.litellm_model_name` and `raw.api_base` from `normalizeProxyRequestLog`; updated JSDoc

### Frontend components
- `apps/web/src/features/models/model-form-data.ts` — Removed `"api_base"` and `"provider_name"` from `FIXED_KEYS`
- `apps/web/src/features/models/components/model-config-form.tsx` — Replaced `LiteLLMProvider` import with `RegistryProvider`
- `apps/web/src/features/models/components/model-form-dialog.tsx` — Replaced `LiteLLMProvider` import with `RegistryProvider`
- `apps/web/src/features/models/detail/model-detail-context.tsx` — Replaced `LiteLLMProvider` import with `RegistryProvider`

### Contracts
- `packages/contracts/src/analytics.ts` — Removed `custom_llm_provider` from `SpendLog` interface

### Analytics service
- `services/analytics-service/src/types/index.ts` — Removed deprecated `LegacyTimeRangeParams` type
- `services/analytics-service/src/data-source/registry-methods.ts` — Added comment noting `apiKey` fallback is DB-level backward compat

### Test fixes
- `services/agent-plugins/src/plugins/__tests__/registry.test.ts` — Updated `apiKey` assertion from `"sk-test"` to `""` to match the post-Task-A-0002 behavior

## Tests run / results

- `pnpm --filter @lite-llm/agent-plugins test -- --run` — **153 passed**, 6 skipped
- `pnpm --filter @lite-llm/server test -- --run` — **16 passed** (3 test files)
- `pnpm --filter @lite-llm/llm-config-service test -- --run` — **40 passed**
- `pnpm --filter @lite-llm/models-repository test -- --run` — **3 passed**
- `pnpm --filter @lite-llm/models-service test -- --run` — **21 passed**

## Typecheck results

| Package | Errors |
|---------|--------|
| `apps/web` | 0 ✅ |
| `packages/server` | 0 ✅ |
| `packages/contracts` | 0 ✅ |
| `services/llm-config-service` | 0 ✅ |
| `services/models-service` | 0 ✅ |
| `services/analytics-service` | 0 ✅ |
| `services/agent-plugins` | 0 ✅ |
| `repositories/models-repository` | 0 ✅ |
| `services/llm-gateway` | 21 ⚠️ (pre-existing mock issues) |

## Follow-up risks

1. **`services/llm-gateway` test mocks**: 21 pre-existing type errors in test files due to missing `modelsService` in mock constructors. Not caused by this task.
2. **Database `api_key` column**: Still exists in `model_proxy_providers` schema. The `registry-methods.ts` fallback `record.apiKey?.trim() || record.secretRef?.trim()` is preserved with a comment for DB-level backward compat.
3. **`model-alias` plugin**: Still active with consumers in `apps/web`, `apps/server`, and orchestration. Not deleted in this task scope.
