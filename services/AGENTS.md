# SERVICES KNOWLEDGE BASE

**Generated:** 2026-07-01
**Commit:** 3029bcb

## OVERVIEW

Backend service-layer packages — each owns a single business concern (data access, proxy, registry, model CRUD, plugins) and is consumed by `apps/server` and `packages/server`. All depend on `repositories/*` for schema/types.

## STRUCTURE

```
services/
├── analytics-service/              # 46-method AnalyticsDataSource, Prisma raw SQL
│   └── src/
│       ├── data-source/            # ModelProxyDataSource implements AnalyticsDataSource
│       ├── queries/proxy/          # Prisma $queryRawUnsafe queries
│       └── types/                  # Request/response/domain types
├── llm-gateway/            # Local OpenAI-compatible proxy
│   └── src/
│       ├── logging/                # Request/response logging
│       ├── upstream/               # Upstream provider forwarding
│       ├── health/                 # Health-check probes
│       └── routes/                 # OpenAI-compatible HTTP routes
├── model-proxy-config-service/    # Settings/registry/providers management
│   └── src/                        # CRUD over model_proxy_settings, model_proxy_models, model_proxy_providers
├── models-service/                 # Provider/model CRUD + alias DB management
│   └── src/
│       ├── alias-router/           # Managed alias reconciliation
│       └── providers/              # Provider-specific adapters
└── agent-plugins/                  # OpenCode/OpenAgent/VS Code plugin system
    └── src/                        # Per-consumer config generators
```

## WHERE TO LOOK

| Task                              | Location                                        | Notes                                                  |
| --------------------------------- | ----------------------------------------------- | ------------------------------------------------------ |
| Add an analytics query            | `services/analytics-service/src/queries/proxy/` | New method on `AnalyticsDataSource` + impl in `data-source/` |
| Add a proxy route                 | `services/llm-gateway/src/routes/`      | OpenAI-compatible; forwards to upstream                |
| Add settings CRUD                 | `services/model-proxy-config-service/src/`     | Direct repository access; no Express                   |
| Add a provider adapter            | `services/models-service/src/providers/`        | Provider-specific model normalization                 |
| Add a new consumer plugin         | `services/agent-plugins/src/`                   | Per-consumer config generator                          |

## CONVENTIONS

- **Service-layer only** — no Express wiring; consumed by `apps/server` and `packages/server`
- **Direct repository access** — services import from `repositories/*` for schema/client
- **Pure data shapes** — service functions take/return plain objects; no Express `req`/`res`
- **Generated Zod schemas live with services** that own the domain concept (e.g. agents schema in `services/agent-plugins/`)
- **All services target Node 20+** — no browser code
- **Cross-service calls** go through orchestration layer in `packages/server/src/orchestration/`, never service-to-service direct

## ANTI-PATTERNS (THIS PROJECT)

- Do not add `app.use(...)` / Express code in services
- Do not duplicate the `AnalyticsDataSource` interface — extend it once in `services/analytics-service/src/types/`
- Do not import across service packages directly — coordinate via `packages/server/src/orchestration/`
- Do not put business logic in `repositories/*` — repositories own schema/persistence only
