# APPS/SERVER/SRC KNOWLEDGE BASE

**Generated:** 2026-07-01
**Commit:** 3029bcb

## OVERVIEW

Internal layout of `apps/server/src/`. Follows runtime → application → routes layering with explicit DI contexts. Each concern (analytics, monitor, health-check) gets its own context, application service, runtime, and routes.

## STRUCTURE

```
apps/server/src/
├── runtime/
│   ├── api-server.ts              # Express app factory + listen
│   ├── app-runtime.ts             # Boot orchestrator (contexts → runtimes → listen)
│   ├── monitor-runtime.ts         # Background ticker (MonitorService)
│   └── health-check-runtime.ts    # Periodic health probes
├── application/
│   ├── monitor-application-service.ts       # Monitor query/read model
│   └── health-check-application-service.ts  # Health probe results
├── contexts/
│   ├── analytics-context.ts       # AnalyticsDataSource + downstream services
│   ├── monitor-context.ts         # MonitorService + alert reader
│   └── index.ts                   # Context barrel
├── routes/
│   ├── monitor-routes.ts          # GET /monitor/* endpoints
│   └── health-check-routes.ts     # GET /health/* endpoints
├── ws/
│   ├── websocket-server.ts        # Single WS server, channel-based subscriptions
│   └── spend-logs-watcher.ts      # Background watcher that emits to WS
├── services/
│   └── health-check/              # Health check service: types, DB query re-exports
│       ├── types.ts               # HealthCheckResult, events, options types
│       └── db.ts                  # Re-exports from @lite-llm/app-repository/queries
├── __tests__/                     # Integration tests (supertest)
│   ├── helpers/                   # Shared test fixtures (registry-test-stack.ts, etc.)
│   ├── chat-routes.test.ts
│   ├── health-check-*.test.ts
│   ├── model-proxy-routes.test.ts
│   ├── registry-integration.test.ts
│   └── spend-logs-watcher.test.ts
└── env.ts                         # Re-export of @lite-llm/config server env
```

## WHERE TO LOOK

| Task                                  | Location                                                | Notes                                       |
| ------------------------------------- | ------------------------------------------------------- | ------------------------------------------- |
| Add a new runtime concern             | `runtime/<concern>-runtime.ts` + `application/<concern>-application-service.ts` + `routes/<concern>-routes.ts` | All three files; wire in `app-runtime.ts`  |
| Change DI wiring                      | `contexts/<concern>-context.ts`                         | Returns a context object consumed by runtime |
| Add a WebSocket channel               | `ws/websocket-server.ts` + a watcher in `ws/`           | Subscribe/unsubscribe per client             |
| Run integration tests                 | `__tests__/<feature>.test.ts`                           | Use `helpers/registry-test-stack.ts`         |
| Add a test fixture                    | `__tests__/helpers/`                                    | Reused across tests; not a runtime concern  |

## CONVENTIONS

- **Three-file concern**: every runtime concern has `*-runtime.ts`, `*-application-service.ts`, `*-routes.ts`. Missing any of the three is incomplete.
- **Pure application services**: `application/` has zero Express imports; pure functions/classes that take/return domain objects
- **Context returns**: each `<concern>-context.ts` exports a factory returning `{ service, runtime? }`
- **Test helpers are co-located**: `__tests__/helpers/` is not a runtime module — it imports all contexts to compose a test stack
- **Tests use supertest + node**: no jsdom; server is Node-only

## ANTI-PATTERNS (THIS PROJECT)

- Do not import Express types in `application/` — keep services transport-agnostic
- Do not call `app.listen()` outside `runtime/api-server.ts` — all entry points go through `app-runtime.ts`
- Do not add WebSocket message handlers outside `ws/websocket-server.ts`
- Do not put test fixtures under `__tests__/` root — they belong in `__tests__/helpers/`
- Do not duplicate context wiring across concerns — extend `index.ts` barrel instead
