---
status: draft
date: 2026-07-14
spec: docs/specs/0005-modelos-providers-roteamento-spec.md
decisions:
  - docs/specs/0005-modelos-providers-roteamento-spec.md
  - docs/adr/0007-segredos-de-providers-sao-cifrados-no-postgresql.md
implemented-by: []
---

> Process: super-planning — Phase 3 (PLAN). Follow
> `/home/gustavo/.agents/skills/super-planning/phases/03-plan.md`.

# Model providers legacy cutover implementation plan

## Summary

**Goal:** make `apps/ui` and the revisioned provider/model registry the sole
write path; keep `apps/web` available only as a deprecated read-only surface.

**Scope:** remove provider persistence and service compatibility based on
`apiKey` and `secretRef`; route the gateway, analytics and server packages to
the encrypted `credentialEnvelope` contract; remove legacy writers and their
tests; make `apps/web` mutations unavailable; and update package exports and
dependencies to reflect the new ownership.

**Out of scope:** removal of the `apps/web` application itself, dashboard and
analytics features unrelated to provider/model administration, and migration
of existing reset-era data. The database is already on the clean-cut schema.

**Success signal:** `rg` finds no operational provider use of `secretRef`, no
provider-table use of `apiKey`, and no legacy provider service/repository;
the old web surface cannot mutate; all affected package typechecks and focused
tests pass.

## Context and Design

The current schema and `ModelAdminService` implement the accepted contract,
but `ProvidersService`, `ProvidersRepository`, `dual-read/providers-dual-read`
and their factory exports remain. `packages/server`, `apps/server`,
`services/analytics-service`, and `services/llm-gateway` still consume those
legacy shapes. `apps/web` also exposes mutations through its older HTTP client.

**Architecture:** retain one operational provider aggregate,
`ModelAdminService` plus the Drizzle registry. Introduce narrow server-only
read/runtime adapters only where a service needs a decrypted credential; no
DTO, query or read route receives the envelope or plaintext. The old web app
uses read-only endpoints and renders no mutating control.

**Tech stack / versions:** TypeScript 6, Drizzle ORM 0.38.4, Express package
routes, TanStack Start 1.168.27, Vitest 4.1.5, pnpm workspaces.

**Execution mode:** sequential. The provider contract must land before gateway,
server and web consumers can safely be switched.

### Flow

1. Runtime services resolve a provider by UUID/name from the registry.
2. A server-only adapter decrypts `credentialEnvelope` only when an upstream
   request needs credentials and fails closed on invalid/missing state.
3. `apps/ui` remains the sole admin writer; legacy Express writers are removed.
4. `apps/web` presents read data only and directs administration to `apps/ui`.

### Contracts

```text
Provider persistence: credentialEnvelope | revision | isDefault | providerId
Public provider read: no plaintext, ciphertext, apiKey, or secretRef
Legacy web: GET-only; mutation requests are not registered
```

## References and Constraints

| Source                                                              | Section                    | What it governs                       | Plan consequence                                             |
| ------------------------------------------------------------------- | -------------------------- | ------------------------------------- | ------------------------------------------------------------ |
| `docs/specs/0005-modelos-providers-roteamento-spec.md`              | Persistencia e invariantes | clean cut, no fallback                | delete legacy readers/writers rather than bridge them        |
| `docs/specs/0005-modelos-providers-roteamento-spec.md`              | Providers e credenciais    | secret redaction and lifecycle        | only server-side runtime code decrypts envelopes             |
| `docs/adr/0007-segredos-de-providers-sao-cifrados-no-postgresql.md` | Consequencias              | no `secretRef` fallback after cutover | remove environment lookup and plaintext provider storage     |
| User direction, 2026-07-14                                          | `apps/web`                 | deprecated read-only surface          | remove/disable all app-web writes without deleting its reads |

**Unresolved decisions:** None. “ready-only” is implemented as “read-only”.

**Global constraints:**

- TDD is required for behavior changes; read
  `docs/context/testing-anti-patterns.md` before test doubles.
- Never return an envelope, plaintext, `apiKey`, or `secretRef` from a read
  contract, error, cache, or log.
- No compatibility fallback or dual write survives the cutover.
- Preserve unrelated user changes in this checkout and implement only in the
  approved worktree.

## Files and Tasks

| File / directory                                                                        | Change                                                                             | Owner    | Depends on                   | Notes                                        |
| --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | -------- | ---------------------------- | -------------------------------------------- |
| `services/llm-config-service/src/{factory,index,types,repositories,services,dual-read}` | delete legacy provider stack; expose new runtime adapter                           | Task-A-1 | none                         | source-of-truth package                      |
| `services/llm-gateway/src/resolver/upstream-provider.ts`                                | decrypt envelope at upstream boundary                                              | Task-B-1 | Task-A-1                     | no environment fallback                      |
| `apps/server`, `packages/server`, `services/analytics-service`                          | replace legacy registry services/routes with read-only/new contract consumers      | Task-B-2 | Task-A-1                     | remove writes                                |
| `apps/web/src/features/**`, `apps/web/src/shared/lib/api-client/**`                     | remove every mutation UI/client path; keep unrelated reads and deprecation handoff | Task-C-1 | Task-B-2                     | deprecated application is read-only globally |
| package manifests, exports, affected tests                                              | remove unused dependencies/exports and verify cutover                              | Task-D-1 | Task-B-1, Task-B-2, Task-C-1 | final sweep                                  |

