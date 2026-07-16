---
status: accepted
date: 2026-07-15
builds-on:
  - SPEC-0005
implemented-by: []
design-ref: docs/spec-decisions/0007_providers_detail_discovery_decisions.md
---

> Process: super-planning — Fase 2 (SPEC). Regras em
> `/home/gustavo/.agents/skills/super-planning/phases/02-spec.md`.

# Detalhe de provider e discovery persistente

> Convenções compartilhadas: `docs/context/CONVENTIONS.md` e
> `docs/context/testing-anti-patterns.md`. Esta spec deriva as decisões de
> `docs/spec-decisions/0007_providers_detail_discovery_decisions.md`.

## Objetivo

Transformar `/providers` em uma lista de navegação simples e concentrar a
configuração operacional de cada provider em `/providers/:providerId`. A página
de detalhe oferecerá as ações administrativas existentes e um painel Discovery
persistente, sem overlay sobre a configuração.

## Escopo

### Incluído

- Lista compacta, clicável e sem botões de ação em `/providers`.
- Rota protegida `/providers/:providerId` com loader que pré-carrega o provider.
- Configuração, teste da conexão persistida, tornar padrão e remoção na página
  de detalhe para `admin`.
- Estado somente leitura para `viewer`.
- Painel lateral Discovery/Probe persistente no desktop; em telas estreitas ele
  é empilhado abaixo da configuração.
- Reuso dos contratos existentes de discovery, sincronização, probe, queries e
  invalidação.
- Cobertura TDD para navegação, autorização, estados de mutação e layout do
  painel.

### Não incluído

- Alterar adapters, schema de provider, criptografia de credenciais ou política
  de destinos.
- Discovery automático ao abrir a página de detalhe.
- Alterações na página de modelos, aliases ou contratos de upstream.
- Um `Sheet` modal/overlay: o painel é uma região persistente da página.

## Fluxo

1. Em `/providers`, cada provider aparece como item semântico com nome, adapter,
   URL, estado da credencial, total de modelos e estado padrão, e navega para o
   detalhe quando acionado.
2. A rota `/providers/:providerId` resolve a query do provider antes de renderizar
   a página. Provider ausente mostra recuperação para a lista, sem controles
   inválidos.
3. Um `admin` pode editar a configuração, testar a conexão já persistida, tornar
   o provider padrão ou removê-lo. Os resultados das ações ficam visíveis na
   própria página e as queries afetadas são invalidadas.
4. Um `viewer` pode ler os dados e o catálogo, mas não recebe controles ou
   mutações administrativas.
5. O botão Discovery revela/ativa um painel lateral que permanece no fluxo do
   layout. Ele preserva o último resultado, o estado de sincronização e o probe
   enquanto o detalhe montado continuar ativo.
6. Discovery continua explícito: só o clique inicia busca; sync e probe usam os
   mesmos comportamentos e mensagens públicas de hoje.
7. Depois de remover com sucesso, a navegação retorna a `/providers`. Falhas de
   remoção, discovery, sync, probe ou teste mantêm a página utilizável e mostram
   o erro público correspondente.

## Contrato de UI e roteamento

| Superfície               | Responsabilidade                                        | Permissões                                   |
| ------------------------ | ------------------------------------------------------- | -------------------------------------------- |
| `/providers`             | Listar e navegar para providers                         | Usuário autenticado                          |
| `/providers/:providerId` | Exibir/configurar um provider e seu catálogo            | Leitura autenticada; escrita somente `admin` |
| Painel Discovery         | Discovery explícito, sync e probe sem ocultar o detalhe | Mesmas permissões das ações existentes       |

O detalhe usa o provider persistido por `providerId`; o teste nele não recebe
plaintext novo do cliente. O teste antes de salvar no formulário de criação
permanece um fluxo separado e continua podendo usar os valores ainda não
persistidos.

O painel não usa o primitivo de `Sheet` sobreposto. No desktop ele é uma coluna
`aside` ao lado da configuração; abaixo do breakpoint de legibilidade, as
colunas viram uma única pilha vertical. Essa estrutura deixa configuração e
Discovery disponíveis sem cobrir conteúdo.

## Requisitos

- Itens da lista não podem conter botões de editar, discovery, padrão ou remover.
- Toda ação administrativa existente deve continuar disponível no detalhe, com
  as mesmas validações, autorização e feedbacks públicos.
- Credentials, segredos e valores de formulário não podem ser retornados ou
  exibidos pela nova superfície.
- A URL do detalhe é estável e suporta carregamento direto e refresh.
- O painel deve ter rótulo/região acessível e estado claro de carregamento,
  vazio, sucesso e erro.
