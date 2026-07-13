# Task-B-1 Phase 6 Review

## 1. Status: NEEDS_FIX

Apenas `apps/ui/src/server/auth/test-setup.ts` existe. Nenhum dos demais deliveráveis de Task-B-1 foi produzido: instância Better Auth, rotas catch-all, lógica de convite/admin, sessão/regra de acesso ou testes de integração. O dependente Task-C-1/D-1 está bloqueado por isso.

## 2. Remaining deliverables / files to create

- `apps/ui/src/server/auth/auth.ts` — Better Auth instance: `drizzleAdapter` com `provider: "pg"`/`schema` do database, plugins `admin`, `organization` (se exigido) e `tanstackStartCookies()` como last plugin.
- `apps/ui/src/routes/api/auth/$.ts` — catch-all `GET/POST` invocando `auth.handler(request)`.
- `apps/ui/src/server/auth/invite.server.ts` — `createInvite`/`acceptInvite` server functions + `InviteResult`.
- `apps/ui/src/server/auth/session.server.ts` — `requireSession` e `requireRole` helpers baseados em `auth.api.getSession({ headers })`.
- `apps/ui/src/server/auth/*.test.ts` — integration tests para convite, sessão, role, exclusão duplicada, expiry e uso único usando `TEST_DATABASE_URL`.
- Atualizar `apps/ui/src/server/auth/test-setup.ts` — ver Defeitos.

## 3. Important answer: accessing Request inside createServerFn

Em `@tanstack/react-start/server`, use `getRequest()` dentro do handler de `createServerFn` para obter a `Request` atual.

```ts
import { createServerFn } from "@tanstack/react-start";
import { getRequest, getHeaders } from "@tanstack/react-start/server";

export const getSessionFn = createServerFn({ method: "GET" }).handler(
  async () => {
    const request = getRequest(); // Request original do VINXI/TanStack Start
    const session = await auth.api.getSession({ headers: request.headers });
    return session;
  },
);
```

Para passar para `betterAuth.getSession(request)`, use exatamente o objeto `request` acima. Se better-auth exigir apenas headers, `getHeaders()` é suficiente; mas o padrão seguro é `getRequest()`.

## 4. Defects in existing `test-setup.ts`

- **Caminho de migração errado**: `resolve(__dirname, "../../../../../../database/drizzle")` resolvido a partir de `apps/ui/src/server/auth` aponta para fora da árvore de worktree. O caminho deve ser relativo a repo root, ex. `resolve(process.cwd(), "database/drizzle")` ou `resolve(import.meta.dirname, "../../../../../database/drizzle")` (verificar contagem real de subidas).
- **Sobrevivência de migrações**: re-executa `migrate()` e `TRUNCATE` sem garantir `TEST_DATABASE_URL` apontar para DB isolado; isso é aceitável desde que a variável seja forçada por setup de teste.
- **Não fecha pool em caso de erro**: se `migrate` ou `TRUNCATE` falhar, o pool fica aberto.
- **Falta exportar helper de auth**: `test-setup.ts` provavelmente deveria prover uma factory de `auth` para testes de integração, permitindo que testes batam contra o mesmo adapter sem duplicar config.

## 5. Recommendation: redispatch

Sim, redespachar para implementer com instrução crítica:

> “Implemente Task-B-1 inteiro a partir do zero: (1) `auth.ts` usando `drizzleAdapter(provider: "pg", schema)` e `tanstackStartCookies()` como último plugin; (2) rota catch-all `apps/ui/src/routes/api/auth/$.ts` com `GET/POST` para `auth.handler(request)` e `APIRoute` de TanStack Start; (3) `invite.server.ts` e `session.server.ts` com server functions validadas por Zod; (4) testes de integração usando `TEST_DATABASE_URL` e corrigindo `test-setup.ts` para resolver `database/drizzle` a partir do repo root; (5) valide com `cd apps/ui && pnpm test` e `pnpm typecheck`. Use `getRequest()` de `@tanstack/react-start/server` para obter headers/session.”
