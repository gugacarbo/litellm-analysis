---
status: implemented
date: 2026-07-15
builds-on:
  - SPEC-0005
implemented-by:
  - apps/ui/src/features/model-admin/models/model-settings-page.tsx
  - apps/ui/src/features/model-admin/models/model-settings-page.test.tsx
design-ref: docs/spec-decisions/0008_model_settings_tabs_decisions.md
---

> Process: super-planning — Fase 2 (SPEC). Regras em
> `/home/gustavo/.agents/skills/super-planning/phases/02-spec.md`.

# Configuração de modelo por abas

> Convenções compartilhadas: `docs/context/testing-anti-patterns.md`. Esta
> spec deriva as decisões de
> `docs/spec-decisions/0008_model_settings_tabs_decisions.md`.

## Objetivo

Reorganizar a página `/models/:modelId/settings` em abas orientadas à tarefa,
reduzindo a densidade visual sem remover parâmetros configuráveis, contratos
ou controles administrativos existentes.

## Escopo

### Incluído

- Abas locais para Essencial, Capacidades e Execução e preço.
- Conservação de todos os campos atuais e do mesmo payload de salvamento.
- Salvar acessível a partir de qualquer aba para administradores.
- Leitura completa para `viewer` e edição somente para `admin`.
- Layout responsivo, sem conteúdo oculto em viewport estreito.
- Testes de regressão do componente ao final da implementação.

### Não incluído

- Mudanças em contratos, schema, handlers, persistência ou rotas.
- Wizard, URL por aba ou persistência da aba ativa entre sessões.
- Redesenho de listas, aliases ou páginas de provider.

## Fluxo

1. Ao abrir a página, a aba Essencial aparece ativa e apresenta os campos de
   identificação e roteamento frequentes, aliases e descrição.
2. A pessoa pode abrir Capacidades para editar arquitetura, raciocínio,
   parâmetros e limites por requisição, ou Execução e preço para configurar
   opções de requisição, preço e o modelo de raciocínio.
3. Trocar de aba não redefine valores, não dispara mutação e preserva erros de
   validação até o salvamento.
4. Um `admin` salva o mesmo formulário existente; um `viewer` lê os valores
   sem receber controle de gravação.
5. A área de gerenciamento continua fora do formulário, ao fim da página, com
   habilitar/desabilitar e excluir protegidos pelos controles atuais.

## Contrato de UI

| Aba              | Conteúdo                                                                       |
| ---------------- | ------------------------------------------------------------------------------ |
| Essencial        | provider, identificação, limites básicos, aliases e descrição                  |
| Capacidades      | arquitetura, raciocínio, parâmetros suportados/padrão e limites por requisição |
| Execução e preço | timeout, retries, headers, preços e `reasoningApiId`                           |

As abas são estado local de apresentação. Os valores continuam sob o mesmo
`react-hook-form` e estado avançado existentes; portanto, o payload enviado a
`saveModel` conserva sua forma e normalização atuais.

## Requisitos

- Todo parâmetro atualmente editável precisa aparecer em exatamente uma aba.
- A aba Essencial deve ser a inicial e conter a maior parte das edições
  cotidianas.
- O formulário deve continuar submetendo valores alterados em abas inativas.
- As abas devem usar semântica e teclado acessíveis, além de permanecerem
  legíveis em telas estreitas.
- Ações administrativas, erros, carregamento e proteção por papel não podem
  regredir.

## Edge cases

| #   | WHEN ⟨trigger⟩                                       | the system MUST ⟨response⟩                                                         |
| --- | ---------------------------------------------------- | ---------------------------------------------------------------------------------- |
| 1   | usuário troca de aba com alterações ainda não salvas | preservar cada valor local e não enviar mutação                                    |
| 2   | `viewer` abre qualquer aba                           | exibir os valores em somente leitura e não mostrar salvar ou ações administrativas |
| 3   | há erro de validação em aba inativa                  | manter o erro associado ao campo; o usuário pode navegar à aba para corrigi-lo     |
| 4   | viewport é estreito                                  | manter abas e campos navegáveis sem sobreposição ou perda de conteúdo              |
| 5   | salvar falha por conflito                            | preservar a mensagem e valores, seguindo o comportamento atual de revisão          |

## Questões em aberto

Nenhuma.

## Definition of Done

```bash
pnpm --dir apps/ui exec vitest run src/features/model-admin/models/model-settings-page.test.tsx
pnpm --dir apps/ui typecheck
pnpm verify -c
```

Os testes devem confirmar que a primeira aba é Essencial, todos os grupos
avançados continuam acessíveis, a troca de aba preserva uma edição e o papel
`viewer` permanece sem controles de gravação. A revisão humana deve confirmar
que o fluxo parece menos denso em desktop e viewport estreito.

## Verificação

- `pnpm --filter ui exec vitest run src/features/model-admin/models/model-settings-page.test.tsx` passou: 5 testes.
- `pnpm --filter ui typecheck` passou.
- `pnpm verify -c` passou após a regeneração dos índices de documentação.
- Inspeção no navegador confirmou Essencial ativa, accordions recolhidos em
  Capacidades e rolagem horizontal das abas em viewport de 375px.

## Test Strategy

- **Mode:** testes de regressão após a implementação; TDD não solicitado.
- **Guidance file:** `docs/context/testing-anti-patterns.md`.
- **Runner:** Vitest focado no package `apps/ui`, seguido por typecheck do
  package e `pnpm verify -c`.
- **Cenários:** agrupamento de campos por aba, preservação ao trocar de aba,
  salvamento, permissões de `viewer` e presença das ações de gerenciamento.

## Human review

- Confirmar que a aba Essencial é útil para a configuração cotidiana e não
  exige abrir grupos avançados.
- Confirmar que nenhuma aba parece comprimida, em desktop ou viewport estreito.
- Confirmar por inspeção que capacidades avançadas continuam descobríveis.

# Self-Review

**Verdict:** approved — 2026-07-15. A especificação define a distribuição
completa dos campos, preserva o contrato existente e cobre permissão,
preservação de estado, responsividade e regressão sem expandir o escopo.
