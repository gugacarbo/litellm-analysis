---
status: draft
date: 2026-07-15
spec: docs/specs/0007-providers-detail-discovery-spec.md
decisions:
  - docs/spec-decisions/0007_providers_detail_discovery_decisions.md
implemented-by: []
---

> Process: super-planning — Fase 3 (PLAN). Regras em
> `/home/gustavo/.agents/skills/super-planning/phases/03-plan.md`.

# Plano de implementação: detalhe de provider e Discovery persistente

## Summary

**Goal:** Fazer de `/providers` uma lista de navegação e concentrar em
`/providers/:providerId` a configuração, teste e Discovery de cada provider.

**Scope:** Criar rota de detalhe protegida, página de configuração com ações
existentes, painel Discovery persistente e responsivo, lista sem mutações e
testes TDD focados.

**Out of scope:** Novos adapters, mudanças de backend/contrato de discovery,
credenciais, aliases, modelos ou um `Sheet` modal sobreposto.

**Success signal:** O usuário abre qualquer item da lista; o detalhe mantém
configuração e Discovery visíveis no mesmo fluxo de layout; `admin` conserva
todas as ações e `viewer` é somente leitura.

## Context and Design

`ProvidersPage` hoje mistura lista, modal de criação, mutações de card e
`DiscoveryPanel` inline. A aplicação já possui query de provider por id,
server functions autenticadas e um padrão de detalhe em
`/models/:modelId/settings`. A mudança é somente de composição/roteamento da
UI: os contratos de provider, discovery, sync, probe e teste persistido já
existem.

**Architecture:** A rota `/providers/$providerId` pré-carrega a query do
provider e renderiza `ProviderSettingsPage`. Essa página organiza uma grade
com região de configuração e `aside` de Discovery. A lista conserva criação,
mas cada item vira um link sem ações diretas. Discovery usa o componente e as
mutations atuais, recebendo o `providerId` da rota e resetando estado local
quando ele mudar.

**Execution mode:** Fundação de detalhe primeiro; depois lista e painel em
paralelo porque terão ownership de arquivos distintos; integração/rota gerada
e revisão ao final. O registro de execução será criado somente após a decisão
obrigatória de worktree.

### Flow

1. Loader de `/providers/$providerId` chama a query existente e a página lê o
   provider pelo parâmetro de rota.
2. A lista em `/providers` mostra metadados e navega ao detalhe por `Link`.
3. `ProviderSettingsPage` reutiliza o formulário e as mutations existentes
   para salvar, testar, tornar padrão e remover.
4. O acionamento explícito de Discovery torna ativa a coluna `aside`; ela não
   usa overlay e reaproveita discovery/probe/sync atuais.
5. Em viewport estreito, a grade vira coluna. Remoção concluída redireciona à
   lista e ausência concorrente mostra recuperação segura.

### Contracts

```ts
type ProviderDetailRouteParams = {
  providerId: string;
};

type ProviderSettingsPageProps = {
  providerId: string;
  role: "admin" | "viewer";
};
```

O contrato de servidor permanece o atual: `testProvider` recebe o id de um
provider já persistido, enquanto o formulário de criação continua usando a
operação separada de teste pré-save. Nenhuma credencial nova cruza a rota de
detalhe.

## References and Constraints

| Source                                                             | Governs                           | Consequence                                                |
| ------------------------------------------------------------------ | --------------------------------- | ---------------------------------------------------------- |
| `docs/specs/0007-providers-detail-discovery-spec.md`               | comportamento, papéis e DoD       | Não introduzir mutação na lista nem overlay.               |
| `docs/spec-decisions/0007_providers_detail_discovery_decisions.md` | decisão de painel persistente     | Usar coluna/`aside` responsivo, não `SheetContent`.        |
| `apps/ui/src/routes/_protected/models/$modelId/settings.tsx`       | loader/param de rota              | Repetir prefetch e composição de rota protegida.           |
| `apps/ui/src/features/model-admin/providers/providers-page.tsx`    | lista, criação e mutations atuais | Extrair sem alterar contratos server-side.                 |
| `apps/ui/src/features/model-admin/providers/discovery-panel.tsx`   | Discovery/probe/sync              | Reusar ações e ajustar composição/reset por provider.      |
| `apps/ui/src/features/model-admin/query/query-options.ts`          | cache/query keys                  | Usar query do provider existente e invalidações atuais.    |
| `docs/context/testing-anti-patterns.md`                            | substitutos e TDD                 | Mockar só limites reais e provar comportamento observável. |

