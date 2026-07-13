---
status: implemented
date: 2026-07-12
builds-on: [ADR-0001, ADR-0002, ADR-0004, ADR-0005, SPEC-0001, SPEC-0002]
implemented-by:
  - docs/jobs/0003-ui-shell-autenticado/Task-A-1
  - docs/jobs/0003-ui-shell-autenticado/Task-A-2
  - docs/jobs/0003-ui-shell-autenticado/Task-B-1
  - docs/jobs/0003-ui-shell-autenticado/Task-B-2
  - docs/jobs/0003-ui-shell-autenticado/Task-C-1
  - docs/jobs/0003-ui-shell-autenticado/Task-D-1
design-ref: docs/spec-decisions/0003_ui_shell_decisions.md
---

> Process: super-planning — Fase 2 (SPEC). Regras em
> `/home/gustavo/.agents/skills/super-planning/phases/02-spec.md`.

# Fornecer um shell autenticado e SSR-safe ao apps/ui

> Convenções compartilhadas de código, segurança e testes:
> `docs/context/CONVENTIONS.md` e `docs/context/testing-anti-patterns.md`.
> Esta spec deriva as decisões de `docs/spec-decisions/0003_ui_shell_decisions.md`.

## Objetivo

Usuários autenticados terão uma estrutura de aplicação responsiva e acessível
ao navegar pelo `apps/ui`: sidebar, cabeçalho, tema persistido em cookie, menu
de conta e saída de sessão. O shell será a base para domínios futuros, sem
exibir áreas que ainda não foram migradas do `apps/web`.

## Escopo

### Incluído

- Layout visual e navegação somente dentro de `/_protected`.
- Sidebar desktop recolhível e drawer mobile.
- Configuração tipada de itens de navegação, inicialmente contendo apenas a
  rota funcional `/`.
- Cabeçalho com acionador de navegação e contexto da rota ativa.
- Preferências de tema (`light`, `dark`) e sidebar desktop (`expanded`,
  `collapsed`) persistidas em cookies; a primeira visita escolhe o tema pelo
  navegador antes da pintura e as visitas seguintes recebem a preferência em
  SSR.
- Menu de conta com nome, e-mail, papel e sign-out.
- Estados e atributos de acessibilidade necessários ao shell.
- Correção mínima dos metadados de verificação da SPEC-0002 que hoje bloqueiam
  o `docs-check`; é um pré-requisito de validação, não funcionalidade do shell.

### Não incluído

- Migração de dashboard, analytics, logs, modelos, providers, aliases, health
  checks, benchmarks, agentes ou chat.
- Filtro global de datas e chat flutuante do `apps/web`.
- Itens de navegação inativos, ocultos como promessa futura ou rotas vazias.
- Redesenho de marca; o nome do produto é `AgentLens`.
- Alteração de schema, fluxo de convite, contratos de papéis ou persistência da
  sessão Better Auth.

## Fluxo

### Entrada autenticada

1. O usuário acessa uma rota protegida.
2. O `beforeLoad` existente valida a sessão; sem sessão, redireciona para
   `/login?returnTo=<rota>` antes de montar o shell.
3. Se houver `ui_theme` válido, o servidor o lê para a requisição. Sem cookie
   ou com valor inválido, o documento inclui um script pré-paint mínimo que
   resolve o tema pelo navegador e cria ou sobrescreve o cookie antes de aplicar
   os estilos.
4. O documento HTML recebe o tema persistido antes da hidratação; na primeira
   visita, o script pré-paint aplica o resultado de `prefers-color-scheme`
   antes de pintar e o cliente inicia com o mesmo valor efetivo.
5. O layout protegido renderiza a sidebar, o cabeçalho, o menu de conta e o
   conteúdo da rota. A rota `/` é o único item navegável nesta entrega.

### Tema e sidebar desktop

1. O usuário escolhe `light` ou `dark` no controle localizado no rodapé da
   sidebar.
2. Uma server function validada, com sessão ativa, grava a preferência no
   cookie `ui_theme` e devolve o valor aceito.
3. A interface atualiza o tema sem flash e uma próxima renderização SSR recebe
   o mesmo valor.
4. Ao recolher ou expandir a sidebar no desktop, a interface grava
   `ui_sidebar` com a preferência correspondente pela mesma fronteira
   server-side.

### Navegação mobile

