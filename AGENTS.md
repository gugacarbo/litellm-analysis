# PROJECT KNOWLEDGE BASE

**Generated:** 2026-04-25
**Commit:** HEAD
**Branch:** main

## OVERVIEW

LiteLLM Analytics Dashboard — full-stack TypeScript monorepo for monitoring LLM API usage, costs, and errors via LiteLLM's PostgreSQL database. React 19 frontend + Express.js backend, deployed as a single web app with optional direct-DB or API-only data access modes. Includes a shared `agents-manager` package for agent configuration management.

## STRUCTURE

```
lite-llm-analytics/
├── apps/
│   ├── web/                # React 19 + Vite 7 SPA (shadcn/ui, Recharts, Tailwind 4)
│   │   └── src/
│   │       ├── components/  # UI components (shadcn primitives + domain modules)
│   │       ├── pages/       # Route pages + page-level hooks/types/utils
│   │       ├── lib/         # API client (modular), utils, server-mode detection
│   │       ├── hooks/       # use-dashboard-data, use-logs, use-server-mode
│   │       ├── types/       # Shared TypeScript interfaces
│   │       └── data/        # Static agent definition data
│   └── server/             # Express.js + Drizzle ORM + PostgreSQL
│       └── src/
│           ├── data-source/ # Strategy pattern: Database vs API vs Limited modes
│           ├── db/          # Drizzle schema, queries, model-merge logic
│           └── services/    # Config file I/O, alias generation
├── packages/               # Shared libraries
│   ├── agents-manager/     # Agent/category config CRUD, file generators
│   ├── alias-router/        # LiteLLM alias routing resolution
│   ├── analytics/           # DB queries + data source implementation
│   └── shared/             # Common types (AgentConfig, CategoryConfig)
├── data/                    # Generated JSON configs (OpenCode, VS Code, agent-routing)
├── biome.json               # Biome 2.x (replaces ESLint+Prettier)
├── turbo.json               # Turborepo task pipeline
└── pnpm-workspace.yaml      # apps/* + packages/*
```

## WHERE TO LOOK

| Task                     | Location                                                                           | Notes                                                |
| ------------------------ | ---------------------------------------------------------------------------------- | ---------------------------------------------------- |
| Add a page/route         | `apps/web/src/App.tsx` + `apps/web/src/pages/`                                     | Pages own their types, utils, and hooks              |
| Add a UI component       | `apps/web/src/components/`                                                         | shadcn primitives at root, domain modules in subdirs |
| Add an API endpoint      | `apps/server/src/api-server.ts`                                                    | All routes defined here                              |
| Add a data-source method | `packages/analytics/src/data-source/api.ts` or `database.ts`                      | Must implement `AnalyticsDataSource` interface      |
| Add a DB query           | `packages/analytics/src/queries/index.ts`                                           | Drizzle ORM queries, camelCase columns               |
| Add a new data type      | `packages/analytics/src/types/index.ts`                                             | Add to interface or type exports                    |
| Change feature gating    | `apps/web/src/components/feature-gate.tsx`                                         | Wraps destructive/limited features                   |
| Change lint/format rules | `biome.json` (root)                                                               | Single quotes, 80 chars, import auto-organize       |
| Change dev proxy         | `apps/web/vite.config.ts`                                                          | `/api` → `localhost:3008`                           |
| Add agent config logic   | `packages/agents-manager/src/`                                                      | Adapters, transformers, CRUD, file generators       |
| Modify agent API routes  | `apps/server/src/routes/agent-config-routes.ts`                                     | Express routes using agents-manager                 |

## CONVENTIONS

### Code Style (Biome 2.x)
- **Single quotes**, 2-space indent, 80-char line width
- **verbatimModuleSyntax** — must use `import type` for type-only imports
- **erasableSyntaxOnly** — only TS features that erase at compile time
- **noUnusedLocals / noUnusedParameters** enforced (web app tsconfig)
- Import auto-organization on format (`organizeImports: "on"`)

