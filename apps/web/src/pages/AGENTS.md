# APPS/WEB/SRC/PAGES

**Generated:** 2026-07-01
**Commit:** 3029bcb

## OVERVIEW

**MIGRATED — this directory is intentionally empty.** All pages moved to `apps/web/src/features/<feature>/` (each feature owns its routes, components, hooks, types, utils). The `pages/` directory is kept as a back-compat placeholder and contains only the `__tests__/` migration tests for the refactor.

## CURRENT STATE

```
apps/web/src/pages/
├── AGENTS.md       # this file (migration notice)
└── __tests__/      # Migration-coverage tests for the pages → features refactor
```

## WHAT WENT WHERE

| Old path (migrated out)                    | New path                                          |
| ------------------------------------------ | ------------------------------------------------- |
| `pages/dashboard.tsx`                      | `features/dashboard/`                             |
| `pages/errors.tsx`                         | `features/logs/`                                  |
| `pages/logs.tsx`                          | `features/logs/`                                  |
| `pages/model-detail.tsx`                   | `features/models/detail/`                         |
| `pages/model-stats.tsx`                   | `features/model-stats/`                           |
| `pages/models.tsx`                        | `features/models/`                                |
| `pages/agent-routing.tsx`                  | `features/agent-routing/`                         |
| `pages/dashboard/{types,utils}.ts`         | `features/dashboard/{types,utils}.ts`             |
| `pages/model-stats/{types,utils}.ts`       | `features/model-stats/{types,utils}.ts`           |
| `pages/models/{form-data,utils}.ts`         | `features/models/detail/{form-data,utils}.ts`     |
| `pages/agent-routing/use-*.ts`             | `features/agent-routing/use-*.ts`                 |

## CONVENTIONS

- **All new routes live under `features/<feature>/`** — do not add files to `pages/`
- **Each feature module owns its complete vertical**: route entry, components, hooks, types, utils
- **Shared primitives go to `shared/`** — never to `pages/`
- **Reverse dependency still holds**: components in `shared/` may import from `features/<feature>/{types,utils}`, but never the reverse

## ANTI-PATTERNS (THIS PROJECT)

- Do not add new pages to this directory — `pages/` is deprecated
- Do not reintroduce the old `pages/<page>.tsx` layout — feature-module pattern only
- Do not import from `../pages/` — use `../features/` or `../shared/` instead