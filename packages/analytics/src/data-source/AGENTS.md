---
description: DatabaseDataSource implementation and method organization
---

# packages/analytics/src/data-source/

Implements `AnalyticsDataSource` interface (46 methods). Composition pattern — each `*-methods.ts` file contains the implementation for related methods.

## FILES (12)

| File | Implements |
|------|------------|
| `database.ts` | `DatabaseDataSource` class — composes all method implementations |
| `analytics-methods.ts` | Cost efficiency, token distribution, performance |
| `credential-methods.ts` | Credential get/set |
| `error-methods.ts` | Error log retrieval |
| `metrics-methods.ts` | Daily/hourly spend trends, metrics summary |
| `model-methods.ts` | Model CRUD, statistics, trends, cache hit rate |
| `monitor-methods.ts` | Health checks, anomaly detection, stuck requests |
| `routing-methods.ts` | Agent routing config |
| `spend-methods.ts` | Spend by model/user/key, spend logs pagination |
| `stats-methods.ts` | Model statistics, API key stats, cost efficiency |
| `utils.ts` | `toNullableNumber()` helper |
| `index.ts` | Factory: `createDataSource()` |

## ARCHITECTURE

```
AnalyticsDataSource (interface)
  └── DatabaseDataSource (class)
        ├── analytics-methods.ts
        ├── credential-methods.ts
        ├── error-methods.ts
        ├── metrics-methods.ts
        ├── model-methods.ts
        ├── monitor-methods.ts
        ├── routing-methods.ts
        ├── spend-methods.ts
        └── stats-methods.ts
```

## PATTERNS

### Adding a Method
1. Add signature to `AnalyticsDataSource` interface in `types/index.ts`
2. Create `getXxxImpl()` in appropriate `*-methods.ts`
3. Add to `DatabaseDataSource` class in `database.ts`

### Method Implementation Pattern
```typescript
export async function getSpendByModelImpl(days = 30): Promise<SpendByModel[]> {
  const result = await getSpendByModel(days);  // from queries/
  return result.map((item) => ({
    model: item.model,
    total_spend: Number(item.total_spend),  // safe coercion
  }));
}
```

### Pagination Pattern
```typescript
export async function getSpendLogsImpl(
  filters: SpendLogsFilters,
  getSpendLogsCountFn: (filters: SpendLogsFilters) => Promise<number>,
): Promise<SpendLogsResponse> {
  const [result, total] = await Promise.all([...]);
  return { logs: result.map(...), pagination: { total, ... } };
}
```

## UTILITIES

### `toNullableNumber()`
Converts potentially null/undefined values to numbers with fallback.
Used throughout for safe DB column → number conversion.

## ANTI-PATTERNS

- Don't add business logic in `*-methods.ts` — delegate to queries/
- Don't use `as any` for type assertions
- Don't skip `Number()` wrapping for DB numerics
