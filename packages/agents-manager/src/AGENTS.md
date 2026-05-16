# packages/agents-manager/src/

## OVERVIEW

Manages agent and category configurations with a repository client, 4 domain services, and a plugin system for generating consumer configs (OpenCode, OpenAgent, VS Code).

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
├── plugins/
│   ├── plugin.ts                # IPlugin interface, TransformContext
│   ├── plugin-types.ts          # InternalAgent, ConfigField types
│   ├── registry.ts              # PluginRegistry class
│   ├── schemas/
│   │   ├── index.ts             # Re-exports plugin schemas
│   │   └── plugin-schemas.ts    # Central schema registry
│   ├── __tests__/
│   │   └── registry.test.ts     # PluginRegistry tests
│   ├── opencode/
│   │   ├── plugin.ts            # OpenCode config generator
│   │   ├── __tests__/
│   │   │   └── plugin.test.ts
│   │   └── schemas/
│   │       ├── opencode.schema.json
│   │       └── generated/
│   │           └── opencode.zod.ts
│   ├── openagent/
│   │   ├── plugin.ts            # OpenAgent config generator
│   │   ├── __tests__/
│   │   │   └── plugin.test.ts
│   │   └── schemas/
│   │       ├── openagent.schema.json
│   │       └── generated/
│   │           └── openagent.zod.ts
│   ├── vscode/
│   │   ├── plugin.ts            # VS Code models generator
│   │   ├── __tests__/
│   │   │   └── plugin.test.ts
│   │   └── schemas/
│   │       ├── vscode.schema.json
│   │       └── generated/
│   │           └── vscode.zod.ts
│   └── litellm-alias/
│       └── plugin.ts            # LiteLLM alias generation plugin
├── types/
│   ├── routing.ts               # PluginRoutingConfig, PluginRoutingRule
│   └── system-agent.ts          # SystemAgent, AgentVersion, AgentExtraConfig
```

## KEY EXPORTS

### Factory
- `createAgentsManager(options?)` — creates `{ repository, services, registry }` singleton

### Services
- `AgentService` — CRUD for agents
- `CategoryService` — CRUD for categories
- `RoutingService` — routing config operations
- `AgentCatalogService` — catalog queries

### Plugins
- `OpenCodePlugin` — generates `opencode.json`
- `OpenAgentPlugin` — generates `oh-my-openagent.json`
- `VsCodePlugin` — generates `vscode-oaicopilot.json`
- `PluginRegistry` — manages plugin lifecycle + export

### Repository
- `createRepositoryClient({ filePath? })` — wraps `@lite-llm/agents-repository`, handles JSONC fallback

## DATA FLOW

```
db.json (source of truth via @lite-llm/agents-repository)
    ↓
RepositoryClient → Services (agent/category/routing)
    ↓
PluginRegistry → OpenCodePlugin / OpenAgentPlugin / VsCodePlugin
    ↓
@storage/output/opencode.json, @storage/output/oh-my-openagent.json, @storage/output/vscode-oaicopilot.json
```

## CONVENTIONS

- Repository client handles `@agents/` path resolution from monorepo root
- JSON/JSONC fallback: `.json` → `.jsonc` if file not found
- Plugin schemas are per-plugin generated artifacts:
  - Each plugin has its own `schemas/` directory with `.schema.json` and `generated/*.zod.ts`
  - JSON schema → Zod generation via `pnpm generate:schemas`
  - Do not edit generated schema files manually; update the JSON schema source and regenerate


## ANTI-PATTERNS

- Don't import from `apps/server/` — this package is standalone
- Don't use `as any` in plugin implementations
- Don't skip `validateOnRead` in repository options

## WHERE TO LOOK

| Task                      | Location                      | Notes                         |
| ------------------------- | ----------------------------- | ----------------------------- |
| Add agent CRUD logic      | `services/agent.service.ts`   | Uses repository client        |
| Add new plugin            | `plugins/`                    | Create `plugins/<name>/plugin.ts` implementing `IPlugin` |
| Change DB path resolution | `repository/client.ts`        | Handles @agents/ paths        |
| Add routing config field  | `services/routing.service.ts` | RoutingService                |
