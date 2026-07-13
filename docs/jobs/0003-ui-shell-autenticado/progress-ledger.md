> **Process:** `super-planning` — this ledger is generated from `super-plan.json` by the active super-planning helper.
> Follow `super-planning/SKILL.md` and the active phase instructions when interpreting or updating this work.

# Progress Ledger: ui-shell-autenticado

> **Plan:** `0003-ui-shell-autenticado`
> **Registry:** `docs/jobs/0003-ui-shell-autenticado/super-plan.json`
> **Generated:** 2026-07-13T22:27:03Z
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
| completed        | 6     |
| cancelled        | 0     |
| **Total**        | **6** |

## Agent Profiles

| Profile | Model   | Agent   |
| ------- | ------- | ------- |
| general | default | default |
| deep    | default | default |
| quick   | default | default |

## Tasks

| Task ID  | Title                                               | Profile | Batch | Layer      | Status           | Dependencies                                     |
| -------- | --------------------------------------------------- | ------- | ----- | ---------- | ---------------- | ------------------------------------------------ |
| Task-A-1 | Corrigir baseline documental da SPEC-0002           | quick   | A     | foundation | [DONE] completed | —                                                |
| Task-A-2 | Implementar preferências de UI server-side          | deep    | A     | foundation | [DONE] completed | —                                                |
| Task-B-1 | Construir shell visual, sidebar e drawer mobile     | general | B     | surface    | [DONE] completed | Task-A-2                                         |
| Task-B-2 | Criar cliente Better Auth e menu de conta           | general | B     | surface    | [DONE] completed | Task-A-2                                         |
| Task-C-1 | Integrar shell, SSR e rotas protegidas              | deep    | C     | surface    | [DONE] completed | Task-A-2, Task-B-1, Task-B-2                     |
| Task-D-1 | Fechar evidências, inventário e validação integrada | general | D     | final      | [DONE] completed | Task-A-1, Task-A-2, Task-B-1, Task-B-2, Task-C-1 |

## Timeline

| Timestamp            | Task     | Event            | Try  | Message                                                                                                                                                                                                                                                      |
| -------------------- | -------- | ---------------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 2026-07-13T21:36:35Z | Task-A-1 | started          | 1    | Implementer dispatched after pre-flight; shared dirty worktree contains unrelated user changes.                                                                                                                                                              |
| 2026-07-13T21:36:35Z | Task-A-2 | started          | 1    | Implementer dispatched after pre-flight; shared dirty worktree contains unrelated user changes.                                                                                                                                                              |
| 2026-07-13T21:38:40Z | Task-A-1 | ready_for_review | 1    | Baseline documental da SPEC-0002 corrigido e docs-check --emit-index passou.                                                                                                                                                                                 |
| 2026-07-13T21:41:29Z | Task-A-2 | ready_for_review | 1    | TDD complete: focused preference tests, apps/ui typecheck, Prettier, and diff check pass. Report: docs/jobs/0003-ui-shell-autenticado/Task-A-2/report.md                                                                                                     |
| 2026-07-13T21:44:29Z | Task-A-1 | completed        | 1    | Review clean; direct scope review approved. Base fc3d66abbb4d4e4cf6d423377f666f0adbfc97b8..HEAD had no commits because the shared worktree is dirty; pnpm docs-check exit 0 resolved the verification gap.                                                   |
| 2026-07-13T21:44:29Z | Task-A-2 | completed        | 1    | Review clean; direct scope review approved. Base fc3d66abbb4d4e4cf6d423377f666f0adbfc97b8..HEAD had no commits because the shared worktree is dirty; focused Vitest exit 0 resolved the verification gap.                                                    |
| 2026-07-13T21:45:00Z | Task-B-1 | started          | 1    | Implementer dispatched after completed Task-A-2 dependency; shared dirty worktree contains unrelated user changes.                                                                                                                                           |
| 2026-07-13T21:45:00Z | Task-B-2 | started          | 1    | Implementer dispatched after completed Task-A-2 dependency; shared dirty worktree contains unrelated user changes.                                                                                                                                           |
| 2026-07-13T21:49:49Z | Task-B-2 | ready_for_review | 1    | TDD RED and GREEN recorded; focused account-menu tests and targeted Biome check pass. Package typecheck remains blocked only by concurrent Task-B-1 matcher-type errors; report.md contains exact evidence.                                                  |
| 2026-07-13T21:51:01Z | Task-B-2 | completed        | 1    | Review clean; focused account-menu test exit 0. Base fc3d66abbb4d4e4cf6d423377f666f0adbfc97b8..HEAD had no commits because shared worktree is dirty; direct scope review was approved.                                                                       |
| 2026-07-13T21:51:03Z | Task-B-1 | ready_for_review | 1    | TDD RED and GREEN recorded in report.md; focused Vitest (4 tests), Biome, TypeScript, and diff checks pass.                                                                                                                                                  |
| 2026-07-13T21:53:35Z | Task-B-1 | completed        | 1    | Review clean; focused shell tests and apps/ui typecheck exit 0. Base fc3d66abbb4d4e4cf6d423377f666f0adbfc97b8..HEAD had no commits because shared worktree is dirty; direct scope review was approved.                                                       |
| 2026-07-13T21:53:45Z | Task-C-1 | started          | 1    | Implementer dispatched after all Batch A and B dependencies completed; shared dirty worktree contains unrelated user changes.                                                                                                                                |
| 2026-07-13T21:55:59Z | Task-C-1 | blocked          | 1    | Blocked: current session projection exposes only id and role, while approved account menu needs name/email/role; app-shell has no account-menu slot. Expanding scope would violate Task-C-1 files and global auth constraints; user decision required.       |
| 2026-07-13T21:59:13Z | Task-C-1 | started          | 2    | Scope exception approved: project public session name/email and add typed AccountMenu slot to AppShell; no auth rules, persistence, schema, or sensitive data changes.                                                                                       |
| 2026-07-13T22:07:28Z | Task-C-1 | ready_for_review | None | TDD RED/GREEN complete: route tests, full UI suite, typecheck, build, Biome, and diff check passed; see report.md.                                                                                                                                           |
| 2026-07-13T22:09:31Z | Task-C-1 | blocked          | 2    | Review needs fixes: malformed ui_theme can crash pre-paint; route tests lack SSR html and authenticated AccountMenu slot/boundary coverage; report test count mismatch.                                                                                      |
| 2026-07-13T22:18:20Z | Task-C-1 | ready_for_review | 2    | P1 fixes complete: malformed ui_theme pre-paint normalization is non-throwing; SSR html and authenticated AppShell AccountMenu slot tests added. Focused route suite: 3 files, 10 tests; UI typecheck, targeted Biome, and diff check passed. See report.md. |
| 2026-07-13T22:20:12Z | Task-C-1 | completed        | 2    | Re-review clean after P1 fixes; focused route/document suite exit 0. Base..HEAD package lacks commits due shared dirty worktree; direct review approved.                                                                                                     |
| 2026-07-13T22:20:23Z | Task-D-1 | started          | 1    | Final evidence task dispatched after all implementation tasks completed.                                                                                                                                                                                     |
| 2026-07-13T22:24:15Z | Task-D-1 | ready_for_review | None | Matriz final passou: docs-check 9/0/0, Vitest UI 8 arquivos/27 testes, typecheck, build, Prettier e diff check. Evidência T1-T9, inventário e SPEC atualizados; revisão humana permanece pendente.                                                           |
| 2026-07-13T22:27:03Z | Task-D-1 | completed        | 1    | BASE fc3d66abbb4d4e4cf6d423377f666f0adbfc97b8..HEAD; review clean (independent review approved). Orchestrator reconfirmed docs-check 9/0/0, Vitest UI 8 files/27 tests, typecheck, build, Prettier and diff check.                                           |

