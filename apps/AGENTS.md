# APPS KNOWLEDGE BASE

**Generated:** 2026-07-01
**Commit:** 3029bcb

## OVERVIEW

Two deployable apps in a pnpm + Turborepo monorepo: a React 19 SPA (`apps/web`) and an Express.js server (`apps/server`). Both depend on `@lite-llm/*` workspace packages and run via `pnpm dev` (parallel via turbo).

## STRUCTURE

```
apps/
├── web/                # React 19 + Vite 7 SPA (shadcn/ui, Recharts, Tailwind 4)
│   └── src/
│       ├── features/   # Domain feature modules (logs, models, monitor, etc.) — main code home
│       ├── shared/     # Cross-feature primitives (components, types, utils, hooks, lib)
│       ├── pages/      # Empty: legacy `pages/` migrated to `features/`; kept for back-compat
│       ├── app.tsx     # Root component
│       └── main.tsx    # Vite entry
└── server/             # Express.js entry point + monitor runtime + WebSocket
    └── src/            # See apps/server/AGENTS.md
```

## WHERE TO LOOK

| Task                          | Location                          | Notes                                                  |
| ----------------------------- | --------------------------------- | ------------------------------------------------------ |
| Add a new feature/route (web) | `apps/web/src/features/<name>/`   | Owns components, hooks, types, utils; mount in App.tsx |
| Add a shared UI primitive     | `apps/web/src/shared/components/` | Cross-feature; keep narrow                             |
| Add a backend route           | `apps/server/src/runtime/`        | See `apps/server/AGENTS.md` for the runtime split      |
| Change dev port / proxy       | `apps/web/vite.config.ts`         | `/api` → `localhost:3008`                              |
| Add a monitor runtime service | `apps/server/src/application/`    | Business services, no Express knowledge                |
| Add a monitor route           | `apps/server/src/routes/`         | Thin Express adapters over application services        |

## CONVENTIONS

- **Feature isolation:** features import from `shared/`, never the reverse; features don't import each other except via App.tsx composition
- **State hooks own their types:** page-level hooks colocated with pages, complex state split into `use-*-state.ts` / `use-*-actions.ts` / `use-*-derived.ts`
- **Server runtime layering:** `runtime/` (Express app factory) + `application/` (business services) + `routes/` (thin adapters) + `ws/` (WebSocket)
- **Shared types:** types duplicated in `apps/web/src/shared/types/` (mirrored from `@lite-llm/agents-repository/schemas`) — web app avoids runtime imports of repository/runtime deps
- **No server code in web app:** keep `apps/web` browser-only; Node-only libs must live in shared packages

## ANTI-PATTERNS (THIS PROJECT)

- Do not reintroduce `apps/web/src/components/`, `apps/web/src/hooks/`, `apps/web/src/lib/`, `apps/web/src/types/` as top-level — they were refactored into `features/` + `shared/`
- Do not put routes in `apps/web/src/pages/` — that directory is empty by design
- Do not import Node-only modules from `apps/web`
- Do not add `tsconfig.json` path aliases beyond `@/` → `./src/`
