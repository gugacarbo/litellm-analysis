> **Process:** `super-planning` — this ledger is generated from `super-plan.json` by the active super-planning helper.
> Follow `super-planning/SKILL.md` and the active phase instructions when interpreting or updating this work.

# Progress Ledger: providers-detail-discovery

> **Plan:** `0007-providers-detail-discovery`
> **Registry:** `docs/jobs/0007-providers-detail-discovery/super-plan.json`
> **Generated:** 2026-07-15T04:14:06Z
> **Regenerated on every `super-plan.json` write via the active `render-progress-ledger.sh` helper path**

## Summary

| Status           | Count |
| ---------------- | ----- |
| pending          | 4     |
| in_progress      | 0     |
| ready_for_review | 0     |
| reviewing        | 0     |
| needs_fix        | 0     |
| blocked          | 0     |
| completed        | 0     |
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

| Task ID  | Title                                            | Profile                   | Batch | Layer      | Status         | Dependencies                 |
| -------- | ------------------------------------------------ | ------------------------- | ----- | ---------- | -------------- | ---------------------------- |
| Task-A-1 | Criar rota e página de detalhe do provider       | deep → deepExecutor       | A     | foundation | [PEND] pending | —                            |
| Task-B-1 | Simplificar lista de providers para navegação    | general → generalExecutor | B     | surface    | [PEND] pending | Task-A-1                     |
| Task-B-2 | Tornar Discovery um painel persistente           | general → generalExecutor | B     | surface    | [PEND] pending | Task-A-1                     |
| Task-C-1 | Integrar rota, verificar e encerrar documentação | deep → deepExecutor       | C     | final      | [PEND] pending | Task-A-1, Task-B-1, Task-B-2 |

## Timeline

| Timestamp | Task | Event                     | Try | Message |
| --------- | ---- | ------------------------- | --- | ------- |
| —         | —    | no task events logged yet | —   | —       |

## Requirements Coverage

| Requirement | Status                      | Covered By |
| ----------- | --------------------------- | ---------- |
| —           | no requirements defined yet | —          |

## Registry Parameters

Every parameter from `super-plan.json` is preserved below. This section is generated directly from the registry so the ledger remains a complete, auditable representation of the plan configuration and task data.

<details>
<summary>Complete <code>super-plan.json</code></summary>

