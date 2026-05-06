# Review Execution Plan — 34 Fixes from Comprehensive Code Review

## Context

Execute 34 reviewed fixes across security, correctness, duplication, tests, structure, performance. Source: `.sisyphus/review-completo.md`.

## Goals

- Hardened API (error handler, Zod validation, rate limiting, CORS, Helmet)
- Zero hardcoded credentials
- Unified types (AgentConfig, CategoryConfig, ConnectionState)
- Consolidated utilities (formatters, chart colors, badge classes, error query builder)
- 5 new test suites
- Structured logging (pino), ErrorBoundary, health endpoints, Swagger docs
- PG pool lifecycle, XSS sanitization, AbortController

## Tasks

### Wave 1 — Infrastructure & Quick Wins (11 tasks, parallel)

- [x] 1.1 Unify TypeScript to ^6.0.3 — shuttle-quick
  **Action**: Update `typescript` to `^6.0.3` in: `packages/analytics`, `packages/agents-manager`, `packages/alias-router`, `packages/server-core`, `packages/shared`, `packages/monitor`, `apps/server`.
  **Files**: `**/package.json` (7 files)
  **Verification**: `pnpm typecheck` passes, no TS 5.x versions remain.

- [x] 1.2 Unify Zod to v4 in shared — shuttle-deep
  **Action**: Update `packages/shared/package.json` to `zod@^4.0.0`, adapt v3→v4 API changes.
  **Files**: `packages/shared/package.json`, `packages/shared/src/`
  **Verification**: `pnpm --filter @litellm/shared typecheck` passes.

- [x] 1.3 Rename @litellm/shared → @lite-llm/shared — shuttle-deep
  **Action**: Change `name` in `packages/shared/package.json`, update ALL imports across monorepo.
  **Files**: `packages/shared/package.json`, all import sites found via `grep -r "@litellm/shared" packages/ apps/`
  **Verification**: `grep -r "@litellm/shared" packages/ apps/` returns zero, `pnpm typecheck` passes.

- [x] 1.4 Create .nvmrc + engines field — shuttle-quick
  **Action**: Create `.nvmrc` with `20`, add `"engines": { "node": ">=20" }` to root `package.json`.
  **Files**: `.nvmrc`, `package.json`
  **Verification**: `.nvmrc` has `20`, `jq '.engines.node' package.json` returns `">=20"`.

- [x] 1.5 Remove hardcoded credentials (S2) — shuttle-quick
  **Action**: Remove `apiKey: "sk-123456789"` from `packages/agents-manager/src/storage/file-storage.ts` line ~102 and `packages/agents-manager/src/generators/providers/index.ts` line ~66. Replace `DB_PASSWORD: z.string().default("dbpassword9090")` with `DB_PASSWORD: z.string().min(1, "DB_PASSWORD is required")` in `packages/config/src/server.ts` line ~15.
  **Files**: `packages/agents-manager/src/storage/file-storage.ts`, `packages/agents-manager/src/generators/providers/index.ts`, `packages/config/src/server.ts`
  **Verification**: `grep -r "sk-123456789\|dbpassword9090" packages/ apps/` returns zero.

- [x] 1.6 Remove empty default from LITELLM_API_KEY (N3) — shuttle-quick
  **Action**: Change `LITELLM_API_KEY: z.string().default("")` to have no empty default.
  **Files**: `packages/config/src/server.ts`
  **Verification**: `grep "LITELLM_API_KEY" packages/config/src/server.ts` shows no `.default("")`.

- [x] 1.7 Add max limit to parseDays() (C3) — shuttle-quick
  **Action**: Add `Math.min(parsed, 365)` cap in `packages/server-core/src/orchestration/lite-llm-params.ts`.
  **Files**: `packages/server-core/src/orchestration/lite-llm-params.ts`
  **Verification**: `parseDays("999999", 30)` returns 365.

- [x] 1.8 Add .limit() to getStuckRequests() (P2) — shuttle-quick
  **Action**: Add `.limit(1000)` to the Drizzle query in `packages/analytics/src/queries/monitor-queries.ts`.
  **Files**: `packages/analytics/src/queries/monitor-queries.ts`
  **Verification**: Query includes `.limit(1000)`.

