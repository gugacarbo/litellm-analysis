# AGENTS.md — @lite-llm/server-core

## OVERVIEW

Server orchestration layer. Contains business logic that coordinates between
@lite-llm/analytics (data access), @lite-llm/agents-manager (config CRUD),
and @lite-llm/alias-router (alias resolution).

## STRUCTURE

```
packages/server-core/src/
├── index.ts                    # Barrel exports
├── orchestration/
│   ├── index.ts                # Factory + re-exports
│   ├── alias-service.ts        # buildAliasMapFromDb, regenerateAllAliases
│   ├── artifact-service.ts     # syncGeneratedArtifacts, syncModelsDirectlyToDatabase
│   └── lite-llm-params.ts     # parseDays, toCostPerToken, buildLiteLLMParams, etc.
├── routes/
│   ├── index.ts               # registerAllRoutes, RouteOptions
│   ├── spend-routes.ts         # GET /spend/*
│   ├── analytics-routes.ts     # GET /analytics/*
│   ├── model-routes.ts         # CRUD /models/*
│   ├── agent-routing-routes.ts # GET/PUT /agent-routing
│   ├── agent-config-routes.ts  # CRUD /agent-config/*
│   └── mode-routes.ts          # GET /mode
└── types/
    └── index.ts               # DbModelSpecLike, RouteOptions
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Add orchestration function | `orchestration/` | Depends on analytics + agents-manager + alias-router |
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
  // 2. Process with agents-manager or alias-router
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
    buildAliasMap: () => buildAliasMapFromDb(),
    regenerateAllAliases: () => regenerateAllAliases(dataSource),
    // ...
  };
}
```

## ANTI-PATTERNS

- Don't add Express-specific logic to orchestration functions
- Don't bypass dataSource — always use the interface
- Don't import from `apps/server/` — this package is standalone
- Don't add new dependencies without updating package.json exports
