# @SETTINGS KNOWLEDGE BASE

**Generated:** 2026-07-01
**Commit:** 3029bcb

## OVERVIEW

Seed/backup configuration directory — version-controlled canonical source of truth for agents, models, and plugins. Hydrated into `model_proxy_*` PostgreSQL via `pnpm settings:import`; exportable back via `pnpm settings:export` for backup/restore.

## STRUCTURE

```
@settings/
├── agents/
│   ├── agents.jsonc          # Canonical agent/category config
│   └── agents.schema.json    # Zod-derived JSON Schema (generated, do not edit)
├── models/
│   ├── models.jsonc          # Canonical provider/model config
│   └── models.schema.json    # Zod-derived JSON Schema (generated, do not edit)
└── plugins/
    ├── plugins.jsonc         # Plugin manifests (OpenCode, OpenAgent, VS Code)
    └── plugins.schema.json   # Zod-derived JSON Schema (generated, do not edit)
```

## WHERE TO LOOK

| Task                                  | Location                          | Notes                                            |
| ------------------------------------- | --------------------------------- | ------------------------------------------------ |
| Add an agent or category              | `@settings/agents/agents.jsonc`   | Validated by `agents.schema.json`                |
| Add a provider or model               | `@settings/models/models.jsonc`   | Validated by `models.schema.json`                |
| Add a plugin manifest                 | `@settings/plugins/plugins.jsonc` | Validated by `plugins.schema.json`               |
| Regenerate a Zod schema               | `repositories/agents-repository/` / `repositories/models-repository/` | Source Zod lives in repositories |
| Migrate settings → DB                 | `pnpm settings:import`            | Idempotent; safe to re-run                        |
| Backup DB → settings                  | `pnpm settings:export`            | Writes timestamped JSONC                          |

## CONVENTIONS

- **JSONC with trailing comments** allowed in seed files
- **Schemas are generated** — do not edit `*.schema.json` manually; update the Zod source in `repositories/*` and run the generator
- **Single source of truth per concern:** agents live only in `agents/`, models only in `models/`, plugins only in `plugins/`
- **Stable IDs:** agent IDs and category IDs are stable identifiers — renames break routing; deprecate-then-create if needed

## ANTI-PATTERNS (THIS PROJECT)

- Do not hand-edit `*.schema.json` files
- Do not commit raw database exports here — use `pnpm settings:export` (normalizes to JSONC)
- Do not introduce new top-level directories under `@settings/` (only `agents/`, `models/`, `plugins/`)
- Do not add secret values — credentials belong in `.env` or `model_proxy_providers` table