- [x] 1.9 Fix WebSocket setTimeout leak (P4) — shuttle-quick
  **Action**: Store heartbeat timer per connection, call `clearTimeout` on disconnect in `apps/server/src/ws/websocket-server.ts`.
  **Files**: `apps/server/src/ws/websocket-server.ts`
  **Verification**: `clearTimeout` visible in disconnect path.

- [x] 1.10 Close PG pool on graceful shutdown (N4) — shuttle-quick
  **Action**: Export `closePool()` from `packages/analytics/src/queries/client.ts`, call in `apps/server/src/runtime/app-runtime.ts` `stop()` before `process.exit()`.
  **Files**: `packages/analytics/src/queries/client.ts`, `apps/server/src/runtime/app-runtime.ts`
  **Verification**: `closePool` exported and called on shutdown.

- [x] 1.11 Add retry + connectionTimeout to PG pool (N7) — shuttle-quick
  **Action**: Add `connectionTimeoutMillis: 5000` and retry logic (3 attempts, 1s/2s/4s backoff) in `packages/analytics/src/queries/client.ts`.
  **Files**: `packages/analytics/src/queries/client.ts`
  **Verification**: `connectionTimeoutMillis: 5000` in pool config, retry logic present.

### Wave 2 — Type Unification & Consolidation (13 tasks, parallel)

- [x] 2.1 Unify AgentConfig/CategoryConfig types (D1) — shuttle-deep
  **Action**: Import from `@lite-llm/shared` instead of local definitions in `packages/agents-manager/src/`.
  **Files**: `packages/agents-manager/src/`, `packages/agents-manager/package.json`
  **Verification**: No local AgentConfig/CategoryConfig in agents-manager, `pnpm typecheck` passes.

- [x] 2.2 Unify ConnectionState type (D8) — shuttle-quick
  **Action**: Move to `apps/web/src/types/connection.ts`, update imports in `pages/monitor/monitor-types.ts` and `pages/health-status/health-status-types.ts`.
  **Files**: `apps/web/src/types/connection.ts`, 2 consumer files
  **Verification**: Both files import ConnectionState, no local definition.

- [x] 2.3 Consolidate formatters into lib/format.ts (D4) — shuttle-deep
  **Action**: Make `apps/web/src/lib/format.ts` the single source for `formatDuration`, `formatDate`, `formatPercent`, `maskApiKey`, `formatRelativeTime`. Remove duplicates from `dashboard-utils.ts`, `model-stats-utils.ts`, `model-detail-utils.ts`.
  **Files**: `apps/web/src/lib/format.ts`, 3 duplicate files
  **Verification**: No formatter exports in pages/ directories.

- [x] 2.4 Import badge classes from errors-utils.ts (D5) — shuttle-quick
  **Action**: Replace inline `getStatusBadgeClass`/`getErrorTypeBadgeClass` in `error-detail-dialog.tsx` and `errors-table-cell.tsx` with imports.
  **Files**: 2 component files
  **Verification**: Both files import, no local definitions.

- [x] 2.5 Unify chart colors (D6) — shuttle-quick
  **Action**: Import `MODEL_STATS_CHART_COLORS`, `LATENCY_CHART_COLORS`, etc. from `apps/web/src/lib/chart-colors.ts` in `model-stats-chart-utils.ts`.
  **Files**: `apps/web/src/pages/model-stats/model-stats-chart-utils.ts`
  **Verification**: Imports from `lib/chart-colors.ts`, no local color constants.

- [x] 2.6 Extract shared error query builder (D7) — shuttle-deep
  **Action**: Extract 13-column COALESCE SELECT into shared `buildErrorSelectQuery()` in `packages/analytics/src/queries/`.
  **Files**: `error-queries.ts`, `monitor-queries.ts`
  **Verification**: Both files import shared function, deduplicated.

- [x] 2.7 Remove dead code (L1) — shuttle-quick
  **Action**: Remove 7 items: `usePageFilters`, `modelMerges`, `getCredentialByName`, `getModelByName`, `ModelQueryParams`, `FilterOptions`, `GitMaster`.
  **Files**: `apps/web/src/hooks/use-page-filters.ts`, `packages/analytics/src/queries/model-queries.ts`, `packages/analytics/src/queries/key-queries.ts`, `packages/analytics/src/types/index.ts`, `packages/shared/src/types/agent-config.ts`
  **Verification**: `pnpm typecheck` and `pnpm build` pass.

