# MODEL PROXY REGISTRY SERVICE

**Generated:** 2026-07-01
**Commit:** 3029bcb

## OVERVIEW

Manages the `model_proxy_*` settings, model registry, and credentials tables. Exposes a service-layer API (no Express) consumed by `apps/server` and `packages/server/src/orchestration/`. Owns the read/write paths for runtime proxy configuration.

## STRUCTURE

```
services/model-proxy-registry-service/
├── src/
│   ├── settings/        # model_proxy_settings CRUD (global proxy config)
│   ├── models/          # model_proxy_models CRUD (per-model overrides)
│   ├── credentials/     # model_proxy_credentials CRUD (encrypted secret storage)
│   ├── registry/        # Composite views over settings + models + credentials
│   └── index.ts         # Public service exports
```

## WHERE TO LOOK

| Task                              | Location                                  | Notes                                            |
| --------------------------------- | ----------------------------------------- | ------------------------------------------------ |
| Read or update proxy settings     | `src/settings/`                           | Single-row table; global config                  |
| Register a new model              | `src/models/`                             | Idempotent on (provider, model_name)             |
| Manage credentials                | `src/credentials/`                        | Encrypted at rest; never log decrypted values    |
| Composite view (settings+models)  | `src/registry/`                           | Used by proxy at request time                    |
| Add a new settings field          | `repositories/model-proxy-repository/prisma/schema.prisma` → regenerate → extend service | Migration required |

## CONVENTIONS

- **No Express** — service functions return values/throw; route adaptation is in `apps/server` or `packages/server`
- **Encrypted credentials** — read path decrypts, write path encrypts; never log decrypted
- **Idempotent writes** — registry operations are safe to retry; they upsert by natural key
- **Schema in `repositories/model-proxy-repository`** — services import Prisma client from there

## ANTI-PATTERNS (THIS PROJECT)

- Do not log decrypted credentials — even at debug level
- Do not return raw Prisma models from public functions — map to domain types
- Do not call `services/model-proxy-service` from here — registry is the source of truth, proxy reads from it
- Do not add HTTP/Express primitives
