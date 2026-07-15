# Task-A-1 — outcome

## Status

Ready for batch review.

## Delivered

- Removed the operational legacy provider stack: repository, service, provider
  persistence types, provider dual-read adapter, its test double, tests, factory
  registration, and all public exports.
- Added `resolveProviderCredential`, the only public runtime credential resolver.
  It accepts only `credentialEnvelope`, requires the encrypted envelope format,
  and converts missing, plaintext, malformed, or undecryptable material into the
  same fail-closed error. It has no environment or legacy-field fallback.
- Updated `ModelAdminService` to use that resolver at its immediate upstream
  credential boundary.

## Changed files

- Modified: `services/llm-config-service/src/factory.ts`
- Modified: `services/llm-config-service/src/index.ts`
- Modified: `services/llm-config-service/src/lib/provider-secrets.ts`
- Modified: `services/llm-config-service/src/lib/provider-secrets.test.ts`
- Modified: `services/llm-config-service/src/services/model-admin.service.ts`
- Modified: `services/llm-config-service/src/services/__tests__/in-memory-repositories.ts`
- Modified: `services/llm-config-service/src/types/index.ts`
- Deleted: `services/llm-config-service/src/repositories/providers-repository.ts`
- Deleted: `services/llm-config-service/src/services/providers.service.ts`
- Deleted: `services/llm-config-service/src/types/providers.ts`
- Deleted: `services/llm-config-service/src/dual-read/providers-dual-read.ts`
- Deleted: `services/llm-config-service/src/services/__tests__/providers.service.test.ts`

## RED evidence

Before the implementation, the focused command failed as intended:

```text
pnpm --filter @lite-llm/llm-config-service exec vitest run src/lib/provider-secrets.test.ts
FAIL: expected function to throw for plaintext "test-secret-value"
```

The old upstream helper returned plaintext, proving that it did not fail closed.

## GREEN evidence

```text
pnpm --filter @lite-llm/llm-config-service exec vitest run src/lib/provider-secrets.test.ts
Test Files  1 passed (1)
Tests       2 passed (2)
```

```text
pnpm exec biome check services/llm-config-service/src/lib/provider-secrets.ts \
  services/llm-config-service/src/lib/provider-secrets.test.ts \
  services/llm-config-service/src/factory.ts \
  services/llm-config-service/src/index.ts \
  services/llm-config-service/src/services/__tests__/in-memory-repositories.ts
Checked 5 files. No fixes applied.
```

```text
rg -n "ProvidersService|ProvidersRepository|secretRef|resolveProviderApiKey|hasStoredProviderSecret|types/providers|providers-dual-read|providers.service|providers-repository" services/llm-config-service/src
# no output
```

`git diff --check` exits successfully.

## Concerns / follow-up ownership

- The package-wide Vitest command is blocked by an unrelated, unchanged failure
  in `src/repositories/models-repository.test.ts`: `Model "llama-3.3-70b"
  already exists`.
- `pnpm --filter @lite-llm/llm-config-service typecheck` is blocked by four
  existing errors in unchanged `src/repositories/models-repository.ts` (lines
  332, 354, and 464), involving nullable `providerId` and the Drizzle insert
  overload. No removed legacy-provider module remains in the typecheck output.
- Downstream import migration is deliberately left to Tasks B-1/B-2. Removing
  the factory's `providersService` makes those consumers fail until their batch
  performs the approved cutover.