### Implementation sequence

- **Batch A — foundation:** delete the old provider persistence/service/dual-read
  stack and define the smallest runtime-only encrypted-credential adapter.
- **Batch B — core:** migrate the gateway and all Express/analytics package
  consumers from legacy registry services; remove legacy mutation endpoints.
- **Batch C — surface:** downgrade `apps/web` to read-only and make the
  deprecation/action handoff visible.
- **Batch D — final:** eliminate unused package exports/dependencies, run
  deletion scans, typechecks and focused integration tests.

## Documentation Verification

| Technology / version    | Focused question                      | Method             | Authoritative source                            | Finding applied to |
| ----------------------- | ------------------------------------- | ------------------ | ----------------------------------------------- | ------------------ |
| Drizzle ORM 0.38.4      | registry schema and query boundary    | repository-pattern | `database/src/schema/model-proxy/*.ts`          | Task-A-1, Task-B-1 |
| TanStack Start 1.168.27 | existing admin write boundary         | repository-pattern | `apps/ui/src/features/model-admin/server/*.ts`  | Task-A-1, Task-C-1 |
| Express routes          | current legacy HTTP consumer boundary | repository-pattern | `packages/server/src/routes/provider-routes.ts` | Task-B-2           |

No external lookup is needed: this is a repository-local contract cutover and
the installed APIs are fully demonstrated by the source paths above.

## Verification

**Test mode:** TDD for behavior changes.

**Testing guidance:** `docs/context/testing-anti-patterns.md`

```bash
pnpm --filter @lite-llm/llm-config-service test
pnpm --filter @lite-llm/llm-gateway test
pnpm --filter server test
pnpm --filter web test
pnpm --filter @lite-llm/llm-config-service typecheck
pnpm --filter @lite-llm/llm-gateway typecheck
pnpm --filter server typecheck
pnpm --filter web typecheck
rg -n "secretRef|ProvidersService|ProvidersRepository|providers-dual-read" services apps packages
```

| ID  | Scenario                                                        | Level                 | Owner              | Evidence                                          |
| --- | --------------------------------------------------------------- | --------------------- | ------------------ | ------------------------------------------------- |
| T1  | encrypted provider credentials resolve only at upstream runtime | unit/integration      | Task-B-1           | missing/corrupt envelopes fail closed             |
| T2  | no legacy provider writer is exported or routed                 | static/integration    | Task-A-1, Task-B-2 | deletion scan and route tests                     |
| T3  | `apps/web` reads but cannot mutate provider/model state         | component/integration | Task-C-1           | absent writer controls and rejected/absent routes |
| T4  | all affected packages compile                                   | typecheck             | Task-D-1           | focused workspace checks pass                     |

**Human review:** open `apps/web` as admin and viewer; confirm data remains
visible, no create/edit/delete/sync action is actionable, and the UI directs
administration to `apps/ui`.

## Risks and Handoff

| Risk                          | Detection                          | Mitigation                                                  | Rollback / recovery                               |
| ----------------------------- | ---------------------------------- | ----------------------------------------------------------- | ------------------------------------------------- |
| hidden legacy caller          | deletion scan/typecheck            | migrate every compile-time consumer before deleting exports | revert the cutover commit                         |
| missing credential at gateway | gateway tests and controlled probe | fail closed with sanitized error                            | re-register the encrypted credential in `apps/ui` |
| web loses read data           | app-web read tests                 | preserve GET adapters until UI retirement                   | restore read adapter only, not writers            |

**Rollout / observability:** deploy the new packages together; no schema
migration is needed because the live schema already contains the clean-cut
columns. Monitor sanitized upstream credential errors after deployment.

## Registry Handoff

- **Spec:** `docs/specs/0005-modelos-providers-roteamento-spec.md`
- **Plan:** `docs/plans/0005-modelos-providers-legacy-cutover.md`
- **Registry:** `docs/jobs/0005-modelos-providers-legacy-cutover/super-plan.json`
- **Progress ledger:** `docs/jobs/0005-modelos-providers-legacy-cutover/progress-ledger.md`

**Decomposition handoff:** sequential, per-task review, worktree approved by
the user, base branch `main`, feature branch
`codex/model-providers-legacy-cutover`; conflict scan is clean because each
task owns distinct primary files and later batches depend on the foundation.
