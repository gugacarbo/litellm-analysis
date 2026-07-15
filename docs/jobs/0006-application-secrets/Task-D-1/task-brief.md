> **Process:** `super-planning` — generated from `super-plan.json` by the active super-planning helper.

# Task Brief: Task-D-1: Integrar, validar e fechar a entrega de segredos

| Field        | Value                     |
| ------------ | ------------------------- |
| ID           | `Task-D-1`                |
| Status       | ⏳ pending                |
| Profile      | general → generalExecutor |
| Layer        | final                     |
| Batch        | D                         |
| Try Count    | 1                         |
| Dependencies | `Task-B-1`, `Task-C-1`    |

Executar os gates focados e globais, conferir documentação/artefatos gerados, validar a remoção de env e preparar evidência de encerramento sem alterar contratos fora de escopo.

### Acceptance Criteria

- [ ] All focused schema, service, UI and sync tests pass together.
- [ ] pnpm typecheck and pnpm verify -c pass or any pre-existing failure is documented with unrelated evidence.
- [ ] docs-check reports zero errors and the generated index includes SPEC-0006.
- [ ] The scoped environment-variable search is empty while legacy public codes remain covered by route tests.
- [ ] The task report records commands, results, migration path and controlled-environment human review required before closure.

### Requirements

- `REQ-001`
- `REQ-002`
- `REQ-003`
- `REQ-004`
- `REQ-005`

### Rules

- Do not mark implementation tasks completed; that is orchestrator-owned after batch review.
- Do not broaden scope to key rotation, fallback or provider credential migration.
- Preserve user-owned changes outside this plan's file scopes.
- Record actual command output and unresolved conditions in the task report.

### Steps

**Step 1: Executar a matriz focada**

Rodar os quatro grupos de teste definidos pela spec após B e C estarem revisados.

```sh
pnpm --filter ui exec vitest run src/features/model-admin/secrets/secrets-page.test.tsx src/features/model-admin/server/application-secrets.handlers.test.ts
```

**Expected result:** A matriz focada passa sem exibir segredos.

**Step 2: Verificar contratos globais**

Rodar typecheck, quick verify, docs-check e busca escopada de variáveis removidas.

```sh
pnpm verify -c
```

**Expected result:** Validação rápida passa ou falhas externas são registradas com escopo comprovado.

**Step 3: Registrar evidência de handoff**

Documentar migration, comandos, resultados e a necessidade de cadastro controlado de chaves reais.

```sh
scripts/docs-check --emit-index
```

**Expected result:** Índices e documentação permanecem sem erros.

### Files

**Modified:**

- `docs/specs/0006-application-secrets-spec.md`
- `docs/index.json`
- `docs/specs/README.md`

### Notes

- Human review with real credentials is a release gate, not an automated test.

---
