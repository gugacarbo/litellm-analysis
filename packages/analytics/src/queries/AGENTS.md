---
description: Drizzle ORM queries for LiteLLM Analytics
---

# packages/analytics/src/queries/

Drizzle ORM queries backed by `litellmDb` connection. Pure I/O — no business logic transformation.

## FILES (14)

| File | Purpose |
|------|---------|
| `schema.ts` | Re-exports from `@lite-llm/litellm-repository/schema` |
| `client.ts` | `litellmDb` connection + schema exports |
| `helpers.ts` | Time condition builders (`normalizeDays`, `getSpendLogsTimeCondition`) |
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
const whereClause = getSpendLogsTimeCondition(normalizeDays(days, 30));
```
`normalizeDays()` handles string/number, NaN, negative → fallback defaults.

### SQL Aggregations
```typescript
sql<number>`SUM(${spendLogs.spend})`.mapWith(Number)
```
Always wrap aggregations with `.mapWith(Number)` for safe serialization.

### Column Mapping
Query returns snake_case DB columns. Transformation happens in `*-methods.ts` files.

### Conditions
```typescript
combineConditions([getSpendLogsTimeCondition(days), sql`...`])
```
`combineConditions()` filters undefined, returns single condition or `and(...)`.

## SCHEMA TABLES

Accessed via `schema.spendLogs`, `schema.errorLogs`, `schema.proxyModelTable`, etc.
Schema defined in `@lite-llm/litellm-repository/schema` — re-exported here.

## ANTI-PATTERNS

- Don't transform data in queries — keep pure SQL
- Don't use raw SQL strings — use Drizzle query builder
- Don't forget `.mapWith(Number)` for aggregations