```json
{
  "$schema": "https://raw.githubusercontent.com/gugacarbo/agents-skills/main/skills/super-planning/interfaces/super-plan.schema.json",
  "createdAt": "2026-07-15T04:13:11.117748+00:00",
  "planId": "0007-providers-detail-discovery",
  "featureName": "providers-detail-discovery",
  "status": "pending",
  "source": {
    "spec": "docs/specs/0007-providers-detail-discovery-spec.md",
    "plan": "docs/plans/0007-providers-detail-discovery.md"
  },
  "goal": "Transformar providers em lista navegável e concentrar configuração e Discovery persistente no detalhe.",
  "architectureSummary": "Rota protegida por providerId carrega ProviderSettingsPage; a página compõe configuração e um aside Discovery responsivo, preservando contratos existentes.",
  "techStack": [
    "TanStack Start",
    "TanStack Query",
    "React",
    "Tailwind CSS",
    "Vitest"
  ],
  "executionMode": "sequential",
  "reviewCadence": "final_only",
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
    "featureBranch": "main"
  },
  "worktree": {
    "enabled": false,
    "path": ""
  },
  "globalConstraints": [
    "Implementação autorizada diretamente na branch main pelo usuário.",
    "Sem worktree; preservar alterações locais não relacionadas.",
    "Manter autorização server-side e nunca expor credenciais.",
    "Discovery usa aside persistente, nunca Sheet modal/overlay.",
    "TDD obrigatório; ler docs/context/testing-anti-patterns.md antes de mocks."
  ],
  "fileStructure": [],
  "requirementsChecklist": [],
  "taskDirectory": "docs/jobs/0007-providers-detail-discovery",
  "rules": [
    "Nunca sobrescrever mudanças locais não relacionadas.",
    "Somente o orquestrador altera super-plan.json por meio deste helper.",
    "Execução sequencial direta; não despachar subagentes sem autorização explícita.",
    "Revisão final única com GPT-5.6 Luna medium."
  ],
  "continuation": {
    "enabled": false,
    "provider": "codex",
    "watchdogProfile": "default",
    "status": "disabled"
  },
  "tasks": [
    {
      "id": "Task-A-1",
      "title": "Criar rota e página de detalhe do provider",
      "description": "Criar a rota protegida /providers/$providerId e ProviderSettingsPage com recuperação, papéis e ações administrativas existentes.",
      "status": "pending",
      "tryCount": 1,
      "maxTries": 3,
      "task_profile": "deep",
      "batch": "A",
      "layer": "foundation",
      "reportFile": "docs/jobs/0007-providers-detail-discovery/Task-A-1/report.md",
      "reviewPackage": "docs/jobs/0007-providers-detail-discovery/Task-A-1/review-package.diff.md",
      "progressLog": "docs/jobs/0007-providers-detail-discovery/Task-A-1/progress.log",
      "logTaskScript": "docs/jobs/0007-providers-detail-discovery/Task-A-1/log-task.sh",
      "baseCommit": "9d2ae191d96d034fbba8d62222a5f0ddb53f3542",
      "dependencies": [],
      "acceptanceCriteria": [
        "A rota pré-carrega provider por id e trata provider ausente.",
        "Admin pode editar, testar persistido, tornar padrão e remover; viewer é somente leitura.",
        "A remoção bem-sucedida retorna à lista.",
        "Testes focados mostram RED antes e GREEN depois."
      ],
      "requirements": ["REQ-002", "REQ-003", "REQ-005"],
      "rules": [
        "TDD required for this behavior-changing task.",
        "Read docs/context/testing-anti-patterns.md before adding mocks, fakes, fixtures, or test-only helpers.",
        "Preserve server-side authorization and never surface credentials.",
        "Report RED and GREEN commands and results in the task report."
      ],
      "steps": [
        {
          "order": 1,
          "title": "Escrever testes RED do detalhe",
          "description": "Cobrir rota, estados de papel, teste, remoção e recuperação antes da implementação.",
          "command": "pnpm --dir apps/ui exec vitest run src/features/model-admin/providers/provider-settings-page.test.tsx",
          "expectedResult": "Os cenários novos falham porque detalhe e rota ainda não existem.",
          "codeExample": null
        },
        {
          "order": 2,
          "title": "Implementar rota e página",
          "description": "Criar loader/rota e compor formulário e ações persistidas com queries existentes.",
          "command": "pnpm --dir apps/ui exec vitest run src/features/model-admin/providers/provider-settings-page.test.tsx",
          "expectedResult": "Os cenários do detalhe passam.",
          "codeExample": null
        }
      ],
      "filesTouched": [
        "apps/ui/src/routes/_protected/providers/$providerId.tsx",
        "apps/ui/src/features/model-admin/providers/provider-settings-page.tsx",
        "apps/ui/src/features/model-admin/providers/provider-settings-page.test.tsx"
      ],
      "files": {
        "created": [
          "apps/ui/src/routes/_protected/providers/$providerId.tsx",
          "apps/ui/src/features/model-admin/providers/provider-settings-page.tsx",
          "apps/ui/src/features/model-admin/providers/provider-settings-page.test.tsx"
        ],
        "modified": [],
        "deleted": []
      },
      "notes": []
    },
    {
      "id": "Task-B-1",
      "title": "Simplificar lista de providers para navegação",
      "description": "Remover ações diretas dos cards e converter cada provider em item compacto que navega ao detalhe, preservando criação.",
      "status": "pending",
      "tryCount": 1,
      "maxTries": 3,
      "task_profile": "general",
      "batch": "B",
      "layer": "surface",
      "reportFile": "docs/jobs/0007-providers-detail-discovery/Task-B-1/report.md",
      "reviewPackage": "docs/jobs/0007-providers-detail-discovery/Task-B-1/review-package.diff.md",
      "progressLog": "docs/jobs/0007-providers-detail-discovery/Task-B-1/progress.log",
      "logTaskScript": "docs/jobs/0007-providers-detail-discovery/Task-B-1/log-task.sh",
      "baseCommit": "9d2ae191d96d034fbba8d62222a5f0ddb53f3542",
      "dependencies": ["Task-A-1"],
      "acceptanceCriteria": [
        "Cada item navega ao provider correspondente.",
        "A lista não contém botões de discovery, editar, padrão ou remover.",
        "A criação de provider permanece disponível.",
        "Teste focado registra RED e GREEN."
      ],
      "requirements": ["REQ-001"],
      "rules": [
        "TDD required for this behavior-changing task.",
        "Read docs/context/testing-anti-patterns.md before adding mocks, fakes, fixtures, or test-only helpers.",
        "Do not move administrative mutations back into the list.",
        "Report RED and GREEN commands and results in the task report."
      ],
      "steps": [
        {
          "order": 1,
          "title": "Escrever teste RED da lista",
          "description": "Esperar links compactos e ausência de ações diretas.",
          "command": "pnpm --dir apps/ui exec vitest run src/features/model-admin/providers/providers-page.test.tsx",
          "expectedResult": "Os cenários novos falham na implementação atual.",
          "codeExample": null
        },
        {
          "order": 2,
          "title": "Implementar lista navegável",
          "description": "Trocar cards de ação por links semânticos e preservar criação.",
          "command": "pnpm --dir apps/ui exec vitest run src/features/model-admin/providers/providers-page.test.tsx",
          "expectedResult": "Os cenários da lista passam.",
          "codeExample": null
        }
      ],
      "filesTouched": [
        "apps/ui/src/features/model-admin/providers/providers-page.tsx",
        "apps/ui/src/features/model-admin/providers/providers-page.test.tsx"
      ],
      "files": {
        "created": [],
        "modified": [
          "apps/ui/src/features/model-admin/providers/providers-page.tsx",
          "apps/ui/src/features/model-admin/providers/providers-page.test.tsx"
        ],
        "deleted": []
      },
      "notes": []
    },
    {
      "id": "Task-B-2",
      "title": "Tornar Discovery um painel persistente",
      "description": "Adaptar DiscoveryPanel e a página de detalhe para usar aside responsivo, manter estados e resetar pelo provider ativo.",
      "status": "pending",
      "tryCount": 1,
      "maxTries": 3,
      "task_profile": "general",
      "batch": "B",
      "layer": "surface",
      "reportFile": "docs/jobs/0007-providers-detail-discovery/Task-B-2/report.md",
      "reviewPackage": "docs/jobs/0007-providers-detail-discovery/Task-B-2/review-package.diff.md",
      "progressLog": "docs/jobs/0007-providers-detail-discovery/Task-B-2/progress.log",
      "logTaskScript": "docs/jobs/0007-providers-detail-discovery/Task-B-2/log-task.sh",
      "baseCommit": "9d2ae191d96d034fbba8d62222a5f0ddb53f3542",
      "dependencies": ["Task-A-1"],
      "acceptanceCriteria": [
        "Discovery é acionado explicitamente e permanece no fluxo do layout.",
        "Desktop mostra aside sem overlay; mobile empilha a região.",
        "Loading, vazio, sucesso, erro, sync e probe preservam comportamento existente.",
        "Troca de provider não apresenta estado anterior como atual.",
        "Teste focado registra RED e GREEN."
      ],
      "requirements": ["REQ-004", "REQ-005"],
      "rules": [
        "TDD required for this behavior-changing task.",
        "Read docs/context/testing-anti-patterns.md before adding mocks, fakes, fixtures, or test-only helpers.",
        "Do not use the modal Sheet primitive or alter discovery server contracts.",
        "Report RED and GREEN commands and results in the task report."
      ],
      "steps": [
        {
          "order": 1,
          "title": "Escrever testes RED do painel",
          "description": "Cobrir região persistente, estados e reset por provider.",
          "command": "pnpm --dir apps/ui exec vitest run src/features/model-admin/providers/provider-settings-page.test.tsx",
          "expectedResult": "Os cenários de painel falham antes da composição responsiva.",
          "codeExample": null
        },
        {
          "order": 2,
          "title": "Implementar aside Discovery",
          "description": "Compor painel lateral no detalhe, ajustar classes responsivas e estado por provider.",
          "command": "pnpm --dir apps/ui exec vitest run src/features/model-admin/providers/provider-settings-page.test.tsx",
          "expectedResult": "Os cenários de painel passam.",
          "codeExample": null
        }
      ],
      "filesTouched": [
        "apps/ui/src/features/model-admin/providers/discovery-panel.tsx",
        "apps/ui/src/features/model-admin/providers/provider-settings-page.tsx",
        "apps/ui/src/features/model-admin/providers/provider-settings-page.test.tsx"
      ],
      "files": {
        "created": [],
        "modified": [
          "apps/ui/src/features/model-admin/providers/discovery-panel.tsx",
          "apps/ui/src/features/model-admin/providers/provider-settings-page.tsx",
          "apps/ui/src/features/model-admin/providers/provider-settings-page.test.tsx"
        ],
        "deleted": []
      },
      "notes": []
    },
    {
      "id": "Task-C-1",
      "title": "Integrar rota, verificar e encerrar documentação",
      "description": "Gerar árvore de rotas, executar verificações focadas e rápidas, revisar o diff e registrar evidências do plano.",
      "status": "pending",
      "tryCount": 1,
      "maxTries": 3,
      "task_profile": "deep",
      "batch": "C",
      "layer": "final",
      "reportFile": "docs/jobs/0007-providers-detail-discovery/Task-C-1/report.md",
      "reviewPackage": "docs/jobs/0007-providers-detail-discovery/Task-C-1/review-package.diff.md",
      "progressLog": "docs/jobs/0007-providers-detail-discovery/Task-C-1/progress.log",
      "logTaskScript": "docs/jobs/0007-providers-detail-discovery/Task-C-1/log-task.sh",
      "baseCommit": "9d2ae191d96d034fbba8d62222a5f0ddb53f3542",
      "dependencies": ["Task-A-1", "Task-B-1", "Task-B-2"],
      "acceptanceCriteria": [
        "routeTree.gen.ts inclui a rota de detalhe.",
        "Testes focados, typecheck e verify -c passam ou possuem baseline registrado.",
        "Revisão final confirma aderência à SPEC-0007 e ausência de credenciais expostas.",
        "Documentação de execução contém evidências."
      ],
      "requirements": ["REQ-001", "REQ-002", "REQ-003", "REQ-004", "REQ-005"],
      "rules": [
        "Read docs/context/testing-anti-patterns.md before adding mocks, fakes, fixtures, or test-only helpers.",
        "Do not rewrite unrelated dirty worktree changes.",
        "Record every verification command and its result in the task report."
      ],
      "steps": [
        {
          "order": 1,
          "title": "Gerar e validar rota",
          "description": "Atualizar route tree e executar testes/typecheck focados.",
          "command": "pnpm generate-routes && pnpm --dir apps/ui exec vitest run src/features/model-admin/providers/providers-page.test.tsx src/features/model-admin/providers/provider-settings-page.test.tsx && pnpm --dir apps/ui typecheck",
          "expectedResult": "Rota e verificações focadas passam.",
          "codeExample": null
        },
        {
          "order": 2,
          "title": "Revisar integração",
          "description": "Executar verificação rápida, revisar diff e registrar evidências/documentação.",
          "command": "pnpm verify -c",
          "expectedResult": "Verificação rápida passa.",
          "codeExample": null
        }
      ],
      "filesTouched": [
        "apps/ui/src/routeTree.gen.ts",
        "docs/jobs/0007-providers-detail-discovery/",
        "docs/specs/0007-providers-detail-discovery-spec.md"
      ],
      "files": {
        "created": [],
        "modified": [
          "apps/ui/src/routeTree.gen.ts",
          "docs/specs/0007-providers-detail-discovery-spec.md"
        ],
        "deleted": []
      },
      "notes": []
    }
  ],
  "updatedAt": "2026-07-15T04:13:11.351889+00:00"
}
```

</details>
