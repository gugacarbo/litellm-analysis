# AGENTS.md — @lite-llm/server

## OVERVIEW

Server orchestration layer. Contains business logic that coordinates between
@lite-llm/analytics-service (data access) and @lite-llm/agents-manager (config CRUD + plugins).
Alias generation is handled by the ModelAliasPlugin in agents-manager.

## STRUCTURE

```
packages/server-core/src/
├── index.ts                    # Barrel exports
├── orchestration/
│   ├── index.ts                # Factory + re-exports
│   ├── alias-db-writer.ts      # AliasDbWriterImpl — bridges plugin to dataSource
│   ├── artifact-service.ts     # syncGeneratedArtifacts, syncModelsDirectlyToDatabase
│   └── lite-llm-params.ts     # parseDays, toCostPerToken, buildLiteLLMParams, coerceLiteLLMParams, etc.
├── routes/
│   ├── index.ts               # registerAllRoutes, RouteOptions
│   ├── spend-routes.ts         # GET /spend/*
│   ├── analytics-routes.ts     # GET /analytics/*
│   ├── model-routes.ts         # CRUD /models/*
│   ├── plugin-routing-routes.ts # GET/PUT /agent-routing
│   ├── agent-config-routes.ts  # CRUD /agent-config/*
│   ├── agent-config/           # Sub-routes: agent + category CRUD
│   ├── agent-definitions-routes.ts # Agent definitions endpoints
│   ├── credential-routes.ts    # LiteLLM credential management
│   └── mode-routes.ts          # GET /mode
└── types/
    └── index.ts               # DbModelSpecLike, RouteOptions
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Add orchestration function | `orchestration/` | Depends on analytics + agents-manager |
| Add route handler | `routes/` | Uses RouteOptions with dataSource + orchestration |
| Add shared type | `types/index.ts` | DbModelSpecLike, RouteOptions |
| Change route registration | `routes/index.ts` | registerAllRoutes() convenience |

## CONVENTIONS

### Route Pattern
```typescript
export function registerXxxRoutes(
  app: Application,
  opts: RouteOptions,
): void {
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

### Orchestration Pattern
```typescript
export async function orchestrationFunction(
  dataSource: AnalyticsDataSource,
  param: SomeType,
): Promise<void> {
  // 1. Read from dataSource
  // 2. Process with agents-manager or models-manager alias-router
  // 3. Write back to dataSource
}
```

### Factory Pattern
```typescript
export function createOrchestrationServices(
  dataSource: AnalyticsDataSource,
): OrchestrationServices {
  return {
    dataSource,
    syncGeneratedArtifacts: () => syncGeneratedArtifacts(dataSource, agentsManager),
    syncModelsDirectlyToDatabase: (models) => syncModelsDirectlyToDatabase(dataSource, models),
  };
}
```

## COST AND PARAM CONVENTIONS

- `toCostPerToken()` normalizes incoming cost values to USD per token. It assumes config files already store per-token USD, so it no longer divides by 1,000,000.
- `coerceLiteLLMParams()` parses extra `litellm_params` values from form/body input, coercing strings to boolean, number, bigint, date, or JSON when possible.
- Route handlers should coerce incoming free-form params before passing them to `buildLiteLLMParams()` or the data source.

## ANTI-PATTERNS

- Don't add Express-specific logic to orchestration functions
- Don't bypass dataSource — always use the interface
- Don't import from `apps/server/` — this package is standalone
- Don't add new dependencies without updating package.json exports
