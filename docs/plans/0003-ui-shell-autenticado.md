# Process: super-planning

> Fase 3 — PLAN. Instruções em
> `/home/gustavo/.agents/skills/super-planning/phases/03-plan.md`.

# Plano de implementação: shell autenticado do apps/ui

**Spec:** [SPEC-0003](../specs/0003-ui-shell-autenticado-spec.md)  
**Decisões:** [0003_ui_shell_decisions.md](../spec-decisions/0003_ui_shell_decisions.md)  
**Status:** pronto para decomposição  
**Modo de execução:** híbrido — Batch A em paralelo, depois batches sequenciais
para respeitar contratos e evitar conflitos de arquivos.

## Resumo

**Objetivo:** substituir o placeholder da rota protegida por um shell acessível,
responsivo e SSR-safe, com navegação somente para rotas existentes, preferências
em cookie e conta autenticada.

**Escopo:** corrigir o bloqueio documental da SPEC-0002; criar preferências de
tema/sidebar e sua fronteira server-side; criar shell, drawer mobile, menu de
conta e cliente Better Auth; integrar tudo às rotas TanStack Start já
protegidas; validar por TDD.

**Fora de escopo:** filtros de data, chat, dashboards/analytics, logs, modelos,
providers, health checks, benchmarks, agentes, novas tabelas/migrations e
redesign visual.

**Sinal de sucesso:** um usuário autenticado entra em `/` com tema correto na
primeira pintura, navega pelo único item funcional (Dashboard), usa a sidebar
em desktop/mobile, vê sua conta e sai; as preferências persistem e o DoD da
SPEC-0003 passa.

## Contexto e design

### Estado atual e pontos de entrada

- `apps/ui/src/routes/__root.tsx` fornece documento HTML, React Query e CSS,
  mas ainda usa título de scaffold e não trata preferência SSR.
- `apps/ui/src/routes/_protected.tsx` já valida sessão por `getSession`,
  redireciona anônimos e é o ponto correto para o shell.
- `apps/ui/src/routes/_protected/index.tsx` é o único conteúdo de produto
  funcional e precisa permanecer acessível por `/`.
- `apps/ui/src/server/auth/get-session.functions.ts` prova o padrão
  `createServerFn` + `getRequest()` + `requireSession`.
- `apps/ui/src/styles.css` já tem tokens claro/escuro e tokens de sidebar;
  falta controlar a classe no documento e construir os componentes.

### Arquitetura alvo

1. Um módulo server-only de preferências parseia `ui_theme`/`ui_sidebar`,
   serializa cookies de 180 dias e expõe server functions autenticadas para as
   mudanças explícitas do usuário.
2. O root document aplica um cookie de tema válido em SSR. Se o cookie estiver
   ausente ou inválido, um script pré-paint minúsculo resolve
   `prefers-color-scheme`, aplica a classe e cria/sobrescreve somente
   `ui_theme`. Ele é a única escrita client-side permitida para essas
   preferências.
3. Componentes client-side usam `@base-ui/react` para drawer modal controlado,
   com Escape, foco e estado mobile transitório. Desktop usa a preferência
   `ui_sidebar`; mobile nunca a sobrescreve.
4. O menu de conta recebe somente os dados públicos da sessão. Sign-out usa
   `authClient.signOut()` de `better-auth/react`, exceção de infraestrutura à
   ADR-0004; nenhuma API administrativa legada é chamada.
5. A configuração de navegação começa com uma única rota protegida, Dashboard.
   Novos domínios só adicionam seus itens quando suas rotas estiverem entregues.

### Contratos implementáveis

```ts
type ThemePreference = "light" | "dark";
type SidebarPreference = "expanded" | "collapsed";

type UiPreferences = {
  theme: ThemePreference;
  sidebar: SidebarPreference;
};
```

- `ui_theme` e `ui_sidebar`: `Path=/`, `SameSite=Lax`, `Max-Age=15552000` e
  `Secure` em produção; são dados não sensíveis e não usam `HttpOnly`.
- Server functions de preferências exigem sessão; ausência/expiração retorna
  `UNAUTHENTICATED` sem `Set-Cookie`.
