---
status: completed
date: 2026-07-13
spec: docs/specs/0004-shared-logger-spec.md
decisions:
  - docs/spec-decisions/0004_shared-logger_decisions.md
implemented-by:
  - packages/logger/src/index.ts
  - packages/logger/src/index.test.ts
  - scripts/code-checks/check-console-log.ts
  - scripts/code-checks/check-console-log.test.ts
  - scripts/pre-commit
  - apps/ui/src/server/context.ts
  - apps/ui/src/server/context.test.ts
---

> **Process: super-planning** — este documento foi produzido pela Phase 3 —
> PLAN do skill em `/home/gustavo/.agents/skills/super-planning/SKILL.md`.
> A especificação aprovada é a fonte normativa; o registry da Phase 4 será a
> fonte executável de tarefas.

# Plano de implementação do logger compartilhado

## Summary

**Goal:** Disponibilizar `@lite-llm/logger` com os níveis `debug`, `info`,
`warn` e `error`, `consumer` obrigatório, formatos JSON/pretty e uma guarda
de pre-commit contra novos `console.log`.

**Scope:** Criar o pacote em `packages/logger`, migrar somente
`apps/ui/src/server/context.ts`, adicionar testes TDD e integrar o guard ao
hook `scripts/pre-commit`.

**Out of scope:** Migrar o gateway ou os demais consumidores de console,
adicionar `trace`, transports, redaction, sampling ou observabilidade externa.

**Success signal:** Testes focados, typechecks e `pnpm docs-check` verdes; uma
chamada nova de `console.log` fora das exceções faz o guard falhar, enquanto o
logger emite os quatro níveis no formato configurado.

## Context and Design

Hoje `apps/ui/src/server/context.ts` declara `ServerLogger` e implementa
`info`/`error` diretamente com JSON e `console.log`/`console.error`. O pacote
novo deve extrair esse contrato sem importar código do UI. O consumidor UI
criará `createLogger({ consumer: "ui" })` e manterá o tipo exportado
`ServerLogger` como alias de compatibilidade.

O formato vem de `process.env.LOGGER_FORMAT`: `json` é o fallback seguro;
`pretty` usa Chalk 5 para aplicar cores quando o terminal suporta ANSI. A
guarda usa a API do TypeScript Compiler para analisar snapshots staged,
identificar chamadas reais de `console.log` cujas linhas foram adicionadas e
ignorar comentários, strings, linhas removidas e exceções declaradas.

**Architecture:** `@lite-llm/logger` é um adapter server-side pequeno com
`createLogger({ consumer })`; o guard é um script de code-check independente;
o hook apenas orquestra os gates existentes e o novo check.

**Tech stack / versions:** Node `>=20`, TypeScript `6.0.x`, pnpm `11.1.3`,
Vitest `4.1.5`, Chalk `5.6.2`, Git staged diff, `scripts/pre-commit` e
`scripts/code-checks/*`.

**Execution mode:** parallel subagents in two waves. Batch A has two disjoint
tasks; Batch B migrates the UI after the logger contract exists.

### Flow

1. Task A-1 cria e testa o pacote `@lite-llm/logger`.
2. Task A-2 cria e testa o guard e o comando de pre-commit sem tocar no pacote.
3. Após A-1, Task B-1 migra o contexto do UI e cobre o consumer `"ui"`.
4. A revisão independente valida cada tarefa conforme a cadência registrada no
   registry; a integração roda DoD e a suíte global.

### Contracts

```ts
type LogMetadata = Record<string, unknown>;

type Logger = {
  debug(event: string, meta?: LogMetadata): void;
  info(event: string, meta?: LogMetadata): void;
  warn(event: string, meta?: LogMetadata): void;
  error(event: string, meta?: LogMetadata): void;
};

createLogger({ consumer: string }): Logger;
```

`LOGGER_FORMAT=json` ou fallback emite uma linha JSON com `level`, `event`,
`consumer`, timestamp ISO-8601 e metadata. `pretty` emite uma linha humana
colorida com timestamp, nível, consumer, evento e metadata; `debug` é azul/cinza,
`info` verde, `warn` amarelo e `error` vermelho quando Chalk detecta suporte.

## References and Constraints

