# Learnings: Providers Reorganization

## Task 5: Fase 5 — Clareza Semântica

- **Discrepancy**: Plan said "rename ambiguous `db` variables" but didn't specify exact scope. Exploration revealed 67 usage sites across 10 analytics query files + 2 consumer files.
- **Resolution**: Used `replaceAll` approach — renamed `db` → `litellmDb` at the source (`litellm-repository/src/client.ts`) and propagated through the entire chain. Monitor detector's local `db` renamed to `alertDb` (different database).
- **Suggestion**: When planning variable renames, include a scope estimate (number of files/usage sites) to avoid underestimation.

## Task 5d: Stale Documentation

- **Discrepancy**: Plan didn't mention `.sisyphus/review-completo.md` as having stale references. Found 4 files total with old package names.
- **Resolution**: Updated all 4 files. Left historical `settings.json` and `monitor.db` references in plan docs (they describe migration history, not stale code).
- **Suggestion**: After package renames, always search ALL `.md` files (not just `.specs/`) for stale references.

## Task 6: Fase 6 — Server Contexts

- **Discrepancy**: Spec suggested 4 contexts (env, agents, analytics, monitor) but env and agents don't need facades — `env.ts` is already a 2-line re-export and `agents-manager` is initialized once in `app-runtime.ts` with no shared state.
- **Resolution**: Created only 2 meaningful contexts: `AnalyticsProvider` (wraps `createDataSource()` + readiness check) and `MonitorProvider` (wraps `getMonitorDb()` singleton). The `AppContext` composition root holds both.
- **Deviation**: Used `MonitorDb` type from `@lite-llm/monitor` instead of `AppDb` from `@lite-llm/app-repository` because the server package doesn't directly depend on `app-repository`. Both types are identical (alias).
- **Deviation**: New context files don't use `.js` extensions in relative imports because the server tsconfig has `rewriteRelativeImportExtensions: true` and no existing file uses them.
- **Suggestion**: When planning context/provider patterns, first verify which services actually need shared state or centralized initialization. Don't create facades for services that are already singletons or pure re-exports.
