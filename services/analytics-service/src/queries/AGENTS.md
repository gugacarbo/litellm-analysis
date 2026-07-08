# SERVICES/ANALYTICS-SERVICE/SRC/QUERIES

**Generated:** 2026-07-01
**Commit:** 3029bcb

## OVERVIEW

Raw SQL queries against `model_proxy_*` PostgreSQL tables, executed via `@lite-llm/database/queryRaw()`. Pure I/O — no business logic, no transformation. All query files live in `proxy/` subdirectory; `queries/index.ts` is a barrel re-export.

## FILES

```
queries/
├── index.ts                       # Barrel: re-exports from proxy/
└── proxy/
    ├── client.ts                  # Database client re-export (from @lite-llm/database/client)
    ├── helpers.ts                 # normalizeDays, getTimeFilterWhere, buildWhereClause
    ├── time-buckets.ts            # Shared time-bucketing helpers
    ├── analytics-queries.ts       # Cost efficiency, performance metrics
    ├── distribution-queries.ts    # Token/request distributions, API key stats
    ├── error-queries.ts           # Error log retrieval
    ├── model-queries.ts           # Model CRUD, statistics, trends (~481 lines)
    ├── monitor-queries.ts         # Health/anomaly queries
    ├── spend-queries.ts           # Spend logs + aggregations
    └── trend-queries.ts           # Daily/hourly spend + token trends
```

Each `*-queries.ts` has a colocated `*-queries.test.ts` for SQL regression coverage.

## PATTERNS

### Time Conditions
```typescript
const where = buildWhereClause([getTimeFilterWhere(normalizeDays(days, 30))]);
```
- `normalizeDays(days, defaultDays)` — handles string/number, NaN, negative → fallback
- `getTimeFilterWhere(days)` — returns SQL fragment for `start_time >= now() - interval`
- `buildWhereClause(conditions[])` — joins with `AND`, returns `""` if empty

### SQL Aggregations
```sql
SELECT
  model,
  SUM(spend)::float AS total_spend,
  COUNT(*)::int AS request_count
FROM "model_proxy_spend_logs"
WHERE ...
```
**Always** use `::int` / `::float` casts for numeric types — raw PostgreSQL numerics should be normalized explicitly.

### Column Mapping
Queries return DB columns directly. Use snake_case aliases (`as "total_spend"`) and let `proxy-*-methods.ts` transform to camelCase domain types.

## SCHEMA TABLES

All tables prefixed `model_proxy_*` (PostgreSQL). Schema lives in `database/src/schema/model-proxy.ts`. Common tables:
- `model_proxy_spend_logs` — request-level spend records
- `model_proxy_error_logs` — error records
- `model_proxy_models` — model registry rows
- `model_proxy_settings` — global proxy settings (single-row)
- `model_proxy_providers` — encrypted provider storage

## ANTI-PATTERNS (THIS PROJECT)

- Do not transform data in queries — pure SQL only; transformation belongs in `data-source/proxy-*-methods.ts`
- Do not replace raw SQL with Drizzle builder unless the query is truly simpler to maintain
- Do not skip `::int` / `::float` casts for numeric types
- Do not add new query files at `queries/` root — they belong in `queries/proxy/`
- Do not reach for ad-hoc pools — use `queries/proxy/client.ts` or `@lite-llm/database/client`
