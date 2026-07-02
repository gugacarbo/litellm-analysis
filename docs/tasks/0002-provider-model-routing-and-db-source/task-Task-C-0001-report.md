# Task-C-0001 Report

## Scope completed

Focused on the remaining blocking repository-contract subset needed to stabilize imports and compilation around `@lite-llm/models-repository` with `DbModelsRepository` as the only implementation.

## Files changed

- `repositories/models-repository/src/interfaces.ts`
- `repositories/models-repository/src/db-repository.ts`
- `repositories/models-repository/src/db-repository.test.ts`
- `repositories/models-repository/src/client.ts`
- `repositories/models-repository/src/index.ts`
- `services/models-service/src/repository/client.ts`
- `services/models-service/src/index.ts`
- `services/models-service/src/services/model.service.ts`
- `services/models-service/src/services/provider.service.ts`
- `services/models-service/src/services/__tests__/model.service.test.ts`
- `services/models-service/src/services/__tests__/provider.service.test.ts`
- `services/model-proxy-service/src/resolver/upstream-provider.ts`
- `apps/server/src/__tests__/helpers/registry-test-stack.ts`

## Contract chosen and why

Chosen contract:

- Primary repository semantics are `read()` / `write()` over `ModelsConfig`.
- `DbModelsRepository` remains the only concrete implementation and the only client returned by `createRepositoryClient()`.
- All touched consumers now import from `@lite-llm/models-repository` root exports instead of the deleted `@lite-llm/models-repository/repository` deep path.

Why this contract:

- It matches the current DB-backed repository behavior already implemented in `DbModelsRepository`.
- It matches the way `models-service`, `analytics-service`, and other DB-backed consumers already mutate the full config object.
- It avoids restoring the deleted file-backed repository surface.

Compatibility note:

- A temporary `findAll()` alias was kept on `IModelsRepository` / `DbModelsRepository` to avoid breaking current dependent consumers that still call `findAll()` during this branch transition.
- The shared contract source of truth is still the `read()` / `write()` model; `findAll()` now delegates to `read()`.

## What changed

- Replaced the stale `IModelsRepository` shape (`findAll/findByModelName/upsert/delete`) with the DB-backed contract (`read/readSync/write/validate/exists/getPath`) and kept `findAll()` only as a compatibility alias.
- Made `createRepositoryClient()` accept DB repository options and always return `DbModelsRepository`.
- Re-exported repository client option types coherently through `models-repository` and `models-service`.
- Removed remaining source imports of `@lite-llm/models-repository/repository` in the owned files.
- Updated `models-service` tests to use an in-memory repository stub that matches the DB-backed contract instead of the deleted file-based repository helper.
- Fixed `db-repository` test doubles so they cover the Prisma methods used by the DB implementation (`findFirst`, `findMany`, `create`, `update`).

## Tests and typechecks run

Passed:

- `pnpm --filter @lite-llm/models-repository typecheck`
- `pnpm --filter @lite-llm/models-repository test -- --run`
  - Result: 1 test file passed, 2 tests passed
- `pnpm --filter @lite-llm/models-service typecheck`
- `pnpm --filter @lite-llm/models-service test -- --run`
  - Result: 3 test files passed, 21 tests passed
- `pnpm --filter @lite-llm/model-proxy-service typecheck`
- `pnpm --filter server typecheck`

Not clean yet:

- `pnpm --filter @lite-llm/model-proxy-service test -- --run upstream-provider`
  - Failed with 4 tests in the current branch state
  - `src/resolver/upstream-provider.test.ts`: 3 failures because the test mocks still assume the pre-lookup path and do not provide `database.modelProxyModel.findMany`
  - `src/service.test.ts`: 1 failure because the expected upstream URL no longer matches current provider-resolution behavior in branch state

## Residual risks and follow-ups

- `ModelsConfig.models` is still keyed only by bare `modelName`, so provider-scoped duplicate model names cannot be represented losslessly in the config map. This task intentionally did not broaden that shape; compile/runtime stabilization was prioritized.
- The temporary `findAll()` alias should be removed after downstream consumers migrate to `read()`.
- `services/model-proxy-service` resolver tests still need their mocks/expectations updated to the provider-scoped lookup behavior introduced on this branch.

## Fix pass addendum

Reviewer findings addressed in this pass:

- Fixed provider-scoped model collapse in `DbModelsRepository.read()` by emitting canonical model keys as `providerName/modelName` whenever `providerName` is non-null.
- Fixed `DbModelsRepository.write()` so existing rows are matched and updated by canonical key, not by the first row with the same bare `modelName`.
- Removed the temporary `findAll()` alias from the public `IModelsRepository` contract and from the owned test doubles.

Additional implementation notes:

- Bare model keys now map deterministically to `providerName = null`.
- Provider-scoped keys map deterministically to `providerName/modelName`.
- Deletions in `write()` now compare canonical keys and delete by row `id`, avoiding accidental deletion/update of the wrong provider-scoped row.

Focused validation rerun for this fix pass:

- `pnpm --filter @lite-llm/models-repository typecheck`
- `pnpm --filter @lite-llm/models-repository test -- --run`
  - Result: 1 test file passed, 3 tests passed
- `pnpm --filter @lite-llm/models-service typecheck`
- `pnpm --filter @lite-llm/models-service test -- --run`
  - Result: 3 test files passed, 21 tests passed
- `pnpm --filter @lite-llm/model-proxy-service typecheck`

Updated residual risk:

- The repository contract now preserves provider-scoped duplicates in `ModelsConfig.models` through canonical string keys, but service-level consumers that present or mutate models by key still need to be conscious that `"provider/model"` and `"model"` are distinct entries with explicit semantics.
