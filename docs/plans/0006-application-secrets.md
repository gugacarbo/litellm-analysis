---
status: draft
date: 2026-07-14
spec: docs/specs/0006-application-secrets-spec.md
decisions:
  - docs/spec-decisions/0006_application_secrets_decisions.md
implemented-by: []
---

> Process: super-planning — Fase 3 (PLAN). Regras em
> `/home/gustavo/.agents/skills/super-planning/phases/03-plan.md`.

# Plano de implementação: segredos de aplicação cifrados

## Summary

**Goal:** Administradores configuram com segurança as chaves de Artificial
Analysis e OpenRouter, e cada sync usa exclusivamente o valor cifrado no banco.

**Scope:** Criar `application_secrets_store`, serviço/repositório de segredos,
funções e página administrativa, runtime dos syncs, remoção do contrato de
ambiente e testes TDD.

**Out of scope:** Rotação da chave mestra, fallback/importação de `.env`,
segredos livres, providers, API keys do proxy e histórico.

**Success signal:** Apenas `admin` configura status/valores sem poder relê-los;
cada sync resolve sua chave do banco no disparo; nenhum segredo aparece em DTO,
status, erro, log ou resposta.

## Context and Design

Hoje `apps/server/src/runtime/app-runtime.ts` injeta valores de `env` nos
syncs. `services/llm-config-service/src/lib/provider-secrets.ts` já implementa
envelope AES-256-GCM com `APP_ENCRYPTION_KEY`; o painel em
`apps/ui/src/features/model-admin/` já tem funções server-side autenticadas.

**Architecture:** A tabela física é exatamente `application_secrets_store`.
`ApplicationSecretsService` cifra antes de upsert, lista apenas metadados e
resolve plaintext somente para o runtime. Syncs recebem um resolvedor assíncrono
e obtêm a chave no início de cada execução. A UI usa handlers próprios,
separados de `ModelAdminService`, porque até a listagem de status exige `admin`.

**Tech stack / versions:** Node `crypto` AES-256-GCM, Drizzle ORM, TanStack
Start `1.168.27`, React Hook Form `7.81.0`, Zod e Vitest `4.1.5`.

**Execution mode:** Fundação sequencial; depois runtime e UI em paralelo, pois
ambos consomem somente o contrato exportado da fundação e não compartilham
arquivos. Revisão por tarefa.

### Flow

1. Admin abre `/models/secrets`; sessão e papel são validados antes de DB/service.
2. Save valida uma das duas chaves, cifra e faz upsert por `key`.
3. UI invalida query e mostra apenas `isConfigured`; remover é explícito e idempotente.
4. Cada endpoint de sync resolve a chave no início de `start()` e passa cópia
   efêmera ao runner.
5. Ausência/corrupção falha fechado com os códigos públicos legados; erro do
   runner é normalizado e nunca pode ecoar o segredo.

### Contracts

```ts
type ApplicationSecretKey =
  | "artificial_analysis_api_key"
  | "openrouter_api_key";

type ApplicationSecretPublic = {
  key: ApplicationSecretKey;
  isConfigured: boolean;
  createdAt: Date | null;
  updatedAt: Date | null;
};

type ApplicationSecretsResolver =
  (key: ApplicationSecretKey) => Promise<string | null>;
```

Resolver plaintext is internal to sync execution. Public operations never
return the value, envelope, IV, tag, fingerprint or derived material.

## References and Constraints

| Source | Governs | Consequence |
| --- | --- | --- |
| `docs/specs/0006-application-secrets-spec.md` | contract, access, runtime and errors | Implement exactly two allowlisted keys and no fallback. |
| `docs/spec-decisions/0006_application_secrets_decisions.md` | table name and separation from providers | Use dedicated `application_secrets_store` service/repository. |
| `docs/context/CONVENTIONS.md` | crypto, Drizzle and UI rules | Reuse envelope; no secret output; use shadcn/RHF/Zod. |
| `docs/context/testing-anti-patterns.md` | test substitutes | Use repository fakes/runner stubs only at real boundaries. |

**Unresolved decisions:** None.

**Global constraints:**

- `APP_ENCRYPTION_KEY` is the only crypto key and remains outside the database.
- Authorization happens before service construction or decryption.
- Rows store ciphertext only. Values and crypto material never cross public,
  logging, trace, metric, loader, cache or status boundaries.
- No environment fallback, bootstrap or compatibility read exists.
- Preserve `ARTIFICIAL_ANALYSIS_API_KEY_MISSING` and
  `OPENROUTER_API_KEY_MISSING` as public codes, but remove env schema/runtime/example use.
- All behavior work follows TDD and reads `docs/context/testing-anti-patterns.md`.

## Files and Tasks

| File / directory | Change | Owner | Depends on | Contract |
| --- | --- | --- | --- | --- |
| `database/src/schema/application-secrets.ts` | create table/type | `Task-A-1` | none | Name is exactly `application_secrets_store`; unique key, non-null envelope. |
| `database/src/schema/index.ts`, `database/drizzle/`, contract test | modify/generate | `Task-A-1` | none | Export schema and generated migration. |
| `services/llm-config-service/src/repositories/application-secrets-repository.ts` | create | `Task-A-1` | none | Drizzle find/upsert/delete seam. |
| `services/llm-config-service/src/services/application-secrets.service.ts`, tests, exports/factory | create/modify | `Task-A-1` | none | Allowlist, crypto, metadata DTO and internal resolver. |
| `packages/config/src/server.ts`, `.env.example` | modify | `Task-B-1` | `Task-A-1` | Remove two runtime environment contracts. |
| `apps/server/src/application/*benchmark-sync*`, tests, `runtime/app-runtime.ts` | modify/create | `Task-B-1` | `Task-A-1` | Resolve at trigger time; safe runner errors. |
| `apps/ui/src/features/model-admin/secrets/` | create | `Task-C-1` | `Task-A-1` | Admin-only UI and tests. |
| `apps/ui/src/features/model-admin/contracts/model-admin.ts`, server functions/handlers, queries | modify/create | `Task-C-1` | `Task-A-1` | Auth-first Zod contracts and invalidation. |
| `apps/ui/src/routes/_protected/models/secrets.tsx`, route tree | create/modify | `Task-C-1` | `Task-A-1` | Protected preloaded route. |
| SPEC/docs indexes | modify | `Task-D-1` | `Task-B-1`, `Task-C-1` | Close only after evidence and review. |

