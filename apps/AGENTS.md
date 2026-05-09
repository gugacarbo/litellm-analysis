# apps/ KNOWLEDGE BASE

## OVERVIEW

Apps directory with React 19 frontend (web) and Express.js backend (server). 307 TypeScript files.

## STRUCTURE

```
apps/
├── web/                    # React 19 + Vite 7 SPA
│   └── src/
│       ├── components/      # shadcn/ui primitives + domain modules
│       ├── pages/           # Route pages (JSX) + hooks/types/utils
│       ├── hooks/           # React Query data-fetching hooks
│       ├── lib/             # API client, utils
│       └── types/           # Shared TypeScript interfaces
└── server/                 # Express.js entry point + monitor + WebSocket
    └── src/
        ├── runtime/         # Express app factory, server bootstrap, monitor runtime
        ├── application/     # Business services (monitor application service)
        ├── routes/          # Monitor-specific routes
        ├── ws/              # WebSocket server for live data
        ├── __tests__/       # Integration tests
        └── env.ts           # Environment config re-export
```

## SUBAGENTS.md LOCATIONS

| Location                            | Content                                    |
| ----------------------------------- | ------------------------------------------ |
| `apps/web/src/components/AGENTS.md` | UI components, shadcn primitives, Recharts |
| `apps/web/src/pages/AGENTS.md`      | Route pages, State-Actions-Derived pattern |
| `apps/web/src/hooks/AGENTS.md`      | React Query hooks, WebSocket               |
| `apps/web/src/lib/AGENTS.md`        | API client, React Query setup              |
| `apps/web/src/types/AGENTS.md`      | Agent/category types, AGENT_DEFINITIONS    |

## WHERE TO LOOK

| Task               | Location                                       | Notes                                     |
| ------------------ | ---------------------------------------------- | ----------------------------------------- |
| Add a page/route   | `apps/web/src/App.tsx` + `apps/web/src/pages/` | Pages own types/hooks/utils               |
| Add UI component   | `apps/web/src/components/`                     | shadcn at root, domain in subdirs         |
| Add API endpoint   | `packages/server-core/src/routes/`             | Express routes registered via server-core |
| Add monitor routes | `apps/server/src/routes/monitor-routes.ts`     | Monitor-specific endpoints                |
| Change dev proxy   | `apps/web/vite.config.ts`                      | `/api` → `localhost:3008`                 |

## CONVENTIONS

### Code Style (Biome 2.x)
- Double quotes, 2-space indent, 80-char line width
- `verbatimModuleSyntax` — must use `import type` for type-only imports
- `erasableSyntaxOnly` — only TS features that erase at compile time

### Architecture
- **Strategy pattern** — data access via `AnalyticsDataSource` interface
- **Page-level isolation** — pages own hooks/types/utils, components import from pages
- **State-Actions-Derived** — complex pages split into 3 hook files
- **Reverse deps** — components → pages → types/hooks (never the other way)

### TypeScript
- Web: `@/` alias → `./src/`
- Server: `declaration: true`, emits `.d.ts`

## ANTI-PATTERNS

- No `as any`, `@ts-ignore`, `@ts-expect-error`
- No `TODO`/`FIXME`/`HACK` comments
- No barrel `index.ts` exports in component subdirectories
- No imports from `../../types/` when page-level types exist

## COMMANDS

```bash
pnpm dev          # Start web (:5178) + server (:3008)
pnpm build        # Turbo build
pnpm test         # Vitest run per app
pnpm lint         # Biome lint
pnpm format       # Biome format
pnpm typecheck    # TypeScript check
```

## NOTES

- Web dev proxy strips `/api` prefix before forwarding to server
- Server port defaults to 3000 but `.env` uses 3008
- Monitor routes registered separately from server-core routes
- No CI/CD — all checks run manually
