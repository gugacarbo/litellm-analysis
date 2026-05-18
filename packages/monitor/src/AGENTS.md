# packages/monitor/src/

## OVERVIEW
Model health monitoring with SQLite storage and anomaly detection. Runs as a background service with periodic ticks, detectors, and WebSocket broadcast. Uses `better-sqlite3` for its own SQLite DB (separate from LiteLLM PostgreSQL).

## STRUCTURE

```
monitor/src/
├── db/
│   ├── monitor-client.ts    # SQLite client init
│   ├── monitor-queries.ts   # Alert CRUD queries
│   └── monitor-schema.ts    # SQLite schema (alerts, alertRules tables)
├── services/
│   ├── detectors/
│   │   ├── error-spike-detector.ts         # Sudden error rate increases
│   │   ├── model-offline-detector.ts       # Zero throughput models
│   │   ├── non-success-spike-detector.ts   # Non-success status code spike detection
│   │   ├── silent-failure-detector.ts      # Models returning errors silently
│   │   ├── timeout-stuck-detector.ts       # Requests stuck in pending
│   │   └── index.ts                        # runAllDetectors() orchestration
│   ├── monitor-service.ts   # MonitorService class (periodic tick + WS broadcast)
│   └── monitor-types.ts     # Alert types, MonitorServiceOptions
└── index.ts                 # Barrel: 15+ named exports
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Add new detector | `services/detectors/` | Implement `DetectorInput → DetectorResult` function |
| Modify tick interval | `services/monitor-service.ts` | `MonitorServiceOptions` constructor param |
| Add alert query | `db/monitor-queries.ts` | `better-sqlite3` synchronous API |
| Change alert schema | `db/monitor-schema.ts` | SQLite DDL (requires migration logic) |

## CONVENTIONS

- **SQLite via `better-sqlite3`** — synchronous API (no async/await for DB ops)
- **Detector pattern** — each detector is a pure function: `(input: DetectorInput) => DetectorResult[]`
- **Errors logged via `console.error`** — no structured logger (known anti-pattern, use as-is)
- **Service lifecycle** — `MonitorService.start()` / `stop()` with WebSocket broadcast on each tick
- **No vitest tests** — no test files exist yet (vitest ^2.1.8 in devDeps)

## ANTI-PATTERNS

- Don't call LiteLLM PostgreSQL directly — use `@lite-llm/queries` data source
- Don't add async DB operations — `better-sqlite3` is synchronous
- Don't import from `apps/server/` — this package is standalone
- Don't upgrade vitest to ^4.1.5 without verifying test compatibility (breaking changes in v3/v4)
