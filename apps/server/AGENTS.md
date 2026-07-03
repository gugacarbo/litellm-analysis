# APPS/SERVER KNOWLEDGE BASE

**Generated:** 2026-07-01
**Commit:** 3029bcb

## OVERVIEW

Express.js HTTP/WebSocket server for the analytics dashboard. Bootstraps the runtime, wires `packages/server` shared routes, instantiates monitor/health/benchmark-sync runtimes, and exposes the dashboard API on port 3008 (configurable via `SERVER_PORT`).

## STRUCTURE

```
apps/server/
├── src/
│   ├── runtime/        # Express app factory, server bootstrap, monitor runtime
│   ├── application/    # Business services (monitor, health-check, benchmark sync)
│   ├── routes/         # App-specific Express routes (health-check, monitor, benchmark sync)
│   ├── ws/             # WebSocket server for live data
│   ├── contexts/       # Dependency-injection contexts (analytics, monitor)
│   ├── __tests__/      # Integration tests
│   └── env.ts          # Server-side environment config re-export
├── package.json
└── tsconfig.json
```

## WHERE TO LOOK

| Task                              | Location                                  | Notes                                                |
| --------------------------------- | ----------------------------------------- | ---------------------------------------------------- |
| Add a runtime lifecycle step      | `src/runtime/app-runtime.ts`              | Boot order: contexts → runtimes → app listen         |
| Add a monitor business service    | `src/application/monitor-application-service.ts` | Pure functions; no Express imports                  |
| Add a health-check endpoint       | `src/routes/health-check-routes.ts`       | Thin Express adapter over `health-check-application-service.ts` |
| Add a benchmark sync endpoint     | `src/routes/benchmark-sync-routes.ts`     | Thin Express adapter over `benchmark-sync-application-service.ts` |
| Add a monitor endpoint            | `src/routes/monitor-routes.ts`            | Adapter over `monitor-application-service.ts`        |
| Add WebSocket channel             | `src/ws/websocket-server.ts`              | Single `WebSocketServer`; broadcasts to subscribed clients |
| Add a DI context                  | `src/contexts/`                           | One file per concern; re-export via `index.ts`       |
| Add integration tests             | `src/__tests__/`                          | Use `helpers/` for shared setup                      |

## CONVENTIONS

- **Runtime layering**: `runtime/` (Express + lifecycle) → `contexts/` (DI) → `application/` (business services) → `routes/` (thin adapters)
- **Contexts own dependency wiring**: services are instantiated in `contexts/<concern>-context.ts`, not in route handlers
- **Routes are pure adapters**: parse request → call `application/` service → serialize response. No business logic in routes
- **WebSocket subscription model**: clients subscribe to channels; the server pushes events via `ws/websocket-server.ts`
- **No direct `apps/web` imports**: server is headless; consumers call HTTP/WS

## ANTI-PATTERNS (THIS PROJECT)

- Do not instantiate services inside route handlers — wire them in `contexts/`
- Do not import from `apps/web` — server is headless
- Do not add shared business logic here — it belongs in `packages/server/src/orchestration/` if reusable, `application/` if app-specific
- Do not add new runtime services without updating `app-runtime.ts` boot order
