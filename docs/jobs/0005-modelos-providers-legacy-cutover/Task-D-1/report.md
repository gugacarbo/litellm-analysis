# Task-D-1 report

## Delivered

- Replaced the removed `ProvidersRepository` dependency in `@lite-llm/models-repository` with direct Drizzle reads/writes of `model_proxy_providers`.
- Made model creation, upsert, and registry writes require a concrete provider. An explicit `providerName` wins; otherwise a configured default provider is used. Missing providers now fail closed instead of writing `providerId: null` into a non-null database column.
- Updated registry persistence to resolve the provider ID before inserts and preserve the existing provider when renaming a model.
- Removed obsolete credential fields from repository and gateway tests. Gateway fixtures now use encrypted `credentialEnvelope` values; the obsolete credential-scoped ledger-hook test was deleted with its removed export.
- Corrected the server model-route config slice type/reference exposed after the cutover.

## Verification

- `pnpm --dir services/llm-config-service typecheck` — passed.
- `pnpm --dir repositories/models-repository typecheck` — passed.
- `pnpm --dir services/analytics-service typecheck` — passed.
- `pnpm --dir services/llm-gateway typecheck` — passed.
- `pnpm --dir packages/server typecheck` — passed.
- `pnpm --dir services/llm-config-service exec vitest run src/repositories/models-repository.test.ts src/lib/provider-secrets.test.ts` — 4 passed.
- `APP_ENCRYPTION_KEY=... PORT=3000 DATABASE_URL=... pnpm --dir repositories/models-repository exec vitest run src/db-repository.test.ts` — 3 passed.
- `pnpm --dir services/analytics-service exec vitest run src/data-source/registry-methods.test.ts` — 3 passed.
- `pnpm --dir services/llm-gateway exec vitest run src/service.test.ts src/resolver/upstream-provider.test.ts` — 27 passed.
- Legacy scan over the affected runtime packages found no `ProvidersService`, `ProvidersRepository`, `providers-dual-read`, or `secretRef` references.
- `git diff --check` — passed.

## Remaining repository-wide signal

`pnpm verify -c` still exits 1 in `code-checks`, reporting 13 workspace export sets with no consumers (including unrelated `@lite-llm/agent-plugins` and `@lite-llm/contracts`). The command reaches and passes docs/CASA checks; this is the documented pre-existing broad baseline and not a legacy-provider-cutover error.

## Reviewer follow-up: default-provider source of truth

- Removed the `model_proxy_settings.default_provider` contract from `SettingsService`, settings types, dual-read exports, repository persistence, and fixtures.
- `getRegistryDefaultProviderImpl` now reads the provider where `is_default = true`; `setRegistryDefaultProviderImpl` clears the current flag and sets the selected provider flag after confirming it exists.
- Removed `local-proxy.defaultProvider` as a fallback in the database-backed models repository and in server model routes. Unscoped model writes now resolve only the table's `is_default` provider.
- The retained deprecated `GET /providers/default` route reads the analytics data source, which now resolves from `model_proxy_providers.is_default`.
- Revalidation after this correction: typechecks pass for `llm-config-service`, `models-repository`, `analytics-service`, `packages/server`, and `apps/server`; focused tests pass 13/13; `git diff --check` passes.
- Global scan finds no `default_provider` code references. Remaining `defaultProvider` occurrences are compatibility labels on the old `Provider` configuration shape/tests and the read-only endpoint response, not a persisted setting or default-selection fallback.
