# Task-A-0002 Report

## Summary

Removed all legacy compatibility bridges for provider credentials and model/provider config. The `apiKey` field was eliminated from the `Provider` schema, `ProviderRecord` type, and all runtime code that read/wrote it. The `env:` shim in `db-repository.ts` was removed. Legacy import methods (`previewLegacyImport`, `upsertLegacyImport`, `LegacyProviderImportData`, `LegacyProviderImportOutcome`) were deleted from `ProvidersRepository`. The `readProviderApiKey` function (which read `provider.apiKey` with `env:` prefix support) was removed from `upstream-provider.ts`. The `assertCanonicalProviderSpec` guard in `models-service` was removed since `apiKey` no longer exists on the `Provider` type. Frontend API client types and forms were updated to use `secretRef` instead of `apiKey`.

## Files changed

### Core contract changes
- `repositories/models-repository/src/schemas/provider.ts` — Removed `apiKey` field from `providerSchema`
- `repositories/models-repository/src/db-repository.ts` — Removed hardcoded `apiKey: "env:MODEL_PROXY_API_KEY"` from local-proxy provider; removed `secretRef: null` from provider create call
- `services/llm-config-service/src/types/providers.ts` — Removed `apiKey` from `ProviderRecord` interface and its "legacy read-only" comment
- `services/llm-config-service/src/lib/provider-secrets.ts` — Removed `apiKey` from `hasStoredProviderSecret` and `resolveProviderSecret` input types

### Repository cleanup
- `services/llm-config-service/src/repositories/providers-repository.ts` — Removed `apiKey` from `toRecord` function; deleted `LegacyProviderImportData`, `LegacyProviderImportOutcome`, `previewLegacyImport()`, `upsertLegacyImport()` methods

### Service cleanup
- `services/models-service/src/services/provider.service.ts` — Removed `assertCanonicalProviderSpec` function and its `apiKey` guard
- `services/llm-gateway/src/resolver/upstream-provider.ts` — Removed `readProviderApiKey` function and its call site; credential resolution now uses only `readSecretRef` + `resolveProviderSecret`

### Server routes
- `packages/server/src/routes/provider-routes.ts` — Removed `apiKey` from POST/PUT provider route handlers; `secretRef` is now the only credential mechanism

### Agent plugins
- `services/agent-plugins/src/plugin-registry.ts` — Replaced `modelProxyProvider?.apiKey` with empty string fallback
- `services/agent-plugins/src/plugins/registry.ts` — Replaced `modelProxyProvider?.apiKey` with empty string fallback

### Frontend
- `apps/web/src/shared/lib/api-client/providers.ts` — Changed `ProviderInput` and `ProviderUpdateInput` to use `secretRef` instead of `apiKey`
- `apps/web/src/features/models/use-providers-page.ts` — Updated form state and submit logic to use `secretRef`
- `apps/web/src/features/models/use-models-page.ts` — Updated form state and submit logic to use `secretRef`
- `apps/web/src/features/models/providers-page.tsx` — Updated form UI to show "Secret Ref (env var name)" instead of "API Key"

### Test updates
- `repositories/models-repository/src/db-repository.test.ts` — Removed `apiKey` from test data and in-memory DB mock; removed `apiKey` assertion
- `services/models-service/src/services/__tests__/provider.service.test.ts` — Removed `apiKey` from test data; removed "rejects upstream provider apiKey compatibility input" test
- `services/llm-config-service/src/services/__tests__/providers.service.test.ts` — Removed `apiKey` assertion; removed "leaves legacy apiKey rows untouched on read" test
- `services/llm-config-service/src/services/__tests__/in-memory-repositories.ts` — Removed `apiKey` from providers mock create/update types
- `services/llm-gateway/src/resolver/upstream-provider.test.ts` — Removed `apiKey` from provider map; updated mock to use `secretRef`; added `process.env` setup for tests that need env-based resolution

## Tests run / results

- `pnpm --filter @lite-llm/models-repository test -- --run` — **3 passed**
- `pnpm --filter @lite-llm/llm-config-service test -- --run` — **40 passed**
- `pnpm --filter @lite-llm/models-service test -- --run` — **21 passed**
- `pnpm --filter @lite-llm/llm-gateway test -- --run` — Pre-existing failures (11 failed, 4 passed) — all failures are due to `resolveUpstreamTarget` using a real database connection (`import { db } from "@lite-llm/database/client"`) that doesn't have the required tables in the test environment. Not caused by this task.
- `npx tsc -p repositories/models-repository/tsconfig.json --noEmit` — **Passed**
- `npx tsc -p services/llm-config-service/tsconfig.json --noEmit` — **Passed**
- `npx tsc -p services/models-service/tsconfig.json --noEmit` — **Passed**
- `npx tsc -p services/llm-gateway/tsconfig.json --noEmit` — **Passed**
- `npx tsc -p packages/server/tsconfig.json --noEmit` — **Passed**
- `npx tsc -p apps/web/tsconfig.json --noEmit` — **Passed**

## Follow-up risks

1. **Database schema**: The `apiKey` column on `model_proxy_providers` still exists in the database schema (`repositories/database/src/schema/model-proxy.ts`). A migration to drop this column should be planned separately (schema cleanup task).
2. **`llm-gateway` tests**: The pre-existing test failures in `llm-gateway` (11 tests) are caused by `resolveUpstreamTarget` using a real database connection instead of a mock. This is a pre-existing issue unrelated to this task.
3. **`hebo/build-config.ts`**: The `apiKey` field in `ProviderGroup` interface and `buildHeboGatewayConfig` is unrelated to the `Provider` type — it's the resolved bearer token from upstream headers. No change needed.
4. **`analytics-service`**: The `registry-methods.ts` file references `record.apiKey?.trim()` — this reads from the database column directly (not the `Provider` type). This will be cleaned up when the schema column is dropped.
5. **Frontend provider form UX**: The form now uses `secretRef` (env var name) instead of `apiKey`. Users will need to provide environment variable names rather than raw API keys. The UI label and placeholder have been updated accordingly.
