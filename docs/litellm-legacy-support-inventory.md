# LiteLLM legacy support — removed (2026-06-17)

All legacy LiteLLM runtime and offline tooling has been removed from this monorepo.

## What remains

- **Branding:** package scope `@lite-llm/*` and repository name `lite-llm-analytics` (not LiteLLM DB support).
- **Runtime:** `model_proxy_*` PostgreSQL only via `MODEL_PROXY_DATABASE_URL`.
- **WebSocket:** event name `spend_logs_changed` (stable contract; observes `model_proxy_requests`).
- **HTTP routes:** `/spend/*` path prefix (payload is `ProxyRequestLog`).
- **Migration reads:** `credential_name` accepts legacy `litellm_credential_name` in imported route params only.

## Removed

See git history for the full diff. Summary:

| Area | Removed |
|------|---------|
| Analytics modes | `ANALYTICS_DATA_SOURCE` toggle; `litellm` / `hybrid`; `DatabaseDataSource`, `HybridDataSource` |
| Package | `repositories/litellm-repository/` |
| Queries | `services/analytics-service/src/queries/*.ts` (non-`proxy/`) |
| CLIs | `backup:litellm`, `model-proxy:import-*`, `analytics:compare-sources`, `sync:cloud` |
| Env | `DB_*`, `DATABASE_URL` (LiteLLM), `LITELLM_CLOUD_*`, `ANALYTICS_DATA_SOURCE` |
| Skill | `.agents/skills/lite-llm-db-access` |

## Docs archive

Historical migration RFCs remain under `docs/litellm-removal-batch-*.md` and `docs/batch-*.md` for reference only.
