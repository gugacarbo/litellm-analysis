# packages/analytics/src/

## OVERVIEW
DB queries (Prisma raw SQL via `$queryRawUnsafe`) + data source implementation. Strategy pattern with 46-method interface.

## STRUCTURE

```
analytics/src/
├── data-source/
│   ├── index.ts      # Factory: createDataSource()
│   ├── database.ts   # DatabaseDataSource (composed from 14 *-queries.ts files via Prisma)
│   └── utils.ts      # Data source utilities
├── queries/
│   ├── index.ts      # All raw SQL queries (prisma.$queryRawUnsafe)
│   └── client.ts     # DB connection (re-exports prisma from @lite-llm/litellm-repository)
├── types/
│   └── index.ts      # AnalyticsDataSource interface (46 methods) + all data types + exports from @litellm/shared
└── index.ts         # Barrel: re-exports from submodules
```

## WHERE TO LOOK

| Task                    | Location                                                | Notes                                                         |
| ----------------------- | ------------------------------------------------------- | ------------------------------------------------------------- |
| Add query               | `queries/index.ts`                                      | Write raw SQL via `prisma.$queryRawUnsafe`                    |
| Add data method         | `types/index.ts` interface → implement in `database.ts` | Add method to DatabaseDataSource class                        |
| Check available queries | `queries/`                                              | 14 files: spend, model, error, trend, distribution, key, etc. |

## CONVENTIONS

### Adding Queries
1. Add to `queries/index.ts`
2. Use `prisma.$queryRawUnsafe<Type>(sql_string)` pattern
3. Use explicit column aliases for camelCase → snake_case mapping
4. Wrap numerics with `::int` or `::float` in SQL

### Adding Data Source Methods
1. Add method signature to `AnalyticsDataSource` interface in `types/index.ts`
2. Implement in `data-source/database.ts` (the single DatabaseDataSource class)
3. Implement corresponding query in `queries/` if new DB logic needed

## ANTI-PATTERNS

- Don't use class inheritance to split large data source classes
- Don't assume `null` from DB — always `Number()` or default
- Don't hardcode mode detection outside `detectMode()`
