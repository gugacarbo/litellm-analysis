# PROJECT KNOWLEDGE BASE

**Generated:** 2026-07-01
**Commit:** 3029bcb
**Branch:** main

## OVERVIEW

LiteLLM Analytics Dashboard — full-stack TypeScript monorepo (pnpm + Turborepo, 22 workspace packages) for monitoring LLM API usage, costs, and errors via the **local model proxy** (`model_proxy_*` PostgreSQL). Runtime uses only `MODEL_PROXY_DATABASE_URL` (legacy LiteLLM DBs intentionally unsupported — see `docs/litellm-legacy-support-inventory.md`).

## STRUCTURE

```
lite-llm-analytics/
├── apps/
│   ├── web/                # React 19 + Vite 7 SPA (shadcn/ui, Recharts, Tailwind 4)
│   │   └── src/features/   # Domain feature modules (logs, models, monitor, etc.)
│   │       shared/        # Cross-feature primitives (components, types, utils, hooks, lib)
│   │       pages/         # Empty — features/ holds routed content
│   │       app.tsx         # Root component
│   │       main.tsx        # Vite entry
│   └── server/             # Express.js entry point + monitor + WebSocket
│       └── src/runtime/    # Express app factory, server bootstrap, monitor runtime
│           application/    # Business services (monitor application service)
│           routes/         # Monitor-specific Express routes
│           ws/            # WebSocket server for live data
│           __tests__/     # Integration tests
├── services/               # 8 backend service packages
│   ├── analytics-service/        # 46-method AnalyticsDataSource, Prisma raw SQL
│   ├── model-proxy-service/      # Local OpenAI-compatible proxy, upstream forwarding
│   ├── model-proxy-registry-service/ # model_proxy_* settings, registry, credentials
│   ├── models-service/           # Provider/model CRUD, alias DB management
│   └── agent-plugins/            # OpenCode/OpenAgent/VS Code plugin system
├── packages/               # 7 shared libraries
│   ├── server/             # Express routes + orchestration services
│   ├── monitor/            # SQLite-based anomaly detection, WebSocket broadcast
│   ├── agents-manager/     # Agent/category CRUD, routing services
│   ├── agent-schemas/      # Common types + Zod schemas
│   ├── contracts/          # API type contracts
│   ├── config/             # Environment variable validation (t3-env + Zod)
│   └── prompt-eval/        # Prompt evaluation via promptfoo
├── repositories/           # Config + DB repositories
│   ├── agents-repository/  # Agents config persistence + validation
│   ├── models-repository/  # Models config persistence + validation
│   ├── model-proxy-repository/ # model_proxy_* Prisma schema
│   ├── app-repository/     # App-specific DB (Drizzle ORM)
│   └── repository-utils/   # Shared storage + JSONC parsing utilities
├── @settings/              # Seed/backup configs (with Zod schemas in *.schema.json)
│   ├── agents/             # agents.jsonc + agents.schema.json
│   ├── models/             # models.jsonc + models.schema.json
│   └── plugins/            # plugins.jsonc + plugins.schema.json
├── @storage/               # Generated data, no code
│   ├── output/             # Generated consumer configs (OpenCode, OpenAgent, VS Code)
│   ├── benchmarks/         # Artificial Analysis data
│   ├── reports/            # Prompt eval reports (runtime-created)
│   └── backups/            # model_proxy_* DB backups
├── scripts/                # Build/dev/backup CLI tools
├── docs/                   # Architecture + operational notes
├── biome.json              # Biome 2.x (double quotes, 2-space indent, 80 chars)
├── turbo.json              # Turborepo task pipeline
└── pnpm-workspace.yaml     # services/* + packages/* + repositories/* + apps/* + scripts/*
```

## WHERE TO LOOK

| Task                              | Location                                                | Notes                                                                |
| --------------------------------- | ------------------------------------------------------- | -------------------------------------------------------------------- |
| Add a web feature/route           | `apps/web/src/features/<feature>/`                      | Features own routes, components, hooks, types, utils                 |
| Add a shared UI component         | `apps/web/src/shared/components/`                       | Cross-feature primitives only; feature-specific lives in features/   |
| Add a server endpoint             | `apps/server/src/runtime/`                              | App entry point lives in runtime/                                    |
| Add an orchestration route        | `packages/server/src/routes/`                           | Shared/business-logic routes (model-config, agent-config, chat)      |
| Add a data-source method          | `services/analytics-service/src/data-source/model-proxy.ts` | Must implement `AnalyticsDataSource` (46 methods)                |
| Add a DB query                    | `services/analytics-service/src/queries/proxy/`         | Prisma raw SQL via `$queryRawUnsafe`                                 |
| Modify cost computation           | `repositories/models-repository/` + `packages/agents-manager/` | Canonical costs are USD per token; `*1_000_000` at display/export |
| Add agent config logic            | `services/agent-plugins/src/` + `packages/agents-manager/` | Plugin adapters + shared CRUD                                       |
| Add model config logic            | `services/models-service/src/` + `packages/server/src/orchestration/` | Provider/model CRUD + alias orchestration                  |
| Settings import/export            | `scripts/src/settings-import/`, `scripts/src/settings-export/` | Hydrates `model_proxy_*` from `@settings/*`                          |