### Architecture
- **Strategy pattern** for data access: `AnalyticsDataSource` interface with `DatabaseDataSource`, `ApiDataSource`, `LimitedDataSource` implementations
- **Capability gates**: `AnalyticsCapabilities` (28 boolean flags) controls feature availability per mode. Frontend checks via `GET /api/mode`
- **HTTP 501** = "feature unavailable" in limited/api-only mode → `FeatureUnavailableError`
- **Page-level architecture**: Pages contain hooks/types/utils only (no JSX). Components live in `components/` and import from page directories
- **State-Actions-Derived pattern**: Complex pages (agent-routing) split into `use-*-state.ts`, `use-*-actions.ts`, `use-*-derived.ts`, composed via `use-*-page.ts`

### TypeScript
- Root targets ES2025, apps target ES2022
- Web app: path alias `@/` → `./src/`
- Server: `declaration: true`, emits `.d.ts`
- Types duplicated across apps (no shared package yet)

### Testing (Vitest 4.x)
- `__tests__/` colocated with source inside `src/`
- Web: jsdom + @testing-library/react, server: node + supertest
- Mocking: `vi.mock()` hoisted, `vi.stubEnv()`, `createMockDataSource()` factory
- Tests verify feature gates (capabilities matrix) explicitly
- `passWithNoTests: true` at root
- **⚠️ Dual test organization**: Both `__tests__/` directories AND `.test.ts` colocated files coexist — no single standard enforced

## PACKAGES

### @lite-llm/agents-manager
Manages agent and category configurations with file-based storage.

**Entry point:** `packages/agents-manager/src/index.ts`

**Key exports:**
- `createAgentsManager()` — initializes singleton with file paths
- `readDb()` / `writeDb()` — raw JSON CRUD
- `readConfigFile()` / `updateAgentInConfig()` / `updateCategoryInConfig()` — typed config CRUD
- `writeProvidersFile()` — generates `data/opencode.json`
- `writeVscodeModelsFile()` — generates `data/vscode-oaicopilot.json`
- `syncOutputConfigFile()` — syncs `data/db.json` → `data/oh-my-openagent.json`

**Data flow:**
1. `db.json` is the source of truth (internal format)
2. Transformers convert DB format → output config format
3. Generators write provider files and VS Code model files

**Dependencies:** `@litellm/shared` (workspace:*)

**Build:** `tsc` → `dist/`, generates `.d.ts` declarations

**⚠️ Documentation note:** `packages/agents-manager/src/AGENTS.md` mentions ".js extension" but actual implementation files are `.ts`

### @lite-llm/analytics
DB queries + data source implementations (Database, Api, Limited modes).

**Structure:**
```
packages/analytics/src/
├── data-source/
│   ├── index.ts      # Factory: createDataSource(), detectMode()
│   ├── types.ts      # DATABASE_CAPABILITIES, LIMITED_CAPABILITIES, API_CAPABILITIES
│   ├── database.ts  # DatabaseDataSource (direct DB access)
│   └── api.ts        # ApiDataSource (HTTP to LiteLLM API)
├── queries/
│   ├── index.ts     # All Drizzle ORM queries (648 lines)
│   ├── schema.ts    # Table definitions (spendLogs, proxyModelTable, errorLogs, liteLLMConfig)
│   └── client.ts    # DB connection
├── types/
│   └── index.ts     # AnalyticsDataSource interface + all data types + exports from @litellm/shared
└── index.ts         # Barrel: exports from data-source, data-source/types, types
```

**Key patterns:**
- `AnalyticsDataSource` interface has 31 methods — any implementation must implement all
- Data source mode detected from `ACCESS_MODE` env var or auto-detected from `DB_HOST` / `LITELLM_API_URL`
- Queries use camelCase column names mapped to snake_case DB columns via Drizzle ORM
- All queries are async and return plain objects (not Drizzle row objects)

**Package exports (from package.json):**
- `import { ApiDataSource } from '@lite-llm/analytics'` → `packages/analytics/src/index.ts`
- `import type { AnalyticsCapabilities } from '@lite-llm/analytics/types'` → `src/types/index.ts`
- `import { db, schema } from '@lite-llm/analytics/queries'` → `src/queries/client.ts`
- `import type { AnalyticsDataSource } from '@lite-llm/analytics/data-source'` → `src/data-source/types.ts`

**Adding a new query:**
1. Add to `packages/analytics/src/queries/index.ts`
2. Use `db.select({ ... }).from(schema.spendLogs)` pattern
3. Export the function
4. Call it from `data-source/database.ts` method

