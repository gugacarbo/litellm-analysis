# Process: super-planning

> Fase 1 — BRAINSTORM. Fonte: `$super-planning` em
> `/home/gustavo/.agents/skills/super-planning/phases/01-brainstorm.md`.
> Decisões da SPEC-0003, shell autenticado do `apps/ui`.

## Problema e objetivo

O `apps/ui` possui autenticação e uma rota protegida, mas ainda não oferece a
estrutura de navegação comum do produto. O `apps/web` legado tem uma sidebar e
experiência transversal ampla, porém copiá-lo integralmente introduziria
navegação para domínios ainda inexistentes no novo app.

O objetivo é entregar um shell autenticado, responsivo e SSR-safe que permita
acrescentar cada futuro domínio ao `apps/ui` sem recriar layout, tema, conta ou
navegação.

## Escopo aprovado

- Shell aplicado apenas ao grupo de rotas protegidas do `apps/ui`.
- Sidebar com itens derivados exclusivamente das rotas funcionais já migradas.
- Cabeçalho com botão de navegação/sidebar e área de contexto da rota.
- Tema claro ou escuro, com primeira escolha automática pelo navegador e
  preferência persistida em cookie.
- Estado expandido/recolhido da sidebar persistido em cookie.
- Menu de conta com nome/e-mail, papel e ação de sair.
- Sidebar mobile em drawer sobreposto, fechada inicialmente e acionada pelo
  cabeçalho.
- Estados de carregamento, erro e vazio necessários ao próprio shell.

## Não objetivos

- Não migrar dashboard, logs, modelos, providers, benchmarks, health checks,
  agentes, filtro global de datas ou chat flutuante.
- Não renderizar itens de navegação para funcionalidades futuras como
  desabilitadas ou "em breve".
- Não alterar o contrato de autenticação, convite, banco ou papéis existentes,
  além do que for necessário para exibir sessão e efetuar sign-out.
- Não criar uma cópia integral da biblioteca de componentes do `apps/web`.
- Não redesenhar a identidade visual do produto; usar a identidade textual
  `LlmToolbox` como identidade do produto.

## Decisões de arquitetura

1. O shell será montado no layout `_protected`, para nunca envolver login ou
   APIs e para reutilizar a sessão já validada pelo `beforeLoad`.
2. A navegação será configurada por dados tipados, não espalhada pelas rotas;
   cada domínio migrado poderá registrar seu item somente quando sua rota
   estiver funcional.
3. `theme` e `sidebar` serão cookies não sensíveis, com valores validados. Na
   primeira visita sem `theme`, um script pré-paint seleciona `light` ou `dark`
   conforme `prefers-color-scheme` e cria o cookie; nas visitas seguintes, SSR
   lê a preferência. Mudanças explícitas serão feitas por server functions e
   headers `Set-Cookie`.
4. As únicas preferências de tema são `light` e `dark`; não existe opção
   `system`. O cookie de sidebar terá padrão expandido no desktop.
5. O menu de conta obtém nome/e-mail/papel da sessão já carregada. A saída usa
   o cliente oficial Better Auth, que encerra a sessão pelo endpoint de
   infraestrutura próprio e então direciona o usuário para `/login`; esta é uma
   exceção explícita à regra de mutations de domínio por server function.
6. Em viewport mobile, a navegação é um drawer modal e inicia fechada. Em
   desktop, ela pode recolher para ícones; a preferência é preservada em
   cookie.
7. Não haverá `localStorage` como fonte de verdade para preferências de shell.
   Ele não será necessário para tema/sidebar e não deve definir a primeira
   renderização.

## Compatibilidade e restrições

- Seguir a ADR-0002: componentes client-side não acessam banco, credenciais ou
  serviços diretamente; operações internas usam server functions protegidas.
- Seguir a ADR-0004: TanStack Router fornece entrada de rota e TanStack Query
  cobre cache/mutações quando necessário.
- Preservar a guarda de sessão atual e não expor dados além de nome, e-mail e
  papel no shell.
- Cookies de preferência devem usar `Path=/`, `SameSite=Lax`, `Max-Age` de 180
  dias e `Secure` em produção. Como o script pré-paint precisa ler o tema,
  preferências não usam `HttpOnly` e nunca contêm dados sensíveis.
- A implementação deve evitar hydration mismatch e flash de tema.
- Acessibilidade mínima: botão de menu com rótulo, navegação por teclado,
  foco correto no drawer e indicação de rota ativa.

## Riscos e mitigação

| Risco                                               | Mitigação                                                                                             |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Flash ou mismatch entre tema SSR e cliente          | Script pré-paint resolve a primeira visita pelo navegador; cookie alimenta SSR nas visitas seguintes. |
| Cookie inválido/corrompido                          | Parser restrito com fallback pelo navegador/sidebar expandida.                                        |
| Estado de drawer persistido indevidamente no mobile | Separar preferência desktop do estado transitório do drawer.                                          |
| Menu exibir dados de outra sessão                   | Usar somente o retorno da guarda/server function da requisição atual.                                 |
| Crescimento prematuro da sidebar                    | Configuração só recebe itens para rotas realmente entregues.                                          |

## Estratégia de testes

- TDD é exigido para comportamento observável novo: parsing/escrita de cookies,
  script pré-paint, tema SSR, estado de sidebar, navegação ativa,
  responsividade/drawer e sign-out.
- Usar `docs/context/testing-anti-patterns.md` como guia de testes.
- Reutilizar Vitest e Testing Library já configurados em `apps/ui`.
- Testes que dependem do Better Auth/Postgres continuarão usando apenas
  `TEST_DATABASE_URL`; o shell unitário não deve exigir banco.

## Suposições para a Fase 2

- A identidade textual é `LlmToolbox`.
  dedicado.
- A única rota funcional de produto nesta entrega é `/`; portanto ela será o
  único item de navegação inicial.
- O cliente Better Auth será criado em módulo client-safe e chamará o endpoint
  de infraestrutura de sign-out; nenhuma rota administrativa legada participa
  desse fluxo.
- O filtro global de datas e o chat flutuante serão planejados junto ao primeiro
  domínio que os consumir.

## Handoff

- visualCompanionUsed: false
- Direção validada pelo usuário em 12 de julho de 2026.
- Pronto para Fase 2 — SPEC.
