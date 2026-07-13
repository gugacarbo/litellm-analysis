# Fundacao server-side do apps/ui

> Plano de implementação da [SPEC-0002](/home/gustavo/Apps/lite-llm-analytics/docs/specs/0002-fundacao-ui-tanstack-start-spec.md). A execução será sequencial porque schema, autenticação, server context e rotas protegidas compartilham contratos.

**Goal:** Preparar o `apps/ui` para executar uma server function autenticada sobre PostgreSQL/Drizzle, com Better Auth, boundary client/server e uma rota protegida de smoke test.

**Architecture:** O `apps/ui` terá módulos server-only para autenticação, composição mínima e server functions. O loader da rota protegida validará a existência da sessão e redirecionará usuários anônimos; TanStack Query chamará `getRuntimeStatus` uma única vez. O gateway Hebo e os services de domínio não serão inicializados nesta etapa.

**Tech Stack:** TanStack Start, TanStack Router, TanStack Query, Better Auth, PostgreSQL, Drizzle ORM, Vitest, React Testing Library e Biome.

## Global Constraints

- Usuários e sessões serão persistidos no PostgreSQL/Drizzle existente em `database/`, por migração própria compatível com o cliente compartilhado.
- O pacote `database` será o proprietário dos schemas Drizzle e dos tipos de leitura, insert e update das tabelas de autenticação, conforme ADR-0006.
- O transporte interno gerado pelo TanStack Start para executar uma server function é permitido.
- A UI não pode consumir a API administrativa legada do `apps/server`, acessar banco/credenciais/providers diretamente ou chamar o gateway diretamente.
- APIs REST próprias em `apps/ui/src/routes/api` são permitidas; a Etapa 1 não precisa criar uma API REST de domínio.
- Server functions usam `createServerFn().validator(...).handler(...)`; loaders chamam server functions e não importam diretamente módulos server-only.
- Better Auth usa `@better-auth/drizzle-adapter` com `provider: "pg"`, `tanstackStartCookies()` como último plugin e a rota própria `apps/ui/src/routes/api/auth/$.ts` para `GET`/`POST`.
- Schemas Zod de leitura, insert e update são derivados no pacote `database` com `drizzle-orm/zod`.
- O loader valida somente a existência de uma sessão; a query `runtime-status` chama exclusivamente `getRuntimeStatus`.
- Os erros públicos usam `UNAUTHENTICATED`, `FORBIDDEN`, `INVALID_INVITE` e `INTERNAL`.
- Testes unitários usam dependências injetadas; testes de integração usam `TEST_DATABASE_URL`, nunca `DATABASE_URL`.
- Cada teste TDD deve ser escrito antes da implementação correspondente.

## File Structure

| File/Directory                                         | Owner Task     | Notes                                                               |
| ------------------------------------------------------ | -------------- | ------------------------------------------------------------------- |
| `database/src/schema/app/auth.ts`                      | Task-A-0002    | Tabelas Drizzle de usuário, sessão, account, verification e invite. |
| `database/src/schema/app/index.ts`                     | Task-A-0002    | Export público dos schemas de autenticação.                         |
| `database/src/schema/app/auth.schemas.ts`              | Task-A-0002    | Schemas Zod derivados de select, insert e update.                   |
| `database/drizzle/`                                    | Task-A-0002    | Migração PostgreSQL gerada e validada.                              |
| `apps/ui/src/server/auth/`                             | Task-B-0002    | Configuração Better Auth, sessão, convite e autorização.            |
| `apps/ui/src/routes/api/auth/$.ts`                     | Task-B-0002    | Catch-all próprio do Better Auth para GET/POST e cookies de sessão. |
| `apps/ui/src/server/context.ts`                        | Task-C-0002    | Composição server-only mínima e dependências injetáveis.            |
| `apps/ui/src/server/runtime-status.ts`                 | Task-C-0002    | Contrato e implementação de `getRuntimeStatus`.                     |
| `apps/ui/src/routes/login.tsx`                         | Task-D-0002    | Entrada pública de login/convite.                                   |
| `apps/ui/src/routes/_protected.tsx`                    | Task-D-0002    | Loader de sessão e redirecionamento para login.                     |
| `apps/ui/src/routes/index.tsx`                         | Task-D-0002    | Rota protegida que exibe o status.                                  |
| `apps/ui/src/server/*.test.ts`                         | Tasks A-C-0002 | Testes TDD de schema, auth, convite e server function.              |
| `apps/ui/src/routes/*.test.tsx`                        | Task-D-0002    | Testes de loader, query, loading, erro e sucesso.                   |
| `scripts/check-ui-client-boundary.mjs`                 | Task-E-0002    | Guarda versionada para imports e APIs proibidas no client.          |
| `scripts/check-ui-client-boundary.test.ts`             | Task-E-0002    | Testes da guarda arquitetural.                                      |
| `docs/verification/0002-fundacao-ui-tanstack-start.md` | Task-E-0002    | Evidências de fechamento da etapa.                                  |

## Execution Order

### Task-A-0002 — Schema PostgreSQL e contratos derivados

**Batch:** A **Layer:** foundation **Depends on:** none