**Unresolved decisions:** Apenas a escolha operacional de worktree exigida para
o job; não bloqueia a definição do comportamento.

**Global constraints:**

- Manter autorização server-side; controles de UI não substituem handler auth.
- Não retornar/exibir plaintext de credencial, inclusive em feedback de teste.
- Não mudar o contrato de upstream, persistência ou política SSRF/DNS.
- Não usar o componente modal `Sheet` para este painel.
- Toda mudança de comportamento segue TDD com o guia de testes do repositório.

## Files and Tasks

| File / directory                                                                    | Change        | Owner      | Depends on                         | Contract                                                             |
| ----------------------------------------------------------------------------------- | ------------- | ---------- | ---------------------------------- | -------------------------------------------------------------------- |
| `apps/ui/src/routes/_protected/providers/$providerId.tsx`                           | create        | `Task-A-1` | none                               | Rota protegida, params e prefetch de provider.                       |
| `apps/ui/src/features/model-admin/providers/provider-settings-page.tsx` e teste     | create        | `Task-A-1` | none                               | Detalhe, recuperação, papel e ações persistidas.                     |
| `apps/ui/src/features/model-admin/providers/providers-page.tsx` e teste             | modify        | `Task-B-1` | `Task-A-1`                         | Lista compacta com links, criação preservada, sem mutações por item. |
| `apps/ui/src/features/model-admin/providers/discovery-panel.tsx` e teste do detalhe | modify        | `Task-B-2` | `Task-A-1`                         | Painel/`aside` persistente, reset por provider e layout responsivo.  |
| `apps/ui/src/routeTree.gen.ts`                                                      | generate      | `Task-C-1` | `Task-A-1`, `Task-B-1`, `Task-B-2` | Árvore contém a rota de detalhe gerada.                              |
| `docs/specs/`, `docs/plans/`, `docs/jobs/`                                          | modify/create | `Task-C-1` | `Task-A-1`, `Task-B-1`, `Task-B-2` | Evidência, revisão e encerramento do job.                            |

### Implementation sequence

- **Batch A — foundation:** `Task-A-1` cria rota e página de detalhe com
  recuperação, papel e ações, em RED/GREEN.
- **Batch B — parallel surfaces:** `Task-B-1` simplifica lista; `Task-B-2`
  adapta Discovery ao painel persistente. Ambos dependem apenas do contrato de
  A e não editam os mesmos arquivos.
- **Batch C — integration:** `Task-C-1` gera a rota, executa verificações,
  faz revisão de diff/testes e atualiza a documentação com evidências.

## Documentation Verification

| Tecnologia      | Pergunta focada                | Método             | Fonte                                                           | Aplicação                              |
| --------------- | ------------------------------ | ------------------ | --------------------------------------------------------------- | -------------------------------------- |
| TanStack Router | rota filha, params e preload   | repository-pattern | `apps/ui/src/routes/_protected/models/$modelId/settings.tsx`    | Task A cria detalhe equivalente.       |
| TanStack Query  | query/invalidação por provider | repository-pattern | `apps/ui/src/features/model-admin/query/query-options.ts`       | Tasks A/B usam chaves existentes.      |
| Base UI Sheet   | comportamento de sobreposição  | repository-pattern | `apps/ui/src/shared/components/ui/sheet.tsx`                    | Task B evita o primitivo fixo/overlay. |
| React/Tailwind  | grade e stack responsivo       | repository-pattern | `apps/ui/src/features/model-admin/providers/providers-page.tsx` | Task B compõe `aside` no fluxo.        |
| Vitest          | padrão de teste focado         | repository-pattern | testes vizinhos de providers                                    | Todas as tarefas registram RED/GREEN.  |

