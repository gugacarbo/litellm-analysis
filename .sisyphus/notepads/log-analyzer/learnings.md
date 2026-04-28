## 2026-04-28 Session Start
- T1 subagent used wrong library (sql.js instead of better-sqlite3 + Drizzle ORM)
- T1 subagent caused massive scope creep (35+ files modified/deleted outside scope)
- Reverted all scope creep, keeping only packages/monitor/ skeleton
- T1 needs full rewrite: better-sqlite3 + drizzle-orm/sqlite-core
- Drizzle ORM ^0.38.0 already in monorepo (via @lite-llm/analytics)
- pnpm-workspace.yaml already uses `packages/*` glob — no modification needed
- Root tsconfig targets ES2025, packages target ES2022
- Analytics package uses pg-core; monitor must use sqlite-core
- No vitest in analytics devDeps (unlike plan assumption) — monitor should include it

## T2: Incremental Analytics Queries (2026-04-28)
- Added 4 query functions to error-queries.ts: getErrorsSince, getErrorCountByModelSince, getModelHealthSince, getStuckRequests
- Added 3 new types: ModelErrorCount, ModelHealthStats, StuckRequest
- Added 4 new methods to AnalyticsDataSource interface
- Added 4 impl functions to error-methods.ts following existing getErrorLogsImpl pattern
- Registered 4 new methods in database.ts class
- Barrel export in queries/index.ts updated
- `@lite-llm/analytics` typecheck passes clean
- **Downstream impact**: 3 test files in apps/server/src/__tests__/ use mock data sources that implement AnalyticsDataSource — they now fail because they're missing the 4 new methods. A follow-up task must add the mock methods to:
  - agent-config-alias-resolution.test.ts
  - agent-config-delete.test.ts
  - agent-routing.test.ts
- PERCENTILE_CONT pattern for p95: `sql\`PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (endTime - startTime)) * 1000)\``
- Error condition consistently uses: `LOWER(COALESCE(${spendLogs.status}, '')) != 'success'`
- Success condition: `LOWER(COALESCE(${spendLogs.status}, '')) = 'success'`
- Stuck request = endTime IS NULL + startTime older than 5 minutes + startTime >= since window
- getModelHealthSince returns a single object (not array) — uses rows[0] with fallback
- `_baselineHours` param is accepted but unused (reserved for future baseline comparison)

## WebSocket Server Setup (T4)

### Key Patterns Discovered
- Server uses `.js` extensions in imports (e.g., `./api-server.js`)
- `app.listen(port)` returns an `http.Server` that can be captured
- Use `noServer: true` with manual upgrade handling for WebSocket integration
- Capture `this.wss` in local variable inside event handlers to avoid non-null assertion issues
- Use `import type` for type-only imports (enforced by Biome)

### Dependencies
- `ws` in dependencies
- `@types/ws` in devDependencies

### File Structure
- `apps/server/src/ws/websocket-server.ts` — MonitorWebSocketServer class
- `apps/server/src/index.ts` — Updated with WebSocket server integration

### Graceful Shutdown
- WebSocket server stops first, then HTTP server closes
- Both SIGTERM and SIGINT handled

## T6: Background Monitor Service + Types (2026-04-28)

### Key Decisions
- Used `Set<Function>` callback pattern instead of EventEmitter to avoid TypeScript generic typing issues
- `MonitorServiceOptions` interface duplicated in both `monitor-types.ts` (with inline `import()`) and `monitor-service.ts` (with proper type import) — the one in `monitor-service.ts` is the canonical one exported
- `void` expressions used to suppress unused-variable warnings for data that will be consumed by T7 detectors
- `insertAlert` is synchronous (better-sqlite3) so `persistAlert` wraps it in async without `await`
- `countAlertsSinceForCooldown` accepts `anomalyType` and `model` params that are voided — T7 will add filtering by these

### Patterns
- Sync `start()`/`stop()` with async `tick()` via `void this.tick()` 
- Event handler registration returns unsubscribe function (cleanup pattern)
- All handler invocations wrapped in try/catch to prevent handler errors from crashing the service
- Health status thresholds: >50% error rate = offline, >10% = degraded, else healthy

## Anomaly Detectors Implementation (T7)

### Created Files
- `packages/monitor/src/services/detectors/model-offline-detector.ts` - Detects when a model had requests but 0 successes and ≥1 failure
- `packages/monitor/src/services/detectors/error-spike-detector.ts` - Detects when error rate > 3x baseline with ≥10 errors
- `packages/monitor/src/services/detectors/timeout-stuck-detector.ts` - Detects stuck requests and high latency (p95 > 3x avg)
- `packages/monitor/src/services/detectors/silent-failure-detector.ts` - Detects unknown error types (>3 per model)
- `packages/monitor/src/services/detectors/index.ts` - Exports runAllDetectors function

### Updated Files
- `packages/monitor/src/services/monitor-service.ts` - Added runAllDetectors call in tick() method
- `packages/monitor/src/index.ts` - Added runAllDetectors export

### Key Patterns
- Each detector takes `DetectorInput` and a `cooldownChecker` function
- Detectors are wrapped in try/catch in monitor-service to prevent crashes
- Cooldown is checked per-detector via countAlertsSince
- All detectors use simple thresholds (no ML/statistical detection)

### Gotchas
- `apply_patch` tool can fail silently with empty files - always verify after creation
- `countAlertsSince` from monitor-queries is SYNCHRONOUS (better-sqlite3)
- Monitor service methods are async
- Use `void` to suppress unused variable warnings for intentionally unused params

### Cooldown Times
- model_offline: 600s (10 min)
- error_spike: 300s (5 min)
- timeout_stuck: 600s (10 min)
- silent_failure: 300s (5 min)

## T10: WebSocket Client Hook + Reconnection (2026-04-28)

### Created Files
- `apps/web/src/pages/monitor/monitor-types.ts` - Frontend types mirroring server WebSocket protocol
- `apps/web/src/lib/api-client/ws-client.ts` - Native WebSocket wrapper with exponential backoff
- `apps/web/src/hooks/use-monitor-websocket.ts` - React hook wrapping WsClient

### Key Patterns Learned
1. **Native WebSocket** - No third-party library needed; uses `WsClient` class with event handlers
2. **Exponential backoff** - `delay = Math.min(1000 * 2 ** reconnectAttempts, 30_000)` capped at 30s
3. **Handler cleanup** - `onStatusChange`/`onMessage` return unsubscribe functions using Set.delete()
4. **Ref for alerts** - `alertsRef` avoids stale closures in message handler; `MAX_ALERTS_BUFFER = 50` bounds memory
5. **REST fallback** - On WS connect, fetch initial alerts via REST for immediate data
6. **Dual onStatusChange** - Register two handlers: one for state updates, one for REST fetch on connect

### API Changes
- Added `getActiveAlerts` alias in `monitor.ts` pointing to `getActiveAlertsApi`

### Verification
- `pnpm --filter web typecheck` passes
- `pnpm --filter web lint` passes (218 files)
