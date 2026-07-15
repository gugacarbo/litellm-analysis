> **Process:** `super-planning` — this ledger is generated from `super-plan.json` by the active super-planning helper.
> Follow `super-planning/SKILL.md` and the active phase instructions when interpreting or updating this work.

# Progress Ledger: application-secrets

> **Plan:** `0006-application-secrets`
> **Registry:** `docs/jobs/0006-application-secrets/super-plan.json`
> **Generated:** 2026-07-15T01:50:24Z
> **Regenerated on every `super-plan.json` write via the active `render-progress-ledger.sh` helper path**

## Summary

| Status           | Count |
| ---------------- | ----- |
| pending          | 0     |
| in_progress      | 0     |
| ready_for_review | 0     |
| reviewing        | 0     |
| needs_fix        | 0     |
| blocked          | 0     |
| completed        | 4     |
| cancelled        | 0     |
| **Total**        | **4** |

## Agent Profiles

| Profile         | Model        | Agent                   | Effort |
| --------------- | ------------ | ----------------------- | ------ |
| generalExecutor | gpt-5.6-luna | general-executor        | medium |
| deepExecutor    | gpt-5.6-luna | deep-executor           | medium |
| taskReviewer    | gpt-5.6-luna | code-reviewer           | medium |
| investigator    | gpt-5.6-luna | investigator            | medium |
| specReviewer    | gpt-5.6-luna | spec-document-reviewer  | medium |
| finalAuditor    | gpt-5.6-luna | spec-compliance-auditor | medium |

## Tasks

| Task ID  | Title                                                  | Profile                   | Batch | Layer      | Status           | Dependencies       |
| -------- | ------------------------------------------------------ | ------------------------- | ----- | ---------- | ---------------- | ------------------ |
| Task-A-1 | Criar armazenamento e serviço de segredos de aplicação | deep → deepExecutor       | A     | foundation | [DONE] completed | —                  |
| Task-B-1 | Resolver segredos no disparo dos sincronizadores       | deep → deepExecutor       | B     | core       | [DONE] completed | Task-A-1           |
| Task-C-1 | Adicionar administração segura de segredos no painel   | general → generalExecutor | B     | surface    | [DONE] completed | Task-A-1           |
| Task-D-1 | Integrar, validar e fechar a entrega de segredos       | general → generalExecutor | D     | final      | [DONE] completed | Task-B-1, Task-C-1 |

## Timeline