| Source                                                                                 | Section / anchor      | What it governs                            | Plan consequence                                                |
| -------------------------------------------------------------------------------------- | --------------------- | ------------------------------------------ | --------------------------------------------------------------- |
| [`0004-shared-logger-spec.md`](../specs/0004-shared-logger-spec.md)                    | Contract / Edge cases | API, formatos, fallback, guard e DoD       | Cada requisito vira critério de uma tarefa e teste focado.      |
| [`0004_shared-logger_decisions.md`](../spec-decisions/0004_shared-logger_decisions.md) | Chosen Approach       | Escopo restrito ao UI e exceções do guard  | Não migrar gateway nem limpar console legado.                   |
| `docs/context/testing-anti-patterns.md`                                                | inteiro               | Regras para mocks, fixtures e determinismo | Workers devem ler o guia antes dos testes e reportar RED/GREEN. |
| `scripts/pre-commit`                                                                   | inteiro               | Ordem dos gates atuais                     | Adicionar check sem substituir `docs-check`/`check-staged`.     |
| `apps/ui/src/server/context.ts`                                                        | inteiro               | Contrato consumidor atual                  | Preservar `ServerLogger` e a alteração de import existente.     |

**Unresolved decisions:** None.

**Global constraints:**

- Não tocar nas alterações já existentes do usuário em `apps/ui` além do
  contexto necessário à migração.
- Não iniciar implementação na `main`; usar a branch
  `codex/0004-shared-logger`.
- TDD obrigatório para todos os comportamentos novos; usar o guia efetivo de
  testes antes de adicionar fixtures, spies ou helpers.
- Tarefas do mesmo batch não compartilham arquivos escritos.
- O guard só bloqueia chamadas reais novas de `console.log`; scripts/CLIs e o
  próprio logger permanecem exceções explícitas.

**Assumptions:** O runtime que carrega `.env` já expõe `LOGGER_FORMAT` em
`process.env`; o pacote não adicionará `dotenv`. A opção `warn` representa o
nível “warning” pedido pelo usuário.

## Files and Tasks

| File / directory                                | Change                                   | Owner task(s) | Depends on | Notes / contract                              |
| ----------------------------------------------- | ---------------------------------------- | ------------- | ---------- | --------------------------------------------- |
| `packages/logger/`                              | create package, API, formatter and tests | Task-A-1      | none       | `@lite-llm/logger`, Chalk 5, four levels      |
| `pnpm-lock.yaml`                                | additive dependency resolution           | Task-A-1      | none       | update only as required by package dependency |
| `scripts/code-checks/check-console-log.ts`      | create staged AST guard                  | Task-A-2      | none       | exit 0/1, no file mutation                    |
| `scripts/code-checks/check-console-log.test.ts` | create guard tests                       | Task-A-2      | none       | staged diff fixtures                          |
| `package.json`                                  | add `check:console-log` command          | Task-A-2      | none       | no unrelated script changes                   |
| `scripts/pre-commit`                            | invoke guard in existing gate flow       | Task-A-2      | none       | preserve docs/check-staged                    |
| `apps/ui/src/server/context.ts`                 | consume shared factory                   | Task-B-1      | Task-A-1   | `consumer: "ui"`, alias compatibility         |
| `apps/ui/src/server/context.test.ts`            | test context logger wiring               | Task-B-1      | Task-A-1   | focused UI server test                        |

### Implementation sequence

- **Batch A — foundation/core:** Task-A-1 implements the package and Task-A-2
  implements the guard/pre-commit integration in parallel.
- **Batch B — surface:** Task-B-1 depends only on the public logger contract
  from Task-A-1 and migrates the UI context.
- **Final integration:** run focused DoD, full test suite, spec audit and
  final branch verification; preserve unrelated user changes.

## Documentation Verification

