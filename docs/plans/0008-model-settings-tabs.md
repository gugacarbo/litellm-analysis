---
status: implemented
date: 2026-07-15
spec: docs/specs/0008-model-settings-tabs-spec.md
decisions:
  - docs/spec-decisions/0008_model_settings_tabs_decisions.md
implemented-by:
  - apps/ui/src/features/model-admin/models/model-settings-page.tsx
  - apps/ui/src/features/model-admin/models/model-settings-page.test.tsx
---

> Process: super-planning — Fase 3 (PLAN). Regras em
> `/home/gustavo/.agents/skills/super-planning/phases/03-plan.md`.

# Configuração de modelo por abas — plano de implementação

## Resumo

**Objetivo:** reduzir a densidade de `/models/:modelId/settings` sem perder
nenhum campo configurável ou alterar o payload de salvamento.

**Escopo:** reorganizar o formulário existente em três abas locais, preservar
permissões e disponibilizar uma regressão focada.

**Fora do escopo:** contratos, persistência, rotas, schemas, wizard e
persistência da aba ativa.

**Sinal de sucesso:** uma pessoa administra os campos cotidianos sem abrir
configurações avançadas e ainda encontra todos os grupos em abas acessíveis.

## Contexto e design

`ModelSettingsPage` já centraliza o `react-hook-form`, `advancedSettings` e a
montagem de `saveModelInputSchema`. O componente local
`apps/ui/src/shared/components/ui/tabs.tsx` encapsula `@base-ui/react/tabs` e
é a única nova composição necessária. O formulário permanece um único
`<form>`: as abas mudam apenas a apresentação e não os estados ou o payload.

As abas são: **Essencial** (provider, identidade, limites básicos, aliases e
descrição), **Capacidades** (arquitetura, raciocínio, parâmetros e limites por
requisição) e **Execução e preço** (opções HTTP, preços e reasoning API). Os
accordions internos de Capacidades ficam fechados inicialmente. O submit usa
rodapé do formulário com tratamento visual persistente no desktop; as ações
administrativas permanecem no card já separado.

**Modo de execução:** sequencial — produção e teste concentram-se na mesma
página e arquivo de teste. Execução autorizada diretamente em `main`, sem
worktree; revisão independente somente ao final.

## Referências e restrições

| Fonte                                                       | Seção                   | Consequência                                                       |
| ----------------------------------------------------------- | ----------------------- | ------------------------------------------------------------------ |
| `docs/specs/0008-model-settings-tabs-spec.md`               | Escopo e contrato de UI | cada campo editável fica em exatamente uma aba; não mudar payloads |
| `docs/spec-decisions/0008_model_settings_tabs_decisions.md` | Decisões                | abas locais, sem wizard ou URL, e gerenciamento separado           |
| `docs/context/testing-anti-patterns.md`                     | Guia de testes          | cobrir interação observável, não detalhes de mocks                 |

**Restrições globais:** preservar autorização server-side, `viewer` somente
leitura, erros/conflitos existentes e alterações locais não relacionadas.

## Tarefas

| Arquivo                                                                | Alteração                                     | Tarefa   |
| ---------------------------------------------------------------------- | --------------------------------------------- | -------- |
| `apps/ui/src/features/model-admin/models/model-settings-page.tsx`      | compor abas, painel/rodapé e grupos avançados | Task-A-1 |
| `apps/ui/src/features/model-admin/models/model-settings-page.test.tsx` | regressões de abas, preservação e papéis      | Task-B-1 |
| docs da feature                                                        | registrar evidência e fechamento              | Task-C-1 |

- **Batch A:** reorganizar a página e manter a semântica do formulário.
- **Batch B:** acrescentar testes de regressão sobre a UI final.
- **Batch C:** executar verificações, inspeção visual e encerrar docs.

## Verificação de documentação

| Tecnologia                              | Pergunta                                 | Método                                                          | Aplicação                                                                 |
| --------------------------------------- | ---------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `@base-ui/react/tabs` via wrapper local | como compor abas sem nova dependência    | repository-pattern: `apps/ui/src/shared/components/ui/tabs.tsx` | Task-A-1 usa `Tabs`, `TabsList`, `TabsTrigger` e `TabsContent` existentes |
| React Hook Form e TanStack Query        | troca de aba preserva formulário/mutação | repository-pattern: `model-settings-page.tsx`                   | Task-A-1 preserva o único formulário, `useForm` e mutations atuais        |
| Vitest + Testing Library                | testar a reorganização                   | repository-pattern: `model-settings-page.test.tsx`              | Task-B-1 expande os testes existentes                                     |

Nenhuma consulta externa é necessária: as APIs relevantes já estão encapsuladas
e usadas no repositório, sem escolha dependente de versão.

## Verificação

```bash
pnpm --dir apps/ui exec vitest run src/features/model-admin/models/model-settings-page.test.tsx
pnpm --dir apps/ui typecheck
pnpm verify -c
```

Casos essenciais: Essencial ativa inicialmente; as três abas têm controles
acessíveis; uma edição sobrevive à troca de aba e chega ao `saveModel`; viewer
não recebe submit/gerenciamento; os campos avançados seguem disponíveis; desktop
e viewport estreito permanecem legíveis.

## Riscos e handoff

| Risco                          | Mitigação                                  | Recuperação                                        |
| ------------------------------ | ------------------------------------------ | -------------------------------------------------- |
| Campo avançado omitido         | mapa explícito de abas e teste de presença | restaurar o controle na aba correspondente         |
| Estado perdido ao trocar aba   | um único form/estado fora dos painéis      | manter painéis no root de Tabs e testar salvamento |
| Rodapé cobre conteúdo estreito | classes responsivas e inspeção visual      | remover fixação no mobile                          |

**Registry:** não materializado; o helper de super-planning local não tinha
proveniência verificável. O plano e os relatórios dos subagentes foram usados
como handoff operacional.
**Handoff de decomposição:** `main` → `main`, worktree desabilitado, perfil
`gpt-5.6-terra`/medium solicitado pelo usuário, execução sequencial e revisão
final única. Não há conflito de arquivo entre batches.