- O layout deve manter ambos os painéis legíveis sem sobreposição em desktop e
  preservar a sequência de leitura/teclado no mobile.

## Edge cases

| #   | WHEN ⟨trigger⟩                                                      | the system MUST ⟨response⟩                                                                                                   |
| --- | ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| 1   | `providerId` não existe, foi removido ou a query falha como ausente | mostrar estado de recuperação com link para `/providers`, sem formulário/mutações                                            |
| 2   | `viewer` abre o detalhe                                             | manter leitura e ocultar/desabilitar toda mutação administrativa no cliente; handlers continuam autorizando no servidor      |
| 3   | teste da conexão persistida falha                                   | apresentar erro público inline, manter a configuração e permitir nova tentativa                                              |
| 4   | Discovery não encontra modelos                                      | manter painel visível com estado vazio e ação para tentar novamente                                                          |
| 5   | discovery, sync ou probe falha                                      | preservar a página, expor erro público e não descartar o último resultado válido                                             |
| 6   | sincronização recebe conflito/revisão desatualizada                 | apresentar a mensagem de conflito existente e permitir recarregar/refazer a ação                                             |
| 7   | provider é removido com sucesso                                     | invalidar lista/detalhe e navegar para `/providers`                                                                          |
| 8   | provider é removido concorrentemente                                | tratar como ausente e oferecer recuperação para a lista                                                                      |
| 9   | viewport é estreito                                                 | empilhar Discovery abaixo da configuração sem overlay nem conteúdo inacessível                                               |
| 10  | usuário abre outro provider                                         | carregar o novo `providerId`; resultados do painel anterior não podem ser apresentados como se pertencessem ao novo provider |

## Questões em aberto

Nenhuma. A expressão “sheet fixo” significa painel persistente no layout, não
o componente modal `Sheet` que cobre o conteúdo.

## Definition of Done

```bash
pnpm --dir apps/ui exec vitest run src/features/model-admin/providers/providers-page.test.tsx src/features/model-admin/providers/provider-settings-page.test.tsx
pnpm --dir apps/ui typecheck
pnpm generate-routes
pnpm verify -c
```

Os testes devem provar a sequência RED/GREEN das verticais abaixo. A árvore de
rotas gerada deve incluir `/providers/$providerId`; a lista não pode manter
ações de mutação; e a revisão humana deve confirmar que o painel não sobrepõe
a configuração em desktop nem em viewport estreito.

## Test Strategy

- **Mode:** TDD para toda mudança de comportamento.
- **Guidance file:** `docs/context/testing-anti-patterns.md`.
- **Runner:** Vitest focado no package `apps/ui`; typecheck do package e
  verificação rápida do repositório ao fim.
- **RED/GREEN:** escrever primeiro uma expectativa observável de rota, papel,
  mutação ou estado do painel; implementar o mínimo; registrar o comando verde
  em cada tarefa.

| ID  | Comportamento                                                       | Nível             | Evidência esperada                                          |
| --- | ------------------------------------------------------------------- | ----------------- | ----------------------------------------------------------- |
| T1  | item compacto navega ao detalhe e não expõe botões de mutação       | component         | RED/GREEN da lista e link por provider                      |
| T2  | loader/detalhe recupera provider e lida com ausente                 | route/component   | RED/GREEN de prefetch e estado de recuperação               |
| T3  | `admin` edita, testa persistido, torna padrão e remove              | component         | RED/GREEN de mutações, feedback e navegação                 |
| T4  | `viewer` permanece em leitura e não chama mutações                  | component/handler | RED/GREEN de controles e contrato server-side existente     |
| T5  | Discovery abre painel persistente e preserva estados                | component         | RED/GREEN de região lateral, loading, vazio, erro e sucesso |
| T6  | mobile empilha painel sem `Sheet`/overlay                           | component/layout  | RED/GREEN de classes/estrutura responsiva observável        |
| T7  | troca/remoção concorrente não associa resultados ao provider errado | component         | RED/GREEN de reset por `providerId` e recuperação           |

## Human review

- Em desktop, abrir um provider e confirmar que configuração e Discovery ficam
  legíveis lado a lado, sem cobrir conteúdo.
- Em viewport estreito, confirmar que a ordem é configuração seguida do painel
  e que foco/leitura seguem essa ordem.
- Com um provider real, executar teste, Discovery, probe e sync; confirmar que
  mensagens públicas e credenciais seguem seguras.

# Self-Review

**Verdict:** approved — 2026-07-15. A especificação distingue explicitamente
o painel persistente de um `Sheet` modal, preserva os contratos de servidor e
define autorização, recuperação, responsividade e TDD sem decisões abertas.