1. Em viewport mobile, a sidebar inicia fechada e é aberta pelo botão com
   rótulo acessível no cabeçalho.
2. A navegação é exibida como drawer modal sobre o conteúdo.
3. Ao navegar, fechar o drawer ou pressionar Escape, o foco e o estado seguem o
   comportamento acessível do componente de dialog/drawer adotado.
4. O estado aberto/fechado do drawer é transitório e não sobrescreve a
   preferência desktop `ui_sidebar`.

### Conta e saída

1. O menu de conta apresenta apenas `name`, `email` e `role` vindos da sessão
   validada da requisição. O seletor de tema não aparece nesse menu.
2. Ao escolher sair, o cliente chama `authClient.signOut()` do Better Auth. O
   cliente usa somente o endpoint de infraestrutura próprio `/api/auth/sign-out`
   e não expõe cookies ao componente.
3. Após sucesso, o browser vai para `/login`; após falha, a sessão e o shell
   permanecem visíveis e a interface mostra um erro recuperável.

## Contrato

### Preferências

```ts
type ThemePreference = "light" | "dark";
type SidebarPreference = "expanded" | "collapsed";

type UiPreferences = {
  theme: ThemePreference;
  sidebar: SidebarPreference;
};
```

- O servidor DEVE aceitar apenas os valores dos tipos acima.
- Ausência ou corrupção de `ui_theme` na primeira visita DEVE selecionar
  `dark` quando `prefers-color-scheme: dark` estiver ativo, ou `light` nos
  demais casos. Valor inválido em uma visita posterior DEVE usar o mesmo
  fallback sem falhar a rota.
- Ausência, corrupção ou valor inválido de `ui_sidebar` DEVE produzir
  `expanded` sem falhar a rota.
- Os cookies canônicos são `ui_theme` e `ui_sidebar`; ambos usam `Path=/`,
  `SameSite=Lax`, `Max-Age=15552000` (180 dias) e `Secure` em produção. Eles
  NÃO usam `HttpOnly`, pois `ui_theme` precisa ser lido e criado pelo script
  pré-paint e não contém informação sensível. Toda alteração por server
  function renova o prazo de 180 dias.
- O script pré-paint DEVE ser limitado a validar/resolver/aplicar o tema e criar
  ou sobrescrever `ui_theme` quando ele estiver ausente ou inválido; ele não
  pode ler, alterar ou expor dados de sessão. O documento pode usar uma
  supressão de mismatch limitada ao atributo de tema do elemento HTML, pois esse
  script o altera intencionalmente antes da hidratação.
- O documento HTML DEVE aplicar a classe de tema compatível com os tokens
  existentes (`.light` ou `.dark`) antes de pintar o conteúdo protegido.
- `localStorage` NÃO DEVE ser a fonte de verdade nem participar da primeira
  renderização de tema/sidebar.

### Navegação

```ts
type NavigationItem = {
  label: string;
  to: "/";
  icon: React.ComponentType<{ className?: string }>;
};
```

- A configuração inicial contém exatamente o item `Dashboard` para `/`.
- Um item só pode ser acrescentado junto de uma rota funcional e protegida.
- A rota atual DEVE ter indicação visual e semântica de item ativo.
- O shell NÃO DEVE criar links para URLs de `apps/web` ou para rotas de API.

### Sessão e conta

```ts
type ShellSessionUser = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "viewer";
};
```

- O shell recebe somente os campos públicos acima da sessão/guarda atual.
- A sessão, cookies de autenticação, tokens, headers e segredo Better Auth NÃO
  podem ser expostos em props, HTML, logs ou bundle client-side.
- O shell deve funcionar para `admin` e `viewer`; autorização de cada domínio
  futuro continua sendo responsabilidade das respectivas server functions.

### Fronteira server/client

- Leitura e validação de preferências ocorrem em módulos server-only ou
  `createServerFn`, usando as primitives atuais do TanStack Start para ler
  `Cookie` e emitir `Set-Cookie`. A única exceção client-side é o script
  pré-paint, limitado ao cookie não sensível `ui_theme` quando ele estiver
  ausente.
- As server functions de preferência DEVEM exigir sessão válida; se ela estiver
  ausente ou expirada, retornam `UNAUTHENTICATED` e não emitem `Set-Cookie` de
  preferência.
