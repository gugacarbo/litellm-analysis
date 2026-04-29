# apps/web/src/hooks/

## OVERVIEW
React Query data-fetching hooks for dashboard, logs, errors, model detail, and monitor WebSocket. Each hook manages parallel queries, auto-refresh intervals, and data transforms from API snake_case → camelCase.

## STRUCTURE

```
hooks/
├── dashboard/
│   └── dashboard-queries.ts    # Dashboard metric queries
├── use-dashboard-data/
│   ├── insights.ts             # Dashboard insight calculations
│   ├── normalizers.ts          # Data normalization
│   └── index.ts                # Composed hook (barrel)
├── use-dashboard-data.ts       # (alternative entry point)
├── use-errors.ts               # Error log queries + state
├── use-logs.ts                 # Spend log queries + pagination
├── use-model-detail-data.ts    # 16 parallel queries for model detail page
└── use-monitor-websocket.ts    # WebSocket connection for live monitor
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Add dashboard data | `dashboard/dashboard-queries.ts` | React Query, dashboard-level |
| Add model detail query | `use-model-detail-data.ts` | 16 `useQuery` boilerplate pattern |
| Add error log query | `use-errors.ts` | Pagination + filters |
| Change WebSocket logic | `use-monitor-websocket.ts` | Auto-reconnect, event dispatch |

## CONVENTIONS

- **One hook per concern** — each file exports a single named hook function
- **16 queries pattern** — `use-model-detail-data.ts` uses `useQuery` with `refetchInterval` for auto-refresh
- **API response transforms** — `useMemo` chains map snake_case API → camelCase with `Number()` coercion
- **Dashboard data** uses `use-dashboard-data/` subdirectory (insights + normalizers split)
- **Monitor WebSocket** uses `useMonitorWebsocket` with typed event callbacks
- **All hooks import** from `@/lib/api-client` (typed API functions)

## ANTI-PATTERNS

- Don't add new dashboard-level queries to `use-model-detail-data.ts` — those are model-specific
- Don't skip `Number()` coercion on numeric fields from API responses
- Don't add JSX or component logic — hooks only
