---
description: Raw SQL queries (via Prisma) for LiteLLM Analytics
---

# packages/analytics/src/queries/

Raw SQL queries backed by `prisma.$queryRawUnsafe`. Pure I/O — no business logic transformation.

## FILES (14)

| File | Purpose |
|------|---------|
| `client.ts` | `prisma` client connection (re-exports from `@lite-llm/litellm-repository`) |
| `helpers.ts` | Time condition builders (`normalizeDays`, `getTimeFilterWhere`, `buildWhereClause`) |
| `analytics-queries.ts` | Cost efficiency, performance metrics, summary stats |
| `credential-settings-queries.ts` | Default credential get/set |
| `distribution-queries.ts` | Token/request distributions, API key stats |
| `error-queries.ts` | Error log retrieval |
| `key-queries.ts` | API key listing |
| `model-queries.ts` | Model CRUD, statistics, trends (534 lines — largest) |
| `monitor-queries.ts` | Health checks, anomaly detection, stuck requests |
| `router-queries.ts` | Router settings |
| `spend-queries.ts` | Spend logs, aggregated spend by model/user/key |
| `trend-queries.ts` | Daily/hourly spend and token trends |

## PATTERNS

### Time Conditions
```typescript
const where = buildWhereClause([getTimeFilterWhere(normalizeDays(days, 30))]);
```
`normalizeDays()` handles string/number, NaN, negative → fallback defaults.

### SQL Aggregations
```sql
SELECT SUM("spend")::float as "total_spend", COUNT(*)::int as "request_count"
FROM "LiteLLM_SpendLogs"
```
Use `::int` and `::float` casts in SQL for type-safe numerics.

### Column Mapping
Query returns DB columns directly. Column aliases (`as "camelCaseName"`) handle mapping.

### Conditions
```typescript
buildWhereClause([timeCondition, modelCondition])
```
`buildWhereClause()` constructs `WHERE ...` from string conditions, returns empty string if none.

## SCHEMA TABLES

Tables are accessed via raw SQL against `LiteLLM_SpendLogs`, `LiteLLM_ErrorLogs`, etc.
Schema managed by Prisma via `repositories/litellm-repository/prisma/schema.prisma`.

## ANTI-PATTERNS

- Don't transform data in queries — keep pure SQL
- Don't use Drizzle query builder — this package uses raw SQL only
- Don't forget `::int` / `::float` casts for numeric types
