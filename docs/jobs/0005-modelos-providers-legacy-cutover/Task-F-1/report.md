# Task-F-1 report

## Delivered

- `apps/server` now removes deprecated configuration mutation layers after package-route registration. GET/HEAD/OPTIONS remain; legacy mutation methods for models, aliases, providers/configuration, agent catalog, category catalog, and plugin routing are not exposed by the runtime. Chat and proxy request routes remain.
- Added a route-guard regression test covering retained GET and removed POST/PUT/PATCH paths.
- Removed `defaultProvider` from the database-backed Provider config shape. The repository uses only `model_proxy_providers.is_default` for an unscoped model, and the gateway no longer resolves credentials through a Provider default alias fallback.

## Verification

- `pnpm --dir repositories/models-repository typecheck` — passed.
- `pnpm --dir services/models-service typecheck` — passed.
- `pnpm --dir services/llm-gateway typecheck` — passed.
- `pnpm --dir apps/server typecheck` — passed.
- `APP_ENCRYPTION_KEY=... PORT=3000 DATABASE_URL=... pnpm --dir repositories/models-repository exec vitest run src/db-repository.test.ts` — 3 passed.
- `pnpm --dir services/llm-gateway exec vitest run src/resolver/upstream-provider.test.ts` — 15 passed.
- `pnpm --dir apps/server exec vitest run src/runtime/legacy-route-guard.test.ts` — 1 passed.
- `default_provider|defaultProvider` scan is clean in the repository, gateway, and server runtime except the local variable `defaultProviderId`, which is derived directly from `isDefault` and is not a fallback contract.
- `git diff --check` — passed.

## Reviewer follow-up: Express runtime compatibility

- The guard now uses the Express 4.22 internal route stack at `app._router.stack`. It deliberately does not access `app.router`, whose deprecated getter throws in the deployed Express 4 runtime.
- Replaced the synthetic-stack test with a real Express application: it registers GET/POST/PUT/PATCH legacy paths plus POST `/chat`, applies the guard without throwing, and verifies only GET `/models` and non-configuration POST `/chat` remain.
- `pnpm --dir apps/server exec vitest run src/runtime/legacy-route-guard.test.ts` and `pnpm --dir apps/server typecheck` both pass.
