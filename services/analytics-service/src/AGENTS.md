# SERVICES/ANALYTICS-SERVICE/SRC

**Generated:** 2026-07-01
**Commit:** 3029bcb

## OVERVIEW

`@lite-llm/analytics-service` — Prisma raw SQL queries + `AnalyticsDataSource` (46-method interface) against `model_proxy_*` PostgreSQL. Single source of truth for read access to proxy logs, errors, models, and spend.

## STRUCTURE

```
services/analytics-service/src/
├── data-source/
│   ├── index.ts                       # createDataSource() factory
│   ├── model-proxy.ts                 # ModelProxyDataSource — composes all method implementations
│   ├── proxy-dashboard-methods.ts     # Dashboard widgets (cost efficiency, distribution)
│   ├── proxy-error-methods.ts          # Error log retrieval
│   ├── proxy-model-methods.ts          # Model CRUD + statistics
│   ├── proxy-monitor-methods.ts        # Health/anomaly queries
│   ├── proxy-spend-methods.ts          # Spend aggregations
│   ├── registry-methods.ts             # Registry-side methods (model_proxy_* tables)
│   ├── routing-methods.ts              # Agent routing config queries
│   └── utils.ts                        # toNullableNumber() and helpers
├── queries/
│   ├── index.ts                       # Barrel re-exporting from proxy/
│   └── proxy/
│       ├── client.ts                  # Prisma client from @lite-llm/model-proxy-repository
│       ├── helpers.ts                 # normalizeDays, getTimeFilterWhere, buildWhereClause
│       ├── time-buckets.ts            # Time-bucketing helpers
│       ├── analytics-queries.ts       # Cost efficiency, performance metrics
│       ├── distribution-queries.ts    # Token/request distributions, API key stats
│       ├── error-queries.ts           # Error log retrieval
│       ├── model-queries.ts           # Model CRUD, statistics, trends (~481 lines)
│       ├── monitor-queries.ts         # Health/anomaly queries
│       ├── spend-queries.ts           # Spend logs + aggregations
│       └── trend-queries.ts           # Daily/hourly spend + token trends
├── presenter/
│   ├── proxy-request-log.ts            # Request log presenter (raw → domain)
│   ├── usage-adjustments.ts           # Cost adjustment helpers
│   └── *.test.ts
└── types/
    └── index.ts                       # AnalyticsDataSource interface (46 methods) + domain types
```

## WHERE TO LOOK

| Task                              | Location                                                | Notes                                              |
| --------------------------------- | ------------------------------------------------------- | -------------------------------------------------- |
| Add a new data source method      | `types/index.ts` (interface) → `data-source/model-proxy.ts` → `data-source/proxy-*-methods.ts` | Three-file concern |
| Add a raw SQL query               | `queries/proxy/<topic>-queries.ts`                      | `prisma.$queryRawUnsafe<Type>(sql)` pattern         |
| Add a presenter                   | `presenter/<topic>.ts`                                 | Pure functions; no I/O                             |
| Add a new domain type             | `types/index.ts`                                       | Re-export from public barrel                        |

## CONVENTIONS

- **Query pattern**:
  ```typescript
  export async function getSpendByModel(days = 30): Promise<SpendByModel[]> {
    return prisma.$queryRawUnsafe<SpendByModel[]>(
      `SELECT model, SUM(spend)::float AS total_spend FROM "model_proxy_spend_logs" WHERE ...`,
    );
  }
  ```
- **Method implementation**: `rows.map((r) => ({ model: r.model, total_spend: Number(r.total_spend) }))`
- **Time conditions**: `buildWhereClause([getTimeFilterWhere(normalizeDays(days, 30))])`
- **Numeric casts in SQL**: always `::int` / `::float` for type-safe numerics
- **Pagination**: `Promise.all([getSpendLogs(filters), getSpendLogsCount(filters)])`
- **All queries in `queries/proxy/`** — `queries/` is a barrel only

## ANTI-PATTERNS (THIS PROJECT)

- Do not add business logic to queries — keep pure SQL
- Do not use class inheritance to split `ModelProxyDataSource` — composition only
- Do not assume `null` from DB — always `Number()` or default
- Do not skip `::int`/`::float` casts for numeric columns