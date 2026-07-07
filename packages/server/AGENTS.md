# @LITE-LLM/SERVER KNOWLEDGE BASE

**Generated:** 2026-07-07
**Commit:** 3029bcb

## OVERVIEW

`@lite-llm/server` — shared Express routes and orchestration services consumed by `apps/server` and other consumers. Owns business logic that coordinates `@lite-llm/analytics-service` (data access), `@lite-llm/agents-manager` (config CRUD), and `@lite-llm/agent-plugins` (config file generation). Distinct from `apps/server` (which is the runtime/entry point).

## STRUCTURE

```
packages/server/
├── src/
│   ├── index.ts                    # Public barrel
│   ├── orchestration/              # Multi-source coordinators (model alias sync, artifact sync, registry bridge, benchmark helpers)
│   │   ├── artifact-service.ts
│   │   ├── benchmark-helpers.ts    # Benchmark dataset loading, model matching, key normalization
│   │   ├── model-route.ts
│   │   ├── openrouter-models.ts    # OpenRouter model data fetching for benchmark comparison
│   │   ├── registry-models-bridge.ts
│   │   ├── route-params.ts
│   │   ├── router-settings.ts
│   │   └── index.ts
│   ├── routes/                     # Shared Express route registrations
│   │   ├── index.ts                # registerAllRoutes() convenience
│   │   ├── spend-routes.ts
│   │   ├── analytics-routes.ts
│   │   ├── model-routes.ts
│   │   ├── model-proxy-routes.ts
│   │   ├── plugin-routing-routes.ts
│   │   ├── chat-routes.ts          # Dashboard chat streaming endpoint
│   │   ├── provider-routes.ts
│   │   ├── agent-catalog-routes.ts
│   │   ├── category-catalog-routes.ts
│   │   └── hebo-express.ts
│   └── types/                      # Shared types (DbModelSpecLike, RouteOptions, AgentsManager)
└── package.json
```

## WHERE TO LOOK

| Task                              | Location                                  | Notes                                                  |
| --------------------------------- | ----------------------------------------- | ------------------------------------------------------ |
| Add an orchestration coordinator  | `src/orchestration/`                      | Coordinates across `analytics-service`, `agents-manager`, `agent-plugins` |
| Add a shared route                | `src/routes/`                             | Use `RouteOptions` pattern (dataSource + orchestration)|
| Register all routes               | `src/routes/index.ts`                     | `registerAllRoutes(app, opts)` for one-line wiring    |
| Change cost normalization         | `src/orchestration/route-params.ts`       | `toCostPerToken()` assumes canonical per-token USD     |
| Add a benchmark comparison endpoint | `src/routes/model-routes.ts`             | `GET /models/:name/benchmark-comparison`; uses `benchmark-helpers.ts` + `openrouter-models.ts` |
| Add chat streaming endpoint       | `src/routes/chat-routes.ts`               | Streams completions via `MODEL_PROXY_*`; mounted in apps/server |

## CONVENTIONS

- **Route pattern**: `registerXxxRoutes(app: Application, opts: RouteOptions): void` — pure Express adapter
- **Orchestration pattern**: functions take `AnalyticsDataSource` + collaborators, return domain objects; no Express knowledge
- **Cost convention**: canonical per-token USD; `* 1_000_000` for display. `toCostPerToken()` normalizes incoming values
- **Alias generation**: handled by `ModelAliasPlugin` in `services/agent-plugins/`; this package only consumes the output
- **4-arg factory**: `createOrchestrationServices(dataSource, agentsManager, modelsService, registry)` returns the orchestration bundle

## ANTI-PATTERNS (THIS PROJECT)

- Do not add Express-specific logic to orchestration functions
- Do not bypass the `AnalyticsDataSource` interface — always go through it
- Do not import from `apps/server/` — this package is standalone and consumed by external tools
- Do not add new dependencies without updating `package.json` `exports` field
- Do not duplicate cost normalization logic — use `route-params.ts` helpers