| Technology / version  | Focused question                                       | Method             | Authoritative source                                                                                              | Finding applied to                                                                        |
| --------------------- | ------------------------------------------------------ | ------------------ | ----------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Chalk 5.6.2           | Como importar Chalk em ESM e respeitar suporte de cor? | Context7           | [`Chalk README`](https://github.com/chalk/chalk) / [`Context7 result`](https://context7.com/chalk/chalk/llms.txt) | Task-A-1 usa `Chalk`/detecção automática; testes isolam nível de cor.                     |
| TypeScript 6.0.x      | Como o repo executa scripts TS e analisa código?       | repository-pattern | `scripts/code-checks/check-ui-client-boundary.ts`, `tsconfig.json`                                                | Task-A-2 segue script TS existente e usa parser/compiler API somente para chamadas reais. |
| pnpm workspace 11.1.3 | Como expor pacote compartilhado?                       | repository-pattern | `pnpm-workspace.yaml`, `packages/contracts/package.json`                                                          | Task-A-1 segue `packages/*`, exports e workspace dependency.                              |
| Git staged diff       | Como o pre-commit recebe arquivos staged?              | repository-pattern | `scripts/pre-commit`, `.lintstagedrc.js`                                                                          | Task-A-2 inspeciona `git diff --cached` e não altera arquivos.                            |

**Unresolved risks:** Chalk color detection can vary between TTY and CI; tests
must force a deterministic Chalk level without changing production behavior.

## Verification

**Test mode:** TDD for behavior changes.

**Testing guidance:** `docs/context/testing-anti-patterns.md`.

```bash
pnpm --filter @lite-llm/logger test
pnpm --filter @lite-llm/logger typecheck
pnpm exec vitest run scripts/code-checks/check-console-log.test.ts
pnpm --filter ui typecheck
pnpm check:console-log
pnpm docs-check
pnpm test
```

| ID  | Scenario / behavior                                        | Level               | Owner task | Evidence                           |
| --- | ---------------------------------------------------------- | ------------------- | ---------- | ---------------------------------- |
| T1  | Consumer e timestamp aparecem no JSON                      | unit                | Task-A-1   | RED/GREEN no logger                |
| T2  | Quatro níveis usam destinos corretos                       | unit                | Task-A-1   | RED/GREEN com spies de console     |
| T3  | JSON é fallback; pretty formata e colore sem ANSI indevido | unit                | Task-A-1   | RED/GREEN com Chalk determinístico |
| T4  | Contexto cria logger com `consumer: "ui"`                  | integration focused | Task-B-1   | teste do contexto verde            |
| T5  | Guard ignora legado, comentários, strings e exceções       | unit                | Task-A-2   | fixtures staged verdes             |
| T6  | Guard rejeita novo `console.log` real                      | unit                | Task-A-2   | diagnóstico + exit 1               |
| T7  | Pre-commit mantém gates existentes e chama guard           | script integration  | Task-A-2   | check dedicado verde               |

**Edge and compatibility cases:** invalid/missing `LOGGER_FORMAT` → JSON;
non-TTY pretty → no ANSI; no staged source files → guard exit 0; existing
untouched console usage → not blocked; logger/scripts exceptions → allowed.

**Human review:** confirmar legibilidade das cores em terminal real e conferir
que as exceções do guard não englobam código de domínio.

## Final integration result

Os focused checks e typechecks do logger/UI passaram, o guard staged passou e
docs-check terminou com 12 documentos, 0 erros e 0 avisos. A suíte global
continua com falhas externas ao escopo em llm-config-service e no typecheck
monorepo amplo; os detalhes estão na auditoria final.

## Risks and Handoff

| Risk                                            | Detection                            | Mitigation                                               | Rollback / recovery                              |
| ----------------------------------------------- | ------------------------------------ | -------------------------------------------------------- | ------------------------------------------------ |
| Workers edit overlapping files                  | registry ownership and diff scope    | keep Batch A write sets disjoint                         | re-dispatch only violating task after cleanup    |
| Chalk emits ANSI unexpectedly in CI             | pretty-mode test at color level 0    | use Chalk auto-detection and deterministic test instance | set `LOGGER_FORMAT=json`                         |
| AST guard misses multiline call                 | multiline fixture in T5/T6           | map AST node start line to added hunk lines              | tighten parser before review closure             |
| Existing user changes are included accidentally | `git diff` and file ownership checks | do not stage unrelated paths                             | restore only task-owned files via targeted patch |

**Rollout / observability:** No feature flag. Production should use JSON
fallback; local development may set `LOGGER_FORMAT=pretty`.

**Readiness checklist:**

- [x] Every requirement has a source reference or is explicitly new to the plan.
- [x] Every changed file has an owner and parallel tasks do not conflict.
- [x] Contracts, errors, compatibility, and observable success are concrete.
- [x] Every behavior change has an independently testable deliverable.
- [x] Risks, rollback, and human review are recorded.
- [x] No TBD/TODO remains and no implementer must invent product behavior.

## Registry Handoff

- **Spec:** `docs/specs/0004-shared-logger-spec.md`
- **Plan:** `docs/plans/0004-shared-logger.md`
- **Registry:** `docs/jobs/0004-shared-logger/super-plan.json`
- **Progress ledger:** `docs/jobs/0004-shared-logger/progress-ledger.md`
- **Task artifacts:** `docs/jobs/0004-shared-logger/<task-id>/`

**Decomposition handoff:** Parallel Batch A, dependent Batch B, branch
`codex/0004-shared-logger`, TDD, and per-task review pending user cadence
selection. Pre-dispatch conflict scan: clean; task files are disjoint and
dependencies are acyclic.

**Completion handoff:** Fill `implemented-by`, verification evidence and final
registry status during Phase 7.

# Self-Review

Verdict: approved — 2026-07-13. All spec requirements map to Task-A-1,
Task-A-2 or Task-B-1; Batch A has disjoint ownership; Task-B-1 depends only on
Task-A-1; no placeholders or unresolved implementation decisions remain.
