# packages/agents-manager/src/

## OVERVIEW

Manages agent and category configurations with a repository client, 5 domain services, and a plugin system for generating consumer configs (OpenCode, OpenAgent, VS Code).

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
│   ├── model.service.ts         # Model spec operations
│   ├── routing.service.ts       # Routing config operations
│   └── index.ts                # Barrel exports
├── plugins/
│   ├── plugin.ts                # IPlugin interface, TransformContext
│   ├── registry.ts              # PluginRegistry class
│   ├── builtins/
│   │   └── opencode.plugin.ts   # OpenCode config generator
│   └── external/
│       ├── litellm-alias.plugin.ts  # LiteLLM alias generation plugin
│       ├── openagent.plugin.ts      # OpenAgent config generator
│       └── vscode.plugin.ts         # VS Code models generator
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
- `ModelService` — model spec operations
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
RepositoryClient → Services (agent/category/model/routing)
    ↓
PluginRegistry → OpenCodePlugin / OpenAgentPlugin / VsCodePlugin
    ↓
@storage/output/opencode.json, @storage/output/oh-my-openagent.json, @storage/output/vscode-oaicopilot.json
```

## CONVENTIONS

- Repository client handles `@agents/` path resolution from monorepo root
- JSON/JSONC fallback: `.json` → `.jsonc` if file not found


## ANTI-PATTERNS

- Don't import from `apps/server/` — this package is standalone
- Don't use `as any` in plugin implementations
- Don't skip `validateOnRead` in repository options

## WHERE TO LOOK

| Task                      | Location                      | Notes                         |
| ------------------------- | ----------------------------- | ----------------------------- |
| Add agent CRUD logic      | `services/agent.service.ts`   | Uses repository client        |
| Add new plugin            | `plugins/`                    | Implement `IPlugin` interface |
| Change DB path resolution | `repository/client.ts`        | Handles @agents/ paths        |
| Add routing config field  | `services/routing.service.ts` | RoutingService                |
