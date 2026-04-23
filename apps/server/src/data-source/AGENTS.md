# AGENTS.md — data-source

## OVERVIEW
Strategy pattern implementation for data access with three modes: database, limited, and API-only.

## STRUCTURE

```
data-source/
├── interface.ts          # AnalyticsDataSource interface (30+ methods)
├── types.ts              # Data types, AnalyticsCapabilities (28 flags), DataSourceMode
├── database.ts           # DatabaseDataSource — full access via Drizzle
├── api.ts                # ApiDataSource — LiteLLM REST API, read-only
├── index.ts              # Factory: detectMode(), createDataSource()
└── __tests__/
    ├── capabilities.test.ts
    └── detectMode.test.ts
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Add new data method | `interface.ts` → implement in `database.ts` + `api.ts` | Must add to `AnalyticsCapabilities` |
| Add capability flag | `types.ts` → update `DATABASE_CAPABILITIES`, `LIMITED_CAPABILITIES`, `API_CAPABILITIES` | 28 flags currently |
| Change mode detection | `index.ts` → `detectMode()` | Priority: ACCESS_MODE → DB_HOST → LITELLM_API_URL → database |
| Add API endpoint support | `api.ts` → `ApiDataSource` class | LiteLLM endpoints: `/daily_metrics`, `/global/spend/report`, `/spend/logs` |
| Fix Drizzle result mapping | `database.ts` → query methods | Explicit `Number()` wrapping, date formatting |
| Test capability flags | `__tests__/capabilities.test.ts` | Verify LIMITED_CAPABILITIES has expected false flags |

## CONVENTIONS

### Capability Flags
- `AnalyticsCapabilities` has 28 boolean flags — every new feature must add a flag to the interface AND all three capability constants
- `DATABASE_CAPABILITIES`: all 28 flags true
- `LIMITED_CAPABILITIES`: 9 flags false (no create/delete/merge models, no agent routing)
- `API_CAPABILITIES`: 13 flags false (no error logs, no model management, no agent routing, no detailed latency)

### Data Mapping
- `DatabaseDataSource` maps Drizzle results (camelCase) to API types (snake_case)
- Explicit `Number()` wrapping for numeric fields from DB
- Date formatting: `toISOString()` for consistency

### Mode Detection
- Priority order: `ACCESS_MODE` env → `DB_HOST` → `LITELLM_API_URL` → fallback database
- Factory returns `DatabaseDataSource` (with optional `LIMITED_CAPABILITIES`) or `ApiDataSource`

### Lazy Loading
- Agent routing config methods use dynamic `import()` for `services/config-file.js`
- Avoids circular dependencies and unnecessary loading

## ANTI-PATTERNS

- Don't add a method to the interface without updating all three capability constants
- Don't assume `null` from DB — always wrap with `Number()` or default
- Don't hardcode mode detection logic outside `detectMode()`
- Don't import config-file services statically — use dynamic import
