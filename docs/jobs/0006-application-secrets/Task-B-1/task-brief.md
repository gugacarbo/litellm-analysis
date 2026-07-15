> **Process:** `super-planning` — generated from `super-plan.json` by the active super-planning helper.

# Task Brief: Task-B-1: Resolver segredos no disparo dos sincronizadores

| Field        | Value               |
| ------------ | ------------------- |
| ID           | `Task-B-1`          |
| Status       | ⏳ pending          |
| Profile      | deep → deepExecutor |
| Layer        | core                |
| Batch        | B                   |
| Try Count    | 1                   |
| Dependencies | `Task-A-1`          |

Remover as duas chaves do contrato de ambiente e alterar os syncs de Artificial Analysis e OpenRouter para resolver o valor do banco por disparo, preservando códigos públicos e redigindo falhas do runner.

### Acceptance Criteria

- [ ] ARTIFICIAL_ANALYSIS_API_KEY and OPENROUTER_API_KEY are absent from config schema, app runtime and .env.example.
- [ ] Both sync services resolve their allowlisted secret at each trigger and do not retain a startup value.
- [ ] Missing/corrupt values stop the runner and preserve existing public *_API_KEY_MISSING codes.
- [ ] Runner errors cannot include the resolved secret in status or route responses.
- [ ] Focused RED/GREEN tests cover both syncs, missing secret and runner echo.

### Requirements

- `REQ-003`
- `REQ-004`
- `REQ-005`

### Rules

- TDD required for this behavior-changing task.
- Read docs/context/testing-anti-patterns.md before adding mocks, fakes, fixtures, or test-only helpers.
- Keep ARTIFICIAL_ANALYSIS_API_KEY_MISSING and OPENROUTER_API_KEY_MISSING as public compatibility codes only.
- Do not log, cache or return the resolved plaintext.
- Report RED and GREEN commands and results in the task report.

### Steps

**Step 1: Escrever regressões RED dos syncs**

Cobrir resolução no trigger, ausência, envelope inválido e erro do runner que ecoa a chave.

```sh
pnpm --filter server exec vitest run src/__tests__/benchmark-sync-application-service.test.ts
```

**Expected result:** Os novos cenários falham contra a injeção estática atual.

**Step 2: Migrar runtime e contrato de ambiente**

Remover as variáveis, injetar resolvedor do serviço e tornar o disparo assíncrono/safe onde necessário.

```sh
rg -n 'ARTIFICIAL_ANALYSIS_API_KEY|OPENROUTER_API_KEY' packages/config/src apps/server/src/runtime .env.example
```

**Expected result:** Após a implementação, a busca não encontra contratos de ambiente removidos.

**Step 3: Verificar GREEN e compatibilidade**

Rodar testes focados e conferir códigos públicos de configuração ausente.

```sh
pnpm --filter server exec vitest run src/__tests__/benchmark-sync-application-service.test.ts src/__tests__/openrouter-benchmark-sync-application-service.test.ts
```

**Expected result:** Testes passam e nenhum runner recebe chamada quando a configuração é inválida.

### Files

**Created:**

- `apps/server/src/__tests__/openrouter-benchmark-sync-application-service.test.ts`

**Modified:**

- `packages/config/src/server.ts`
- `.env.example`
- `apps/server/src/runtime/app-runtime.ts`
- `apps/server/src/application/benchmark-sync-application-service.ts`
- `apps/server/src/application/openrouter-benchmark-sync-application-service.ts`
- `apps/server/src/__tests__/benchmark-sync-application-service.test.ts`

### Notes

- This task may start only after Task-A-1 exports the resolver contract.

---
