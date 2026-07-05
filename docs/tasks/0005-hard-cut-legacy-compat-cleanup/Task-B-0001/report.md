# Task-B-0001 Report

## Summary

- Removed `apiKey` field from the PUT `/models/providers/:providerId` handler in `model-routes.ts` — the field no longer exists in the canonical provider contract after Task-A-0002.
- Removed the `MODEL_PROXY_API_KEY` env-var fallback from proxy authentication in `model-proxy-routes.ts`. The proxy now authenticates exclusively via the `apiKeysService` registry (seeded API keys), eliminating the legacy compat path.
- Removed the `MODEL_PROXY_API_KEY` check from `hasConfiguredAuth()` — auth readiness is now determined solely by seeded API keys.
- Verified that `chat-routes.ts` and `app-runtime.ts` still reference `MODEL_PROXY_API_KEY` for the chat endpoint and health-check runtime respectively, which are current product features (not legacy compat), so they were left untouched.
- Verified that `upstream-provider.ts` and `service.ts` in `llm-gateway` had no remaining legacy compat code — `readProviderApiKey` was already removed by Task-A-0002.

## Files Changed

- `packages/server/src/routes/model-routes.ts` — removed `apiKey` from provider update handler type
- `packages/server/src/routes/model-proxy-routes.ts` — removed `MODEL_PROXY_API_KEY` fallback from `authorizeRequest()` and `hasConfiguredAuth()`

## Tests Run / Results

- `pnpm exec tsc -p packages/server/tsconfig.json --noEmit` — ✅ Passed
- `pnpm exec tsc -p apps/server/tsconfig.json --noEmit` — ✅ Passed
- `pnpm exec tsc -p services/llm-gateway/tsconfig.json --noEmit` — ⚠️ Pre-existing test file errors (missing `modelsService` in mock, `createDatabaseMock` not found) — not caused by this task
- `packages/server` vitest — ✅ 3 test files, 16 tests passed
- `services/llm-gateway` vitest — ⚠️ 8/9 test files passed (39 tests), 1 pre-existing mock hoisting failure in `service.test.ts`

## Follow-up Risks

- `chat-routes.ts` still reads `MODEL_PROXY_API_KEY` directly from env for the `/chat` endpoint — this is a current product feature, not legacy compat, but could be migrated to use the apiKeysService in the future.
- `app-runtime.ts` still passes `MODEL_PROXY_API_KEY` to `seedBootstrapApiKey()` and `healthCheckRuntime` — these are bootstrap/health-check features, not legacy compat paths.
- The `llm-gateway` test file `service.test.ts` has pre-existing mock issues unrelated to this task.
