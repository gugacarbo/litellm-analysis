# APPS/WEB/SRC/SHARED/TYPES

**Generated:** 2026-07-01
**Commit:** 3029bcb

## OVERVIEW

Browser-safe mirror of domain types from `@lite-llm/agents-repository/schemas`. Avoids runtime repository imports in the web bundle. Types are plain interfaces — no runtime validation (use `@lite-llm/agent-plugins` schemas for validation server-side).

## STRUCTURE

```
apps/web/src/shared/types/
├── connection.ts                       # WebSocket connection state types
├── automatic-interaction-thread.ts     # assistant-ui thread types
└── index.ts                            # Barrel re-exports
```

## KEY TYPES

| File                                | Types                                                                     |
| ----------------------------------- | ------------------------------------------------------------------------- |
| `connection.ts`                     | WebSocket connection state (`Connected`, `Disconnected`, `Reconnecting`)   |
| `automatic-interaction-thread.ts`   | assistant-ui thread message/role types                                    |

## WHERE TO LOOK

| Task                              | Location                                  | Notes                                                |
| --------------------------------- | ----------------------------------------- | ---------------------------------------------------- |
| Add a UI-side type                | `shared/types/<name>.ts`                  | Mirror from `@lite-llm/agents-repository/schemas`; export via `index.ts` |
| Add a new feature type            | `features/<feature>/types/`               | Feature owns its types; only cross-feature types go here |
| Server-side validation            | `@lite-llm/agent-plugins/src/plugin-config-schemas.ts` | Types here are runtime-free for browser bundle size |

## CONVENTIONS

- **Plain interfaces only** — no Zod schemas in the web bundle (browser bundle size constraint)
- **Types consumed by**: `features/*`, `shared/components/*`, `shared/lib/api-client/*`
- **Mirrored, not imported**: types here mirror `@lite-llm/agents-repository/schemas` to keep the web bundle free of repository/runtime deps
- **Sync mirror required**: when changing a mirrored type, update both sides in the same PR
- **No JSX, no runtime logic** — types only

## ANTI-PATTERNS (THIS PROJECT)

- Do not add Zod schemas here — keep web bundle Zod-free; use `@lite-llm/agent-plugins` server-side
- Do not duplicate types that belong in `features/<feature>/types/` — only cross-feature shared types go here
- Do not import from `@lite-llm/agents-repository` or `@lite-llm/agents-repository/schemas` at runtime — keep browser types local
- Do not add types that exist elsewhere — extend the existing `*.ts` file instead
