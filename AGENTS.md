# PROJECT KNOWLEDGE BASE

**Generated:** 2026-04-23
**Commit:** e47a421
**Branch:** main

## OVERVIEW

LiteLLM Analytics Dashboard — full-stack TypeScript monorepo for monitoring LLM API usage, costs, and errors via LiteLLM's PostgreSQL database. React 19 frontend + Express.js backend, deployed as a single web app with optional direct-DB or API-only data access modes.

## STRUCTURE

```
litellm-analysis/
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
├── data/                    # Generated JSON configs (OpenCode, VS Code, agent-routing)
├── biome.json               # Biome 2.x (replaces ESLint+Prettier)
├── turbo.json               # Turborepo task pipeline
└── pnpm-workspace.yaml      # apps/* + packages/* (packages/ unused)
```

## WHERE TO LOOK

| Task                     | Location                                                                           | Notes                                                |
| ------------------------ | ---------------------------------------------------------------------------------- | ---------------------------------------------------- |
| Add a page/route         | `apps/web/src/App.tsx` + `apps/web/src/pages/`                                     | Pages own their types, utils, and hooks              |
| Add a UI component       | `apps/web/src/components/`                                                         | shadcn primitives at root, domain modules in subdirs |
| Add an API endpoint      | `apps/server/src/api-server.ts`                                                    | All routes defined here                              |
| Add a DB query           | `apps/server/src/db/queries.ts`                                                    | Drizzle ORM, camelCase column mappings               |
| Add a data-source method | `apps/server/src/data-source/interface.ts` → implement in `database.ts` + `api.ts` | Must add to `AnalyticsCapabilities`                  |
| Change feature gating    | `apps/web/src/components/feature-gate.tsx`                                         | Wraps destructive/limited features                   |
| Change lint/format rules | `biome.json` (root)                                                                | Single quotes, 80 chars, import auto-organize        |
| Change dev proxy         | `apps/web/vite.config.ts`                                                          | `/api` → `localhost:3008`                            |

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

## ANTI-PATTERNS (THIS PROJECT)

- No `as any`, `@ts-ignore`, or `@ts-expect-error` — use proper typing
- No `TODO`/`FIXME`/`HACK` comments — resolve or track externally
- No hardcoded secrets in source — use `.env` files
- Dual linting exists (Biome root + ESLint web) — prefer Biome for new rules

## UNIQUE STYLES

- **Three consumer configs**: `data/` contains `oh-my-openagent.json`, `opencode.json`, `vscode-oaicopilot.json` — all generated by `services/config-file.ts` from DB state
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
```

## NOTES

- No CI/CD pipeline exists — all checks run manually
- No Docker/containerization — runs on Node.js >= 20 + PostgreSQL 14+
- `packages/*` workspace slot declared but empty
- README structure is outdated — actual structure has `apps/server/` as separate app, not inside `apps/web/src/server/`
- Web dev proxy strips `/api` prefix before forwarding to server
- Server port defaults to 3000 (env) but `.env` uses 3008; Vite proxy targets 3008