### Implementation sequence

- **Batch A — foundation:** `Task-A-1` creates schema, migration, repository and
  service with schema/service RED-GREEN tests.
- **Batch B — parallel core/surface:** `Task-B-1` changes config/runtime/syncs;
  `Task-C-1` builds the admin surface. Each depends on A only and owns disjoint files.
- **Batch D — final:** `Task-D-1` runs focused/full checks, reviews the branch,
  records evidence and transitions the spec only when every gate is green.

## Documentation Verification

| Technology | Focused question | Method | Source | Applied to |
| --- | --- | --- | --- | --- |
| Drizzle ORM | table/export/migration pattern | repository-pattern | `database/src/schema/model-proxy/table.ts`, `database/package.json` | A uses shared schema/export and `db:generate`. |
| Node crypto | envelope/key parsing behavior | repository-pattern | `services/llm-config-service/src/lib/provider-secrets.ts` | A reuses AES-GCM/fail-closed path. |
| TanStack Start | auth-first server function pattern | repository-pattern | `apps/ui/src/features/model-admin/server/model-admin.functions.ts` | C keeps DB lazy until admin auth. |
| React Query/UI | prefetch/query/invalidation pattern | repository-pattern | `apps/ui/src/features/model-admin/query/query-options.ts` | C adds isolated keys/loader. |
| Vitest | focused package command pattern | repository-pattern | package scripts and `apps/server/vitest.config.ts` | Task commands use package `exec vitest run`. |

No external lookup is needed: all material APIs have current, directly
applicable repository patterns and this plan introduces no ambiguous new API.

## Verification

**Test mode:** TDD for behavior changes.

**Testing guidance:** `docs/context/testing-anti-patterns.md`.

```bash
pnpm exec vitest run database/src/schema/model-proxy/schema-contract.test.ts
pnpm --filter @lite-llm/llm-config-service exec vitest run src/services/__tests__/application-secrets.service.test.ts
pnpm --filter ui exec vitest run src/features/model-admin/secrets/secrets-page.test.tsx src/features/model-admin/server/application-secrets.handlers.test.ts
pnpm --filter server exec vitest run src/__tests__/benchmark-sync-application-service.test.ts src/__tests__/openrouter-benchmark-sync-application-service.test.ts
! rg -n 'ARTIFICIAL_ANALYSIS_API_KEY|OPENROUTER_API_KEY' packages/config/src apps/server/src/runtime .env.example
pnpm typecheck
pnpm verify -c
```

| ID | Scenario | Level | Owner | Evidence |
| --- | --- | --- | --- | --- |
| T1 | unique key/non-null envelope | schema | `Task-A-1` | RED/GREEN contract test |
| T2 | encrypt/upsert/list metadata only | service | `Task-A-1` | fake repository, no secret result |
| T3 | missing/corrupt record fails closed | service | `Task-A-1` | resolver failure, no runner call |
| T4 | unauthenticated/viewer never constructs service | handler | `Task-C-1` | call order test |
| T5 | admin save/remove does not show value | component | `Task-C-1` | mutation/invalidation test |
| T6 | sync resolves at trigger time | application | `Task-B-1` | runner receives resolved value |
| T7 | runner echo cannot reach status/route | application/route | `Task-B-1` | safe fixed error test |
| T8 | deleted env vars absent from contract | config/runtime | `Task-B-1` | scoped search/bootstrap test |

**Human review:** Save real keys in a controlled environment, trigger both
syncs, inspect UI/logs, and verify deploy removes only the two upstream vars.

## Risks and Handoff

| Risk | Detection | Mitigation | Recovery |
| --- | --- | --- | --- |
| Missing DB secret | 503 configuration response | Admin saves value | Resave value from controlled source. |
| Runner echoes token | status/route regression test | Normalize failures | Revert runtime change and rotate key. |
| Migration drift | generated migration/schema test | Generate from schema | Revert before deploy. |
| UI auth bypass | handler order test | Separate admin-only handlers | Remove route/function. |

**Rollout:** Apply migration before server/UI code; configure both values before
sync. No feature flag or compatibility window exists.

## Registry Handoff

- **Spec:** `docs/specs/0006-application-secrets-spec.md`
- **Plan:** `docs/plans/0006-application-secrets.md`
- **Registry:** `docs/jobs/0006-application-secrets/super-plan.json`
- **Progress ledger:** `docs/jobs/0006-application-secrets/progress-ledger.md`

**Decomposition handoff:** parallel after foundation, per-task review, base
commit recorded before dispatch. Conflict scan is clean: B and C have no shared
files and consume A's exported contract.

**Completion handoff:** record focused tests, typecheck, quick verification,
migration, generated docs and controlled-environment review before marking the
spec implemented.
