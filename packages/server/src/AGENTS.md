# @lite-llm/server-core

## OVERVIEW

Server orchestration layer. Contains business logic that coordinates between
@lite-llm/queries (data access), @lite-llm/agents-manager (agent/category services),
and @lite-llm/agent-plugins (config file generation).

## STRUCTURE

```
packages/server-core/src/
├── index.ts                    # Barrel exports
├── orchestration/
│   ├── index.ts                # Factory + re-exports
│   ├── artifact-service.ts     # syncGeneratedArtifacts, syncModelsDirectlyToDatabase
│   └── lite-llm-params.ts     # parseDays, toCostPerToken, buildLiteLLMParams, etc.
├── routes/
│   ├── index.ts               # registerAllRoutes, RouteOptions
│   ├── spend-routes.ts        # GET /spend/*
│   ├── analytics-routes.ts    # GET /analytics/*
│   ├── model-routes.ts        # CRUD /models/*
│   ├── plugin-routing-routes.ts # GET/PUT /agent-routing
│   ├── agent-config-routes.ts  # CRUD /agent-config/*
│   ├── agent-catalog-routes.ts # Agent catalog endpoints
│   ├── category-catalog-routes.ts # Category catalog endpoints
│   ├── agent-definitions-routes.ts # Agent definitions endpoints
│   ├── credential-routes.ts   # LiteLLM credential management
│   └── mode-routes.ts         # GET /mode
└── types/
    └── index.ts               # DbModelSpecLike, RouteOptions, AgentsManager
```

## DEPENDENCIES

- `@lite-llm/queries` — data access interface
- `@lite-llm/agents-manager` — agent/category services
- `@lite-llm/agent-plugins` — config file generation (PluginRegistry)
- `@lite-llm/models-manager` — model services

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Add orchestration function | `orchestration/` | Depends on analytics + agents-manager + agent-plugins |
| Add route handler | `routes/` | Uses RouteOptions with dataSource + orchestration |
| Add shared type | `types/index.ts` | DbModelSpecLike, RouteOptions |
| Change route registration | `routes/index.ts` | registerAllRoutes() convenience |

## ANTI-PATTERNS

- Don't add Express-specific logic to orchestration functions
- Don't bypass dataSource — always use the interface
- Don't import from `apps/server/` — this package is standalone
- Don't add new dependencies without updating package.json exports
