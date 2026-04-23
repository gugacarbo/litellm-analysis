# Learnings

## Task 0: Vitest Infrastructure Setup

- **vitest 4.1.5** installed across all packages (root, server, web)
- **pnpm -w** flag needed for root workspace installs (otherwise ERR_PNPM_ADDING_TO_ROOT)
- **jsdom** installed only in web filter for browser environment; server uses `environment: "node"`
- Web vitest config needs `resolve.alias` for `@/*` path alias matching tsconfig.app.json paths
- Web vitest config uses `globals: true` to allow `describe`/`it`/`expect` without imports (though tests import explicitly)
- Turbo test task configured with `dependsOn: ["^build"]` and `inputs: ["$TURBO_DEFAULT$", "vitest.config.ts"]`
- Root vitest.config.ts has `passWithNoTests: true` since root has no tests itself