- [x] 2.8 Use or remove unused agent-config types (M5) — shuttle-quick
  **Action**: Check `GlobalFallbackBody`, `AgentConfigItemBody`, `BulkConfigBody`, `RouteRegistrar` usage, update or remove.
  **Files**: `packages/server-core/src/routes/agent-config/types.ts`, `packages/server-core/src/routes/agent-config/item-routes.ts`
  **Verification**: Types used by handlers or removed, `pnpm typecheck` passes.

- [x] 2.9 Replace dynamic imports with static (M8) — shuttle-quick
  **Action**: Replace 6 `await import()` calls in `packages/server-core/src/routes/agent-config/item-routes.ts` with top-level static imports.
  **Files**: `packages/server-core/src/routes/agent-config/item-routes.ts`
  **Verification**: No `await import()` in file.

- [x] 2.10 Sync AGENT_KEYS with AGENT_DEFINITIONS (M9) — shuttle-quick
  **Action**: Add "build", "plan", "OpenCode-Builder" to `AGENT_KEYS` in `packages/alias-router/src/constants/`.
  **Files**: `packages/alias-router/src/constants/`
  **Verification**: AGENT_KEYS has 14 entries.

- [x] 2.11 Reduce getSpendLogs max limit (P1) — shuttle-quick
  **Action**: Change `limit=0` fallback from 100000 to 1000 in `packages/analytics/src/queries/spend-queries.ts`.
  **Files**: `packages/analytics/src/queries/spend-queries.ts`
  **Verification**: Effective limit is 1000, not 100000.

- [x] 2.12 Optimize getLatestHealthChecks with DISTINCT ON (P3) — shuttle-quick
  **Action**: Replace JS filtering with SQL `DISTINCT ON` in `packages/monitor/src/db/monitor-queries.ts`.
  **Files**: `packages/monitor/src/db/monitor-queries.ts`
  **Verification**: No `.all()` + JS filter pattern.

- [x] 2.13 Validate type query param on DELETE agent-config (S3) — shuttle-quick
  **Action**: Return 400 if `type` not "agent" or "category" in `packages/server-core/src/routes/agent-config/item-routes.ts`.
  **Files**: `packages/server-core/src/routes/agent-config/item-routes.ts`
  **Verification**: Invalid type returns 400.

### Wave 3 — Core Server + Frontend Hardening (17 tasks)

- [x] 3.1 Add global Express error handler (C1) — shuttle-deep
  **Action**: Add error middleware in `apps/server/src/runtime/api-server.ts`, remove 52 generic try/catch from routes.
  **Files**: `apps/server/src/runtime/api-server.ts`, `packages/server-core/src/routes/`
  **Verification**: Global handler exists, generic catches removed.
  **Blocks**: 3.2

- [x] 3.2 Add Zod validation to all API routes (C2) — shuttle-deep
  **Action**: Create Zod schemas for query/body, replace 79 `as` casts with validated values.
  **Files**: `packages/server-core/src/routes/`
  **Verification**: No `as string/number` on params, invalid inputs return 400.
  **Blocked By**: 3.1

- [x] 3.3 Add db.transaction() to destructive ops (C4) — shuttle-quick
  **Action**: Wrap `mergeModels()`, `deleteModel()`, `deleteModelLogs()` in `db.transaction()` in `packages/analytics/src/queries/model-queries.ts`.
  **Files**: `packages/analytics/src/queries/model-queries.ts`
  **Verification**: 3 transaction calls exist.

- [x] 3.4 Replace silent catches in MonitorService (C5) — shuttle-quick
  **Action**: Log errors instead of silently returning `[]`/`null` in `packages/monitor/src/services/monitor-service.ts`.
  **Files**: `packages/monitor/src/services/monitor-service.ts`
  **Verification**: Catch blocks contain error logging.

