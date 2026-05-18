# packages/agents-manager/src/

## OVERVIEW

Manages agent and category configurations with a repository client and 4 domain services.

**Note:** Plugin system moved to `@lite-llm/agent-plugins` package.

## STRUCTURE

```
agents-manager/src/
├── index.ts                     # Barrel + createAgentsManager() factory
├── config/
│   └── defaults.ts              # DEFAULT_DB_PATH, DEFAULT_ROUTING, DEFAULT_SYSTEM_AGENTS
├── repository/
│   └── client.ts                # createRepositoryClient() with JSONC fallback
├── services/
│   ├── agent.service.ts         # Agent CRUD operations
│   ├── agent-catalog.service.ts # Agent catalog queries
│   ├── category.service.ts      # Category CRUD operations
│   ├── routing.service.ts       # Routing config operations
│   └── index.ts                # Barrel exports
├── types/
│   ├── routing.ts               # PluginRoutingConfig, PluginRoutingRule
│   └── system-agent.ts          # SystemAgent, AgentVersion, AgentExtraConfig
```

## KEY EXPORTS

### Factory
- `createAgentsManager(options?)` — creates `{ repository, services }` object

### Services
- `AgentService` — CRUD for agents
- `CategoryService` — CRUD for categories
- `RoutingService` — routing config operations
- `AgentCatalogService` — catalog queries

### Repository
- `createRepositoryClient({ filePath? })` — wraps `@lite-llm/agents-repository`, handles JSONC fallback

## DATA FLOW

```
db.json (source of truth via @lite-llm/agents-repository)
    ↓
RepositoryClient → Services (agent/category/routing)
```

## CONVENTIONS

- Repository client handles `@agents/` path resolution from monorepo root
- JSON/JSONC fallback: `.json` → `.jsonc` if file not found

## ANTI-PATTERNS

- Don't import from `apps/server/` — this package is standalone
- Don't skip `validateOnRead` in repository options

## WHERE TO LOOK

| Task                      | Location                      | Notes                         |
| ------------------------- | ----------------------------- | ----------------------------- |
| Add agent CRUD logic      | `services/agent.service.ts`   | Uses repository client        |
| Change DB path resolution | `repository/client.ts`        | Handles @agents/ paths        |
| Add routing config field  | `services/routing.service.ts` | RoutingService                |