- Valor de tema inválido/ausente resolve pelo browser antes da pintura e é
  sobrescrito pelo valor canônico; sidebar inválida/ausente usa `expanded`.
- O seletor explícito oferece apenas `light` e `dark`, no rodapé da sidebar.
- O menu de conta só contém nome, e-mail, papel e ação de sair.

## Referências e restrições

| Fonte                                                                      | Seção                     | O que governa                                                     | Consequência no plano                                                                    |
| -------------------------------------------------------------------------- | ------------------------- | ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| [SPEC-0003](../specs/0003-ui-shell-autenticado-spec.md)                    | Contrato e Casos de borda | Cookies, shell, conta e 13 casos observáveis                      | Tasks B–F devem cobrir todos os casos com TDD.                                           |
| [ADR-0002](../adr/0002-server-functions-como-fronteira-de-dados.md)        | Decisão e Consequências   | UI é dona da fronteira; browser não usa API administrativa legada | Preferências usam server functions e guardas de boundary continuam válidas.              |
| [ADR-0004](../adr/0004-router-query-organiza-dados-da-ui.md)               | Decisão                   | Mutações de domínio chamam server functions                       | Sign-out é exceção limitada ao cliente oficial Better Auth, documentada nesta plan/spec. |
| [ADR-0005](../adr/0005-better-auth-com-bootstrap-por-convite.md)           | Decisão                   | Sessão Better Auth protege server functions                       | Task B chama `requireSession`; Task D usa somente o cliente oficial para logout.         |
| [0003_ui_shell_decisions.md](../spec-decisions/0003_ui_shell_decisions.md) | Decisões de arquitetura   | Sem `system`, sem localStorage, sidebar só funcional              | Nenhuma tarefa pode reintroduzir esses comportamentos.                                   |
| [testing-anti-patterns.md](../context/testing-anti-patterns.md)            | Completo                  | TDD e substitutos honestos                                        | Toda task de comportamento começa pelo teste RED e usa mocks só em fronteiras reais.     |

**Decisões não resolvidas:** nenhuma.

**Restrições globais:**

- Não modificar schema, migrations, convite, papéis nem regras de autenticação
  existentes fora do encerramento de sessão já suportado pelo Better Auth.
- Exceção aprovada em 13 de julho de 2026: a integração pode ampliar apenas a
  projeção pública já autenticada da sessão para `name` e `email`, sem mudar
  autorização, persistência ou os dados expostos ao cliente além de
  `id`/`name`/`email`/`role` necessários ao shell.
- Não importar banco, services, `node:*`, cookies de sessão ou APIs do
  `apps/server` em componentes client-side.
- Não usar `localStorage` para tema/sidebar; não adicionar links futuros ou
  desabilitados à sidebar.
- Não permitir que o drawer mobile grave `ui_sidebar`.
- Manter `apps/web` intacto como referência.

## Arquivos e tarefas

