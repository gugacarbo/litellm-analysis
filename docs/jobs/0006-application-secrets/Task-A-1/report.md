Process: super-planning

# Task-A-1 report — application secret storage foundation

## Status

Ready for review. The foundation adds the exact physical table
`application_secrets_store`, an encrypted persistence seam, and a service whose
public operations return metadata only.

## Changes

- Added the Drizzle schema `applicationSecretsStore` with UUID primary key,
  unique `key`, non-null `credential_envelope`, and timestamps; exported it
  from the root schema barrel.
- Generated `database/drizzle/0003_overrated_lionheart.sql` and its Drizzle
  metadata from the schema, including the `application_secrets_store` create
  statement and unique-key index.
- Added `ApplicationSecretsRepository`, keyed by the two literal allowlisted
  values only: `artificial_analysis_api_key` and `openrouter_api_key`.
- Added `ApplicationSecretsService`: `replace` validates and AES-256-GCM
  encrypts with the established `APP_ENCRYPTION_KEY` helpers before upsert;
  `list` and `remove` return public metadata only; `resolve` returns plaintext
  only for internal runtime use and returns `null` for missing, malformed, or
  undecryptable stored values.
- Wired the service into `createRegistryServices` and exported its public
  contract for the subsequent runtime and UI tasks.
- Added schema/service contract coverage using a functional in-memory
  repository fake at the repository boundary. The tests assert encryption at
  rest, no public plaintext, allowlist validation, metadata-only listing,
  idempotent deletion, and fail-closed resolution.

## TDD evidence

### RED

```text
pnpm exec vitest run database/src/schema/model-proxy/schema-contract.test.ts
FAIL: Cannot find module '../application-secrets'

pnpm --filter @lite-llm/llm-config-service exec vitest run src/services/__tests__/application-secrets.service.test.ts
FAIL: Cannot find module '../application-secrets.service.js'
```

### GREEN

```text
pnpm exec vitest run database/src/schema/model-proxy/schema-contract.test.ts
PASS: 1 file, 4 tests

pnpm --filter @lite-llm/llm-config-service exec vitest run src/services/__tests__/application-secrets.service.test.ts
PASS: 1 file, 5 tests

pnpm --filter @lite-llm/database typecheck
PASS

pnpm --filter @lite-llm/llm-config-service typecheck
PASS

pnpm exec biome check <8 Task-A source/test files>
PASS
```

## Migration note

The initial generator run exposed pre-existing SPEC-0005 schema drift. It was
superseded by the isolated generated migration documented in the remediation
section below; the checked-in Task-A migration contains no provider, alias, or
revision changes.

## Remaining unrelated verification failure

`pnpm verify -c` still fails after docs-check succeeds because `code-checks`
reports 13 pre-existing workspace export sets with no consumers (beginning with
`@lite-llm/agent-plugins` and `@lite-llm/contracts`). The Task-A focused tests,
two package typechecks, formatting check, and `git diff --check` are green.

## Requirement confirmation

- REQ-001: encrypted-persistence table, unique logical key, and generated
  migration are present.
- REQ-002: the service supports public-status list/replace/remove semantics
  without exposing plaintext or envelope data.
- REQ-003: writes use the existing AES-256-GCM envelope helper; missing or bad
  records resolve to `null` and do not expose crypto material.

## Remediation after independent review

### P1 — isolated generated migration

- Reconciled the temporary Drizzle generation baseline to the rebased current
  schema, excluding only `application_secrets_store`; this prevents the
  pre-existing SPEC-0005 alias/provider/revision drift from being emitted as
  part of Task-A.
- Generated the migration through `drizzle-kit generate` (no SQL was
  hand-authored), then replaced the prior mixed migration with
  `0003_application-secrets-store.sql`.
- The resulting migration creates only `application_secrets_store`, its named
  allowlist check, and `uq_application_secrets_store_key`; it contains no
  alias/provider/revision changes and no destructive statements.

### P2 — defense in depth for the two supported keys

- Added generated database check
  `ck_application_secrets_store_key_allowlist`, permitting only
  `artificial_analysis_api_key` and `openrouter_api_key`.
- Added repository-boundary validation before `upsert` reaches Drizzle, while
  retaining the service-level validation and public metadata-only API.
- Extended focused coverage for the generated check, repository-boundary
  rejection, and an otherwise valid envelope encrypted with a different
  `APP_ENCRYPTION_KEY`, which resolves to `null`.

### TDD and verification evidence

```text
RED (temporarily removed the new constraint and repository guard):
pnpm exec vitest run database/src/schema/model-proxy/schema-contract.test.ts
FAIL: expected [] to include ck_application_secrets_store_key_allowlist

pnpm --filter @lite-llm/llm-config-service exec vitest run src/services/__tests__/application-secrets.service.test.ts
FAIL: expected repository write to reject Unsupported application secret key

GREEN:
pnpm exec vitest run database/src/schema/model-proxy/schema-contract.test.ts
PASS: 1 file, 4 tests

pnpm --filter @lite-llm/llm-config-service exec vitest run src/services/__tests__/application-secrets.service.test.ts
PASS: 1 file, 6 tests

pnpm --filter @lite-llm/database db:generate
PASS: No schema changes, nothing to migrate

pnpm --filter @lite-llm/database typecheck
PASS

pnpm --filter @lite-llm/llm-config-service typecheck
PASS

pnpm exec biome check <8 Task-A source/test files>
PASS

git diff --check
PASS
```