**Adding a new data source method:**
1. Add method signature to `AnalyticsDataSource` interface in `types/index.ts`
2. Implement in `data-source/database.ts`
3. Implement in `data-source/api.ts`
4. Set capability flag in appropriate `*_CAPABILITIES` constant in `data-source/types.ts`

**CAUTION — Refactoring pitfalls:**
- Do NOT use class inheritance to split large data source classes — TypeScript's strict mode requires all interface methods in each class
- Large files (>500 lines) are acceptable here due to TypeScript constraints
- Use composition or functional splitting instead of inheritance

### @lite-llm/alias-router
Resolves model aliases for LiteLLM routing. Pure functions — no I/O, no side effects.

**Entry point:** `packages/alias-router/src/index.ts`

**Key exports:**
- `generateLitellmAliases()` — generates alias mapping
- `resolveConfiguredModels()` / `resolveModelValue()` — maps agent names → model identifiers
- `getExistingAliasesForAgent()` / `replaceAliasesForAgent()` — alias cleanup
- `sortAliasesByDefinitionOrder()` — definition-order sorting
- `AGENT_KEYS`, `CATEGORY_KEYS`, `MODEL_NAMES` — constants

**Structure:** `alias/` (generate/resolve/cleanup), `constants/`, `sort/`, `utils/`

**Dependencies:** None (standalone logic package)

**Build:** `tsc` → `dist/`

**⚠️ Test location:** Tests at `__tests__/` (package root), not `src/__tests__/` — deviates from stated convention

### @litellm/shared
Shared TypeScript types and Zod schemas for agent/category configuration.

**Entry point:** `packages/shared/src/index.ts`

**Key exports:**
- Types: `AgentConfig`, `CategoryConfig`, `AgentConfigFile`, `OhMyOpenAgentConfig`, `Permission`, `Thinking`, `GitMaster`
- Schemas: `agentConfigSchema`, `categoryConfigSchema`, `agentConfigFileSchema`, `ohMyOpenAgentConfigSchema`, `permissionSchema`, `thinkingSchema`

**Data flow:**
1. `@litellm/shared` defines types + Zod schemas
2. `@lite-llm/agents-manager` imports and uses them for CRUD
3. Consumer configs generated from internal format

**Dependencies:** `zod` v3

**Build:** `tsc` → `dist/`

**⚠️ Package exports:** Uses glob pattern `"./types/*": "./src/types/*.ts"` — non-standard, may not work reliably across all tools

## ANTI-PATTERNS (THIS PROJECT)

- No `as any`, `@ts-ignore`, or `@ts-expect-error` — use proper typing
- No `TODO`/`FIXME`/`HACK` comments — resolve or track externally
- No hardcoded secrets in source — use `.env` files
- Dual linting exists (Biome root + ESLint web) — prefer Biome for new rules

## UNIQUE STYLES

- **Three consumer configs**: `data/` contains `oh-my-openagent.json`, `opencode.json`, `vscode-oaicopilot.json` — all generated by `packages/agents-manager` from `db.json`
- **Cost formatting**: `$X.XX/Mi` (per million tokens) via `getInputCost()`/`getOutputCost()`
- **Column schema system**: `MODEL_STATS_COLUMNS` declarative array drives table rendering in model-stats
- **Alias resolution**: `resolveModelName()` in agent-routing maps configs through alias table via `useMemo`
- **Collapsible sections**: `expandedSections: Record<string, boolean>` pattern in config editors
- **Mode badge**: Sidebar shows "Full Access" / "Limited" / "API Mode" with emoji indicators

## COMMANDS

```bash
pnpm dev          # Start both apps (web on :5178, server on :3008)
pnpm build        # turbo build (tsc + vite for web, tsc for server)
pnpm test         # turbo test (vitest run per app)
pnpm lint         # turbo lint (biome lint)
pnpm format       # turbo format (biome check --write)
pnpm typecheck    # turbo typecheck (tsc --noEmit)

# Single package (faster for iteration)
pnpm --filter @lite-llm/analytics typecheck
pnpm --filter @lite-llm/analytics build
```

## NOTES

- No CI/CD pipeline exists — all checks run manually
- No Docker/containerization — runs on Node.js >= 20 + PostgreSQL 14+
- Web dev proxy strips `/api` prefix before forwarding to server
- Server port defaults to 3000 (env) but `.env` uses 3008; Vite proxy targets 3008