| Arquivo/diretório                                                                                         | Alteração                   | Owner       | Depende de  | Contrato                                                                             |
| --------------------------------------------------------------------------------------------------------- | --------------------------- | ----------- | ----------- | ------------------------------------------------------------------------------------ |
| `docs/specs/0002-fundacao-ui-tanstack-start-spec.md`                                                      | modificar                   | Task-A-0003 | —           | Corrigir `implemented-by` para paths reais.                                          |
| `docs/specs/verification/0002-...md` → `docs/verification/0002-...md`                                     | mover/atualizar referências | Task-A-0003 | —           | Tirar evidência de `docs/specs/` para eliminar ID duplicado/ausência de frontmatter. |
| `docs/plans/0002-...md`, `docs/jobs/0002-.../super-plan.json`                                             | modificar                   | Task-A-0003 | —           | Apontar a evidência real após a movimentação.                                        |
| `apps/ui/src/server/ui-preferences.functions.ts`                                                          | criar                       | Task-B-0003 | —           | Parser, serialização, leitura e mutações protegidas de preferência.                  |
| `apps/ui/src/server/ui-preferences.functions.test.ts`                                                     | criar                       | Task-B-0003 | —           | RED/GREEN de cookies, sessão e erros.                                                |
| `apps/ui/src/components/app-shell/app-shell.tsx`, `app-sidebar.tsx`, `navigation.ts`, `theme-control.tsx` | criar                       | Task-C-0003 | Task-B-0003 | Sidebar desktop, drawer mobile, navegação e tema visual.                             |
| `apps/ui/src/components/app-shell/{app-sidebar,theme-control}.test.tsx`                                   | criar                       | Task-C-0003 | Task-B-0003 | Navegação, foco, Escape, persistência e estados responsivos.                         |
| `apps/ui/src/lib/auth-client.ts`                                                                          | criar                       | Task-D-0003 | —           | Cliente client-safe `better-auth/react`.                                             |
| `apps/ui/src/components/app-shell/account-menu.tsx`                                                       | criar                       | Task-D-0003 | Task-B-0003 | Dados públicos da conta e sign-out oficial.                                          |
| `apps/ui/src/components/app-shell/account-menu.test.tsx`                                                  | criar                       | Task-D-0003 | Task-B-0003 | Sucesso/falha de logout sem mockar a UI interna.                                     |
| `apps/ui/src/server/auth/get-session.functions.ts`                                                        | modificar                   | Task-E-0003 | Tasks B–D   | Projetar somente `name`, `email` e `role` públicos da sessão já autenticada.         |
| `apps/ui/src/components/app-shell/app-shell.tsx`                                                          | modificar                   | Task-E-0003 | Tasks B–D   | Receber e renderizar o slot do menu de conta sem acesso a sessão no cliente.         |
| `apps/ui/src/routes/__root.tsx`                                                                           | modificar                   | Task-E-0003 | Tasks B–D   | HTML, título, script pré-paint e estado SSR-safe.                                    |
| `apps/ui/src/routes/_protected.tsx`                                                                       | modificar                   | Task-E-0003 | Tasks B–D   | Montar shell com sessão/rotas e preservar redirect.                                  |
| `apps/ui/src/routes/_protected/index.tsx`                                                                 | modificar                   | Task-E-0003 | Tasks B–D   | Conteúdo Dashboard dentro do shell, sem novo domínio.                                |
| `apps/ui/src/routes/*shell*.test.tsx`, `apps/ui/src/routes/-_protected.test.ts`                           | criar/modificar             | Task-E-0003 | Tasks B–D   | Integração da rota, SSR e regressão de guarda.                                       |
| `apps/ui/APP_INVENTORY.md`, `docs/specs/0003-...md`, `docs/index.json`, `docs/specs/README.md`            | modificar                   | Task-F-0003 | Tasks A–E   | Evidência, checklist e índices no fechamento.                                        |

### Sequência de implementação

- **Batch A — foundation/final, paralelo:**
  - **Task-A-0003:** reparar a documentação histórica da SPEC-0002. Mover a
    evidência para `docs/verification/`, atualizar as quatro referências e
    trocar `implemented-by` pelos diretórios reais `docs/jobs/.../Task-*-1`;
    terminar com `pnpm docs-check --emit-index` verde.
  - **Task-B-0003:** criar preferências server-side por TDD. Implementar parser
    determinístico, serializador de cookie, `getUiPreferences`,
    `setThemePreference` e `setSidebarPreference`; todos exigem sessão, exceto
    a leitura usada para SSR quando o cookie já está disponível.
- **Batch B — surface, paralelo após B:**
  - **Task-C-0003:** criar os componentes de shell desacoplados de rota:
    configuração única de Dashboard, sidebar desktop, drawer Base UI mobile,
    toggle de tema e contratos de callbacks. Cobrir navegação ativa, Escape,
    foco e a separação mobile/desktop antes da implementação.
  - **Task-D-0003:** criar o cliente Better Auth React e o menu de conta. Usar
    `authClient.signOut()` e redirecionar só após sucesso; erro não desmonta o
    shell. O módulo não acessa banco nem APIs administrativas.
- **Batch C — surface, sequencial:**
  - **Task-E-0003:** integrar preferências e shell ao root/protected route,
    renderizar o script pré-paint limitado, aplicar classe de tema no HTML,
    manter a guarda existente e cobrir os fluxos de rota/SSR. Esta tarefa
    também projeta `name` e `email` públicos da sessão já validada e adiciona
    ao `AppShell` o slot necessário para renderizar o menu de conta, conforme
    a exceção aprovada; ela não altera autorização, sessão persistida ou schema.
