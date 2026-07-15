> **Process:** `super-planning` — generated from `super-plan.json` by the active super-planning helper.

# Task Brief: Task-A-1: Criar armazenamento e serviço de segredos de aplicação

| Field | Value |
|-------|-------|
| ID | `Task-A-1` |
| Status | ⏳ pending |
| Profile | deep → deepExecutor |
| Layer | foundation |
| Batch | A |
| Try Count | 1 |
| Dependencies | _None_ |

Implementar application_secrets_store, migration gerada, repositório Drizzle e ApplicationSecretsService allowlisted com envelope cifrado e DTOs sem segredo.

### Acceptance Criteria

- [ ] application_secrets_store has a unique key and non-null credential_envelope in its Drizzle contract and generated migration.
- [ ] Only artificial_analysis_api_key and openrouter_api_key can be written or resolved.
- [ ] Writes persist AES-256-GCM envelopes and public reads expose only key, isConfigured and timestamps.
- [ ] Missing or malformed stored values fail closed without returning plaintext or crypto material.
- [ ] Focused schema and service tests show RED before implementation and GREEN after it.

### Requirements

- `REQ-001`
- `REQ-002`
- `REQ-003`

### Rules

- TDD required for this behavior-changing task.
- Read docs/context/testing-anti-patterns.md before adding mocks, fakes, fixtures, or test-only helpers.
- Reuse APP_ENCRYPTION_KEY envelope behavior; never log or return plaintext, ciphertext, IV, tag or fingerprints.
- Generate migrations from the Drizzle schema rather than writing SQL by hand.
- Report RED and GREEN commands and results in the task report.

### Steps

**Step 1: Adicionar testes RED de schema e serviço**

Criar os testes de contrato e serviço para allowlist, envelope, metadata-only e fail-closed antes do código.

```sh
pnpm exec vitest run database/src/schema/model-proxy/schema-contract.test.ts
```

**Expected result:** Os novos casos falham porque a tabela e o serviço ainda não existem.

**Step 2: Implementar schema, migration e serviço**

Criar tabela, exports, migration gerada, repositório e ApplicationSecretsService com DTO público e resolvedor interno.

```sh
pnpm --filter @lite-llm/database db:generate
```

**Expected result:** Migration é gerada a partir de application_secrets_store.

**Step 3: Executar testes GREEN focados**

Rodar os testes novos de schema e serviço e confirmar ausência de valores em retornos públicos.

```sh
pnpm --filter @lite-llm/llm-config-service exec vitest run src/services/__tests__/application-secrets.service.test.ts
```

**Expected result:** Todos os testes focados passam.

### Files

**Created:**

- `database/src/schema/application-secrets.ts`
- `services/llm-config-service/src/repositories/application-secrets-repository.ts`
- `services/llm-config-service/src/services/application-secrets.service.ts`
- `services/llm-config-service/src/services/__tests__/application-secrets.service.test.ts`

**Modified:**

- `database/src/schema/index.ts`
- `database/src/schema/model-proxy/schema-contract.test.ts`
- `services/llm-config-service/src/index.ts`
- `services/llm-config-service/src/factory.ts`

### Notes

- The physical database table must be named application_secrets_store exactly.

---

