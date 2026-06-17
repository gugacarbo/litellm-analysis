# Plano Batch 1 (restante) + Batch 2 (ledger)

## Contexto

**Batch 1** está funcionalmente pronto ([`litellm-removal-batch-1-foundation.md`](./litellm-removal-batch-1-foundation.md)): rotas `/v1/*`, schema `model_proxy_*`, `local-proxy`, testes passando. Faltam:

- Inventários das 4 tabelas LiteLLM na documentação (código já mapeado)
- Provider upstream neutro (hoje só `MODEL_PROXY_UPSTREAM_*` + credentials DB em `services/model-proxy-service/src/service.ts`)

**Batch 2** está parcialmente iniciado: ledger inline em `service.ts` (`createRequestRow` / `finishRequest`). Faltam módulos `logging/*`, campos Prisma estendidos, erros estruturados, `timeout`, redação de payloads e `spend_logs_changed` push.

## Ondas de execução

### Onda 0 — Preparação (3 paralelos, sem dependências)

| ID | Entregável |
|----|------------|
| SA-0A | `docs/litellm-query-inventory.md` + checkboxes batch-1 |
| SA-0B | RFC schema provider upstream + draft JSONC/schema |
| SA-0C | `docs/batch-2-schema-gap.md` + draft `migration.sql` |

### Onda 1 — Fundação (4 paralelos, após SA-0C aprovado)

| ID | Entregável |
|----|------------|
| SA-1A | Migration Prisma + `db:generate` |
| SA-1B | `logging/payload-redactor.ts` + testes |
| SA-1C | `logging/usage-extractor.ts` + testes |
| SA-1D | `logging/cost-calculator.ts` + testes |

### Onda 2 — Core (3 paralelos, após SA-1A)

| ID | Entregável |
|----|------------|
| SA-2A | `logging/request-ledger.ts` |
| SA-2B | Timeout (`AbortSignal` + status `timeout`) + erros estruturados upstream |
| SA-2C | `resolver/upstream-provider.ts` + testes (B1-B) |

### Onda 3 — Integração (sequencial)

| ID | Entregável |
|----|------------|
| SA-3A | Refatorar `service.ts` para delegar ao ledger |
| SA-3B | Hook `onRequestFinished` → `spend_logs_changed` em `app-runtime.ts` |

### Onda 4 — Validação (2 paralelos)

| ID | Entregável |
|----|------------|
| SA-4A | Testes: non-stream, stream+TTFT, fail, timeout, cancel, redação, cost snapshot |
| SA-4B | Atualizar checklists batch-1/batch-2; `pnpm test` + typecheck |

## Decisões fechadas

| Decisão | Escolha |
|---------|---------|
| Migration | Adicionar colunas em `model_proxy_requests` (não nova tabela) |
| `estimated_cost_usd` | Manter como alias de `total_cost` |
| DB ausente em prod | Hard fail; dev pode mockar Prisma |
| Timeout default | 120s global (`AbortSignal`) |
| WS | Push no finish; poll LiteLLM coexist até Batch 4 |

## Critérios de pronto

**Batch 1:**

- Inventários documentados e checkboxes marcados
- Provider upstream configurável em `models.jsonc`; `resolveTarget` não depende só de env global

**Batch 2:**

- Toda chamada `/v1/chat/completions` gera registro persistido com status, usage, custo snapshot, payloads redigidos
- `spend_logs_changed` emitido no finish
- `pnpm --filter @lite-llm/model-proxy-service test` + server typecheck passando

## Referências

- [`litellm-removal-batch-1-foundation.md`](./litellm-removal-batch-1-foundation.md)
- [`litellm-removal-batch-2-ledger.md`](./litellm-removal-batch-2-ledger.md)
- [`litellm-removal-migration-plan.md`](./litellm-removal-migration-plan.md)
- [`litellm-query-inventory.md`](./litellm-query-inventory.md)
- [`batch-2-schema-gap.md`](./batch-2-schema-gap.md)
