# @LITE-LLM/MONITOR/SRC

**Generated:** 2026-07-01
**Commit:** 3029bcb

## OVERVIEW

`@lite-llm/monitor` — model health monitoring with SQLite storage, anomaly detection, and WebSocket broadcast. Note: this package is mostly **stubs** — the real detection logic lives in `services/health-check-service.ts` (1046 lines, called from `apps/server/src/application/health-check-application-service.ts`). The `db/` directory contains schema/queries placeholders.

## STRUCTURE

```
packages/monitor/src/
├── index.ts                 # Public barrel
├── db/
│   ├── monitor-client.ts    # better-sqlite3 client init (stub)
│   ├── monitor-queries.ts   # Alert CRUD queries (stub)
│   └── monitor-schema.ts    # SQLite DDL (stub — single alerts table)
├── services/
│   ├── monitor-service.ts   # Periodic tick orchestrator (legacy)
│   ├── health-check-service.ts # REAL logic — 1046 lines, model health + anomaly detection
│   ├── monitor-types.ts     # Alert, DetectorInput, DetectorResult types
│   └── detectors/
│       ├── index.ts                       # runAllDetectors()
│       ├── error-spike-detector.ts        # Sudden error rate increases
│       ├── model-offline-detector.ts      # Zero-throughput models
│       ├── non-success-spike-detector.ts   # 4xx/5xx spike detection
│       ├── silent-failure-detector.ts     # Models returning errors silently
│       └── timeout-stuck-detector.ts      # Requests stuck in pending
└── __tests__/               # Detector unit tests
```

## WHERE TO LOOK

| Task                              | Location                                                | Notes                                       |
| --------------------------------- | ------------------------------------------------------- | ------------------------------------------- |
| Add a new detector                | `services/detectors/<name>-detector.ts`                 | Pure fn `(input: DetectorInput) => DetectorResult[]`; register in `detectors/index.ts` |
| Modify the run loop               | `services/health-check-service.ts`                      | **Real logic lives here** (not `monitor-service.ts`) |
| Add an alert query                | `db/monitor-queries.ts`                                 | **Currently stub** — extend carefully         |
| Change SQLite schema              | `db/monitor-schema.ts`                                  | Stub — needs migration if extended           |

## CONVENTIONS

- **Detector pattern**: pure function `(input: DetectorInput) => DetectorResult[]`. No side effects, no I/O — input contains all data needed
- **Health-check service is canonical**: `services/health-check-service.ts` is the source of truth for health logic; `monitor-service.ts` is legacy
- **Better-sqlite3 is synchronous**: no async/await for DB ops
- **Errors via `console.error`**: no structured logger (known gap; tracked separately)
- **Test framework**: Vitest ^2.1.8 (pinned — workspace is otherwise on ^4.1.5; do not upgrade without verifying)

## ANTI-PATTERNS (THIS PROJECT)

- Do not call `model_proxy_*` PostgreSQL directly — go through `services/analytics-service`
- Do not add async DB operations — `better-sqlite3` is synchronous
- Do not import from `apps/server/` — this package is standalone
- Do not upgrade Vitest to ^4.1.5 without verifying detector test compatibility (breaking changes in v3/v4)
- Do not put health logic in `monitor-service.ts` — extend `health-check-service.ts` instead