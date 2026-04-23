# Learnings

## Task 0: Vitest Infrastructure Setup

- **vitest 4.1.5** installed across all packages (root, server, web)
- **pnpm -w** flag needed for root workspace installs (otherwise ERR_PNPM_ADDING_TO_ROOT)
- **jsdom** installed only in web filter for browser environment; server uses `environment: "node"`
- Web vitest config needs `resolve.alias` for `@/*` path alias matching tsconfig.app.json paths
- Web vitest config uses `globals: true` to allow `describe`/`it`/`expect` without imports (though tests import explicitly)
- Turbo test task configured with `dependsOn: ["^build"]` and `inputs: ["$TURBO_DEFAULT$", "vitest.config.ts"]`
- Root vitest.config.ts has `passWithNoTests: true` since root has no tests itself

## Task 3: LIMITED_CAPABILITIES + /mode endpoint

### Key Decisions
- LIMITED_CAPABILITIES: all 19 read caps = true, 5 write caps: createModel=false, updateModel=true, deleteModel=false, mergeModels=false, deleteModelLogs=false
- DatabaseDataSource constructor now accepts optional `capabilities` param (defaults to DATABASE_CAPABILITIES)
- /mode endpoint detection: errorLogs && createModel → database; errorLogs && !createModel → limited; !errorLogs → api-only
- createDataSource() handles 'limited' case by passing LIMITED_CAPABILITIES to DatabaseDataSource constructor

### Files Modified
- apps/server/src/data-source/database.ts: Added LIMITED_CAPABILITIES export, made constructor accept capabilities param
- apps/server/src/data-source/index.ts: Added 'limited' case in switch, exported LIMITED_CAPABILITIES
- apps/server/src/api-server.ts: Updated /mode endpoint to detect 'limited' mode

### LSP: All 3 files clean, zero errors