| Timestamp            | Task     | Event            | Try  | Message                                                                                                                                                                                |
| -------------------- | -------- | ---------------- | ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-07-15T00:41:51Z | Task-A-1 | started          | None | Task dispatched after rebase to c22e434a.                                                                                                                                              |
| 2026-07-15T00:42:26Z | Task-A-1 | started          | 1    | Iniciada leitura de contrato, arquitetura e testes.                                                                                                                                    |
| 2026-07-15T00:45:17Z | Task-A-1 | info             | 1    | Testes RED confirmaram imports ausentes; schema, repositorio e servico agora implementados com testes focados verdes.                                                                  |
| 2026-07-15T00:48:38Z | Task-A-1 | ready_for_review | 1    | Fundacao concluida: schema, migration gerada, repositorio, servico e testes TDD verdes; relatorio preenchido.                                                                          |
| 2026-07-15T00:51:36Z | Task-A-1 | info             | None | Batch A review found P1 unsafe mixed migration drift and P2 missing runtime/database allowlist enforcement; returning task for one consolidated fix.                                   |
| 2026-07-15T00:52:13Z | Task-A-1 | started          | None | Task-A-1 remediation: migration isolation and allowlist constraints                                                                                                                    |
| 2026-07-15T00:57:46Z | Task-A-1 | info             | None | Remediation complete: generated migration now contains only application_secrets_store, allowlist CHECK, and unique index; repository write guard and wrong-key fail-closed test added. |
| 2026-07-15T00:57:46Z | Task-A-1 | ready_for_review | None | Task-A-1 remediation verified; ready for re-review.                                                                                                                                    |
| 2026-07-15T01:00:22Z | Task-A-1 | completed        | None | c22e434a3fb31b00a29c961681a23d3575343115..HEAD review clean; focused schema 4/4 and service 6/6 passed; APP_ENCRYPTION_KEY helper compatibility verified.                              |
| 2026-07-15T01:01:01Z | Task-B-1 | started          | None | Batch B runtime integration dispatched after reviewed Task-A foundation.                                                                                                               |
| 2026-07-15T01:01:04Z | Task-C-1 | started          | None | Batch B admin surface dispatched after reviewed Task-A foundation.                                                                                                                     |
| 2026-07-15T01:01:31Z | Task-B-1 | started          | 1    | Iniciada a migracao de resolucao de segredos por disparo.                                                                                                                              |
| 2026-07-15T01:01:44Z | Task-C-1 | started          | None | Started Task-C-1 admin secrets UI/API                                                                                                                                                  |
| 2026-07-15T01:09:26Z | Task-B-1 | info             | None | Original worker exceeded platform usage; orchestrator completed scope, green focused sync suite 12/12 and server typecheck.                                                            |
| 2026-07-15T01:09:29Z | Task-B-1 | ready_for_review | None | Runtime/config integration complete; focused suite 12/12 and server typecheck passed.                                                                                                  |
| 2026-07-15T01:16:43Z | Task-C-1 | info             | None | Original worker ended without handoff; orchestrator completed UI/API, green focused UI suite 12/12 and UI typecheck.                                                                   |
| 2026-07-15T01:16:47Z | Task-C-1 | ready_for_review | None | Admin secrets UI/API complete; focused UI suite 12/12 and UI typecheck passed.                                                                                                         |
| 2026-07-15T01:27:27Z | Task-B-1 | info             | None | Batch B review found missing route compatibility regression and RED transcript; both remediated with real isolated-base RED and new route tests.                                       |
| 2026-07-15T01:27:32Z | Task-C-1 | info             | None | Batch B review found missing React Hook Form/Zod use and RED transcript; both remediated with form refactor and real isolated-base RED.                                                |
| 2026-07-15T01:27:59Z | Task-B-1 | ready_for_review | None | Remediation complete: route compatibility regressions and isolated-base RED transcript added; green 14/14 and server typecheck.                                                        |
| 2026-07-15T01:28:04Z | Task-C-1 | ready_for_review | None | Remediation complete: React Hook Form/Zod and isolated-base RED transcript added; green UI 12/12 and UI typecheck.                                                                     |
| 2026-07-15T01:30:26Z | Task-B-1 | info             | None | Second review requested captured RED output; actual isolated worktree transcript added to report.                                                                                      |
| 2026-07-15T01:30:31Z | Task-C-1 | info             | None | Second review requested captured RED output; actual isolated worktree transcript added to report.                                                                                      |
| 2026-07-15T01:32:42Z | Task-B-1 | completed        | None | c22e434a3fb31b00a29c961681a23d3575343115..HEAD batch B review clean; dynamic resolver, route compatibility, TDD transcripts, focused 14/14 and server typecheck passed.                |
| 2026-07-15T01:32:47Z | Task-C-1 | completed        | None | c22e434a3fb31b00a29c961681a23d3575343115..HEAD batch B review clean; admin-only UI/API, RHF/Zod, TDD transcript, focused UI 12/12 and UI typecheck passed.                             |
| 2026-07-15T01:33:34Z | Task-D-1 | started          | None | Final integration and verification started after reviewed batches A and B.                                                                                                             |
| 2026-07-15T01:49:37Z | Task-D-1 | ready_for_review | None | Final integration complete; user-approved external baselines documented and final remediation audit approved.                                                                          |
| 2026-07-15T01:50:06Z | Task-D-1 | completed        | None | c22e434a3fb31b00a29c961681a23d3575343115..HEAD final audit clean; focused tests/typechecks/docs passed and user-approved external baselines documented.                                |

## Requirements Coverage

