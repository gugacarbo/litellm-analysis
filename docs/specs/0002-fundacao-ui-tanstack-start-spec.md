---
status: implemented
date: 2026-07-10
builds-on: [ADR-0001, ADR-0002, ADR-0004, ADR-0005, ADR-0006, SPEC-0001]
implemented-by:
  - docs/jobs/0002-fundacao-ui-tanstack-start/Task-A-1
  - docs/jobs/0002-fundacao-ui-tanstack-start/Task-B-1
  - docs/jobs/0002-fundacao-ui-tanstack-start/Task-C-1
  - docs/jobs/0002-fundacao-ui-tanstack-start/Task-D-1
  - docs/jobs/0002-fundacao-ui-tanstack-start/Task-E-1
---

# Estabelecer a fundação server-side do apps/ui

## Objetivo

Preparar o `apps/ui` para executar operações protegidas no runtime server-side do TanStack Start, com autenticação Better Auth, composição dos serviços existentes e separação verificável entre código client-safe e server-only.

Esta etapa não migra telas de domínio. Seu resultado é uma fundação funcional sobre a qual as etapas de modelos, analytics, health checks, benchmarks, agentes e chat poderão ser construídas sem retornar ao cliente HTTP do `apps/web`.

## Fluxo

### Primeiro acesso

1. O usuário acessa o `apps/ui` sem sessão.
2. Uma rota pública apresenta autenticação ou o fluxo de convite inicial.
3. O usuário envia `inviteToken`, email, nome e senha para a server function `acceptInvite`.
4. O servidor valida o convite/configuração inicial sem enviar o segredo de bootstrap ao browser.
5. O servidor cria a conta Better Auth e a sessão persistida em uma operação única.
6. O usuário é redirecionado para uma rota protegida.

Administradores poderão usar a server function `createInvite`, informando email opcional e papel `admin` ou `viewer`. A função retorna o token uma única vez para composição do link de convite; somente o hash é persistido.

### Acesso autenticado

1. O usuário acessa uma rota protegida.
2. O loader valida somente a existência de uma sessão no servidor e redireciona para `/login?returnTo=<rota>` quando não houver sessão.
3. A rota monta a query `runtime-status`.
4. A query chama exclusivamente a server function `getRuntimeStatus`.
5. A server function valida sessão e autorização, executa a leitura segura e retorna apenas dados públicos da aplicação.
6. TanStack Query mantém o resultado no estado da tela, sem uma segunda consulta equivalente no loader.

### Sessão inválida

1. O usuário acessa uma rota protegida sem sessão, com sessão expirada ou sem autorização.
2. A server function não compõe serviços administrativos nem consulta dados protegidos.
3. A aplicação retorna um erro de autenticação/autorização tipado.
4. A UI direciona o usuário para autenticação ou apresenta acesso negado.

## Contrato

### Contexto server-side

O `apps/ui` deverá possuir uma composição server-only reutilizável para inicializar, sob demanda e de forma testável apenas as dependências da Etapa 1:

- contexto de autenticação;
- repositórios de usuários, sessões e convites;
- logger server-side com redaction;
- dependências mínimas de `getRuntimeStatus`.

A composição não deve inicializar registry, models repository, analytics data source ou gateway Hebo nesta etapa. Esses serviços entram nas specs derivadas dos respectivos domínios.

### Autenticação

- Better Auth será o provedor de sessão da aplicação.
- Usuários e sessões serão persistidos no PostgreSQL/Drizzle existente em `database/`, por migração própria compatível com o cliente compartilhado.
- O pacote `database` será o proprietário dos schemas Drizzle e dos tipos de leitura, insert e update das tabelas de autenticação, conforme ADR-0006.
- Os schemas Zod de leitura, insert e update serão derivados no pacote `database` com `createSelectSchema`, `createInsertSchema` e `createUpdateSchema` de `drizzle-orm/zod`.
- A migração incluirá as tabelas lógicas `user`, `session`, `account`, `verification` e `app_invite`.
- O primeiro usuário será criado por um convite derivado de `AUTH_BOOTSTRAP_INVITE_SECRET` ou por convite emitido por um administrador.
- O segredo de bootstrap será lido somente no servidor, nunca persistido em texto puro e nunca enviado ao browser.
- Cada convite terá hash persistido, validade, estado de uso e consumo atômico de uso único.
- Convites expirados, inválidos ou já consumidos serão rejeitados com o mesmo erro público `INVALID_INVITE`.
- O usuário terá no mínimo o papel `admin` ou `viewer`; `getRuntimeStatus` exigirá o papel `admin` nesta etapa.
- Rotas e server functions protegidas exigirão sessão válida.
- A autorização será aplicada no servidor; esconder controles na UI não é suficiente.

Os erros públicos de autenticação e autorização usarão o catálogo mínimo `UNAUTHENTICATED`, `FORBIDDEN`, `INVALID_INVITE` e `INTERNAL`. Mensagens podem ser amigáveis, mas não devem revelar se um convite, segredo, usuário ou sessão específica existe.

Contratos mínimos das server functions de convite:

