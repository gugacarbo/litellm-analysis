# SERVICES/ANALYTICS-SERVICE/SRC/DATA-SOURCE

**Generated:** 2026-07-01
**Commit:** 3029bcb

## OVERVIEW

Implements the 46-method `AnalyticsDataSource` interface against `model_proxy_*` PostgreSQL. Composition pattern: `ModelProxyDataSource` class delegates each method to a topic-specific `proxy-*-methods.ts` file.

## FILES

| File                          | Implements                                                           |
| ----------------------------- | -------------------------------------------------------------------- |
| `model-proxy.ts`              | `ModelProxyDataSource` class — composes all method impls             |
| `proxy-dashboard-methods.ts`  | Cost efficiency, token distribution, performance widgets            |
| `proxy-error-methods.ts`      | Error log retrieval                                                  |
| `proxy-model-methods.ts`      | Model CRUD, statistics, trends, cache hit rate                       |
| `proxy-monitor-methods.ts`    | Health checks, anomaly detection, stuck requests                      |
| `proxy-spend-methods.ts`      | Spend by model/user/key, spend logs pagination                        |
| `registry-methods.ts`          | Registry queries (settings, providers, model registrations)         |
| `routing-methods.ts`          | Agent routing config queries                                         |
| `utils.ts`                    | `toNullableNumber()`, shared helpers                                 |
| `index.ts`                    | `createDataSource()` factory                                         |

## ARCHITECTURE

```
AnalyticsDataSource (interface, 46 methods)
        │
        ▼
ModelProxyDataSource (class, model-proxy.ts)
        │
        ├─ proxy-dashboard-methods.ts
        ├─ proxy-error-methods.ts
        ├─ proxy-model-methods.ts
        ├─ proxy-monitor-methods.ts
        ├─ proxy-spend-methods.ts
        ├─ registry-methods.ts
        └─ routing-methods.ts
                │
                ▼
        queries/proxy/* (raw SQL via Drizzle)
```

## PATTERNS

### Adding a Method
1. Add signature to `AnalyticsDataSource` interface in `services/analytics-service/src/types/index.ts`
2. Create `getXxxImpl()` in appropriate `proxy-*-methods.ts`
3. Add to `ModelProxyDataSource` class in `model-proxy.ts` (one-line delegation)
4. Add underlying raw SQL in `queries/proxy/<topic>-queries.ts` if new DB logic needed

### Method Implementation
```typescript
export async function getSpendByModelImpl(days = 30): Promise<SpendByModel[]> {
  const rows = await getSpendByModel(days);
  return rows.map((r) => ({ model: r.model, total_spend: Number(r.total_spend) }));
}
```

### Pagination
```typescript
const [rows, total] = await Promise.all([getSpendLogs(filters), getSpendLogsCount(filters)]);
return { logs: rows.map(...), pagination: { total, ... } };
```

## UTILITIES

- `toNullableNumber(value, fallback)` — converts possibly-null/undefined DB values to numbers with fallback. Used throughout for safe column → number conversion.

## ANTI-PATTERNS (THIS PROJECT)

- Do not add business logic in `proxy-*-methods.ts` — delegate to `queries/proxy/`
- Do not use `as any` for type assertions
- Do not skip `Number()` wrapping for DB numerics (Postgres returns string for some numeric types via Drizzle)
- Do not split `ModelProxyDataSource` via class inheritance — composition only