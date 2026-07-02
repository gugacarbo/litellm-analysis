# @SETTINGS KNOWLEDGE BASE

**Generated:** 2026-07-01
**Commit:** 3029bcb

## OVERVIEW

Seed/backup configuration directory for agents and plugins. Model/provider routing now lives in the `model_proxy_models` and `model_proxy_providers` tables; `pnpm settings:import` / `pnpm settings:export` only cover the remaining file-backed settings here.

## STRUCTURE

```
@settings/
├── agents/
│   ├── agents.jsonc          # Canonical agent/category config
│   └── agents.schema.json    # Zod-derived JSON Schema (generated, do not edit)
└── plugins/
    ├── plugins.jsonc         # Plugin manifests (OpenCode, OpenAgent, VS Code)
    └── plugins.schema.json   # Zod-derived JSON Schema (generated, do not edit)
```

## WHERE TO LOOK

| Task                                  | Location                          | Notes                                            |
| ------------------------------------- | --------------------------------- | ------------------------------------------------ |
| Add an agent or category              | `@settings/agents/agents.jsonc`   | Validated by `agents.schema.json`                |
| Inspect provider or model routing     | `model_proxy_models` / `model_proxy_providers` | Database-backed registry; not file-backed        |
| Add a plugin manifest                 | `@settings/plugins/plugins.jsonc` | Validated by `plugins.schema.json`               |
| Regenerate a Zod schema               | `repositories/agents-repository/` | Source Zod for file-backed settings lives in repositories |
| Migrate settings → DB                 | `pnpm settings:import`            | Idempotent; imports agents + plugins only         |
| Backup DB → settings                  | `pnpm settings:export`            | Exports agents + plugins only                     |

## CONVENTIONS

- **JSONC with trailing comments** allowed in seed files
- **Schemas are generated** — do not edit `*.schema.json` manually; update the Zod source in `repositories/*` and run the generator for the file-backed settings that still exist
- **Single source of truth per concern:** agents live only in `agents/`, plugins only in `plugins/`, and model/provider routing lives only in the database registry tables
- **Stable IDs:** agent IDs and category IDs are stable identifiers — renames break routing; deprecate-then-create if needed

## ANTI-PATTERNS (THIS PROJECT)

- Do not hand-edit `*.schema.json` files
- Do not commit raw database exports here — use `pnpm settings:export` (normalizes to JSONC)
- Do not introduce new top-level directories under `@settings/` (only `agents/`, `plugins/`)
- Do not add secret values — credentials belong in env/secret storage and provider rows live in `model_proxy_providers`