## CONVENTIONS

### Code Style (Biome 2.x)
- **Double quotes**, 2-space indent, 80-char line width
- `verbatimModuleSyntax` — must use `import type` for type-only imports
- `erasableSyntaxOnly` — only TS features that erase at compile time
- `noUnusedLocals` / `noUnusedParameters` enforced (web app tsconfig)
- Import auto-organization on format (`organizeImports: "on"`)
- **Generated schemas are read-only** — do not edit generated JSON/Zod schema files manually

### Architecture
- **Data access:** `AnalyticsDataSource` interface (46 methods) implemented by `ModelProxyDataSource` (`model_proxy_*`). Factory: `createDataSource()` in `services/analytics-service/src/data-source/index.ts`.
- **Feature-module pattern (web):** each feature in `apps/web/src/features/<name>/` owns its routes, components, hooks, types, utils. Shared primitives in `apps/web/src/shared/`.
- **State-Actions-Derived pattern:** complex features (agent-routing) split into `use-*-state.ts`, `use-*-actions.ts`, `use-*-derived.ts`, composed via `use-*-page.ts`.
- **Service-layer pattern (server):** `apps/server/src/` follows runtime/ (Express app factory) + application/ (business services) + routes/ + ws/ separation.
- **Orchestration pattern (server):** `packages/server/src/orchestration/` holds services that coordinate across multiple data sources.
- **Plugin adapters (services/agent-plugins):** per-consumer config generators (OpenCode, OpenAgent, VS Code Copilot).

### TypeScript
- Root targets ES2025, apps target ES2022
- Web app: path alias `@/` → `./src/`
- Server: `declaration: true`, emits `.d.ts`
- **TypeScript catalog version: 6.0.3** (pnpm catalog) — fragmentation noted: some packages still on 5.7.2/5.9.3

### Testing (Vitest)
- Vitest 4.1.5 (workspace-wide) — **except** `packages/monitor` pinned to ^2.1.8
- `__tests__/` colocated with source inside `src/`
- Web: jsdom + @testing-library/react; server: node + supertest
- Mocking: `vi.mock()` hoisted, `vi.stubEnv()` for env vars
- `passWithNoTests: true` at root
- **Dual test organization**: `__tests__/` directories AND `.test.ts` colocated files coexist

### Costs
- Canonical model costs stored as USD per token (`input_cost_per_token`, `output_cost_per_token`)
- Display helpers may present `$X.XX/Mi` by multiplying the per-token value by 1,000,000
- Generated consumer configs continue expressing costs in `$/M`; the `modelAdapter` performs `* 1_000_000` at export time

## ANTI-PATTERNS (THIS PROJECT)

- No `as any`, `@ts-ignore`, or `@ts-expect-error` — use proper typing
- No `TODO`/`FIXME`/`HACK` comments in source — resolve or track externally
- No hardcoded secrets in source — use `.env` files
- No editing of generated JSON/Zod schema files manually — update the canonical Zod source and regenerate
- No introducing new top-level workspace packages without updating `pnpm-workspace.yaml` + `turbo.json`
- No mocking the `AnalyticsDataSource` interface ad-hoc in server tests — use the `createMockDataSource()` factory in `apps/server/src/__tests__/helpers/`

## COMMANDS

```bash
pnpm dev                       # Start both apps (web on :5178, server on :3008)
pnpm build                     # turbo build (tsc + vite for web, tsc for server)
pnpm test                      # turbo test (vitest run per app)
pnpm lint                      # turbo lint (biome lint)
pnpm format                    # turbo format (biome check --write)
pnpm typecheck                 # turbo typecheck (tsc --noEmit)

# Local PostgreSQL (docker/podman via scripts/db-compose.sh)
pnpm db:up                     # Start postgres (reads .env / .env.local)
pnpm db:down                   # Stop postgres container
pnpm db:migrate                # Apply model-proxy Prisma migrations (deploy)

# Settings sync
pnpm settings:import           # @settings → model_proxy_* (migration)
pnpm settings:export           # model_proxy_* → @settings backup

# Single package
pnpm --filter @lite-llm/analytics-service typecheck
pnpm --filter @lite-llm/monitor typecheck

# Model proxy database backup
pnpm backup                    # MODEL_PROXY_DATABASE_URL (model_proxy_*)
```

## BUILD & CI (Gaps)

- No GitHub Actions or CI pipeline — all checks run manually
- No Docker/containerization — runs on Node.js >= 20 + PostgreSQL 14+
- No remote cache — Turborepo local cache only
- Pre-commit hook runs `pnpm format` only — no lint/type-check
- Knip config exists at root for unused-export detection