- Componentes client-side chamam server functions de preferência. Sign-out é a
  única exceção de infraestrutura: usa `authClient.signOut()` de `better-auth/react`,
  que chama somente `/api/auth/sign-out`. Componentes não acessam banco,
  serviços, cookies de sessão ou a API administrativa legada.
- O `apps/ui` não pode chamar APIs administrativas existentes de `apps/server`,
  conforme ADR-0002.

## Casos de borda

| #   | QUANDO o evento ocorrer                                             | o sistema DEVE responder                                                                                                                  |
| --- | ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Usuário sem sessão acessar rota protegida                           | Redirecionar para login antes de renderizar sidebar, cabeçalho ou dados de conta.                                                         |
| 2   | Cookie de tema estiver ausente, malformado ou com valor inválido    | Antes da primeira pintura, escolher `dark` quando o navegador preferir escuro, ou `light` em outro caso; persistir apenas o valor aceito. |
| 3   | Cookie de sidebar estiver ausente, malformado ou com valor inválido | Aplicar `expanded`; não expor nem usar o valor inválido.                                                                                  |
| 4   | Escrita autenticada da preferência falhar                           | Manter o último estado confirmado, mostrar erro recuperável e não fingir persistência.                                                    |
| 5   | Viewport for mobile                                                 | Abrir a sidebar somente como drawer inicialmente fechado, com foco gerenciado e Escape fechando o drawer.                                 |
| 6   | Usuário alternar a sidebar no mobile                                | Alterar apenas o estado transitório do drawer, sem modificar `ui_sidebar`.                                                                |
| 7   | Usuário alternar a sidebar no desktop                               | Atualizar layout e persistir `expanded`/`collapsed` no cookie.                                                                            |
| 8   | Nenhum domínio além da home estiver migrado                         | Renderizar exclusivamente Dashboard; não mostrar links desabilitados, "em breve" ou URLs legadas.                                         |
| 9   | Sign-out retornar erro de rede ou resposta não OK                   | Manter a pessoa no shell autenticado, mostrar erro e não redirecionar.                                                                    |
| 10  | Sign-out retornar sucesso                                           | Limpar a sessão conforme Better Auth e redirecionar para `/login`; retorno a rota protegida deve exigir nova sessão.                      |
| 11  | Menu de conta for aberto                                            | Exibir apenas nome, e-mail e papel da sessão atual; nunca tokens, cookies ou segredos.                                                    |
| 12  | Rota desconhecida for acessada autenticada                          | Preservar o tratamento 404 do root sem inserir links extras na sidebar.                                                                   |
| 13  | Server function de preferência for chamada sem sessão válida        | Retornar `UNAUTHENTICATED`, não executar a operação e não emitir `Set-Cookie` de preferência.                                             |

## Questões em aberto

Nenhuma. O nome `AgentLens` é uma decisão não bloqueante e
pode ser alterado por uma spec de identidade visual posterior.

## Estratégia de testes

TDD é obrigatório para todas as alterações de comportamento desta spec. A
diretriz efetiva é `docs/context/testing-anti-patterns.md`; os testes devem
primeiro demonstrar o comportamento observável e só então introduzir a menor
implementação necessária.

| Área           | Testes mínimos                                                                                                                                     |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Preferências   | Unitários para parser/fallback, serialização com 180 dias e server functions autenticadas de leitura/escrita.                                      |
| SSR/tema       | Teste de rota/documento para cookie explícito e teste do script pré-paint para primeira visita clara/escura e cookie inválido antes da hidratação. |
| Navegação      | Sidebar contém apenas Dashboard, indica rota ativa e não contém URLs legadas.                                                                      |
| Sidebar        | Desktop persiste estado; mobile inicia fechado, abre/fecha com botão/Escape e não persiste drawer.                                                 |
| Conta          | Menu mostra somente campos públicos da sessão.                                                                                                     |
| Sign-out       | Teste do cliente Better Auth: sucesso redireciona a `/login`; falha mantém rota/erro; a chamada usa somente o endpoint de infraestrutura.          |
| Regressão auth | Guarda continua redirecionando sessão ausente antes de montar o shell; preferência sem sessão retorna `UNAUTHENTICATED` sem `Set-Cookie`.          |