- [x] 3.5 Add pino structured logger + middleware (N6) — shuttle-deep
  **Action**: Install pino/pino-http, create shared logger, replace `console.log`, add pino-http middleware.
  **Files**: `apps/server/`, `packages/server-core/`, `packages/monitor/`, `package.json`
  **Verification**: Logger outputs JSON, middleware active.

- [x] 3.6 Extract shared useAliasDialogState hook (D2) — shuttle-deep
  **Action**: Create shared hook in `apps/web/src/hooks/`, replace 3 duplicates in `models/`, `agent-routing/`, `aliases.tsx`.
  **Files**: `apps/web/src/hooks/`, 3 consumer files
  **Verification**: Shared hook exists, 3 files import from it.

- [x] 3.7 Remove parallel model-stats dialog system (D3) — shuttle-quick
  **Action**: Delete `dialog-state.ts` and `dialog-handlers.ts`, remove inline derivations from `model-stats.tsx`.
  **Files**: `apps/web/src/pages/model-stats/`
  **Verification**: Both files deleted, logic through composed hooks.

- [x] 3.8 Extract health-status sub-components (M1) — shuttle-quick
  **Action**: Extract 3 sub-components from `health-status.tsx` (601 lines → <400 lines).
  **Files**: `apps/web/src/pages/health-status.tsx`, `apps/web/src/components/health-status/`
  **Verification**: 3 new files, health-status.tsx under 400 lines.

- [x] 3.9 Extract ModelDetailDialog from alert-history-table (M2) — shuttle-quick
  **Action**: Extract inline 122-line dialog from `alert-history-table.tsx` into `model-detail-dialog.tsx`.
  **Files**: `apps/web/src/components/monitor/`
  **Verification**: Dialog extracted, imports work.

- [x] 3.10 Split health-check-service.ts into modules (M3) — shuttle-deep
  **Action**: Split 769-line file into `sse-parser.ts`, `http-client.ts`, `token-calculator.ts`, `model-workarounds.ts`.
  **Files**: `packages/monitor/src/services/`
  **Verification**: 4 new modules, orchestrator under 300 lines.

- [x] 3.11 Consolidate 16 useMemo in model-stats (M4) — shuttle-quick
  **Action**: Combine 16 useMemo into 1-2 using single `reduce()` pass.
  **Files**: `apps/web/src/pages/model-stats/use-model-stats-derived.ts`
  **Verification**: 1-2 useMemo, all aggregates still returned.

- [x] 3.12 Extract requireModelParam middleware (M6) — shuttle-quick
  **Action**: Create middleware, replace 13 duplicate "model is required" blocks in `analytics-routes.ts`.
  **Files**: `packages/server-core/src/routes/`
  **Verification**: 0 inline "model is required" checks.

- [x] 3.13 Remove duplicate DELETE /models/logs route (M7) — shuttle-quick
  **Action**: Keep one DELETE route (prefer `:model` path param), remove the other.
  **Files**: `packages/server-core/src/routes/model-routes.ts`
  **Verification**: Exactly 1 DELETE /models/logs route.

- [x] 3.14 Add XSS sanitization for DB-sourced data (N2) — shuttle-deep
  **Action**: Install dompurify, create `lib/sanitize.ts`, apply to API-sourced strings in components.
  **Files**: `apps/web/src/lib/sanitize.ts`, component files, `apps/web/package.json`
  **Verification**: Sanitize utility exists, used on DB data.

- [x] 3.15 Create React ErrorBoundary wrapper (N5) — shuttle-quick
  **Action**: Create ErrorBoundary class component, wrap root/pages in `App.tsx`.
  **Files**: `apps/web/src/components/error-boundary.tsx`, `apps/web/src/App.tsx`
  **Verification**: ErrorBoundary exists, wrapped in App.tsx.

- [x] 3.16 Create GET /health and GET /ready endpoints (N9) — shuttle-quick
  **Action**: Add liveness probe and readiness probe in `apps/server/src/runtime/api-server.ts`.
  **Files**: `apps/server/src/runtime/api-server.ts`
  **Verification**: /health returns 200, /ready returns 200/503 based on DB.