| Requirement                                   | Status           | Covered By                   |
| --------------------------------------------- | ---------------- | ---------------------------- |
| REQ-001: Persistência cifrada                 | [DONE] completed | Task-A-1, Task-D-1           |
| REQ-002: Gestão administrativa restrita       | [DONE] completed | Task-A-1, Task-C-1, Task-D-1 |
| REQ-003: Contrato criptográfico e fail-closed | [DONE] completed | Task-A-1, Task-B-1, Task-D-1 |
| REQ-004: Resolução dinâmica no sync           | [DONE] completed | Task-B-1, Task-D-1           |
| REQ-005: Remoção do contrato de ambiente      | [DONE] completed | Task-B-1, Task-C-1, Task-D-1 |

## Registry Parameters

Every parameter from `super-plan.json` is preserved below. This section is generated directly from the registry so the ledger remains a complete, auditable representation of the plan configuration and task data.

<details>
<summary>Complete <code>super-plan.json</code></summary>

```json
{
  "$schema": "https://raw.githubusercontent.com/gugacarbo/agents-skills/main/skills/super-planning/interfaces/super-plan.schema.json",
  "createdAt": "2026-07-14T23:05:59.996481+00:00",
  "planId": "0006-application-secrets",
  "featureName": "application-secrets",
  "status": "completed",
  "source": {
    "spec": "docs/specs/0006-application-secrets-spec.md",
    "plan": "docs/plans/0006-application-secrets.md"
  },
  "goal": "Administradores gerenciam duas chaves cifradas no banco e os sincronizadores as resolvem no disparo.",
  "architectureSummary": "application_secrets_store com ApplicationSecretsService cifrado; runtime usa resolvedor assíncrono; UI admin-only não expõe valores.",
  "techStack": [
    "Node.js crypto AES-256-GCM",
    "Drizzle ORM",
    "TanStack Start",
    "React Hook Form",
    "Zod",
    "Vitest"
  ],
  "executionMode": "subagent-driven",
  "reviewCadence": "per_batch",
  "agents": {
    "generalExecutor": {
      "model": "gpt-5.6-luna",
      "agent": "general-executor",
      "effort": "medium"
    },
    "deepExecutor": {
      "model": "gpt-5.6-luna",
      "agent": "deep-executor",
      "effort": "medium"
    },
    "taskReviewer": {
      "model": "gpt-5.6-luna",
      "agent": "code-reviewer",
      "effort": "medium"
    },
    "investigator": {
      "model": "gpt-5.6-luna",
      "agent": "investigator",
      "effort": "medium"
    },
    "specReviewer": {
      "model": "gpt-5.6-luna",
      "agent": "spec-document-reviewer",
      "effort": "medium"
    },
    "finalAuditor": {
      "model": "gpt-5.6-luna",
      "agent": "spec-compliance-auditor",
      "effort": "medium"
    }
  },
  "branchStrategy": {
    "baseBranch": "main",
    "featureBranch": "codex/application-secrets-store"
  },
  "worktree": {
    "enabled": true,
    "path": "/home/gustavo/Apps/lite-llm-analytics/.worktrees/codex/application-secrets-store"
  },
  "globalConstraints": [
    "APP_ENCRYPTION_KEY e a única chave de criptografia e fica fora do banco.",
    "Somente admin pode listar status ou mutar segredos; autorizacao precede servico.",
    "Nenhum plaintext ou material criptografico cru cruza DTO, log, trace, status, cache ou resposta.",
    "Nao existe fallback, bootstrap ou leitura de ambiente para as duas chaves.",
    "Manter os codigos publicos legados de chave ausente.",
    "TDD obrigatorio; ler docs/context/testing-anti-patterns.md antes de mocks."
  ],
  "fileStructure": [
    {
      "path": "database/src/schema/application-secrets.ts",
      "ownerTask": "Task-A-1",
      "notes": "Tabela application_secrets_store e tipos Drizzle."
    },
    {
      "path": "services/llm-config-service/src/services/application-secrets.service.ts",
      "ownerTask": "Task-A-1",
      "notes": "Cifra, metadata DTO e resolvedor interno."
    },
    {
      "path": "apps/server/src/application/benchmark-sync-application-service.ts",
      "ownerTask": "Task-B-1",
      "notes": "Resolução por trigger e erro seguro."
    },
    {
      "path": "apps/ui/src/features/model-admin/secrets/",
      "ownerTask": "Task-C-1",
      "notes": "Página e testes admin-only."
    },
    {
      "path": "docs/jobs/0006-application-secrets/",
      "ownerTask": "Task-D-1",
      "notes": "Evidência e fechamento do plano."
    }
  ],
  "requirementsChecklist": [
    {
      "id": "REQ-001",
      "title": "Persistência cifrada",
      "source": "SPEC-0006 Modelo de dados",
      "status": "completed",
      "acceptanceCriteria": [
        "Tabela application_secrets_store tem key única e envelope não nulo.",
        "Plaintext nunca é persistido."
      ],
      "coveredByTasks": ["Task-A-1", "Task-D-1"],
      "notes": ["Migration é gerada do schema Drizzle."]
    },
    {
      "id": "REQ-002",
      "title": "Gestão administrativa restrita",
      "source": "SPEC-0006 Fluxo e Edge cases",
      "status": "completed",
      "acceptanceCriteria": [
        "Somente admin lista status, salva ou remove.",
        "Viewer e anônimo são rejeitados antes de criar serviço."
      ],
      "coveredByTasks": ["Task-A-1", "Task-C-1", "Task-D-1"],
      "notes": ["Status também não é visível para viewer."]
    },
    {
      "id": "REQ-003",
      "title": "Contrato criptográfico e fail-closed",
      "source": "SPEC-0006 Requisitos e Edge cases",
      "status": "completed",
      "acceptanceCriteria": [
        "APP_ENCRYPTION_KEY cifra e decifra somente no limite interno.",
        "Envelope ausente ou inválido impede o runner."
      ],
      "coveredByTasks": ["Task-A-1", "Task-B-1", "Task-D-1"],
      "notes": ["Reutilizar envelope AES-256-GCM existente."]
    },
    {
      "id": "REQ-004",
      "title": "Resolução dinâmica no sync",
      "source": "SPEC-0006 Fluxo",
      "status": "completed",
      "acceptanceCriteria": [
        "Cada trigger resolve a chave no banco.",
        "Erro do runner não vaza segredo em status ou rota."
      ],
      "coveredByTasks": ["Task-B-1", "Task-D-1"],
      "notes": ["Códigos públicos legados permanecem estáveis."]
    },
    {
      "id": "REQ-005",
      "title": "Remoção do contrato de ambiente",
      "source": "SPEC-0006 Escopo e DoD",
      "status": "completed",
      "acceptanceCriteria": [
        "As duas variáveis não existem no schema/config/runtime/example.",
        "Não há bootstrap nem fallback."
      ],
      "coveredByTasks": ["Task-B-1", "Task-C-1", "Task-D-1"],
      "notes": [
        "Os nomes podem existir nos códigos públicos de compatibilidade."
      ]
    }
  ],
  "taskDirectory": "docs/jobs/0006-application-secrets",
  "rules": [
    "Nunca iniciar implementacao na main sem permissao.",
    "Nunca redespachar tarefa concluida.",
    "Somente o orquestrador altera super-plan.json por meio deste helper.",
    "Revisao unica por batch com gpt-5.6-luna medium.",
    "A API de dispatch desta sessao nao expoe selecao explicita de modelo ou effort; os perfis gpt-5.6-luna medium permanecem como configuracao solicitada e os workers usam o padrao da plataforma."
  ],
  "tasks": [
    {
      "id": "Task-A-1",
      "title": "Criar armazenamento e serviço de segredos de aplicação",
      "description": "Implementar application_secrets_store, migration gerada, repositório Drizzle e ApplicationSecretsService allowlisted com envelope cifrado e DTOs sem segredo.",
      "status": "completed",
      "tryCount": 1,
      "maxTries": 3,
      "task_profile": "deep",
      "batch": "A",
      "layer": "foundation",
      "reportFile": "docs/jobs/0006-application-secrets/Task-A-1/report.md",
      "reviewPackage": "docs/jobs/0006-application-secrets/Task-A-1/review-package.diff.md",
      "progressLog": "docs/jobs/0006-application-secrets/Task-A-1/progress.log",
      "logTaskScript": "docs/jobs/0006-application-secrets/Task-A-1/log-task.sh",
      "baseCommit": "c22e434a3fb31b00a29c961681a23d3575343115",
      "dependencies": [],
      "acceptanceCriteria": [
        "application_secrets_store has a unique key and non-null credential_envelope in its Drizzle contract and generated migration.",
        "Only artificial_analysis_api_key and openrouter_api_key can be written or resolved.",
        "Writes persist AES-256-GCM envelopes and public reads expose only key, isConfigured and timestamps.",
        "Missing or malformed stored values fail closed without returning plaintext or crypto material.",
        "Focused schema and service tests show RED before implementation and GREEN after it."
      ],
      "requirements": ["REQ-001", "REQ-002", "REQ-003"],
      "rules": [
        "TDD required for this behavior-changing task.",
        "Read docs/context/testing-anti-patterns.md before adding mocks, fakes, fixtures, or test-only helpers.",
        "Reuse APP_ENCRYPTION_KEY envelope behavior; never log or return plaintext, ciphertext, IV, tag or fingerprints.",
        "Generate migrations from the Drizzle schema rather than writing SQL by hand.",
        "Report RED and GREEN commands and results in the task report."
      ],
      "steps": [
        {
          "order": 1,
          "title": "Adicionar testes RED de schema e serviço",
          "description": "Criar os testes de contrato e serviço para allowlist, envelope, metadata-only e fail-closed antes do código.",
          "command": "pnpm exec vitest run database/src/schema/model-proxy/schema-contract.test.ts",
          "expectedResult": "Os novos casos falham porque a tabela e o serviço ainda não existem.",
          "codeExample": null
        },
        {
          "order": 2,
          "title": "Implementar schema, migration e serviço",
          "description": "Criar tabela, exports, migration gerada, repositório e ApplicationSecretsService com DTO público e resolvedor interno.",
          "command": "pnpm --filter @lite-llm/database db:generate",
          "expectedResult": "Migration é gerada a partir de application_secrets_store.",
          "codeExample": null
        },
        {
          "order": 3,
          "title": "Executar testes GREEN focados",
          "description": "Rodar os testes novos de schema e serviço e confirmar ausência de valores em retornos públicos.",
          "command": "pnpm --filter @lite-llm/llm-config-service exec vitest run src/services/__tests__/application-secrets.service.test.ts",
          "expectedResult": "Todos os testes focados passam.",
          "codeExample": null
        }
      ],
      "filesTouched": [
        "database/src/schema/application-secrets.ts",
        "database/src/schema/index.ts",
        "database/drizzle/",
        "database/src/schema/model-proxy/schema-contract.test.ts",
        "services/llm-config-service/src/repositories/application-secrets-repository.ts",
        "services/llm-config-service/src/services/application-secrets.service.ts",
        "services/llm-config-service/src/services/__tests__/application-secrets.service.test.ts",
        "services/llm-config-service/src/index.ts",
        "services/llm-config-service/src/factory.ts"
      ],
      "files": {
        "created": [
          "database/src/schema/application-secrets.ts",
          "services/llm-config-service/src/repositories/application-secrets-repository.ts",
          "services/llm-config-service/src/services/application-secrets.service.ts",
          "services/llm-config-service/src/services/__tests__/application-secrets.service.test.ts"
        ],
        "modified": [
          "database/src/schema/index.ts",
          "database/src/schema/model-proxy/schema-contract.test.ts",
          "services/llm-config-service/src/index.ts",
          "services/llm-config-service/src/factory.ts"
        ],
        "deleted": []
      },
      "notes": [
        "The physical database table must be named application_secrets_store exactly."
      ]
    },
    {
      "id": "Task-B-1",
      "title": "Resolver segredos no disparo dos sincronizadores",
      "description": "Remover as duas chaves do contrato de ambiente e alterar os syncs de Artificial Analysis e OpenRouter para resolver o valor do banco por disparo, preservando códigos públicos e redigindo falhas do runner.",
      "status": "completed",
      "tryCount": 1,
      "maxTries": 3,
      "task_profile": "deep",
      "batch": "B",
      "layer": "core",
      "reportFile": "docs/jobs/0006-application-secrets/Task-B-1/report.md",
      "reviewPackage": "docs/jobs/0006-application-secrets/Task-B-1/review-package.diff.md",
      "progressLog": "docs/jobs/0006-application-secrets/Task-B-1/progress.log",
      "logTaskScript": "docs/jobs/0006-application-secrets/Task-B-1/log-task.sh",
      "baseCommit": "c22e434a3fb31b00a29c961681a23d3575343115",
      "dependencies": ["Task-A-1"],
      "acceptanceCriteria": [
        "ARTIFICIAL_ANALYSIS_API_KEY and OPENROUTER_API_KEY are absent from config schema, app runtime and .env.example.",
        "Both sync services resolve their allowlisted secret at each trigger and do not retain a startup value.",
        "Missing/corrupt values stop the runner and preserve existing public *_API_KEY_MISSING codes.",
        "Runner errors cannot include the resolved secret in status or route responses.",
        "Focused RED/GREEN tests cover both syncs, missing secret and runner echo."
      ],
      "requirements": ["REQ-003", "REQ-004", "REQ-005"],
      "rules": [
        "TDD required for this behavior-changing task.",
        "Read docs/context/testing-anti-patterns.md before adding mocks, fakes, fixtures, or test-only helpers.",
        "Keep ARTIFICIAL_ANALYSIS_API_KEY_MISSING and OPENROUTER_API_KEY_MISSING as public compatibility codes only.",
        "Do not log, cache or return the resolved plaintext.",
        "Report RED and GREEN commands and results in the task report."
      ],
      "steps": [
        {
          "order": 1,
          "title": "Escrever regressões RED dos syncs",
          "description": "Cobrir resolução no trigger, ausência, envelope inválido e erro do runner que ecoa a chave.",
          "command": "pnpm --filter server exec vitest run src/__tests__/benchmark-sync-application-service.test.ts",
          "expectedResult": "Os novos cenários falham contra a injeção estática atual.",
          "codeExample": null
        },
        {
          "order": 2,
          "title": "Migrar runtime e contrato de ambiente",
          "description": "Remover as variáveis, injetar resolvedor do serviço e tornar o disparo assíncrono/safe onde necessário.",
          "command": "rg -n 'ARTIFICIAL_ANALYSIS_API_KEY|OPENROUTER_API_KEY' packages/config/src apps/server/src/runtime .env.example",
          "expectedResult": "Após a implementação, a busca não encontra contratos de ambiente removidos.",
          "codeExample": null
        },
        {
          "order": 3,
          "title": "Verificar GREEN e compatibilidade",
          "description": "Rodar testes focados e conferir códigos públicos de configuração ausente.",
          "command": "pnpm --filter server exec vitest run src/__tests__/benchmark-sync-application-service.test.ts src/__tests__/openrouter-benchmark-sync-application-service.test.ts",
          "expectedResult": "Testes passam e nenhum runner recebe chamada quando a configuração é inválida.",
          "codeExample": null
        }
      ],
      "filesTouched": [
        "packages/config/src/server.ts",
        ".env.example",
        "apps/server/src/runtime/app-runtime.ts",
        "apps/server/src/application/benchmark-sync-application-service.ts",
        "apps/server/src/application/openrouter-benchmark-sync-application-service.ts",
        "apps/server/src/__tests__/benchmark-sync-application-service.test.ts",
        "apps/server/src/__tests__/openrouter-benchmark-sync-application-service.test.ts"
      ],
      "files": {
        "created": [
          "apps/server/src/__tests__/openrouter-benchmark-sync-application-service.test.ts"
        ],
        "modified": [
          "packages/config/src/server.ts",
          ".env.example",
          "apps/server/src/runtime/app-runtime.ts",
          "apps/server/src/application/benchmark-sync-application-service.ts",
          "apps/server/src/application/openrouter-benchmark-sync-application-service.ts",
          "apps/server/src/__tests__/benchmark-sync-application-service.test.ts"
        ],
        "deleted": []
      },
      "notes": [
        "This task may start only after Task-A-1 exports the resolver contract."
      ]
    },
    {
      "id": "Task-C-1",
      "title": "Adicionar administração segura de segredos no painel",
      "description": "Criar rota /models/secrets, server functions, handlers, contracts, query options e UI para admins listar status, salvar/substituir e remover as duas chaves sem expor valores.",
      "status": "completed",
      "tryCount": 1,
      "maxTries": 3,
      "task_profile": "general",
      "batch": "B",
      "layer": "surface",
      "reportFile": "docs/jobs/0006-application-secrets/Task-C-1/report.md",
      "reviewPackage": "docs/jobs/0006-application-secrets/Task-C-1/review-package.diff.md",
      "progressLog": "docs/jobs/0006-application-secrets/Task-C-1/progress.log",
      "logTaskScript": "docs/jobs/0006-application-secrets/Task-C-1/log-task.sh",
      "baseCommit": "c22e434a3fb31b00a29c961681a23d3575343115",
      "dependencies": ["Task-A-1"],
      "acceptanceCriteria": [
        "The protected /models/secrets route preloads only metadata and renders the two fixed secret statuses.",
        "Unauthenticated and viewer requests fail before the service is created; admin requests can list, save and remove.",
        "Inputs accept only the two allowlisted keys and non-empty plaintext, while outputs never contain a secret or envelope.",
        "Save and removal invalidate the secrets query and the UI never repopulates a saved value.",
        "Focused handler, query and component tests demonstrate RED then GREEN."
      ],
      "requirements": ["REQ-002", "REQ-005"],
      "rules": [
        "TDD required for this behavior-changing task.",
        "Read docs/context/testing-anti-patterns.md before adding mocks, fakes, fixtures, or test-only helpers.",
        "Use the existing TanStack Start auth-first lazy import pattern and shadcn, React Hook Form and Zod primitives.",
        "Viewer must not receive even configuration status.",
        "Report RED and GREEN commands and results in the task report."
      ],
      "steps": [
        {
          "order": 1,
          "title": "Criar testes RED de autorização e UI",
          "description": "Cobrir sessão ausente, viewer, admin save/remove e ausência de campo preenchido após salvar.",
          "command": "pnpm --filter ui exec vitest run src/features/model-admin/server/application-secrets.handlers.test.ts",
          "expectedResult": "Os novos testes falham porque handlers e funções ainda não existem.",
          "codeExample": null
        },
        {
          "order": 2,
          "title": "Implementar contrato, handlers e rota",
          "description": "Adicionar schemas Zod, DTOs públicos, server functions auth-first, query options, página e rota protegida.",
          "command": "pnpm --filter ui run generate-routes",
          "expectedResult": "A rota /models/secrets aparece no route tree gerado.",
          "codeExample": null
        },
        {
          "order": 3,
          "title": "Rodar testes GREEN do painel",
          "description": "Executar handlers, query options e componente para confirmar autorização e não exposição.",
          "command": "pnpm --filter ui exec vitest run src/features/model-admin/secrets/secrets-page.test.tsx src/features/model-admin/server/application-secrets.handlers.test.ts",
          "expectedResult": "Todos os testes focados passam.",
          "codeExample": null
        }
      ],
      "filesTouched": [
        "apps/ui/src/features/model-admin/contracts/model-admin.ts",
        "apps/ui/src/features/model-admin/server/application-secrets.handlers.ts",
        "apps/ui/src/features/model-admin/server/application-secrets.functions.ts",
        "apps/ui/src/features/model-admin/query/query-options.ts",
        "apps/ui/src/features/model-admin/secrets/",
        "apps/ui/src/routes/_protected/models/secrets.tsx",
        "apps/ui/src/routeTree.gen.ts"
      ],
      "files": {
        "created": [
          "apps/ui/src/features/model-admin/server/application-secrets.handlers.ts",
          "apps/ui/src/features/model-admin/server/application-secrets.functions.ts",
          "apps/ui/src/features/model-admin/server/application-secrets.handlers.test.ts",
          "apps/ui/src/features/model-admin/secrets/secrets-page.tsx",
          "apps/ui/src/features/model-admin/secrets/secrets-page.test.tsx",
          "apps/ui/src/routes/_protected/models/secrets.tsx"
        ],
        "modified": [
          "apps/ui/src/features/model-admin/contracts/model-admin.ts",
          "apps/ui/src/features/model-admin/query/query-options.ts",
          "apps/ui/src/routeTree.gen.ts"
        ],
        "deleted": []
      },
      "notes": [
        "This task consumes ApplicationSecretsService but must not alter Task-A files."
      ]
    },
    {
      "id": "Task-D-1",
      "title": "Integrar, validar e fechar a entrega de segredos",
      "description": "Executar os gates focados e globais, conferir documentação/artefatos gerados, validar a remoção de env e preparar evidência de encerramento sem alterar contratos fora de escopo.",
      "status": "completed",
      "tryCount": 1,
      "maxTries": 3,
      "task_profile": "general",
      "batch": "D",
      "layer": "final",
      "reportFile": "docs/jobs/0006-application-secrets/Task-D-1/report.md",
      "reviewPackage": "docs/jobs/0006-application-secrets/Task-D-1/review-package.diff.md",
      "progressLog": "docs/jobs/0006-application-secrets/Task-D-1/progress.log",
      "logTaskScript": "docs/jobs/0006-application-secrets/Task-D-1/log-task.sh",
      "baseCommit": "c22e434a3fb31b00a29c961681a23d3575343115",
      "dependencies": ["Task-B-1", "Task-C-1"],
      "acceptanceCriteria": [
        "All focused schema, service, UI and sync tests pass together.",
        "pnpm typecheck and pnpm verify -c pass or any pre-existing failure is documented with unrelated evidence.",
        "docs-check reports zero errors and the generated index includes SPEC-0006.",
        "The scoped environment-variable search is empty while legacy public codes remain covered by route tests.",
        "The task report records commands, results, migration path and controlled-environment human review required before closure."
      ],
      "requirements": ["REQ-001", "REQ-002", "REQ-003", "REQ-004", "REQ-005"],
      "rules": [
        "Do not mark implementation tasks completed; that is orchestrator-owned after batch review.",
        "Do not broaden scope to key rotation, fallback or provider credential migration.",
        "Preserve user-owned changes outside this plan's file scopes.",
        "Record actual command output and unresolved conditions in the task report."
      ],
      "steps": [
        {
          "order": 1,
          "title": "Executar a matriz focada",
          "description": "Rodar os quatro grupos de teste definidos pela spec após B e C estarem revisados.",
          "command": "pnpm --filter ui exec vitest run src/features/model-admin/secrets/secrets-page.test.tsx src/features/model-admin/server/application-secrets.handlers.test.ts",
          "expectedResult": "A matriz focada passa sem exibir segredos.",
          "codeExample": null
        },
        {
          "order": 2,
          "title": "Verificar contratos globais",
          "description": "Rodar typecheck, quick verify, docs-check e busca escopada de variáveis removidas.",
          "command": "pnpm verify -c",
          "expectedResult": "Validação rápida passa ou falhas externas são registradas com escopo comprovado.",
          "codeExample": null
        },
        {
          "order": 3,
          "title": "Registrar evidência de handoff",
          "description": "Documentar migration, comandos, resultados e a necessidade de cadastro controlado de chaves reais.",
          "command": "scripts/docs-check --emit-index",
          "expectedResult": "Índices e documentação permanecem sem erros.",
          "codeExample": null
        }
      ],
      "filesTouched": [
        "docs/specs/0006-application-secrets-spec.md",
        "docs/index.json",
        "docs/specs/README.md",
        "docs/jobs/0006-application-secrets/"
      ],
      "files": {
        "created": [],
        "modified": [
          "docs/specs/0006-application-secrets-spec.md",
          "docs/index.json",
          "docs/specs/README.md"
        ],
        "deleted": []
      },
      "notes": [
        "Human review with real credentials is a release gate, not an automated test."
      ]
    }
  ],
  "updatedAt": "2026-07-15T01:50:24.801676+00:00"
}
```

</details>
