# PROJECT KNOWLEDGE BASE

**Generated:** 2026-05-13 (updated 2026-06-15)
**Commit:** a6a4e5d
**Branch:** main

## OVERVIEW

LiteLLM Analytics Dashboard — full-stack TypeScript monorepo for monitoring LLM API usage, costs, and errors via LiteLLM's PostgreSQL database. React 19 frontend + Express.js backend, deployed as a single web app with optional direct-DB or API-only data access modes. Configs split into `agents-manager` (agents/categories + plugin routing) and `models-manager` (providers/models + alias routing).

## STRUCTURE

```
lite-llm-analytics/
├── apps/
│   ├── web/                # React 19 + Vite 7 SPA (shadcn/ui, Recharts, Tailwind 4)
│   │   └── src/
│   │       ├── components/  # UI components (shadcn primitives + domain modules)
│   │       ├── pages/       # Route pages + page-level hooks/types/utils
│   │       ├── lib/         # API client (modular), utils
│   │       ├── hooks/       # use-dashboard-data, use-logs
│   │       └── types/       # Shared TypeScript interfaces
│   └── server/             # Express.js entry point + monitor + WebSocket
│       └── src/
│           ├── runtime/         # Express app factory, server bootstrap, monitor runtime
│           ├── application/     # Business services (monitor application service)
│           ├── routes/          # Monitor-specific Express routes
│           ├── ws/              # WebSocket server for live data
│           ├── __tests__/       # Integration tests
│           └── env.ts           # Environment config re-export
  ├── packages/               # Shared libraries
│   ├── agents-manager/     # Agent/category config CRUD, file generators
│   ├── models-manager/     # Provider/model CRUD + alias routing resolution
│   ├── analytics/           # DB queries + data source implementation
│   ├── monitor/             # Model health monitoring (SQLite, anomaly detection)
│   ├── server-core/         # Orchestration layer (routes, alias db writer, artifact sync)
│   ├── shared/             # Common types (AgentConfig, CategoryConfig)
│   ├── env/                # Environment variable validation (t3-env, Zod)
│   └── api-contracts/      # API type contracts (analytics, agent-routing)
├── @settings/agents/                 # Agent config source-of-truth (agents.jsonc + schema)
├── @settings/plugins/                # Plugin config source-of-truth (plugins.jsonc + schema)
├── @settings/models/                 # Model/provider config source-of-truth (models.jsonc + schema)
├── @storage/output/         # Generated JSON configs (OpenCode, VS Code, agent-routing)
│   ├── oh-my-openagent.json
│   ├── opencode.json
│   ├── vscode-oaicopilot.json
│   └── cloud-sync/         # LiteLLM cloud spend logs
├── @storage/benchmarks/    # Artificial Analysis benchmark data
│   ├── artificial-analysis-models.json
│   └── model-aliases.json
├── @storage/reports/       # Prompt evaluation reports (runtime-created)
├── repositories/            # Config repositories + DB repos
│   ├── agents-repository/  # Agents config persistence + validation
│   ├── models-repository/  # Models config persistence + validation
│   ├── model-proxy-repository/ # Local model-proxy PostgreSQL schema + Prisma client
│   ├── repository-utils/   # Shared storage + JSONC parsing utilities
│   ├── app-repository/     # App-specific DB (Drizzle ORM)
│   └── litellm-repository/ # LiteLLM DB access via Prisma (generated client + raw SQL queries)
├── biome.json               # Biome 2.x (replaces ESLint+Prettier)
├── turbo.json               # Turborepo task pipeline
└── pnpm-workspace.yaml      # apps/* + packages/* + repositories/*
```

## WHERE TO LOOK

