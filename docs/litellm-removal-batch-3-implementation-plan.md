# Plano Batch 3 (settings, registry e credenciais)

## Contexto

**Batch 3** migra settings operacionais, model registry, credenciais upstream e
API keys locais do schema LiteLLM (`LiteLLM_Config`, `LiteLLM_ProxyModelTable`,
`LiteLLM_CredentialsTable`) para `model_proxy_*`. Analytics/spend permanece no
LiteLLM DB até Batch 4.

Pacote central: `@lite-llm/model-proxy-registry-service`  
Checklist operacional: [`litellm-removal-batch-3-settings-registry-credentials.md`](./litellm-removal-batch-3-settings-registry-credentials.md)

## Ondas de execução

### Onda 0 — Preparação (paralelo)

| ID | Entregável |
|----|------------|
| SA-0A | [`batch-3-decisions.md`](./batch-3-decisions.md) — RFC fechado (secret_ref, API keys, sync states) |
| SA-0B | [`batch-3-field-mapping.md`](./batch-3-field-mapping.md) — matriz `litellmParams` ↔ `ModelRoute` |
| SA-0C | [`batch-3-legacy-import.md`](./batch-3-legacy-import.md) — spec import one-shot |
| SA-0D | Fix ledger double-finish + testes verdes (gate para auth proxy) |

### Onda 1 — Registry service (fundação)

| ID | Entregável |
|----|------------|
| SA-1A | `model-proxy-registry-service`: repositories Prisma (`settings`, `models`, `credentials`, `api_keys`) |
| SA-1B | Services: `SettingsService`, `RegistryModelsService`, `CredentialsService`, `ApiKeysService` |
| SA-1C | `createRegistryServices` factory + `getRegistryPrisma` client |
| SA-1D | Testes unitários por service (mocks in-memory) |

### Onda 2 — Adapters e import legado

| ID | Entregável |
|----|------------|
| SA-2A | `litellm-params-adapter` (`toModelRoute` / `fromModelRoute` / `toModelProxyRow`) |
| SA-2B | `legacy-config-adapter` → `model_proxy_settings` |
| SA-2C | `legacy-credentials-adapter` → `model_proxy_credentials` (+ `deriveSecretRef`) |
| SA-2D | `import-legacy-registry` CLI (`pnpm model-proxy:import-legacy`) |

### Onda 3 — Integração server + proxy

| ID | Entregável |
|----|------------|
| SA-3A | Dual-read helpers (`settings-dual-read`, `models-dual-read`) |
| SA-3B | `registry-models-bridge` + rotas `/models/*` registry-first |
| SA-3C | Rotas `/credentials/default` + router aliases em `model_proxy_settings` |
| SA-3D | Auth proxy: `model_proxy_api_keys` + bootstrap `MODEL_PROXY_API_KEY` |

### Onda 4 — UI e nomenclatura

| ID | Entregável |
|----|------------|
| SA-4A | UI models: `modelRoute`, estados `synced` / `config-only` / `registry-only` |
| SA-4B | API client + sync-batch directions `config-to-registry` / `registry-to-config` |
| SA-4C | Shim `litellmParams` em respostas (deprecated) para transição |

### Onda 5 — Validação e fechamento

| ID | Entregável |
|----|------------|
| SA-5A | Testes integração server: settings roundtrip, registry CRUD, API key auth, sync states |
| SA-5B | `pnpm test` + typecheck (`server`, `analytics-service`, `monitor`, registry-service) |
| SA-5C | Checklists batch-3 marcados + este plano de implementação |

## Decisões fechadas

| Decisão | Escolha |
|---------|---------|
| Credenciais upstream | `secretRef` = nome de env var; sem write de `apiKey` bruto |
| API keys locais | `model_proxy_api_keys` com bcrypt; fallback env só em dev/bootstrap |
| Sync presence | `synced`, `config-only`, `registry-only` (sem `litellm-only` na UI) |
| Dual-write LiteLLM | **Não** — apenas leitura + import one-shot |
| `repositories/litellm-repository` | Mantido neste batch (analytics Batch 4) |

## Resultados Onda 5 (2026-06-16)

| Pacote | Testes | Typecheck |
|--------|--------|-----------|
| `@lite-llm/model-proxy-registry-service` | 50 passed | OK |
| `server` (apps) | 17 passed (7 novos integração) | OK |
| `@lite-llm/server` | — | OK |
| `@lite-llm/analytics-service` | — | OK |
| `@lite-llm/monitor` | 3 passed | OK |
| **Monorepo (`pnpm test`)** | **31 tasks OK** | — |

Testes de integração novos: `apps/server/src/__tests__/registry-integration.test.ts`

## Critérios de pronto

- Novos writes operacionais em `model_proxy_*` (não `LiteLLM_*`)
- Registry substitui `LiteLLM_ProxyModelTable` para modelos novos
- Adapters legados isolados; import CLI documentado
- `pnpm test` verde no monorepo

## Referências

- [`litellm-removal-batch-3-settings-registry-credentials.md`](./litellm-removal-batch-3-settings-registry-credentials.md)
- [`batch-3-decisions.md`](./batch-3-decisions.md)
- [`batch-3-field-mapping.md`](./batch-3-field-mapping.md)
- [`batch-3-legacy-import.md`](./batch-3-legacy-import.md)
- [`litellm-removal-migration-plan.md`](./litellm-removal-migration-plan.md)