## Requirements Coverage

| Requirement                                  | Status         | Covered By         |
| -------------------------------------------- | -------------- | ------------------ |
| REQ-001: Baseline documental verificável     | [PEND] pending | Task-A-1           |
| REQ-002: Preferências autenticadas em cookie | [PEND] pending | Task-A-2, Task-C-1 |
| REQ-003: Shell e navegação responsivos       | [PEND] pending | Task-B-1, Task-C-1 |
| REQ-004: Conta pública e sign-out oficial    | [PEND] pending | Task-B-2, Task-C-1 |
| REQ-005: SSR seguro e guarda preservada      | [PEND] pending | Task-C-1           |
| REQ-006: Evidência e qualidade de entrega    | [PEND] pending | Task-D-1           |

## Registry Parameters

Every parameter from `super-plan.json` is preserved below. This section is generated directly from the registry so the ledger remains a complete, auditable representation of the plan configuration and task data.

<details>
<summary>Complete <code>super-plan.json</code></summary>

```json
{
  "$schema": "https://raw.githubusercontent.com/gugacarbo/agents-skills/main/super-planning/interfaces/super-plan.schema.json",
  "createdAt": "2026-07-13T21:27:27.932940+00:00",
  "planId": "0003-ui-shell-autenticado",
  "featureName": "ui-shell-autenticado",
  "status": "in_progress",
  "source": {
    "spec": "docs/specs/0003-ui-shell-autenticado-spec.md",
    "plan": "docs/plans/0003-ui-shell-autenticado.md"
  },
  "goal": "Entregar o shell autenticado, responsivo e SSR-safe do apps/ui, com navegação funcional mínima, preferências persistidas em cookie e encerramento de sessão oficial.",
  "architectureSummary": "Preferências tipadas ficam em server functions autenticadas; um script pré-paint limitado normaliza somente o tema não sensível; componentes Base UI compõem o shell e Better Auth executa sign-out; as rotas TanStack Start integram sessão e SSR.",
  "techStack": [
    "TanStack Start 1.168.27",
    "TanStack Router",
    "React",
    "Better Auth 1.6.23",
    "@base-ui/react 1.6.0",
    "Vitest",
    "React Testing Library",
    "Tailwind CSS"
  ],
  "executionMode": "subagent-driven",
  "reviewCadence": "per_task",
  "agents": {
    "general": {
      "model": "",
      "agent": ""
    },
    "deep": {
      "model": "",
      "agent": ""
    },
    "quick": {
      "model": "",
      "agent": ""
    }
  },
  "branchStrategy": {
    "baseBranch": "main",
    "featureBranch": "codex/0002-fundacao-ui-tanstack-start"
  },
  "worktree": {
    "enabled": false,
    "path": "../lite-llm-analytics-worktrees/0003-ui-shell-autenticado"
  },
  "globalConstraints": [
    "Não alterar schema, migrations, convite, papéis ou regras de autenticação existentes.",
    "Não usar localStorage para tema/sidebar nem links para rotas futuras ou apps/web.",
    "Não importar banco, services, node:*, sessão ou API administrativa legada em componentes client-side.",
    "Drawer mobile é transitório e nunca grava ui_sidebar.",
    "Manter apps/web intacto como referência e preservar alterações preexistentes do usuário."
  ],
  "fileStructure": [
    {
      "path": "docs/verification/0002-fundacao-ui-tanstack-start.md",
      "ownerTask": "Task-A-1",
      "notes": "Evidência histórica fora de docs/specs."
    },
    {
      "path": "apps/ui/src/server/ui-preferences.functions.ts",
      "ownerTask": "Task-A-2",
      "notes": "Fronteira autenticada de cookies de preferência."
    },
    {
      "path": "apps/ui/src/components/app-shell/",
      "ownerTask": "Task-B-1",
      "notes": "Shell, navegação, sidebar, drawer e controle de tema."
    },
    {
      "path": "apps/ui/src/lib/auth-client.ts",
      "ownerTask": "Task-B-2",
      "notes": "Cliente Better Auth seguro para o browser."
    },
    {
      "path": "apps/ui/src/components/app-shell/account-menu.tsx",
      "ownerTask": "Task-B-2",
      "notes": "Menu de dados públicos e sign-out."
    },
    {
      "path": "apps/ui/src/routes/__root.tsx",
      "ownerTask": "Task-C-1",
      "notes": "Documento, título e script pré-paint."
    },
    {
      "path": "apps/ui/src/routes/_protected.tsx",
      "ownerTask": "Task-C-1",
      "notes": "Integra shell com a guarda de sessão."
    },
    {
      "path": "apps/ui/src/routes/_protected/index.tsx",
      "ownerTask": "Task-C-1",
      "notes": "Dashboard mínimo dentro do shell."
    },
    {
      "path": "apps/ui/APP_INVENTORY.md",
      "ownerTask": "Task-D-1",
      "notes": "Checklist de inventário e evidência final."
    }
  ],
  "requirementsChecklist": [
    {
      "id": "REQ-001",
      "title": "Baseline documental verificável",
      "source": "SPEC-0003 escopo e DoD",
      "status": "pending",
      "acceptanceCriteria": [
        "SPEC-0002 não produz ID duplicado nem implemented-by inexistente.",
        "pnpm docs-check --emit-index passa."
      ],
      "coveredByTasks": ["Task-A-1"],
      "notes": ["Pré-requisito documental da entrega funcional."]
    },
    {
      "id": "REQ-002",
      "title": "Preferências autenticadas em cookie",
      "source": "SPEC-0003 Preferências e fronteira server/client",
      "status": "pending",
      "acceptanceCriteria": [
        "Valores e cookies canônicos são validados.",
        "Mutações exigem sessão e não emitem cookie quando anônimas."
      ],
      "coveredByTasks": ["Task-A-2", "Task-C-1"],
      "notes": ["Cobre casos 2, 3, 4, 7 e 13."]
    },
    {
      "id": "REQ-003",
      "title": "Shell e navegação responsivos",
      "source": "SPEC-0003 Navegação e sidebar",
      "status": "pending",
      "acceptanceCriteria": [
        "Somente Dashboard é navegável.",
        "Desktop persiste sidebar e mobile usa drawer transitório acessível."
      ],
      "coveredByTasks": ["Task-B-1", "Task-C-1"],
      "notes": ["Cobre casos 5, 6 e 8."]
    },
    {
      "id": "REQ-004",
      "title": "Conta pública e sign-out oficial",
      "source": "SPEC-0003 Sessão e conta",
      "status": "pending",
      "acceptanceCriteria": [
        "Menu exibe somente nome, e-mail e papel.",
        "authClient.signOut redireciona somente em sucesso e falha é recuperável."
      ],
      "coveredByTasks": ["Task-B-2", "Task-C-1"],
      "notes": ["Cobre casos 9, 10 e 11."]
    },
    {
      "id": "REQ-005",
      "title": "SSR seguro e guarda preservada",
      "source": "SPEC-0003 Entrada autenticada",
      "status": "pending",
      "acceptanceCriteria": [
        "Tema explícito aplica SSR e primeira visita resolve antes da pintura.",
        "Anônimo redireciona antes do shell e 404 permanece do root."
      ],
      "coveredByTasks": ["Task-C-1"],
      "notes": ["Cobre casos 1, 2 e 12."]
    },
    {
      "id": "REQ-006",
      "title": "Evidência e qualidade de entrega",
      "source": "SPEC-0003 Definition of Done",
      "status": "pending",
      "acceptanceCriteria": [
        "T1 a T9 têm evidência real.",
        "docs-check, testes focados, typecheck e build passam."
      ],
      "coveredByTasks": ["Task-D-1"],
      "notes": ["Inclui revisão humana definida pela spec."]
    }
  ],
  "taskDirectory": "docs/jobs/0003-ui-shell-autenticado",
  "rules": [
    "Somente o orquestrador altera super-plan.json pelo helper ativo.",
    "Tasks de comportamento seguem TDD e o guia docs/context/testing-anti-patterns.md.",
    "Nenhuma task inicia antes de suas dependências estarem concluídas e revisadas.",
    "Revisão independente ocorre por task antes de concluí-la.",
    "A execução não amplia o escopo além da SPEC-0003.",
    "Executar os perfis general, deep e quick com gpt-5.6-luna em effort medium, conforme aprovação do usuário.",
    "Limitação de plataforma: spawn_agent não aceita seleção explícita de modelo ou effort; os workers usam o padrão da sessão."
  ],
  "tasks": [
    {
      "id": "Task-A-1",
      "title": "Corrigir baseline documental da SPEC-0002",
      "description": "Mover a evidência de verificação para fora de docs/specs e corrigir referências e implemented-by históricos para destravar o docs-check.",
      "status": "completed",
      "tryCount": 1,
      "maxTries": 3,
      "task_profile": "quick",
      "batch": "A",
      "layer": "foundation",
      "reportFile": "docs/jobs/0003-ui-shell-autenticado/Task-A-1/report.md",
      "reviewPackage": "docs/jobs/0003-ui-shell-autenticado/Task-A-1/review-package.diff.md",
      "progressLog": "docs/jobs/0003-ui-shell-autenticado/Task-A-1/progress.log",
      "logTaskScript": "docs/jobs/0003-ui-shell-autenticado/Task-A-1/log-task.sh",
      "baseCommit": "fc3d66abbb4d4e4cf6d423377f666f0adbfc97b8",
      "dependencies": [],
      "acceptanceCriteria": [
        "A evidência 0002 deixa docs/specs sem criar ID duplicado ou arquivo sem frontmatter.",
        "SPEC-0002 aponta implemented-by para diretórios Task-*-1 existentes.",
        "pnpm docs-check --emit-index encerra com exit 0."
      ],
      "requirements": ["SPEC-0003 Definition of Done", "T1"],
      "rules": [
        "Não alterar comportamento do apps/ui nesta task.",
        "Preservar o histórico da verificação 0002 ao mover o arquivo e atualizar todas as referências.",
        "Não editar super-plan.json manualmente."
      ],
      "steps": [
        {
          "order": 1,
          "title": "Localizar referências históricas",
          "description": "Mapear a verificação 0002 e os paths implemented-by antes de editar.",
          "command": "rg -n \"verification/0002|Task-[A-E]-1\" docs",
          "expectedResult": "Todas as referências afetadas são conhecidas.",
          "codeExample": null
        },
        {
          "order": 2,
          "title": "Reparar paths documentais",
          "description": "Mover a evidência para docs/verification e atualizar a spec, plano e registry 0002.",
          "command": null,
          "expectedResult": "A árvore docs/specs contém somente specs com frontmatter válido.",
          "codeExample": null
        },
        {
          "order": 3,
          "title": "Validar e regenerar índices",
          "description": "Executar o verificador documental e manter somente os índices gerados necessários.",
          "command": "pnpm docs-check --emit-index",
          "expectedResult": "Exit 0.",
          "codeExample": null
        }
      ],
      "filesTouched": [
        "docs/specs/0002-fundacao-ui-tanstack-start-spec.md",
        "docs/specs/verification/0002-fundacao-ui-tanstack-start.md",
        "docs/verification/0002-fundacao-ui-tanstack-start.md",
        "docs/plans/0002-fundacao-ui-tanstack-start.md",
        "docs/jobs/0002-fundacao-ui-tanstack-start/super-plan.json",
        "docs/index.json",
        "docs/specs/README.md"
      ],
      "files": {
        "created": [],
        "modified": [
          "docs/specs/0002-fundacao-ui-tanstack-start-spec.md",
          "docs/plans/0002-fundacao-ui-tanstack-start.md",
          "docs/jobs/0002-fundacao-ui-tanstack-start/super-plan.json",
          "docs/index.json",
          "docs/specs/README.md"
        ],
        "deleted": [
          "docs/specs/verification/0002-fundacao-ui-tanstack-start.md"
        ]
      },
      "notes": [
        "A evidência movida será criada em docs/verification durante a execução."
      ]
    },
    {
      "id": "Task-A-2",
      "title": "Implementar preferências de UI server-side",
      "description": "Criar parser, serialização, leitura e mutações autenticadas para ui_theme e ui_sidebar, com testes TDD de cookies e sessão.",
      "status": "completed",
      "tryCount": 1,
      "maxTries": 3,
      "task_profile": "deep",
      "batch": "A",
      "layer": "foundation",
      "reportFile": "docs/jobs/0003-ui-shell-autenticado/Task-A-2/report.md",
      "reviewPackage": "docs/jobs/0003-ui-shell-autenticado/Task-A-2/review-package.diff.md",
      "progressLog": "docs/jobs/0003-ui-shell-autenticado/Task-A-2/progress.log",
      "logTaskScript": "docs/jobs/0003-ui-shell-autenticado/Task-A-2/log-task.sh",
      "baseCommit": "fc3d66abbb4d4e4cf6d423377f666f0adbfc97b8",
      "dependencies": [],
      "acceptanceCriteria": [
        "Parser aceita apenas light/dark e expanded/collapsed e usa os fallbacks especificados.",
        "Cookies de preferência usam Path=/, SameSite=Lax, Max-Age=15552000 e Secure apenas em produção.",
        "Mutações sem sessão retornam UNAUTHENTICATED e não emitem Set-Cookie.",
        "Testes RED e GREEN cobrem ausência, corrupção, persistência e autorização."
      ],
      "requirements": [
        "SPEC-0003 Preferências",
        "SPEC-0003 Fronteira server/client",
        "Casos de borda 2, 3, 4, 7 e 13",
        "T2",
        "T3"
      ],
      "rules": [
        "TDD obrigatório para esta alteração de comportamento.",
        "Ler docs/context/testing-anti-patterns.md antes de criar mocks, fakes, fixtures ou helpers de teste.",
        "Reportar comandos e resultados RED e GREEN no report da task.",
        "Usar createServerFn, getRequest e requireSession conforme o padrão existente.",
        "Não usar localStorage e não expor cookies de sessão.",
        "Não editar super-plan.json."
      ],
      "steps": [
        {
          "order": 1,
          "title": "Escrever testes RED de preferências",
          "description": "Cobrir parser, fallback, serialização e chamadas sem sessão antes da implementação.",
          "command": "pnpm --dir apps/ui exec vitest run src/server/ui-preferences.functions.test.ts",
          "expectedResult": "Falha pelos módulos ou comportamentos ainda ausentes.",
          "codeExample": null
        },
        {
          "order": 2,
          "title": "Implementar fronteira server-side mínima",
          "description": "Adicionar tipos, parser, serializador e server functions protegidas sem alterar a sessão existente.",
          "command": null,
          "expectedResult": "Funções retornam apenas preferências canônicas e headers de cookie autorizados.",
          "codeExample": null
        },
        {
          "order": 3,
          "title": "Executar GREEN e regressão focada",
          "description": "Rodar o arquivo novo e as regressões de autenticação não dependentes de banco.",
          "command": "pnpm --dir apps/ui exec vitest run src/server/ui-preferences.functions.test.ts --exclude **/server/auth/invites.test.ts",
          "expectedResult": "Exit 0 com os testes de preferência verdes.",
          "codeExample": null
        }
      ],
      "filesTouched": [
        "apps/ui/src/server/ui-preferences.functions.ts",
        "apps/ui/src/server/ui-preferences.functions.test.ts"
      ],
      "files": {
        "created": [
          "apps/ui/src/server/ui-preferences.functions.ts",
          "apps/ui/src/server/ui-preferences.functions.test.ts"
        ],
        "modified": [],
        "deleted": []
      },
      "notes": [
        "A leitura SSR usa o cookie já disponível; escritas explícitas exigem sessão."
      ]
    },
    {
      "id": "Task-B-1",
      "title": "Construir shell visual, sidebar e drawer mobile",
      "description": "Criar a configuração mínima de Dashboard, sidebar desktop recolhível, drawer Base UI mobile e controle visual de tema com contratos de callback.",
      "status": "completed",
      "tryCount": 1,
      "maxTries": 3,
      "task_profile": "general",
      "batch": "B",
      "layer": "surface",
      "reportFile": "docs/jobs/0003-ui-shell-autenticado/Task-B-1/report.md",
      "reviewPackage": "docs/jobs/0003-ui-shell-autenticado/Task-B-1/review-package.diff.md",
      "progressLog": "docs/jobs/0003-ui-shell-autenticado/Task-B-1/progress.log",
      "logTaskScript": "docs/jobs/0003-ui-shell-autenticado/Task-B-1/log-task.sh",
      "baseCommit": "fc3d66abbb4d4e4cf6d423377f666f0adbfc97b8",
      "dependencies": ["Task-A-2"],
      "acceptanceCriteria": [
        "A navegação contém exatamente Dashboard para / e comunica o item ativo.",
        "Desktop alterna expanded/collapsed pelo callback de persistência; mobile inicia fechado e não grava ui_sidebar.",
        "Drawer Base UI controlado fecha por Escape e usa foco do componente da biblioteca.",
        "Controle oferece apenas light e dark e reporta falhas recuperáveis.",
        "Testes RED e GREEN cobrem navegação, responsividade, Escape, foco e persistência."
      ],
      "requirements": [
        "SPEC-0003 Navegação",
        "SPEC-0003 Tema e sidebar desktop",
        "Casos de borda 5, 6, 7 e 8",
        "T5",
        "T6"
      ],
      "rules": [
        "TDD obrigatório para esta alteração de comportamento.",
        "Ler docs/context/testing-anti-patterns.md antes de criar mocks, fakes, fixtures ou helpers de teste.",
        "Reportar comandos e resultados RED e GREEN no report da task.",
        "Usar Drawer controlado de @base-ui/react; não implementar focus trap manual.",
        "Não adicionar links futuros, URLs de apps/web, localStorage ou estado de drawer persistido.",
        "Não editar super-plan.json."
      ],
      "steps": [
        {
          "order": 1,
          "title": "Escrever testes RED dos contratos visuais",
          "description": "Cobrir apenas Dashboard, estado ativo, drawer fechado no mobile, Escape e callbacks de preferência.",
          "command": "pnpm --dir apps/ui exec vitest run src/components/app-shell/app-sidebar.test.tsx src/components/app-shell/theme-control.test.tsx",
          "expectedResult": "Falha pela ausência dos componentes.",
          "codeExample": null
        },
        {
          "order": 2,
          "title": "Implementar componentes desacoplados de rota",
          "description": "Criar navigation, theme-control, app-sidebar e app-shell usando tokens existentes e callbacks tipados.",
          "command": null,
          "expectedResult": "Desktop e mobile compartilham a configuração de navegação sem persistência indevida.",
          "codeExample": null
        },
        {
          "order": 3,
          "title": "Executar GREEN focado",
          "description": "Rodar testes de componentes e manter a cobertura dos contratos acessíveis.",
          "command": "pnpm --dir apps/ui exec vitest run src/components/app-shell/app-sidebar.test.tsx src/components/app-shell/theme-control.test.tsx",
          "expectedResult": "Exit 0.",
          "codeExample": null
        }
      ],
      "filesTouched": [
        "apps/ui/src/components/app-shell/app-shell.tsx",
        "apps/ui/src/components/app-shell/app-sidebar.tsx",
        "apps/ui/src/components/app-shell/navigation.ts",
        "apps/ui/src/components/app-shell/theme-control.tsx",
        "apps/ui/src/components/app-shell/app-sidebar.test.tsx",
        "apps/ui/src/components/app-shell/theme-control.test.tsx"
      ],
      "files": {
        "created": [
          "apps/ui/src/components/app-shell/app-shell.tsx",
          "apps/ui/src/components/app-shell/app-sidebar.tsx",
          "apps/ui/src/components/app-shell/navigation.ts",
          "apps/ui/src/components/app-shell/theme-control.tsx",
          "apps/ui/src/components/app-shell/app-sidebar.test.tsx",
          "apps/ui/src/components/app-shell/theme-control.test.tsx"
        ],
        "modified": [],
        "deleted": []
      },
      "notes": [
        "A integração com rota e escrita de preferências pertence à Task-C-1."
      ]
    },
    {
      "id": "Task-B-2",
      "title": "Criar cliente Better Auth e menu de conta",
      "description": "Adicionar cliente React seguro para Better Auth e menu de conta que recebe somente dados públicos, trata sign-out e preserva o shell em erro.",
      "status": "completed",
      "tryCount": 1,
      "maxTries": 3,
      "task_profile": "general",
      "batch": "B",
      "layer": "surface",
      "reportFile": "docs/jobs/0003-ui-shell-autenticado/Task-B-2/report.md",
      "reviewPackage": "docs/jobs/0003-ui-shell-autenticado/Task-B-2/review-package.diff.md",
      "progressLog": "docs/jobs/0003-ui-shell-autenticado/Task-B-2/progress.log",
      "logTaskScript": "docs/jobs/0003-ui-shell-autenticado/Task-B-2/log-task.sh",
      "baseCommit": "fc3d66abbb4d4e4cf6d423377f666f0adbfc97b8",
      "dependencies": ["Task-A-2"],
      "acceptanceCriteria": [
        "O menu recebe e mostra somente nome, e-mail e papel públicos.",
        "Sign-out chama authClient.signOut de better-auth/react e redireciona para /login apenas em sucesso.",
        "Erro de sign-out mantém shell e sessão visíveis com mensagem recuperável.",
        "Testes RED e GREEN usam Better Auth como única fronteira mockada, sem mockar a UI interna."
      ],
      "requirements": [
        "SPEC-0003 Sessão e conta",
        "SPEC-0003 Fronteira server/client",
        "Casos de borda 9, 10 e 11",
        "T7"
      ],
      "rules": [
        "TDD obrigatório para esta alteração de comportamento.",
        "Ler docs/context/testing-anti-patterns.md antes de criar mocks, fakes, fixtures ou helpers de teste.",
        "Reportar comandos e resultados RED e GREEN no report da task.",
        "Usar somente authClient.signOut e o endpoint de infraestrutura Better Auth; não chamar API administrativa legada.",
        "Não expor tokens, cookies, headers, segredo Better Auth ou dados extras em props e logs.",
        "Não editar super-plan.json."
      ],
      "steps": [
        {
          "order": 1,
          "title": "Escrever teste RED de menu e logout",
          "description": "Cobrir dados públicos, sucesso com redirect e falha recuperável.",
          "command": "pnpm --dir apps/ui exec vitest run src/components/app-shell/account-menu.test.tsx",
          "expectedResult": "Falha pela ausência do cliente e componente.",
          "codeExample": null
        },
        {
          "order": 2,
          "title": "Criar cliente e menu mínimos",
          "description": "Configurar createAuthClient de better-auth/react e encapsular a ação no componente acessível.",
          "command": null,
          "expectedResult": "Logout usa apenas a fronteira oficial e não desmonta o shell quando falha.",
          "codeExample": null
        },
        {
          "order": 3,
          "title": "Executar GREEN focado",
          "description": "Rodar o teste do menu e confirmar a chamada oficial.",
          "command": "pnpm --dir apps/ui exec vitest run src/components/app-shell/account-menu.test.tsx",
          "expectedResult": "Exit 0.",
          "codeExample": null
        }
      ],
      "filesTouched": [
        "apps/ui/src/lib/auth-client.ts",
        "apps/ui/src/components/app-shell/account-menu.tsx",
        "apps/ui/src/components/app-shell/account-menu.test.tsx"
      ],
      "files": {
        "created": [
          "apps/ui/src/lib/auth-client.ts",
          "apps/ui/src/components/app-shell/account-menu.tsx",
          "apps/ui/src/components/app-shell/account-menu.test.tsx"
        ],
        "modified": [],
        "deleted": []
      },
      "notes": ["Task-C-1 conecta o menu à sessão da rota protegida."]
    },
    {
      "id": "Task-C-1",
      "title": "Integrar shell, SSR e rotas protegidas",
      "description": "Conectar preferências e componentes ao documento e às rotas TanStack Start, incluindo script pré-paint limitado, projeção pública autenticada de name/email/role, slot de menu no AppShell e regressão da guarda.",
      "status": "completed",
      "tryCount": 2,
      "maxTries": 3,
      "task_profile": "deep",
      "batch": "C",
      "layer": "surface",
      "reportFile": "docs/jobs/0003-ui-shell-autenticado/Task-C-1/report.md",
      "reviewPackage": "docs/jobs/0003-ui-shell-autenticado/Task-C-1/review-package.diff.md",
      "progressLog": "docs/jobs/0003-ui-shell-autenticado/Task-C-1/progress.log",
      "logTaskScript": "docs/jobs/0003-ui-shell-autenticado/Task-C-1/log-task.sh",
      "baseCommit": "fc3d66abbb4d4e4cf6d423377f666f0adbfc97b8",
      "dependencies": ["Task-A-2", "Task-B-1", "Task-B-2"],
      "acceptanceCriteria": [
        "HTML aplica light/dark SSR quando o cookie é válido e o script pré-paint resolve e normaliza tema ausente ou inválido antes da hidratação.",
        "A rota protegida monta shell com dados públicos sem duplicar a guarda ou expor sessão.",
        "Anônimo ainda redireciona para login antes de montar shell; 404 do root é preservado.",
        "Integração liga callbacks de tema/sidebar às server functions e mantém o drawer mobile transitório.",
        "Testes RED e GREEN cobrem documento, primeira visita clara/escura, guarda e fronteira client/server.",
        "Session projection exposes only the public name, email, and role needed by AccountMenu; AppShell renders it through a typed slot without client session access."
      ],
      "requirements": [
        "SPEC-0003 Entrada autenticada",
        "SPEC-0003 Contrato de preferências",
        "Casos de borda 1, 2, 4 e 12",
        "T4",
        "T8",
        "T9"
      ],
      "rules": [
        "TDD obrigatório para esta alteração de comportamento.",
        "Ler docs/context/testing-anti-patterns.md antes de criar mocks, fakes, fixtures ou helpers de teste.",
        "Reportar comandos e resultados RED e GREEN no report da task.",
        "O script pré-paint pode tocar somente ui_theme não sensível quando ausente ou inválido.",
        "Não importar módulos server-only, banco, node:* ou API administrativa legada no bundle client-side.",
        "Não editar super-plan.json.",
        "Escopo aprovado: somente ampliar a projeção pública da sessão e o slot do AppShell; não alterar autorização, persistência de sessão, schema ou dados sensíveis."
      ],
      "steps": [
        {
          "order": 1,
          "title": "Escrever testes RED de rota e documento",
          "description": "Cobrir tema SSR, script pré-paint, redirect de anônimo e montagem autenticada sem detalhes internos.",
          "command": "pnpm --dir apps/ui exec vitest run src/routes --exclude **/server/auth/invites.test.ts",
          "expectedResult": "Falha pelos pontos de integração ausentes.",
          "codeExample": null
        },
        {
          "order": 2,
          "title": "Integrar root e layout protegido",
          "description": "Atualizar __root, _protected e index para aplicar preferências, shell e conteúdo Dashboard mínimo.",
          "command": null,
          "expectedResult": "O shell respeita SSR e a guarda preexistente.",
          "codeExample": null
        },
        {
          "order": 3,
          "title": "Executar verificações de integração",
          "description": "Rodar testes de rota, typecheck e build de apps/ui.",
          "command": "pnpm --dir apps/ui typecheck && pnpm --dir apps/ui build",
          "expectedResult": "Exit 0 sem violação de fronteira client/server.",
          "codeExample": null
        }
      ],
      "filesTouched": [
        "apps/ui/src/server/auth/get-session.functions.ts",
        "apps/ui/src/components/app-shell/app-shell.tsx",
        "apps/ui/src/routes/__root.tsx",
        "apps/ui/src/routes/_protected.tsx",
        "apps/ui/src/routes/_protected/index.tsx",
        "apps/ui/src/routes/*shell*.test.tsx",
        "apps/ui/src/routes/-_protected.test.ts"
      ],
      "files": {
        "created": [
          "apps/ui/src/routes/*shell*.test.tsx",
          "apps/ui/src/routes/-_protected.test.ts"
        ],
        "modified": [
          "apps/ui/src/server/auth/get-session.functions.ts",
          "apps/ui/src/components/app-shell/app-shell.tsx",
          "apps/ui/src/routes/__root.tsx",
          "apps/ui/src/routes/_protected.tsx",
          "apps/ui/src/routes/_protected/index.tsx"
        ],
        "deleted": []
      },
      "notes": [
        "O formato final dos arquivos de teste deve seguir a convenção descoberta no apps/ui; glob é planejamento, não caminho literal obrigatório."
      ]
    },
    {
      "id": "Task-D-1",
      "title": "Fechar evidências, inventário e validação integrada",
      "description": "Executar a matriz de validação, corrigir somente regressões introduzidas, registrar evidência de fechamento, atualizar inventário/checklists e regenerar índices.",
      "status": "completed",
      "tryCount": 1,
      "maxTries": 3,
      "task_profile": "general",
      "batch": "D",
      "layer": "final",
      "reportFile": "docs/jobs/0003-ui-shell-autenticado/Task-D-1/report.md",
      "reviewPackage": "docs/jobs/0003-ui-shell-autenticado/Task-D-1/review-package.diff.md",
      "progressLog": "docs/jobs/0003-ui-shell-autenticado/Task-D-1/progress.log",
      "logTaskScript": "docs/jobs/0003-ui-shell-autenticado/Task-D-1/log-task.sh",
      "baseCommit": "fc3d66abbb4d4e4cf6d423377f666f0adbfc97b8",
      "dependencies": [
        "Task-A-1",
        "Task-A-2",
        "Task-B-1",
        "Task-B-2",
        "Task-C-1"
      ],
      "acceptanceCriteria": [
        "T1 a T9 possuem evidência de comando e resultado real.",
        "docs-check, suíte UI focada, typecheck e build passam conforme a SPEC-0003.",
        "APP_INVENTORY e checklist da SPEC registram somente itens efetivamente entregues.",
        "Índices de documentação são regenerados e nenhuma funcionalidade fora do escopo é adicionada."
      ],
      "requirements": [
        "SPEC-0003 Definition of Done",
        "SPEC-0003 Verificação",
        "T1 a T9"
      ],
      "rules": [
        "Não iniciar novas funcionalidades nem refatorações amplas nesta task.",
        "Corrigir somente regressões comprovadamente introduzidas pelas tasks anteriores.",
        "Diferenciar falhas preexistentes das regressões da entrega.",
        "Não editar super-plan.json manualmente."
      ],
      "steps": [
        {
          "order": 1,
          "title": "Executar matriz de validação",
          "description": "Rodar docs-check, testes UI sem convite de banco, typecheck e build.",
          "command": "pnpm docs-check --emit-index && pnpm --dir apps/ui exec vitest run --exclude **/server/auth/invites.test.ts && pnpm --dir apps/ui typecheck && pnpm --dir apps/ui build",
          "expectedResult": "Todos os comandos de DoD encerram com exit 0.",
          "codeExample": null
        },
        {
          "order": 2,
          "title": "Registrar evidências e atualizar checklist",
          "description": "Anexar resultados reais à spec e marcar inventário somente para capacidades entregues.",
          "command": null,
          "expectedResult": "Documentação descreve a implementação e sua verificação sem promessas futuras.",
          "codeExample": null
        },
        {
          "order": 3,
          "title": "Revisar escopo final",
          "description": "Confirmar que não há links prematuros, localStorage, APIs administrativas ou mudança de schema.",
          "command": "git diff --check",
          "expectedResult": "Exit 0.",
          "codeExample": null
        }
      ],
      "filesTouched": [
        "apps/ui/APP_INVENTORY.md",
        "docs/specs/0003-ui-shell-autenticado-spec.md",
        "docs/index.json",
        "docs/specs/README.md"
      ],
      "files": {
        "created": [],
        "modified": [
          "apps/ui/APP_INVENTORY.md",
          "docs/specs/0003-ui-shell-autenticado-spec.md",
          "docs/index.json",
          "docs/specs/README.md"
        ],
        "deleted": []
      },
      "notes": [
        "A revisão humana da SPEC permanece exigida após a evidência automatizada."
      ]
    }
  ],
  "updatedAt": "2026-07-13T22:27:03.892679+00:00"
}
```

</details>
