# Task-B-0001 Report — Update agents-manager runtime to not reference @settings

## Status

**BLOCKED** — typecheck fails in a file outside `filesTouched` scope.

## 1. What you implemented

All four files in `filesTouched` were successfully modified:

1. **`packages/agents-manager/src/config/defaults.ts`** — Removed `DEFAULT_AGENTS_PATH` constant and the `serverEnv` import (which was only used for `SETTINGS_PATH`). The `DEFAULT_AGENTS` array and its `SystemAgent` type import remain untouched.

2. **`packages/agents-manager/src/index.ts`** — Removed:
   - Import and re-export of `DEFAULT_AGENTS_PATH`
   - `AgentsManagerFactoryOptions` interface (the `dbPath` option)
   - `dbPath` parameter from `createAgentsManager()` — it now takes no arguments
   - `agentsFilePath` option passed to `createRepositoryClient()`
   - Re-export of `RepositoryClientOptions` (no longer exists)

3. **`apps/server/src/runtime/app-runtime.ts`** — Removed the `dbPath: \`\${env.SETTINGS_PATH}/agents/agents.json\`` option from the `createAgentsManager()` call. The `env` import is retained because `env` is still used elsewhere in the file.

4. **`packages/agents-manager/src/repository/client.ts`** — Removed:
   - `RepositoryClientOptions` interface (had `agentsFilePath` and `pluginsFilePath` — both unused by `createDbRepository`)
   - `_options` parameter from `createRepositoryClient()` — it now takes no arguments

## 2. What you tested

Ran `npm run typecheck` across the entire workspace.

## 3. TDD Evidence

Not required by this task.

## 4. Files changed

| File | Change |
|------|--------|
| `packages/agents-manager/src/config/defaults.ts` | Modified — removed `DEFAULT_AGENTS_PATH` and `serverEnv` import |
| `packages/agents-manager/src/index.ts` | Modified — removed `DEFAULT_AGENTS_PATH`, `AgentsManagerFactoryOptions`, `RepositoryClientOptions` re-export; simplified `createAgentsManager` signature |
| `apps/server/src/runtime/app-runtime.ts` | Modified — removed `dbPath` from `createAgentsManager()` call |
| `packages/agents-manager/src/repository/client.ts` | Modified — removed `RepositoryClientOptions` interface and `_options` parameter |

## 5. Self-review findings

- All edits are strictly deletions or simplifications — no new functionality added (YAGNI).
- The `env` import in `app-runtime.ts` is still needed for `env.STORAGE_PATH`, `env.PORT`, `env.MODEL_PROXY_API_KEY`, etc.
- The `DEFAULT_AGENTS` constant is still exported and used elsewhere — only `DEFAULT_AGENTS_PATH` was removed.
- `createRepositoryClient` in `services/models-service/src/repository/client.ts` has its own `RepositoryClientOptions` type (from `repositories/models-repository`) — not affected.

## 6. Issues or concerns

**BLOCKER:** `npm run typecheck` fails with:

```
repositories/agents-repository/src/schemas/__tests__/validate-json-schema.test.ts:83:15
  error TS2339: Property 'SETTINGS_PATH' does not exist on type 'Readonly<{ ... }>'
```

This file (`repositories/agents-repository/src/schemas/__tests__/validate-json-schema.test.ts`) is **outside** my `filesTouched` list. It belongs to **Task-B-0002**, which is supposed to delete or update it. The error is a pre-existing breakage from **Task-A-0003** (which removed `SETTINGS_PATH` from the config schema in `packages/config/src/server.ts`).

My acceptance criteria require `npm run typecheck` to pass, but I cannot satisfy that without touching a file outside my authorized scope. The orchestrator should either:
- (a) Mark Task-B-0002 as a hard dependency and run it first, or
- (b) Authorize this task to delete the stale test file as part of B-0001.
