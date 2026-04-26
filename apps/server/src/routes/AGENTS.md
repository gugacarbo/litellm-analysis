# apps/server/src/routes/

## OVERVIEW
Express.js route handlers. Each route file exports `registerXxxRoutes(app, dataSource)`.

## STRUCTURE

```
routes/
├── agent-config-routes.ts   # Agent CRUD
├── agent-routing-routes.ts  # Routing config
├── error-routes.ts          # Error logs
├── mode-routes.ts           # Server mode detection
└── spend-routes.ts          # Spend analytics
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Add endpoint | Create `*-routes.ts` | Export `registerXxxRoutes(app, dataSource)` |
| Register route | `api-server.ts` | Import and call `registerXxxRoutes()` |
| Add data method | `packages/analytics/src/types/index.ts` | Route uses dataSource methods |

## CONVENTIONS

### Route Pattern
```typescript
export function registerSpendRoutes(
  app: Application,
  dataSource: AnalyticsDataSource,
) {
  app.get("/spend/model", async (req, res) => {
    const data = await dataSource.getSpendByModel(days);
    res.json(data);
  });
}
```

### Error Handling
- Return 500 with `{ error: String(error) }` on failure
- Return 501 via `FeatureUnavailableError` for unavailable features
- Parse query params with fallbacks

## ANTI-PATTERNS

- Don't register routes directly — always use `registerXxxRoutes()` pattern
- Don't bypass data source — always use `dataSource.*` methods