Mocks são permitidos apenas para browser APIs (`matchMedia`), a fronteira Better
Auth e a server function sob consumo do componente; os testes não devem
verificar detalhes internos de Radix/TanStack nem criar APIs de produção para
facilitar testes. Testes de shell não exigem `TEST_DATABASE_URL`; os testes de
integração de convite existentes continuam isolados nessa variável.

## Definition of Done

```bash
pnpm prettier --check docs/spec-decisions/0003_ui_shell_decisions.md docs/context/testing-anti-patterns.md docs/specs/0003-ui-shell-autenticado-spec.md
# exit 0

pnpm docs-check --emit-index
# exit 0 após corrigir o artefato sem frontmatter e os paths `implemented-by`
# inexistentes da SPEC-0002; SPEC-0003 aparece em docs/specs/README.md e
# docs/index.json

pnpm --dir apps/ui typecheck
# exit 0

pnpm --dir apps/ui exec vitest run --exclude '**/server/auth/invites.test.ts'
# exit 0; casos 1-13 cobertos pelos testes de shell e regressões unitárias existentes

pnpm --dir apps/ui build
# exit 0; build client e server sem import server-only indevido
```

O fechamento exige evidência automatizada para os casos de borda 1 a 13 e
inspeção humana dos itens abaixo.

## Revisão humana

- Conferir visualmente a primeira visita em navegador claro e escuro, além da
  troca explícita entre claro/escuro, procurando flash perceptível.
- Conferir drawer em viewport mobile e sidebar recolhida/expandida em desktop,
  incluindo foco, teclado e leitura por tecnologia assistiva quando disponível.
- Conferir hierarquia visual, identidade provisória e legibilidade do menu de
  conta sem copiar elementos prematuros do `apps/web`.

## Verificação

Verificado em 13 de julho de 2026 no worktree compartilhado. Todos os comandos
abaixo encerraram com exit 0.

```bash
pnpm prettier --check docs/spec-decisions/0003_ui_shell_decisions.md docs/context/testing-anti-patterns.md docs/specs/0003-ui-shell-autenticado-spec.md
# All matched files use Prettier code style!

pnpm docs-check --emit-index
# 9 docs · 0 erro(s) · 0 aviso(s)

pnpm --dir apps/ui exec vitest run --exclude '**/server/auth/invites.test.ts'
# 8 arquivos passaram · 27 testes passaram

pnpm --dir apps/ui typecheck
# tsc --noEmit

pnpm --dir apps/ui build
# build client e SSR concluídos

git diff --check
# sem saída
```

| ID  | Evidência automatizada real                                                                                                                                                                             |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T1  | `pnpm docs-check --emit-index` passou com 9 documentos, 0 erros e 0 avisos; a SPEC-0002 e os índices permanecem válidos.                                                                                |
| T2  | `src/server/ui-preferences.functions.test.ts` passou cobrindo fallbacks para cookies ausentes/corrompidos e valores canônicos.                                                                          |
| T3  | O mesmo arquivo passou cobrindo `UNAUTHENTICATED` sem cookie e escrita autenticada com renovação de 180 dias.                                                                                           |
| T4  | `src/routes/-__root.test.tsx` e `src/routes/-__root.ssr.test.tsx` passaram cobrindo primeira visita clara/escura, cookie inválido/malformado e classe SSR.                                              |
| T5  | `src/components/app-shell/app-sidebar.test.tsx` passou verificando Dashboard como único link e estado ativo na rota raiz.                                                                               |
| T6  | O mesmo teste passou verificando drawer mobile inicialmente fechado, Escape e ausência de persistência do estado transitório.                                                                           |
| T7  | `src/components/app-shell/account-menu.test.tsx` passou verificando campos públicos, sucesso de sign-out e erro recuperável.                                                                            |
| T8  | `src/routes/-_protected.test.ts` passou verificando redirect anônimo antes da montagem e montagem autenticada pelo slot do shell.                                                                       |
| T9  | `pnpm --dir apps/ui typecheck` e `pnpm --dir apps/ui build` passaram; a inspeção de escopo não encontrou `localStorage`, URLs de `apps/web` nem chamadas `/api/` administrativas nos arquivos do shell. |

A revisão humana continua necessária para primeira pintura em navegadores claro e
escuro, comportamento do drawer em viewport mobile, foco/teclado e legibilidade
do menu de conta.

## Self-Review

Verdict: approved after independent-review fixes — 12 de julho de 2026.
