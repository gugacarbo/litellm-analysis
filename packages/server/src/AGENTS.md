# @LITE-LLM/SERVER/SRC

**Generated:** 2026-07-01
**Commit:** 3029bcb

## OVERVIEW

Internal layout of `@lite-llm/server`. Two top-level subdirs: `orchestration/` (multi-source coordinators) and `routes/` (Express adapters). All cross-package coordination lives here — services don't import each other directly.

## STRUCTURE

```
packages/server/src/
├── index.ts                    # Public barrel (re-exports orchestration + routes)
├── orchestration/
│   ├── index.ts                # Factory: createOrchestrationServices(4 args)
│   ├── artifact-service.ts     # syncGeneratedArtifacts, syncModelsDirectlyToDatabase
│   ├── model-route.ts          # Route a request to a concrete model via registry
│   ├── registry-models-bridge.ts # Sync registry ↔ models DB
│   ├── route-params.ts         # parseDays, toCostPerToken, buildLiteLLMParams, coerceLiteLLMParams
│   ├── router-settings.ts      # Routing configuration operations
│   └── __tests__/
└── routes/
    ├── index.ts                # registerAllRoutes(app, opts)
    ├── analytics-routes.ts     # GET /analytics/*
    ├── spend-routes.ts        # GET /spend/*
    ├── model-routes.ts        # CRUD /models/* (~1096 lines)
    ├── model-proxy-routes.ts  # /model-proxy/* health and admin
    ├── plugin-routing-routes.ts # GET/PUT /agent-routing
    ├── chat-routes.ts         # POST /chat (streaming completions)
    ├── provider-routes.ts   # Provider management
    ├── agent-catalog-routes.ts
    ├── category-catalog-routes.ts
    └── hebo-express.ts
```

## WHERE TO LOOK

| Task                              | Location                                  | Notes                                            |
| --------------------------------- | ----------------------------------------- | ------------------------------------------------ |
| Add an orchestration function     | `orchestration/<name>.ts`                 | Add to factory in `orchestration/index.ts`       |
| Add a route handler               | `routes/<name>-routes.ts`                 | Register in `routes/index.ts`                    |
| Change cost normalization         | `orchestration/route-params.ts`           | `toCostPerToken()` assumes per-token USD         |
| Coerce free-form form input       | `orchestration/route-params.ts`           | `coerceLiteLLMParams()` parses strings→primitives|
| Wire a new route                  | `routes/index.ts`                         | `registerAllRoutes()` is the single entry point  |

## CONVENTIONS

- **Route pattern**:
  ```typescript
  export function registerXxxRoutes(app: Application, opts: RouteOptions): void {
    app.get('/endpoint', async (req, res) => {
      try {
        const data = await opts.dataSource.someMethod();
        res.json(data);
      } catch (error) {
        res.status(500).json({ error: String(error) });
      }
    });
  }
  ```
- **Orchestration template**:
  ```typescript
  export async function orchestrationFn(dataSource, param): Promise<void> {
    // 1. Read from dataSource
    // 2. Process via agentsManager / modelsService / registry
    // 3. Write back via dataSource
  }
  ```
- **Factory template (4-arg)**:
  ```typescript
  export function createOrchestrationServices(dataSource, agentsManager, modelsService, registry): OrchestrationServices
  ```

## ANTI-PATTERNS (THIS PROJECT)

- Do not add Express imports to orchestration files
- Do not bypass `RouteOptions.dataSource` — every route goes through the interface
- Do not import from `apps/server/` — this package is standalone
- Do not duplicate `coerceLiteLLMParams` logic — extract helpers to `route-params.ts`