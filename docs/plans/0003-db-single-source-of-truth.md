# Database becomes single source of truth — Implementation Plan

> **For agentic workers:** Use subagent-driven development to implement this plan task-by-task.
> The executable source of truth is `docs/tasks/0003-db-single-source-of-truth/tasks.json`.

**Goal:** Remove `@settings/` entirely so the PostgreSQL database is the only source of truth for agents, models, and plugins. No runtime code, script, test, or documentation may depend on files under `@settings/`.

**Architecture:** The workspace currently keeps canonical JSONC seeds under `@settings/` and hydrates them into `model_proxy_*` tables via `pnpm settings:import`. This plan eliminates that directory and all associated import/export/validation scripts. Runtime services already read from the database through repository clients; the remaining work is to delete the dead paths, scripts, env var, schemas, and outdated documentation.

**Tech Stack:** TypeScript, pnpm workspace, Vitest, Biome, Drizzle/PostgreSQL, existing agents-manager and repositories.

## Global Constraints

- Database is the single source of truth for agents, models, and plugins.
- No service, script, test, or documentation may reference `@settings/` after implementation.
- Plugin output artefacts in `@storage/output/` continue to be generated, now sourced from the DB.
- No data migration from JSONC to the DB will be performed.
- No backward-compatibility or fallback to `@settings/` will be kept.
- All changes must pass:
  ```bash
  npm run typecheck        # exit 0
  npm test                 # all green
  pnpm docs-check          # exit 0
  ```

## File Structure

| File/Directory | Owner Task | Notes |
| -------------- | ---------- | ----- |
| `package.json` (root) | C-0002 | Remove `settings:*`, `generate:agents-schema`, `validate:agents*` scripts |
| `.env.example` | A-0003 | Remove `SETTINGS_PATH` |
| `.env.local` | A-0003 | Remove `SETTINGS_PATH` |
| `packages/config/src/server.ts` | A-0003 | Remove `SETTINGS_PATH` env schema |
| `scripts/src/settings-import/` | A-0002 | Delete entire directory |
| `scripts/src/settings-export/` | A-0002 | Delete entire directory |
| `scripts/src/generate-schema/` | A-0002 | Delete entire directory |
| `scripts/src/validate-agents/` | A-0002 | Delete entire directory |
| `scripts/src/settings-import/parse.ts` | A-0001 | Remove `readModelsFile` dead code |
| `scripts/src/settings-import/paths.ts` | A-0001 | Remove `modelsFile` dead path |
| `scripts/src/settings-import/index.test.ts` | A-0001 | Delete broken test or remove model import references |
| `scripts/src/generate-schema/index.ts` | A-0001 | Remove `modelsConfigSchema` generation |
| `apps/server/src/runtime/app-runtime.ts` | B-0001 | Stop building `@settings/agents/agents.json` path |
| `packages/agents-manager/src/config/defaults.ts` | B-0001 | Remove `DEFAULT_AGENTS_PATH` based on `SETTINGS_PATH` |
| `packages/agents-manager/src/index.ts` | B-0001 | Adjust `createAgentsManager` options if path is removed |
| `packages/agents-manager/src/repository/client.ts` | B-0001 | Clean unused `agentsFilePath`/`pluginsFilePath` options |
| `repositories/agents-repository/package.json` | B-0002 | Remove AJV validation scripts |
| `repositories/agents-repository/src/schemas/__tests__/validate-json-schema.test.ts` | B-0002 | Stop reading `@settings/agents.schema.json` |
| `services/agent-plugins/` | B-0003 | Verify DB sourcing; no code change expected, only docs |
| `@settings/` | C-0003 | Delete entire directory |
| `@settings/AGENTS.md` | C-0001 | Delete |
| `packages/agents-manager/src/AGENTS.md` | C-0001 | Remove `@settings` references |
| `services/agent-plugins/AGENTS.md` | C-0001 | Remove `@settings` references |
| `README.md` | C-0001 | Remove `@settings` / `pnpm settings:import` references |
| `docs/specs/0003-db-single-source-of-truth-spec.md` | D-0002 | Set `status: implemented` and fill `implemented-by` |

## Task Registry

- **Registry:** `docs/tasks/0003-db-single-source-of-truth/tasks.json`
- **Progress log:** `docs/tasks/0003-db-single-source-of-truth/progress.log`
- **Progress ledger:** `docs/tasks/0003-db-single-source-of-truth/progress-ledger.md`
