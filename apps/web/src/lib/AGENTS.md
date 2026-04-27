# apps/web/src/lib/

## OVERVIEW
API client utilities, React Query setup, server mode detection. Barrel exports from `api-client/` submodules.

## STRUCTURE

```
lib/
├── api-client.ts          # Barrel: re-exports from api-client/
├── api-client/
│   ├── agent-config.ts    # Agent config CRUD
│   ├── agent-routing.ts   # Routing config
│   ├── analytics.ts       # Dashboard analytics
│   ├── core.ts           # Base fetch wrapper
│   ├── models.ts         # Model management
│   └── spend.ts          # logs
├── query-client.ts       # React Query client
├── query-keys.ts         # Query key factories
├── server-mode.ts       # Server mode detection
├── spend-log-utils.ts   # Spend log formatters
└── utils.ts             # General utilities
```

## WHERE TO LOOK

| Task                    | Location             | Notes                                         |
| ----------------------- | -------------------- | --------------------------------------------- |
| Add API endpoint        | `api-client/`        | Add new module + re-export in `api-client.ts` |
| Add React Query key     | `query-keys.ts`      | Factory functions for cache keys              |
| Change server detection | `server-mode.ts`     | Reads `GET /api/mode`                         |
| Add HTTP client         | `api-client/core.ts` | Base fetch with error handling                |

## CONVENTIONS

- Import from `@/` alias (mapped to `./src/`)
- API client uses React Query for caching
- Server mode cached in React Query (`query-keys.ts`)
- All API functions return typed responses
