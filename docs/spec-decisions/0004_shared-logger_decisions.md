---
status: draft
date: 2026-07-13
source-phase: brainstorm
related-spec: docs/specs/0004-shared-logger-spec.md
---

> **Process: super-planning** — Fase 1 — BRAINSTORM. Fonte: `$super-planning`
> em
> `/home/gustavo/.agents/skills/super-planning/phases/01-brainstorm.md`.

# Decisions for shared logger

## Summary

O `apps/ui` já injeta um logger estruturado no `ServerContext`, mas a
implementação está privada ao app. A entrega criará um pacote compartilhado
em `packages/`, migrará somente o `apps/ui` e adicionará uma guarda de
pre-commit contra novos usos de `console.log`.

## Chosen Approach

Criar o pacote `@lite-llm/logger` com uma factory
`createLogger({ consumer })`, contrato de `debug`/`info`/`warn`/`error` e dois
formatos de saída selecionáveis por `LOGGER_FORMAT`: `json` para logs
estruturados e `pretty` para desenvolvimento local. O formato pretty usará
`chalk` para colorir a saída quando o terminal suportar cores. O UI informará
`consumer: "ui"` e manterá `ServerLogger` como alias compatível.

A guarda será executada pelo `scripts/pre-commit` sobre linhas adicionadas nos
arquivos staged. Ela bloqueará novas chamadas de `console.log`, com exceções
explícitas para o pacote do logger e scripts/CLIs que precisam escrever saída
humana.

## Requirements Shaping These Decisions

- O logger compartilhado deve ser utilizável por outros consumidores server-side
  sem depender de React, TanStack, Better Auth, banco ou configuração do UI.
- A factory deve exigir um identificador `consumer` para atribuir a origem do
  logger.
- O contrato inicial deve oferecer `debug(event, meta?)`, `info(event, meta?)`,
  `warn(event, meta?)` e `error(event, meta?)`.
- Cada entrada JSON deve conter nível, evento, `consumer`, timestamp ISO-8601 e
  os metadados fornecidos.
- `LOGGER_FORMAT=json` deve preservar saída JSON de uma linha; `pretty` deve
  produzir saída humana colorida com `chalk` quando possível.
- O pre-commit deve detectar novos `console.log` sem falhar por usos legados
  existentes fora do escopo.
- A própria implementação do logger pode escrever no console como adapter de
  saída; esse uso é uma exceção documentada da guarda.

## Constraints

- O worktree já possui alterações do usuário em `apps/ui`; elas devem ser
  preservadas.
- O repositório está em `main`; a implementação não deve começar nessa branch
  sem autorização explícita para isso.
- O novo pacote deve seguir o padrão de `packages/*`: `package.json`,
  `tsconfig.json`, `src/` e export público explícito.
- `chalk` será dependência de runtime do pacote porque participa do formato
  pretty.
- A checagem deve integrar o hook existente `scripts/pre-commit` e não
  substituir o fluxo atual de `docs-check`/`check-staged`.

## Assumptions

- O primeiro runtime-alvo é Node/server-side; não há requisito de transporte
  para arquivo, HTTP ou observabilidade externa nesta entrega.
- `LOGGER_FORMAT` ausente ou inválido usará `json` como fallback seguro.
- Não haverá migração do logger específico de `services/llm-gateway` agora.
- A guarda será orientada a linhas adicionadas no índice Git e detectará
  chamadas reais via análise sintática, sem tratar comentários ou strings como
  violações.
- As exceções da guarda serão limitadas a `packages/logger/**` e caminhos
  `**/scripts/**`.

## Non-Goals

- Migrar todos os consumidores de `console.log` do monorepo.
- Substituir o logger de `services/llm-gateway`.
- Adicionar o nível `trace` ao contrato inicial.
- Adicionar redaction, transports, correlation context, sampling ou configuração
  de ambiente além de `LOGGER_FORMAT`.
- Fazer limpeza das alterações pré-existentes no worktree.

## Risks and Tradeoffs

| Risk                                                                     | Mitigation                                                                                                          |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| A checagem por diff não detecta um uso antigo que não foi alterado.      | O objetivo é bloquear novos usos no fluxo de commit; uma varredura histórica pode ser feita em iniciativa separada. |
| Exceções de caminho podem permitir um `console.log` acidental em script. | Manter a lista curta, explícita e coberta por testes do próprio script.                                             |
| Cores ANSI podem poluir logs redirecionados.                             | Respeitar a detecção de suporte do Chalk; JSON permanece sem cores.                                                 |
| O pacote pode crescer antes de existir demanda real.                     | Manter a API inicial pequena e sem transports.                                                                      |

## Alternatives Considered

| Option                                       | Why it was not chosen                                                                                  |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Varrer todo o repositório em cada pre-commit | Falharia imediatamente por usos legítimos/legados fora do escopo da migração.                          |
| Varrer apenas `apps/ui` inteiro              | Não protege os demais pacotes contra novos usos e não corresponde ao objetivo de logger compartilhado. |
| Migrar todos os consumidores agora           | Amplia o escopo e mistura a entrega com a substituição do logger específico do gateway.                |
| Forçar sempre saída colorida                 | Produziria ANSI em CI e em logs redirecionados; o Chalk deve respeitar o terminal.                     |

## Open Questions

- Nenhuma. O usuário confirmou o escopo, o `consumer`, o modo `pretty` com
  Chalk, o fallback JSON e TDD.

## Carry Forward to Spec

- [ ] Definir o contrato exportado e o formato dos dois modos como requisitos
      testáveis.
- [ ] Aplicar TDD aos testes do logger, da migração do contexto e do guard.
- [ ] Registrar comandos de typecheck, testes focados e execução do pre-commit
      no Definition of Done.
