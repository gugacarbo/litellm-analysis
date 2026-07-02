# MODEL PROXY CONFIG SERVICE

**Generated:** 2026-07-01
**Commit:** 3029bcb

## OVERVIEW

Manages the `model_proxy_*` settings, model registry, and providers tables. Exposes a service-layer API (no Express) consumed by `apps/server` and `packages/server/src/orchestration/`. Owns the read/write paths for runtime proxy configuration.

## STRUCTURE

```
services/model-proxy-config-service/
├── src/
│   ├── settings/        # model_proxy_settings CRUD (global proxy config)
│   ├── models/          # model_proxy_models CRUD (per-model overrides)
│   ├── providers/       # model_proxy_providers CRUD (encrypted secret storage)
│   ├── registry/        # Composite views over settings + models + providers
│   └── index.ts         # Public service exports
```

## WHERE TO LOOK

| Task                              | Location                                  | Notes                                            |
| --------------------------------- | ----------------------------------------- | ------------------------------------------------ |
| Read or update proxy settings     | `src/settings/`                           | Single-row table; global config                  |
| Register a new model              | `src/models/`                             | Idempotent on (provider, model_name)             |
| Manage providers                  | `src/providers/`                          | Encrypted at rest; never log decrypted values    |
| Composite view (settings+models)  | `src/registry/`                           | Used by proxy at request time                    |
| Add a new settings field          | `repositories/database/src/schema/model-proxy.ts` → migration → extend service | Migration required |

## CONVENTIONS

- **No Express** — service functions return values/throw; route adaptation is in `apps/server` or `packages/server`
- **Encrypted providers** — read path decrypts, write path encrypts; never log decrypted
- **Idempotent writes** — registry operations are safe to retry; they upsert by natural key
- **Schema in `repositories/database`** — services use the shared Drizzle database client from there

## ANTI-PATTERNS (THIS PROJECT)

- Do not log decrypted provider secrets — even at debug level
