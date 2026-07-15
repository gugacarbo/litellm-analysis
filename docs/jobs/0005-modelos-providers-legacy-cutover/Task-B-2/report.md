# Task-B-2 report

## Delivered

- Removed `providersService` from the shared Express route contract, runtime wiring, model route validation, and server test fixtures.
- Reduced the deprecated provider router to its single retained read-only boundary: `GET /providers/default`.
- Removed legacy provider writer/discovery/OAuth endpoints and their obsolete integration coverage.
- Updated analytics provider reads to derive a non-sensitive `credentialStatus` from `credentialEnvelope`; no legacy secret reference is read or emitted.

## TDD evidence

### RED

`APP_ENCRYPTION_KEY=... PORT=3000 DATABASE_URL=... pnpm --filter server exec vitest run src/__tests__/provider-routes-read-only.test.ts`

Before the route removal, the new regression expectation for `POST /providers` to return `404` failed: the legacy router responded with `500` because its removed provider dependency was absent from the test route options.

### GREEN

- `APP_ENCRYPTION_KEY=... PORT=3000 DATABASE_URL=... pnpm --filter server exec vitest run src/__tests__/provider-routes-read-only.test.ts` — 1 passed.
- `pnpm --filter @lite-llm/analytics-service exec vitest run src/data-source/registry-methods.test.ts` — 3 passed.
- Legacy scan over `packages/server`, `apps/server`, and `services/analytics-service` found no `providersService`, `ProvidersService`, `ProvidersRepository`, `secretRef`, `resolveProviderApiKey`, or `listProviders(` symbols.
- `git diff --check` completed cleanly.

## Concerns

- `pnpm --filter @lite-llm/server typecheck`, `pnpm --filter server typecheck`, and `pnpm --filter @lite-llm/analytics-service typecheck` remain blocked by in-flight Task-A contract fallout outside this task's files: `repositories/models-repository/src/db-repository.ts` still imports removed `ProvidersRepository`, and existing model persistence paths lack the now-required `providerId`. `packages/server/src/routes/model-routes.ts` also has pre-existing `configSliceFromModel`/config-shape errors. These are not introduced by Task-B-2.
- The retained `/providers/default` route remains only for deprecated read compatibility. All provider mutation must use the ModelAdmin surface.