```ts
type AcceptInviteInput = {
  inviteToken: string;
  email: string;
  name: string;
  password: string;
};

type CreateInviteInput = {
  email?: string;
  role: "admin" | "viewer";
};

type InviteResult =
  | { ok: true; userId: string; sessionCreated?: true; inviteToken?: string }
  | {
      ok: false;
      error: {
        code: "INVALID_INVITE" | "UNAUTHENTICATED" | "FORBIDDEN" | "INTERNAL";
        message: string;
      };
    };
```

`acceptInvite` aceita o token de bootstrap ou um token emitido por administrador. `createInvite` exige sessão de `admin`, não retorna o token novamente após a resposta inicial e deve rejeitar a criação de convites duplicados para o mesmo email enquanto houver convite válido.

### Server function de smoke test

A etapa deverá expor uma operação server-side equivalente a `getRuntimeStatus` com o seguinte contrato lógico:

```ts
type RuntimeStatus = {
  ok: true;
  authenticated: true;
  runtime: "tanstack-start";
};

type RuntimeStatusErrorCode = "UNAUTHENTICATED" | "FORBIDDEN" | "INTERNAL";

type RuntimeStatusResult =
  | RuntimeStatus
  | {
      ok: false;
      error: {
        code: RuntimeStatusErrorCode;
        message: string;
      };
    };
```

Requisitos:

- rejeitar ausência de sessão com `UNAUTHENTICATED`;
- rejeitar usuário `viewer` com `FORBIDDEN`;
- retornar `INTERNAL` para falhas inesperadas sem vazar detalhes internos;
- não retornar segredos, variáveis de ambiente ou detalhes de banco;
- ser consumível por uma rota protegida;
- ser testável sem iniciar o servidor HTTP completo;
- usar a query key estável `runtime-status`;
- não executar uma segunda leitura equivalente no loader.

### Client/server boundary

- Componentes client-side podem importar apenas tipos e helpers client-safe.
- Acesso a banco, filesystem, secrets, services server-only e providers deve ficar em módulos server-only.
- O transporte interno gerado pelo TanStack Start para executar uma server function é permitido.
- A UI não pode consumir a API administrativa legada do `apps/server`, acessar banco/credenciais/providers diretamente ou chamar o gateway diretamente.
- APIs REST próprias em `apps/ui/src/routes/api` são permitidas, mas não são necessárias para o smoke test desta etapa.
- O uso de TanStack Query deve apontar para server functions ou APIs REST próprias explicitamente definidas pela feature.
- Server functions serão declaradas com `createServerFn`, validação de entrada e handler server-only; loaders não importarão diretamente módulos de banco ou Better Auth.
- A rota Better Auth `routes/api/auth/$` é uma rota de infraestrutura própria do `apps/ui`, necessária para o protocolo de autenticação, e não uma API administrativa legada.
- A guarda arquitetural será implementada em `scripts/check-ui-client-boundary.mjs`, permitindo rotas REST próprias e proibindo imports server-only e referências à API legada.

### Observabilidade mínima

Falhas de autenticação e falhas internas devem ser registradas em eventos estruturados com os campos permitidos `event`, `errorCode`, `requestId`, `userId` quando disponível e `durationMs`. Tokens, cookies, chaves, segredos, headers de autorização e payloads completos são proibidos. O logger deve aplicar redaction antes da saída.

## Casos de borda

| #   | QUANDO o evento ocorrer                                          | o sistema DEVE responder                                                                                                                          |
| --- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | O usuário acessar a rota protegida sem sessão                    | O loader redireciona para `/login?returnTo=...`; uma chamada direta à server function retorna `UNAUTHENTICATED`, sem executar `getRuntimeStatus`. |
| 2   | A sessão estiver expirada                                        | Rejeitar a operação e exigir nova autenticação.                                                                                                   |
| 3   | O convite inicial estiver ausente ou inválido                    | Recusar a criação da conta e não revelar qual parte do segredo falhou.                                                                            |
| 4   | O usuário autenticado não tiver autorização                      | Retornar acesso negado sem consultar dados administrativos.                                                                                       |
| 5   | A composição server-side falhar                                  | Retornar erro interno seguro e registrar diagnóstico sem dados sensíveis.                                                                         |
| 6   | Um módulo server-only entrar no bundle client-side               | O build ou teste de arquitetura DEVE falhar.                                                                                                      |
| 7   | A rota for renderizada sem dados de runtime                      | Exibir estado de carregamento e erro recuperável, sem inventar status saudável.                                                                   |
| 8   | O browser tentar acessar uma API administrativa diretamente      | A guarda arquitetural DEVE falhar antes da conclusão da etapa.                                                                                    |
| 9   | O teste usar repositórios reais por acidente                     | A suíte deve falhar ou isolar explicitamente a dependência, evitando mutação do banco de desenvolvimento.                                         |
| 10  | O usuário autenticado com papel `admin` acessar a rota protegida | O loader permite a rota, a query chama `getRuntimeStatus` uma vez e a UI exibe `RuntimeStatus.ok`.                                                |

## Matriz de testes TDD