Nenhuma consulta externa é necessária: os comportamentos de roteamento, cache,
UI e testes já estão definidos por implementações atuais do repositório.

## Verification

**Test mode:** TDD para cada mudança observável.

**Testing guidance:** `docs/context/testing-anti-patterns.md`.

```bash
pnpm --dir apps/ui exec vitest run src/features/model-admin/providers/providers-page.test.tsx src/features/model-admin/providers/provider-settings-page.test.tsx
pnpm --dir apps/ui typecheck
pnpm generate-routes
pnpm verify -c
```

| ID  | Scenario                                         | Level             | Owner      | Evidence                                   |
| --- | ------------------------------------------------ | ----------------- | ---------- | ------------------------------------------ |
| T1  | item lista navega e não contém ações diretas     | component         | `Task-B-1` | Link, ausência de botões e RED/GREEN       |
| T2  | loader e detalhe resolvem provider/ausente       | route/component   | `Task-A-1` | Prefetch e estado de recuperação           |
| T3  | admin salva/testa/padroniza/remove               | component         | `Task-A-1` | Mutations, erros e redirect                |
| T4  | viewer é leitura e handlers seguem protegidos    | component/handler | `Task-A-1` | Ausência de controles e contrato vigente   |
| T5  | Discovery persiste no fluxo com todos os estados | component         | `Task-B-2` | Região `aside`, loading/vazio/erro/sucesso |
| T6  | viewport estreito empilha sem overlay            | component/layout  | `Task-B-2` | Estrutura/classes responsivas              |
| T7  | troca/remoção concorrente recupera corretamente  | component         | `Task-A-1` | Reset por id e link à lista                |

**Human review:** Validar lado a lado em desktop, empilhamento em mobile,
ordem de foco e execução real de teste, Discovery, probe e sync sem expor
credenciais.

## Risks and Handoff

| Risk                           | Detection                        | Mitigation                         | Recovery                           |
| ------------------------------ | -------------------------------- | ---------------------------------- | ---------------------------------- |
| Painel reduz legibilidade      | revisão em viewport médio        | breakpoint/grade com coluna mínima | empilhar antes do limite crítico   |
| Estado vaza entre providers    | teste de mudança de `providerId` | reset explícito/local key          | recarregar detalhe correto         |
| Rota gerada fica desatualizada | typecheck/route generation       | rodar `pnpm generate-routes`       | regenerar e revisar diff           |
| Remoção deixa tela órfã        | teste de mutation                | invalidar e navegar para lista     | recuperação por estado ausente     |
| Regressão de papel             | teste admin/viewer               | reutilizar handlers existentes     | remover controles e corrigir guard |

**Rollout:** Sem migration, feature flag ou mudança de backend. Publicar junto
com a árvore de rotas gerada após verificações e revisão visual.

## Registry Handoff

- **Spec:** `docs/specs/0007-providers-detail-discovery-spec.md`
- **Plan:** `docs/plans/0007-providers-detail-discovery.md`
- **Registry:** `docs/jobs/0007-providers-detail-discovery/super-plan.json` (pendente da decisão de worktree)
- **Progress ledger:** `docs/jobs/0007-providers-detail-discovery/progress-ledger.md` (pendente da decisão de worktree)

**Decomposition handoff:** batches A, B e C definidos; a persistência do job
aguarda a escolha obrigatória de worktree antes de fixar base/branch e tarefas.

**Completion handoff:** registrar RED/GREEN por tarefa, testes focados,
typecheck, geração de rota, `pnpm verify -c`, revisão de diff e avaliação
humana responsiva antes de marcar a spec como implementada.

# Self-Review

**Verdict:** approved — 2026-07-15. O plano separa os ownerships para evitar
conflito, amarra a rota e o painel aos padrões locais e fixa verificação TDD.
O único gate restante é operacional: escolher o worktree para criar o job.
