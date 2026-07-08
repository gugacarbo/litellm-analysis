# Task-F-0009: Close docs alignment and final verification hooks

## What changed and why

### `docs/context/CONVENTIONS.md` (lines 62-63)

- **Before:** "API aceita `litellmParams` via shim, normaliza para `modelRoute`" and "`litellmParams` é alias deprecado"
- **After:** "API rejeita `litellmParams` com erro 4xx — hard cut, sem shim" and "`litellmParams` é rejeitado com 4xx"
- Reflects the hard cut: legacy payloads are no longer accepted or aliased.

### `docs/specs/0009-model-route-hard-cut-spec.md`

- **Status:** `draft` → `implemented`
- **implemented-by:** Added 8 key source file paths from the implementation commits
- **Verificação:** Filled in with verification evidence per layer (contracts, server, web, llm-config) and the final commit hash (`35ec65b`)

### Regenerated indexes

- `docs/index.json` and `docs/specs/README.md` regenerated via `scripts/docs-check --emit-index` (0 errors, 0 warnings)

## Verification results

| Check                             | Result                                                                          |
| --------------------------------- | ------------------------------------------------------------------------------- |
| `scripts/docs-check --emit-index` | ✅ 0 errors, 0 warnings                                                         |
| `pnpm typecheck`                  | ⚠️ Pre-existing failures in `@lite-llm/llm-gateway` (unrelated to hard cut)     |
| `pnpm test`                       | ⚠️ Pre-existing failure in `@lite-llm/llm-gateway#test` (unrelated to hard cut) |

The `@lite-llm/llm-gateway` typecheck and test failures are pre-existing issues (missing `id` field in inserts, missing `modelsService` property, `createDatabaseMock` not found) — none of these are related to the 0009-model-route-hard-cut work.

## Concerns

None. The docs now accurately reflect the hard cut state. The pre-existing `llm-gateway` failures are unrelated and should be tracked separately.