| Task                     | Location                                         | Notes                                                |
| ------------------------ | ------------------------------------------------ | ---------------------------------------------------- |
| Add a page/route         | `apps/web/src/App.tsx` + `apps/web/src/pages/`   | Pages own their types, utils, and hooks; use nested children + `Outlet` for tabbed sections              |
| Add a UI component       | `apps/web/src/components/`                       | shadcn primitives at root, domain modules in subdirs |
| Add an API endpoint      | `apps/server/src/runtime/api-server.ts`          | All routes defined here                              |
| Add a data-source method | `services/analytics-service/src/data-source/database.ts` | Must implement `AnalyticsDataSource` interface       |
| Add a DB query           | `services/analytics-service/src/queries/`                | Prisma raw SQL queries via `$queryRawUnsafe`         |
| Add a new data type      | `services/analytics-service/src/types/index.ts`          | Add to interface or type exports                     |
| Change lint/format rules | `biome.json` (root)                              | Single quotes, 80 chars, import auto-organize        |
| Change dev proxy         | `apps/web/vite.config.ts`                        | `/api` → `localhost:3008`                            |
| Add agent config logic   | `services/agent-plugins/src/`                   | Adapters, transformers, CRUD, file generators        |
| Modify agent API routes  | `packages/server-core/src/routes/agent-config-routes.ts` | Express routes using agents-manager                  |
| Add model config logic   | `services/models-service/src/`                   | Provider/model CRUD, alias management                 |
| Modify model API routes  | `packages/server-core/src/routes/model-routes.ts`| Express routes using models-manager                  |
| Add a Models sub-route   | `apps/web/src/features/models/models-layout.tsx` + `App.tsx` | Tab navigation lives in the layout; children render via `Outlet` |

## CONVENTIONS

### Code Style (Biome 2.x)
- **Double quotes**, 2-space indent, 80-char line width
- **verbatimModuleSyntax** — must use `import type` for type-only imports
- **erasableSyntaxOnly** — only TS features that erase at compile time
- **noUnusedLocals / noUnusedParameters** enforced (web app tsconfig)
- Import auto-organization on format (`organizeImports: "on"`)
- **Generated schemas are read-only** — do not edit generated JSON/Zod schema files manually; update the canonical Zod source and regenerate

### Architecture
- **Strategy pattern** for data access: `AnalyticsDataSource` interface (46 methods), with `DatabaseDataSource` as the sole implementation (method implementations composed from 9 \*-methods.ts files, backed by 13 query files via `prisma.$queryRawUnsafe`)
- **Page-level architecture**: Page subdirectories contain hooks/types/utils only (no JSX). Page root `.tsx` files contain JSX. Components live in `components/` and import from page directories
- **State-Actions-Derived pattern**: Complex pages (agent-routing) split into `use-*-state.ts`, `use-*-actions.ts`, `use-*-derived.ts`, composed via `use-*-page.ts`

### TypeScript
- Root targets ES2025, apps target ES2022
- Web app: path alias `@/` → `./src/`
- Server: `declaration: true`, emits `.d.ts`
- Types duplicated in apps/web/src/types/ (imported from @lite-llm/agent-schemas in packages)

### Testing (Vitest 4.x)
- `__tests__/` colocated with source inside `src/`
- Web: jsdom + @testing-library/react, server: node + supertest
- Mocking: `vi.mock()` hoisted, `vi.stubEnv()`, `createMockDataSource()` factory
- `passWithNoTests: true` at root
- **⚠️ Dual test organization**: Both `__tests__/` directories AND `.test.ts` colocated files coexist — no single standard enforced
- **⚠️ createMockDataSource() copy-pasted 3x** across server tests (79 methods each) — not extracted to shared helpers
- **⚠️ TypeScript version fragmentation** across packages (5.7.2 / 5.9.3 / 6.0.3) — root uses 6.0.3
- **⚠️ Vitest version split**: packages/monitor pins ^2.1.8 while rest of repo uses ^4.1.5

## PACKAGES

Detailed documentation in each package's `AGENTS.md`:

### /services (*-service packages)

| Package                      | Entry          | Key Responsibility                                           |
| ---------------------------- | -------------- | ------------------------------------------------------------ |
| `@lite-llm/agent-plugins`   | `src/index.ts` | Plugin system: OpenCode, OpenAgent, VS Code, LiteLLM aliases |
| `@lite-llm/analytics-service`| `src/index.ts` | 46-method AnalyticsDataSource, Prisma raw SQL queries          |
| `@lite-llm/model-proxy-service`| `src/index.ts` | Local OpenAI-compatible proxy, upstream forwarding, request ledger |
| `@lite-llm/models-service`   | `src/index.ts` | Provider/model CRUD, alias DB management                      |

### /packages (shared libraries)

