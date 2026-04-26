# packages/analytics/src/

## OVERVIEW
DB queries (Drizzle ORM) + data source implementations (Database, Api, Limited modes). Strategy pattern with 31-method interface.

## STRUCTURE

```
analytics/src/
├── data-source/
│   ├── index.ts      # Factory: createDataSource(), detectMode()
│   ├── types.ts      # DATABASE/LIMITED/API capabilities, 28 flags
│   ├── database.ts   # DatabaseDataSource (direct Drizzle)
│   └── api.ts        # ApiDataSource (LiteLLM REST API)
├── queries/
│   ├── index.ts     # 648 lines of Drizzle ORM queries
│   ├── schema.ts    # Table definitions
│   └── client.ts    # DB connection
├── types/
│   └── index.ts     # AnalyticsDataSource interface (31 methods)
└── index.ts         # Barrel: re-exports from submodules
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Add query | `queries/index.ts` | `db.select({}).from(schema.spendLogs)` |
| Add data method | `types/index.ts` interface → implement in `database.ts` + `api.ts` | Add capability flag |
| Change capabilities | `data-source/types.ts` | 28 flags in 3 constants |
| Fix mode detection | `data-source/index.ts` → `detectMode()` | Priority: ACCESS_MODE → DB_HOST → LITELLM_API_URL |

## CONVENTIONS

### Adding Queries
1. Add to `queries/index.ts`
2. Use `db.select({}).from(schema.spendLogs)` pattern
3. Map camelCase DB columns to snake_case API response
4. Wrap numerics with `Number()` for safety

### Adding Data Source Methods
1. Add signature to `AnalyticsDataSource` interface in `types/index.ts`
2. Implement in `data-source/database.ts`
3. Implement in `data-source/api.ts`
4. Update capability constants in `data-source/types.ts`

## ANTI-PATTERNS

- Don't use class inheritance to split large data source classes
- Don't assume `null` from DB — always `Number()` or default
- Don't hardcode mode detection outside `detectMode()`