- [x] 3.17 Add AbortController to fetch hooks (N16) — shuttle-quick
  **Action**: Add AbortController cleanup to 5 hooks: `use-dashboard-data`, `use-model-detail-data`, `use-logs`, `use-errors`, `use-monitor-websocket`.
  **Files**: `apps/web/src/hooks/`
  **Verification**: All 5 hooks use AbortController with cleanup.

### Wave 4 — Tests, Docs & Standardization (11 tasks, parallel)

- [x] 4.1 Create tests for @lite-llm/analytics (T1) — shuttle-deep
  **Action**: Test query functions and DatabaseDataSource methods with mocked pool.
  **Files**: `packages/analytics/src/__tests__/`
  **Verification**: `pnpm --filter @lite-llm/analytics test` passes.

- [x] 4.2 Create tests for @lite-llm/server-core/routes (T2) — shuttle-deep
  **Action**: Test route handlers with supertest + Express app factory.
  **Files**: `packages/server-core/src/__tests__/`
  **Verification**: `pnpm --filter @lite-llm/server-core test` passes.

- [x] 4.3 Create tests for @lite-llm/monitor (T3) — shuttle-deep
  **Action**: Test 4 detectors, MonitorService tick, SQLite queries.
  **Files**: `packages/monitor/src/__tests__/`
  **Verification**: `pnpm --filter @lite-llm/monitor test` passes.

- [x] 4.4 Create tests for @lite-llm/shared (T4) — shuttle-quick
  **Action**: Test Zod schemas with valid/invalid inputs.
  **Files**: `packages/shared/src/__tests__/`
  **Verification**: `pnpm --filter @lite-llm/shared test` passes.

- [x] 4.5 Create tests for @lite-llm/api-contracts (T5) — shuttle-quick
  **Action**: Test type exports and constants.
  **Files**: `packages/api-contracts/src/__tests__/`
  **Verification**: `pnpm --filter @lite-llm/api-contracts test` passes.

- [x] 4.6 Create tests for uncovered hooks (T6) — shuttle-deep
  **Action**: Test 5 hooks with React Query mocks.
  **Files**: `apps/web/src/hooks/__tests__/`
  **Verification**: `pnpm --filter web test` passes for hooks.

- [x] 4.7 Fix conditional assertions in agent-routing.test.tsx (T7) — shuttle-quick
  **Action**: Replace `if (length > 0)` patterns with unconditional `expect()`.
  **Files**: `apps/web/src/pages/__tests__/agent-routing.test.tsx`
  **Verification**: No conditional assertions remain.

- [x] 4.8 Extract shared getServer() helper (T8) — shuttle-quick
  **Action**: Extract to `helpers/create-test-server.ts`, update 4 test files.
  **Files**: `apps/server/src/__tests__/`
  **Verification**: Helper exists, 4 files import from it.

- [x] 4.9 Remove duplicate sortAliasesByDefinitionOrder test (T9) — shuttle-quick
  **Action**: Remove from `alias-generator.test.ts`, keep in alias-router `__tests__/`.
  **Files**: `apps/server/src/__tests__/alias-generator.test.ts`
  **Verification**: No reference to sortAliasesByDefinitionOrder.

- [x] 4.10 Standardize test organization (L2) — shuttle-quick
  **Action**: Choose `__tests__/` directories, migrate `.test.ts` files.
  **Files**: All test files
  **Verification**: `pnpm test` passes with consistent org.

- [x] 4.11 Add OpenAPI/Swagger documentation (N12) — shuttle-deep
  **Action**: Install swagger-jsdoc + swagger-ui-express, annotate routes, serve at /api-docs.
  **Files**: `packages/server-core/src/routes/`, `apps/server/src/runtime/api-server.ts`
  **Verification**: /api-docs returns 200.

## Dependencies

- 3.1 (C1 error handler) → 3.2 (C2 Zod validation)
- 1.3 (L5 rename shared) → 2.1 (D1 type unification)

## Verification

1. `pnpm typecheck` passes
2. `pnpm build` succeeds
3. `pnpm test` passes all suites
4. `grep -r "sk-123456789\|dbpassword9090" packages/ apps/` returns zero
5. Final verification wave: 4 parallel review agents (compliance, code quality, QA, scope) APPROVE