| Package                    | Entry          | Key Responsibility                                           |
| -------------------------- | -------------- | ------------------------------------------------------------ |
| `@lite-llm/agents-manager` | `src/index.ts` | Agent/category CRUD, routing services (coordena múltiplos)    |
| `@lite-llm/server`         | `src/index.ts` | Express routes + orchestration services                      |
| `@lite-llm/monitor`        | `src/index.ts` | SQLite-based anomaly detection, WebSocket broadcast           |
| `@lite-llm/contracts`      | `src/index.ts` | API type contracts                                           |
| `@lite-llm/config`         | `src/index.ts` | Environment variable validation (t3-env, Zod)                 |
| `@lite-llm/prompt-eval`    | `src/index.ts` | Prompt evaluation via promptfoo                               |

### /shared

| Package                    | Entry          | Key Responsibility                                           |
| -------------------------- | -------------- | ------------------------------------------------------------ |
| `@lite-llm/agent-schemas`        | `src/index.ts` | Common types + Zod schemas                                   |


## ANTI-PATTERNS (THIS PROJECT)

- No `as any`, `@ts-ignore`, or `@ts-expect-error` — use proper typing
- No `TODO`/`FIXME`/`HACK` comments — resolve or track externally
- No hardcoded secrets in source — use `.env` files

## UNIQUE STYLES

- **Three consumer configs**: `@storage/output/` contains `oh-my-openagent.json`, `opencode.json`, `vscode-oaicopilot.json` — all generated by `services/agent-plugins` from `db.json`
- **Cost storage**: canonical model costs are stored as USD per token (`input_cost_per_token`, `output_cost_per_token`)
- **Cost formatting**: display helpers may still present `$X.XX/Mi` (per million tokens) by multiplying the per-token value by 1,000,000
- **Generated consumer configs**: OpenCode output continues to express costs in `$/M`; the OpenCode `modelAdapter` performs the `* 1_000_000` conversion at export time
- **Column schema system**: `MODEL_STATS_COLUMNS` declarative array drives table rendering in model-stats
- **Alias resolution**: `resolveModelName()` in agent-routing maps configs through alias table via `useMemo`
- **Collapsible sections**: `expandedSections: Record<string, boolean>` pattern in config editors

## COMMANDS

```bash
pnpm dev          # Start both apps (web on :5178, server on :3008)
pnpm build        # turbo build (tsc + vite for web, tsc for server)
pnpm test         # turbo test (vitest run per app)
pnpm lint         # turbo lint (biome lint)
pnpm format       # turbo format (biome check --write)
pnpm typecheck    # turbo typecheck (tsc --noEmit)

# Single package (faster for iteration)
pnpm --filter @lite-llm/analytics-service typecheck
pnpm --filter @lite-llm/analytics-service build
pnpm --filter @lite-llm/model-proxy-repository db:generate
pnpm --filter @lite-llm/model-proxy-repository db:validate
pnpm --filter @lite-llm/model-proxy-repository typecheck
pnpm --filter @lite-llm/model-proxy-service typecheck
pnpm --filter @lite-llm/model-proxy-service test
pnpm --filter @lite-llm/server typecheck
pnpm --filter @lite-llm/monitor typecheck
pnpm --filter @lite-llm/litellm-repository typecheck

# Prisma / litellm-repository
pnpm --filter @lite-llm/litellm-repository db:generate   # Generate Prisma client
pnpm --filter @lite-llm/litellm-repository db:sync        # Clone schema + migrations from upstream LiteLLM repo
pnpm --filter @lite-llm/litellm-repository db:pull        # Introspect DB tables
pnpm --filter @lite-llm/litellm-repository db:validate    # Validate Prisma schema

# LiteLLM database backup
pnpm backup           # Run LiteLLM database backup with progress display
pnpm backup:list      # List available backup files in backups/
```

## BUILD & CI (Gaps)

- No GitHub Actions or CI pipeline — all checks run manually
- No Docker/containerization — runs on Node.js >= 20 + PostgreSQL 14+
- No remote cache — Turborepo local cache only
- Pre-commit hook runs `pnpm format` only — no lint/type-check
- lint-staged command in scripts but no config file found

## SUBPACKAGE DOCUMENTATION

| Location                              | Coverage                            |
| ------------------------------------- | ----------------------------------- |
| `services/analytics-service/src/queries/`     | Prisma raw SQL query patterns, helpers |
| `services/analytics-service/src/data-source/` | DatabaseDataSource composition      |
| `repositories/litellm-repository/`    | Prisma client + upstream schema sync scripts |
| `services/models-service/src/alias-router/` | Managed alias reconciliation (DB) |