- **Batch D — final:**
  - **Task-F-0003:** executar a matriz completa, corrigir apenas regressões
    introduzidas pela etapa, registrar evidência de fechamento, marcar os itens
    concluídos no inventário e regenerar os índices.

O scan de conflitos está limpo: Task A só edita documentação histórica; Task B
é server-only; Tasks C e D criam arquivos distintos no mesmo diretório; apenas
Task E integra as rotas depois de suas dependências. Não há dependências
cíclicas.

## Verificação de documentação

| Tecnologia/versão         | Questão                                                                                | Método                        | Fonte                                                                                                                                                                                                                                            | Decisão aplicada                                                                                                                       |
| ------------------------- | -------------------------------------------------------------------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| TanStack Start 1.168.27   | Como ler request/cookie e emitir resposta em server function sem contaminar o cliente? | repository-pattern + Context7 | `apps/ui/src/server/auth/get-session.functions.ts`; `docs/jobs/0002-fundacao-ui-tanstack-start/Task-B-1/report.md`; [TanStack auth primitives](https://tanstack.com/start/latest/docs/framework/react/guide/authentication-server-primitives.md) | Task B usa `createServerFn`, `getRequest()` e primitives server-only para cookies; Task E não importa esses módulos no cliente.        |
| TanStack Start 1.168.27   | Como usar cookie como contexto sem mismatch de hidratação?                             | Context7                      | [TanStack hydration errors](https://tanstack.com/start/latest/docs/framework/react/guide/hydration-errors.md)                                                                                                                                    | Task E recebe cookie SSR quando válido e limita a mutação pré-hidratação ao atributo de tema para a primeira visita.                   |
| Better Auth 1.6.23        | Qual é o contrato oficial para sign-out React?                                         | Context7                      | [client](https://github.com/better-auth/better-auth/blob/v1.6.23/docs/content/docs/concepts/client.mdx), [basic usage](https://github.com/better-auth/better-auth/blob/v1.6.23/docs/content/docs/basic-usage.mdx)                                | Task D cria `createAuthClient` de `better-auth/react` e usa `authClient.signOut`; é exceção de infraestrutura, não API administrativa. |
| Base UI 1.6.0             | Como manter drawer mobile controlado com foco/Escape?                                  | Context7                      | [controlled Drawer](<https://github.com/mui/base-ui/blob/v1.6.0/docs/src/app/(docs)/react/components/drawer/page.mdx>)                                                                                                                           | Task C usa `Drawer.Root` controlado com `open`/`onOpenChange`; não implementa focus trap manual.                                       |
| CSS/Tailwind já instalado | Quais tokens e mecanismo de tema existem?                                              | repository-pattern            | `apps/ui/src/styles.css`, `apps/ui/components.json`                                                                                                                                                                                              | Task E aplica somente `.light`/`.dark`; Task C usa tokens sem duplicar paleta hard-coded.                                              |

## Verificação

**Modo de teste:** TDD obrigatório para Tasks B–E; Task A é correção
documental e Task F é integração/evidência.

**Guia de testes:** `docs/context/testing-anti-patterns.md`.

```bash
pnpm docs-check --emit-index
# exit 0; baseline documental e índices corretos

pnpm --dir apps/ui exec vitest run --exclude '**/server/auth/invites.test.ts'
# exit 0; testes de shell e regressões unitárias verdes

pnpm --dir apps/ui typecheck
# exit 0

pnpm --dir apps/ui build
# exit 0; bundles client/server gerados sem violação de fronteira
```

| ID  | Cenário                                                                  | Nível              | Owner       | Evidência                                                      |
| --- | ------------------------------------------------------------------------ | ------------------ | ----------- | -------------------------------------------------------------- |
| T1  | SPEC-0002 volta a passar na validação documental                         | docs               | Task-A-0003 | `docs-check --emit-index` exit 0.                              |
| T2  | Parser aceita só valores canônicos e aplica fallbacks                    | unit               | Task-B-0003 | RED/GREEN para ausência, corrupção e valor inválido.           |
| T3  | Mutação de preferência exige sessão e emite cookie de 180 dias           | unit/integration   | Task-B-0003 | `UNAUTHENTICATED` sem header; sucesso com `Set-Cookie`.        |
| T4  | Primeira visita resolve tema pelo browser antes da hidratação            | route/document     | Task-E-0003 | Script testado para browser claro, escuro e cookie inválido.   |
| T5  | Navegação inicial contém só Dashboard e indica rota ativa                | component          | Task-C-0003 | Árvore renderizada sem links futuros/legados.                  |
| T6  | Drawer mobile inicia fechado, abre/fecha e não persiste sidebar desktop  | component          | Task-C-0003 | `matchMedia`, Escape e callback de persistência cobertos.      |
| T7  | Conta mostra apenas dados públicos; logout sucesso/falha é recuperável   | component          | Task-D-0003 | `authClient.signOut` como fronteira mockada.                   |
| T8  | Rota protegida continua a redirecionar anônimo e monta shell autenticado | route              | Task-E-0003 | Testes existentes atualizados sem duplicar consulta de sessão. |
| T9  | Sem import server-only/API legada no client                              | build/architecture | Task-E-0003 | typecheck/build e guarda de boundary existente passam.         |

**Revisão humana:** verificar primeira pintura clara/escura, drawer em viewport
mobile, sidebar expandida/recolhida em desktop, teclado/foco e legibilidade do
menu de conta.

## Riscos e handoff

| Risco                                | Detecção             | Mitigação                                                          | Rollback/recuperação                                                                 |
| ------------------------------------ | -------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| Script pré-paint causar mismatch     | T4 e inspeção visual | Escopo mínimo, atributo de tema isolado e teste de cookie inválido | Remover script e manter fallback claro enquanto o cookie é corrigido.                |
| Cookie inválido persistir            | T2/T4                | Parser único e sobrescrita canônica                                | Limpar `ui_theme`/`ui_sidebar`; fallback seguro.                                     |
| Logout divergir do Better Auth       | T7 e teste manual    | Usar cliente oficial 1.6.23, não wrapper manual                    | Reverter somente `auth-client.ts`/menu e manter sessão atual.                        |
| Baseline documental bloquear entrega | T1 no Batch A        | Reparar paths históricos antes da integração                       | Reverter apenas a movimentação documental se referências externas forem descobertas. |
| Crescimento precoce do shell         | T5 e revisão         | Configuração de navegação mínima e tipada                          | Remover item antes do merge; não afeta dados.                                        |

**Rollout/observabilidade:** nenhuma migration ou flag é necessária. Preferências
novas usam cookies isolados; rollback remove o shell sem afetar sessões Better
Auth. Eventos de erro de preferências/sign-out seguem o logger/redaction já
existente, sem registrar cookies ou dados de sessão.

**Checklist de prontidão:**

- [x] Cada requisito da SPEC-0003 está mapeado a uma task ou teste T1–T9.
- [x] Arquivos têm owner, batches e dependências sem conflito.
- [x] Contratos de cookie, autenticação, exceção Better Auth e responsividade são concretos.
- [x] Comportamentos das Tasks B–E têm ciclo TDD independente.
- [x] Riscos, rollback e revisão humana estão definidos.
- [x] Não há TBD/TODO ou decisão de produto pendente.

## Handoff para registry

- **Spec:** `docs/specs/0003-ui-shell-autenticado-spec.md`
- **Plan:** `docs/plans/0003-ui-shell-autenticado.md`
- **Registry:** `docs/jobs/0003-ui-shell-autenticado/super-plan.json`
- **Ledger:** `docs/jobs/0003-ui-shell-autenticado/progress-ledger.md`
- **Artefatos por task:** `docs/jobs/0003-ui-shell-autenticado/<task-id>/`

A Fase 4 deve materializar as seis tasks acima no `super-plan.json`, com
`reviewCadence: per_task`, base commit atual, regras TDD copiadas e os critérios
T1–T9. A execução começa por Tasks A e B em paralelo; não deve despachar C ou
D antes de B, nem E antes de C e D.
