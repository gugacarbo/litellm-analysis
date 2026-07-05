# Task-D-0001 Report

## Summary

Performed the final sweep of dead code, updated task statuses, and ran comprehensive validation across the monorepo. No new dead code was found beyond what was already cleaned in Tasks A/B/C. The `dist/` directories contain stale artifacts but these are build outputs, not source code.

## Dead code sweep results

### Already cleaned by previous tasks
- `litellm_params`, `litellm_provider_name`, `custom_llm_provider` — only present in `LEGACY_ROUTE_PARAM_KEYS` (rejection list) and rejection tests ✅
- `config-to-litellm`, `litellm-to-config` — removed from frontend; backend already rejects ✅
- `litellmOnly`, `litellmValue` — removed from frontend types ✅
- `LiteLLMProvider` type alias — removed ✅
- `LegacyTimeRangeParams` — removed ✅
- `LegacySyncDirection` — removed ✅
- `normalizeSyncPresenceStatus`, `normalizeSyncDirection` — removed ✅
- `strip-prefix.ts` — already deleted by Task-B-0002 ✅

### Stale `dist/` artifacts (build outputs, not source)
- `packages/server/dist/orchestration/lite-llm-params.d.ts`
- `services/analytics-service/dist/data-source/model-methods.d.ts`
- `services/analytics-service/dist/queries/model-queries.d.ts`
- `services/analytics-service/dist/types/index.d.ts`
- `services/agent-plugins/dist/plugins/model-alias/utils/strip-prefix.d.ts`
- `services/agent-plugins/dist/plugins/litellm-alias/utils/strip-prefix.d.ts`
- `packages/contracts/dist/analytics.d.ts`

These will be cleaned on next build. No action needed.

### Remaining intentional legacy references
- `services/llm-config-service/src/adapters/model-route-adapter.ts` — `LEGACY_ROUTE_PARAM_KEYS` used for **rejection** with clear error messages
- `services/llm-config-service/src/types/sync-status.ts` — `normalizeSyncDirection` and `normalizeSyncPresenceStatus` **reject** legacy values
- `packages/server/src/routes/plugin-routing-routes.ts` — `LEGACY_PLUGIN_CONFIG_KEYS` used for validation rejection
- `services/analytics-service/src/data-source/registry-methods.ts` — `apiKey` fallback for DB-level backward compat (column still exists)

## Validation results

### Typecheck (all packages)
| Package | Status |
|---------|--------|
| `apps/web` | ✅ 0 errors |
| `packages/server` | ✅ 0 errors |
| `packages/contracts` | ✅ 0 errors |
| `services/llm-config-service` | ✅ 0 errors |
| `services/models-service` | ✅ 0 errors |
| `services/analytics-service` | ✅ 0 errors |
| `services/agent-plugins` | ✅ 0 errors |
| `repositories/models-repository` | ✅ 0 errors |
| `services/llm-gateway` | ⚠️ 21 pre-existing errors (test mocks) |

### Test suites
| Package | Tests | Status |
|---------|-------|--------|
| `llm-config-service` | 40 passed | ✅ |
| `models-repository` | 3 passed | ✅ |
| `models-service` | 21 passed | ✅ |
| `server` | 16 passed | ✅ |
| `agent-plugins` | 153 passed, 6 skipped | ✅ |

## Task status final

| Task | Batch | Status |
|------|-------|--------|
| Task-A-0001 | A | `ready_for_review` |
| Task-A-0002 | A | `ready_for_review` |
| Task-B-0001 | B | `ready_for_review` |
| Task-B-0002 | B | `ready_for_review` |
| Task-C-0001 | C | `ready_for_review` |
| Task-D-0001 | D | `ready_for_review` |

## Follow-up risks

1. **`services/llm-gateway` tests**: 21 pre-existing type errors in test files. Not caused by this hard cut.
2. **Database `api_key` column**: Still exists in `model_proxy_providers`. A separate schema migration task should drop it.
3. **`model-alias` plugin**: Still active. Full deletion requires coordinated cut across `apps/web`, `apps/server`, and orchestration.
4. **`dist/` directories**: Stale build artifacts will be cleaned on next `pnpm build`.