- Escrever testes que confirmem os schemas de autenticação e tipos derivados de leitura, insert e update.
- Criar as tabelas Better Auth e `app_invite` no schema Drizzle do pacote `database`.
- Derivar e exportar schemas Zod de select, insert e update a partir das tabelas, sem interfaces equivalentes duplicadas.
- Exportar os schemas e tipos pelo entrypoint apropriado sem duplicar interfaces em `apps/ui`.
- Gerar a migração PostgreSQL usando o fluxo oficial do pacote `database`.
- Validar a migração em PostgreSQL de teste e registrar o contrato de `TEST_DATABASE_URL`.

**Deliverable:** schema e migração PostgreSQL disponíveis para o runtime de autenticação.

### Task-B-0002 — Better Auth, convite e autorização

**Batch:** B **Layer:** core **Depends on:** Task-A-0002

- Escrever testes para sessão válida, sessão expirada, convite inválido, convite expirado, convite reutilizado e consumo concorrente.
- Adicionar `better-auth` e `@better-auth/drizzle-adapter` ao `apps/ui`.
- Configurar `drizzleAdapter(db, { provider: "pg", schema })` usando os exports do pacote `database`.
- Configurar `tanstackStartCookies()` como último plugin do Better Auth.
- Montar `apps/ui/src/routes/api/auth/$.ts` com handlers server-side `GET` e `POST` delegando para `auth.handler(request)`.
- Implementar `acceptInvite` com token de bootstrap ou convite administrativo, hash persistido e consumo atômico.
- Implementar `createInvite` com autorização `admin`, papel `admin|viewer` e rejeição de convite válido duplicado por email.
- Implementar resolução de sessão e `requireRole("admin")` sem expor segredos ao client.
- Validar redaction dos erros de auth e uso exclusivo de `TEST_DATABASE_URL` nos testes de integração.

**Deliverable:** sessão persistida, bootstrap por convite e autorização server-side testados.

### Task-C-0002 — Contexto server-side e `getRuntimeStatus`

**Batch:** C **Layer:** core **Depends on:** Task-B-0002

- Escrever testes para `UNAUTHENTICATED`, `FORBIDDEN`, `INTERNAL` e sucesso autenticado.
- Criar a composição server-only mínima para auth, logger redacted e dependências injetáveis.
- Declarar `getRuntimeStatus` com `createServerFn({ method: "GET" }).validator(...).handler(...)`, exigindo papel `admin` e retornando apenas `RuntimeStatus` público.
- Definir a união de resultado e catálogo de erros conforme a spec.
- Adicionar logging estruturado com somente `event`, `errorCode`, `requestId`, `userId` opcional e `durationMs`.

**Deliverable:** server function independente do HTTP completo, com contrato de sucesso/erro e testes unitários.

### Task-D-0002 — Rota protegida, loader e Query

**Batch:** D **Layer:** surface **Depends on:** Task-C-0002

- Escrever testes de redirecionamento para `/login?returnTo=...`, loading, erro, sucesso e chamada única da query.
- Configurar o provider de TanStack Query no root do `apps/ui`.
- Criar a rota pública de login/convite sem dados administrativos.
- Criar o layout protegido cujo loader chama uma server function `getSession` e apenas valida sessão/redireciona anônimos.
- Criar a query `runtime-status` que chama somente `getRuntimeStatus`.
- Exibir loading, erro e `RuntimeStatus.ok` sem inventar estado saudável.

**Deliverable:** fluxo completo admin: rota protegida → Query → server function → status.

### Task-E-0002 — Boundary guard e fechamento TDD

**Batch:** E **Layer:** final **Depends on:** Task-D-0002

- Escrever testes que detectem referências à API legada do `apps/server`, provider clients e imports server-only no client, sem rejeitar APIs REST próprias em `apps/ui/src/routes/api`.
- Implementar `scripts/check-ui-client-boundary.mjs` retornando exit code diferente de zero quando detectar violação.
- Garantir que o transporte gerado pelo TanStack Start não seja classificado como violação.
- Rodar typecheck, testes da UI, testes Vitest da matriz e build.
- Registrar comandos e resultados em `docs/verification/0002-fundacao-ui-tanstack-start.md`.
- Atualizar a spec com `implemented-by` e status `implemented` somente após revisão limpa.

**Deliverable:** guardas arquiteturais, evidência de DoD e fechamento da Etapa 1.

## Structured Registry

- **Registry:** `docs/jobs/0002-fundacao-ui-tanstack-start/super-plan.json`
- **Progress ledger:** `docs/jobs/0002-fundacao-ui-tanstack-start/progress-ledger.md`
- **Task directories:** `docs/jobs/0002-fundacao-ui-tanstack-start/<task-id>/`
- **Task-local logs:** `docs/jobs/0002-fundacao-ui-tanstack-start/<task-id>/progress.log`
- **Task-local logger:** `docs/jobs/0002-fundacao-ui-tanstack-start/<task-id>/log-task.sh`

## Plan Self-Review

- Spec coverage: casos 1 a 10 estão distribuídos entre Tasks B-E.
- Placeholder scan: nenhum `TODO`, `TBD` ou etapa indefinida.
- Dependency order: A → B → C → D → E, sem ciclos.
- File conflicts: execução sequencial evita conflitos no contexto compartilhado.
- Decomposition readiness: cada task possui testes prévios, deliverable e dependências explícitas.
