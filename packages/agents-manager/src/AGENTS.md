# @LITE-LLM/AGENTS-MANAGER/SRC

**Generated:** 2026-07-01
**Commit:** 3029bcb

## OVERVIEW

`@lite-llm/agents-manager` — agent/category CRUD, repository client wrapper, and routing service. Plugin system moved to `@lite-llm/agent-plugins` (separate package).

## STRUCTURE

```
packages/agents-manager/src/
├── index.ts                     # Public barrel + createAgentsManager() factory
├── config/
│   └── defaults.ts              # DEFAULT_AGENTS_PATH, DEFAULT_AGENTS
├── repository/
│   └── client.ts                # createRepositoryClient() over @lite-llm/agents-repository
├── services/
│   ├── agent.service.ts         # Agent CRUD
│   ├── agent-catalog.service.ts # Agent catalog queries
│   ├── category.service.ts      # Category CRUD
│   ├── routing.service.ts       # Routing config operations
│   └── __tests__/
└── types/                       # (empty — types consolidated into @lite-llm/agent-schemas)
```

## KEY EXPORTS

### Factory
- `createAgentsManager(options?)` → `{ repository, services }`

### Services
- `AgentService` — CRUD for agents
- `CategoryService` — CRUD for categories
- `RoutingService` — routing config operations
- `AgentCatalogService` — catalog queries

### Repository
- `createRepositoryClient({ filePath? })` — wraps `@lite-llm/agents-repository`; resolves `@settings/agents/` from monorepo root

## DATA FLOW

```
@settings/agents/agents.jsonc  (source of truth)
        ↓
agents-repository (SQLite/PostgreSQL via Prisma)
        ↓
RepositoryClient → Services (agent/category/routing)
        ↓
apps/server routes via @lite-llm/server
```

## WHERE TO LOOK

| Task                              | Location                              | Notes                              |
| --------------------------------- | ------------------------------------- | ---------------------------------- |
| Add agent CRUD logic              | `services/agent.service.ts`           | Uses repository client             |
| Change DB path resolution         | `repository/client.ts`                | Handles `@settings/agents/` paths  |
| Add routing config field          | `services/routing.service.ts`         | RoutingService methods             |
| Add a new default                 | `config/defaults.ts`                  | DEFAULT_AGENTS_PATH, DEFAULT_AGENTS |

## CONVENTIONS

- Repository client resolves `@settings/agents/` path from monorepo root automatically
- All agents/categories go through services; never mutate the repository directly
- Types live in `@lite-llm/agent-schemas`, not here — this `types/` directory is intentionally empty (migration artifact)

## ANTI-PATTERNS (THIS PROJECT)

- Do not import from `apps/server/` — this package is standalone
- Do not skip `validateOnRead` in repository options
- Do not put types here — use `@lite-llm/agent-schemas`
- Do not re-implement plugin logic — it lives in `@lite-llm/agent-plugins`