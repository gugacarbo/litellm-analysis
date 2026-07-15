> **Process:** `super-planning` — generated from `super-plan.json` by the active super-planning helper.

# Task Brief: Task-C-1: Adicionar administração segura de segredos no painel

| Field | Value |
|-------|-------|
| ID | `Task-C-1` |
| Status | ⏳ pending |
| Profile | general → generalExecutor |
| Layer | surface |
| Batch | B |
| Try Count | 1 |
| Dependencies | `Task-A-1` |

Criar rota /models/secrets, server functions, handlers, contracts, query options e UI para admins listar status, salvar/substituir e remover as duas chaves sem expor valores.

### Acceptance Criteria

- [ ] The protected /models/secrets route preloads only metadata and renders the two fixed secret statuses.
- [ ] Unauthenticated and viewer requests fail before the service is created; admin requests can list, save and remove.
- [ ] Inputs accept only the two allowlisted keys and non-empty plaintext, while outputs never contain a secret or envelope.
- [ ] Save and removal invalidate the secrets query and the UI never repopulates a saved value.
- [ ] Focused handler, query and component tests demonstrate RED then GREEN.

### Requirements

- `REQ-002`
- `REQ-005`

### Rules

- TDD required for this behavior-changing task.
- Read docs/context/testing-anti-patterns.md before adding mocks, fakes, fixtures, or test-only helpers.
- Use the existing TanStack Start auth-first lazy import pattern and shadcn, React Hook Form and Zod primitives.
- Viewer must not receive even configuration status.
- Report RED and GREEN commands and results in the task report.

### Steps

**Step 1: Criar testes RED de autorização e UI**

Cobrir sessão ausente, viewer, admin save/remove e ausência de campo preenchido após salvar.

```sh
pnpm --filter ui exec vitest run src/features/model-admin/server/application-secrets.handlers.test.ts
```

**Expected result:** Os novos testes falham porque handlers e funções ainda não existem.

**Step 2: Implementar contrato, handlers e rota**

Adicionar schemas Zod, DTOs públicos, server functions auth-first, query options, página e rota protegida.

```sh
pnpm --filter ui run generate-routes
```

**Expected result:** A rota /models/secrets aparece no route tree gerado.

**Step 3: Rodar testes GREEN do painel**

Executar handlers, query options e componente para confirmar autorização e não exposição.

```sh
pnpm --filter ui exec vitest run src/features/model-admin/secrets/secrets-page.test.tsx src/features/model-admin/server/application-secrets.handlers.test.ts
```

**Expected result:** Todos os testes focados passam.

### Files

**Created:**

- `apps/ui/src/features/model-admin/server/application-secrets.handlers.ts`
- `apps/ui/src/features/model-admin/server/application-secrets.functions.ts`
- `apps/ui/src/features/model-admin/server/application-secrets.handlers.test.ts`
- `apps/ui/src/features/model-admin/secrets/secrets-page.tsx`
- `apps/ui/src/features/model-admin/secrets/secrets-page.test.tsx`
- `apps/ui/src/routes/_protected/models/secrets.tsx`

**Modified:**

- `apps/ui/src/features/model-admin/contracts/model-admin.ts`
- `apps/ui/src/features/model-admin/query/query-options.ts`
- `apps/ui/src/routeTree.gen.ts`

### Notes

- This task consumes ApplicationSecretsService but must not alter Task-A files.

---

