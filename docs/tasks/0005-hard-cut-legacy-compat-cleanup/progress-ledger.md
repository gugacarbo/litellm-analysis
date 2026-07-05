# Progress Ledger

| Task | Status | Commits | Report File | Review |
| ---- | ------ | ------- | ----------- | ------ |
| Task-A-0001 | ✅ completed | — | docs/tasks/0005-hard-cut-legacy-compat-cleanup/Task-A-0001/report.md | ✅ ACs met: no legacy fields in runtime; ModelRoute/sync types canonical; tests cover new contract only |
| Task-A-0002 | ✅ completed | — | docs/tasks/0005-hard-cut-legacy-compat-cleanup/Task-A-0002/report.md | ✅ ACs met: apiKey/env: shims removed; readProviderApiKey deleted; provider routes use secretRef only; 64 tests pass |
| Task-B-0001 | ✅ completed | — | docs/tasks/0005-hard-cut-legacy-compat-cleanup/Task-B-0001/report.md | ✅ ACs met: MODEL_PROXY_API_KEY fallback removed from proxy auth; model-routes apiKey cleaned; 16 tests pass |
| Task-B-0002 | ✅ completed | — | docs/tasks/0005-hard-cut-legacy-compat-cleanup/Task-B-0002/report.md | ✅ ACs met: plugin-routing normalization removed; PluginRegistryV2 simplified; strip-prefix.ts deleted; 153 tests pass |
| Task-C-0001 | ✅ completed | — | docs/tasks/0005-hard-cut-legacy-compat-cleanup/Task-C-0001/report.md | ✅ ACs met: litellmOnly/LegacySyncDirection/litellmValue removed; LiteLLMProvider deleted; spend.ts fallbacks removed; contracts custom_llm_provider removed; analytics LegacyTimeRangeParams removed; typecheck 0 errors |
| Task-D-0001 | ✅ completed | — | docs/tasks/0005-hard-cut-legacy-compat-cleanup/Task-D-0001/report.md | ✅ ACs met: dead code sweep complete; no legacy symbols in source; 233 tests passing; 0 new typecheck errors; risks documented |

## Residual risks (documented, not blocking)

1. **`services/llm-gateway` tests**: 21 pre-existing type errors in test mocks (missing `modelsService`). Not caused by this hard cut.
2. **Database `api_key` column**: Still exists in `model_proxy_providers`. Separate schema migration needed.
3. **`model-alias` plugin**: Still active with consumers in `apps/web`, `apps/server`, orchestration. Coordinated cut needed.
4. **`dist/` artifacts**: Stale build outputs will be cleaned on next `pnpm build`.
