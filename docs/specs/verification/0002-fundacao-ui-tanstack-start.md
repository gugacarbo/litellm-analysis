# Verification: 0002-fundacao-ui-tanstack-start

> Evidências de fechamento da Etapa 1 — Fundação server-side do apps/ui

## Definition of Done

```bash
# 1. Boundary guard
node scripts/check-ui-client-boundary.mjs
# ✅ UI Client Boundary: no violations found

# 2. Typecheck
cd apps/ui && npx tsc --noEmit
# ✅ (exit 0)

# 3. Testes unitários (excluindo integração que requer TEST_DATABASE_URL)
cd apps/ui && npx vitest run --exclude '**/invites.test.ts'
# ✅ 10 passed (runtime-status: 4, protected route: 6)

# 4. Teste do boundary guard
npx vitest run scripts/check-ui-client-boundary.test.ts
# ✅ 4 passed

# 5. Testes de integração (requerem TEST_DATABASE_URL)
cd apps/ui && TEST_DATABASE_URL=... npx vitest run src/server/auth/invites.test.ts
# ⏳ Requer PostgreSQL de teste configurado
```

## Resultados

| Verificação                 | Status                     | Comando                                                   |
| --------------------------- | -------------------------- | --------------------------------------------------------- |
| Boundary guard              | ✅                          | `node scripts/check-ui-client-boundary.mjs`               |
| Typecheck                   | ✅                          | `npx tsc --noEmit`                                        |
| Testes unitários (10)       | ✅                          | `npx vitest run --exclude '**/invites.test.ts'`           |
| Teste boundary guard (4)    | ✅                          | `npx vitest run scripts/check-ui-client-boundary.test.ts` |
| Testes integração auth (12) | ⏳ Requer TEST_DATABASE_URL | `npx vitest run src/server/auth/invites.test.ts`          |

## Arquivos criados/modificados

### Task A-1 (Schema)
- `database/src/schema/app/auth.ts` — Tabelas Drizzle
- `database/src/schema/app/auth.schemas.ts` — Schemas Zod
- `database/src/schema/app/index.ts` — Exports
- `database/drizzle/` — Migração PostgreSQL

### Task B-1 (Auth)
- `apps/ui/src/server/auth/auth.ts` — Better Auth singleton
- `apps/ui/src/server/auth/invites.ts` — Sessão, convite, autorização
- `apps/ui/src/server/auth/invites.test.ts` — Testes de integração
- `apps/ui/src/server/auth/test-setup.ts` — Setup de testes
- `apps/ui/src/routes/api/auth/$.ts` — Catch-all Better Auth

### Task C-1 (Server context)
- `apps/ui/src/server/context.ts` — Server context factory
- `apps/ui/src/server/runtime-status.functions.ts` — Server function
- `apps/ui/src/server/runtime-status.test.ts` — Testes unitários

### Task D-1 (Rotas)
- `apps/ui/src/routes/login.tsx` — Login + fluxo de invite
- `apps/ui/src/routes/_protected.tsx` — Layout protegido
- `apps/ui/src/routes/_protected/index.tsx` — Dashboard protegido
- `apps/ui/src/routes/api/auth/accept-invite.ts` — API de aceite de convite
- `apps/ui/src/routes/-_protected.test.ts` — Testes de rota

### Task E-1 (Boundary)
- `scripts/check-ui-client-boundary.mjs` — Guarda arquitetural
- `scripts/check-ui-client-boundary.test.ts` — Testes da guarda
