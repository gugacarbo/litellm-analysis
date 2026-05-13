# PROJECT KNOWLEDGE BASE

**Generated:** 2026-05-13
**Commit:** a6a4e5d
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
│   │       ├── lib/         # API client (modular), utils
│   │       ├── hooks/       # use-dashboard-data, use-logs
│   │       ├── types/       # Shared TypeScript interfaces
│   │       └── data/        # Static agent definition data
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
│   ├── alias-router/        # LiteLLM alias routing resolution
│   ├── analytics/           # DB queries + data source implementation
│   ├── monitor/             # Model health monitoring (SQLite, anomaly detection)
│   ├── server-core/         # Orchestration layer (routes, alias db writer, artifact sync)
│   ├── shared/             # Common types (AgentConfig, CategoryConfig)
│   ├── config/             # Environment variable validation (t3-env, Zod)
│   └── api-contracts/      # API type contracts (analytics, agent-routing)
├── data/                    # Generated JSON configs (OpenCode, VS Code, agent-routing)
├── biome.json               # Biome 2.x (replaces ESLint+Prettier)
├── turbo.json               # Turborepo task pipeline
└── pnpm-workspace.yaml      # apps/* + packages/*
```

## WHERE TO LOOK

| Task                     | Location                                         | Notes                                                |
| ------------------------ | ------------------------------------------------ | ---------------------------------------------------- |
| Add a page/route         | `apps/web/src/App.tsx` + `apps/web/src/pages/`   | Pages own their types, utils, and hooks              |
| Add a UI component       | `apps/web/src/components/`                       | shadcn primitives at root, domain modules in subdirs |
| Add an API endpoint      | `apps/server/src/api-server.ts`                  | All routes defined here                              |
| Add a data-source method | `packages/analytics/src/data-source/database.ts` | Must implement `AnalyticsDataSource` interface       |
| Add a DB query           | `packages/analytics/src/queries/`                | Drizzle ORM queries, camelCase columns               |
| Add a new data type      | `packages/analytics/src/types/index.ts`          | Add to interface or type exports                     |
| Change lint/format rules | `biome.json` (root)                              | Single quotes, 80 chars, import auto-organize        |
| Change dev proxy         | `apps/web/vite.config.ts`                        | `/api` → `localhost:3008`                            |
| Add agent config logic   | `packages/agents-manager/src/`                   | Adapters, transformers, CRUD, file generators        |
| Modify agent API routes  | `apps/server/src/routes/agent-config-routes.ts`  | Express routes using agents-manager                  |

## CONVENTIONS

### Code Style (Biome 2.x)
- **Double quotes**, 2-space indent, 80-char line width
- **verbatimModuleSyntax** — must use `import type` for type-only imports
- **erasableSyntaxOnly** — only TS features that erase at compile time
- **noUnusedLocals / noUnusedParameters** enforced (web app tsconfig)
- Import auto-organization on format (`organizeImports: "on"`)

### Architecture
- **Strategy pattern** for data access: `AnalyticsDataSource` interface (46 methods), with `DatabaseDataSource` as the sole implementation (method implementations composed from 8 \*-methods.ts files, backed by 14 query files)
- **Page-level architecture**: Page subdirectories contain hooks/types/utils only (no JSX). Page root `.tsx` files contain JSX. Components live in `components/` and import from page directories
- **State-Actions-Derived pattern**: Complex pages (agent-routing) split into `use-*-state.ts`, `use-*-actions.ts`, `use-*-derived.ts`, composed via `use-*-page.ts`

### TypeScript
- Root targets ES2025, apps target ES2022
- Web app: path alias `@/` → `./src/`
- Server: `declaration: true`, emits `.d.ts`
- Types duplicated in apps/web/src/types/ (imported from @litellm/shared in packages)

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

| Package                    | Entry          | Key Responsibility                                           |
| -------------------------- | -------------- | ------------------------------------------------------------ |
| `@lite-llm/agents-manager` | `src/index.ts` | Agent/category CRUD, plugin system, config file generators   |
| `@lite-llm/analytics`      | `src/index.ts` | 46-method AnalyticsDataSource interface, Drizzle ORM queries |
| `@lite-llm/alias-router`   | `src/index.ts` | Pure alias resolution functions (no I/O)                     |
| `@litellm/shared`          | `src/index.ts` | Types + Zod schemas for agent/category config                |
| `@lite-llm/server-core`    | `src/index.ts` | Route registration + orchestration services                  |
| `@lite-llm/monitor`        | `src/index.ts` | SQLite-based anomaly detection, WebSocket broadcast          |

## ANTI-PATTERNS (THIS PROJECT)

- No `as any`, `@ts-ignore`, or `@ts-expect-error` — use proper typing
- No `TODO`/`FIXME`/`HACK` comments — resolve or track externally
- No hardcoded secrets in source — use `.env` files

## UNIQUE STYLES

- **Three consumer configs**: `data/` contains `oh-my-openagent.json`, `opencode.json`, `vscode-oaicopilot.json` — all generated by `packages/agents-manager` from `db.json`
- **Cost formatting**: `$X.XX/Mi` (per million tokens) via `getInputCost()`/`getOutputCost()`
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
pnpm --filter @lite-llm/analytics typecheck
pnpm --filter @lite-llm/analytics build
pnpm --filter @lite-llm/server-core typecheck
pnpm --filter @lite-llm/monitor typecheck
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
| `packages/analytics/src/queries/`     | Drizzle ORM query patterns, helpers |
| `packages/analytics/src/data-source/` | DatabaseDataSource composition      |
