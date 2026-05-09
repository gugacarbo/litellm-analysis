# packages/analytics/src/

## OVERVIEW
DB queries (Drizzle ORM) + data source implementation. Strategy pattern with 46-method interface.

## STRUCTURE

```
analytics/src/
├── data-source/
│   ├── index.ts      # Factory: createDataSource()
│   ├── database.ts   # DatabaseDataSource (direct Drizzle, composed from 14 *-queries.ts files)
│   └── utils.ts      # Data source utilities
├── queries/
│   ├── index.ts      # All Drizzle ORM queries
│   ├── schema.ts     # Table definitions (spendLogs, proxyModelTable, errorLogs, liteLLMConfig)
│   └── client.ts     # DB connection
├── types/
│   └── index.ts      # AnalyticsDataSource interface (46 methods) + all data types + exports from @litellm/shared
└── index.ts         # Barrel: re-exports from submodules
```

## WHERE TO LOOK

| Task                    | Location                                                | Notes                                                         |
| ----------------------- | ------------------------------------------------------- | ------------------------------------------------------------- |
| Add query               | `queries/index.ts`                                      | `db.select({}).from(schema.spendLogs)`                        |
| Add data method         | `types/index.ts` interface → implement in `database.ts` | Add method to DatabaseDataSource class                        |
| Check available queries | `queries/`                                              | 14 files: spend, model, error, trend, distribution, key, etc. |

## CONVENTIONS

### Adding Queries
1. Add to `queries/index.ts`
2. Use `db.select({}).from(schema.spendLogs)` pattern
3. Map camelCase DB columns to snake_case API response
4. Wrap numerics with `Number()` for safety

### Adding Data Source Methods
1. Add method signature to `AnalyticsDataSource` interface in `types/index.ts`
2. Implement in `data-source/database.ts` (the single DatabaseDataSource class)
3. Implement corresponding query in `queries/` if new DB logic needed

## ANTI-PATTERNS

- Don't use class inheritance to split large data source classes
- Don't assume `null` from DB — always `Number()` or default
- Don't hardcode mode detection outside `detectMode()`