Os testes da etapa devem ser escritos antes da implementação correspondente. Cada linha abaixo precisa ter pelo menos um teste automatizado ou uma verificação de build associada.

| Caso | Teste obrigatório                                                                     | Critério de aceite                                                                                                                                                                                                  |
| ---- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | `apps/ui/src/routes/protected.test.tsx` e `apps/ui/src/server/runtime-status.test.ts` | Loader redireciona para `/login?returnTo=...`; chamada direta da server function sem sessão retorna `UNAUTHENTICATED` e não chama dependências protegidas.                                                          |
| 2    | `apps/ui/src/server/auth.test.ts`                                                     | Sessão expirada retorna `UNAUTHENTICATED` sem mutação ou consulta protegida.                                                                                                                                        |
| 3    | `apps/ui/src/server/invites.test.ts`                                                  | Convite ausente, inválido, expirado ou reutilizado não cria usuário e retorna `INVALID_INVITE`.                                                                                                                     |
| 4    | `apps/ui/src/server/runtime-status.test.ts`                                           | Usuário `viewer` recebe `FORBIDDEN` e o service protegido não é chamado.                                                                                                                                            |
| 5    | `apps/ui/src/server/runtime-status.test.ts`                                           | Falha injetada na composição retorna `INTERNAL`; logger registra evento permitido e não contém segredo.                                                                                                             |
| 6    | `scripts/check-ui-client-boundary.test.ts`                                            | Import server-only detectado faz o script retornar exit code diferente de zero.                                                                                                                                     |
| 7    | `apps/ui/src/routes/protected.test.tsx`                                               | Rota usa estado loading/error e nunca apresenta `ok: true` sem resultado da query.                                                                                                                                  |
| 8    | `scripts/check-ui-client-boundary.test.ts`                                            | Referências à API legada, provider client ou imports server-only introduzidos na árvore client-side fazem a guarda falhar; rotas REST próprias e transporte gerado do TanStack não são classificados como violação. |
| 9    | `apps/ui/src/server/repositories.test.ts`                                             | Testes exigem dependências injetadas ou helper de banco isolado e não usam o banco local.                                                                                                                           |
| 10   | `apps/ui/src/routes/protected.test.tsx`                                               | Sessão `admin` permite a rota, TanStack Query chama `getRuntimeStatus` uma vez e a tela exibe o status retornado.                                                                                                   |

Os testes unitários usarão dependências injetadas. Testes de integração de autenticação usarão exclusivamente um PostgreSQL dedicado indicado por `TEST_DATABASE_URL`, com schema descartável e sem reutilizar `DATABASE_URL`. Os testes devem priorizar contratos observáveis; não é necessário fixar a implementação interna da server function ou do adaptador Better Auth quando o comportamento público permanecer o mesmo.

## Questões em aberto

Nenhuma questão bloqueia a implementação da Etapa 1. O formato visual final das telas de autenticação será validado na revisão humana; esta spec define comportamento, não design final.

## Definition of Done

```bash
pnpm docs-check                                      # exit 0; spec e índices válidos
pnpm --filter ui typecheck                           # exit 0
pnpm --filter ui test                                # testes da fundação verdes
pnpm --filter ui build                               # build client/server verde
pnpm exec vitest run apps/ui/src/server apps/ui/src/routes scripts/check-ui-client-boundary.test.ts # matriz TDD verde
node scripts/check-ui-client-boundary.mjs             # exit 0; nenhuma violação client/server
```

Testes obrigatórios:

- sessão válida permite acessar a rota protegida e executar `getRuntimeStatus`;
- sessão ausente é rejeitada;
- sessão expirada é rejeitada;
- convite inválido não cria usuário;
- usuário sem autorização não executa operação protegida;
- admin autenticado completa o fluxo rota protegida → TanStack Query → `getRuntimeStatus` → `RuntimeStatus`;
- falha de composição produz erro seguro;
- segredo de bootstrap não aparece no bundle client-side;
- imports server-only não entram na árvore client-side;
- `getRuntimeStatus` não retorna segredos nem detalhes internos;
- casos de borda `1` a `10` estão cobertos conforme a Matriz de testes TDD;
- o ciclo Red/Green foi executado durante o desenvolvimento e está registrado no relatório de verificação;
- testes unitários usam dependências injetadas e testes de integração usam `TEST_DATABASE_URL`, nunca o banco local de desenvolvimento.

## Revisão humana

- Confirmar o fluxo de primeiro acesso e convite.
- Confirmar que o contrato de sessão atende o ambiente local e o deploy previsto.
- Inspecionar a tela de autenticação em desktop e mobile.
- Verificar que nenhuma credencial aparece em logs, respostas ou bundle.
- Confirmar que a solução não iniciou uma segunda composição independente do gateway Hebo.

## Self-Review

**Verdict:** approved
**Date:** 2026-07-09
**Evidence:** reviewed by `spec-document-reviewer`; final status `Approved` with no remaining findings.

## Verificação

```text
Registrar os comandos e resultados em
docs/verification/0002-fundacao-ui-tanstack-start.md no fechamento da etapa.
```
