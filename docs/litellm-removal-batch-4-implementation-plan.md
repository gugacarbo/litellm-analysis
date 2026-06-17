# Plano Batch 4 (analytics e histórico)

## Contexto

**Batch 4** migra analytics, `/logs`, dashboard, model detail, error logs e
detectores do monitor de `LiteLLM_SpendLogs` / `LiteLLM_ErrorLogs` para
`model_proxy_requests`, com importação histórica idempotente e modo `hybrid`
para comparação de totais.

Pacote central: `@lite-llm/analytics-service`  
Checklist operacional:
[`litellm-removal-batch-4-analytics-history.md`](./litellm-removal-batch-4-analytics-history.md)

## Ondas de execução

### Onda 0 — Preparação (paralelo)

| ID | Entregável |
|----|------------|
| SA-0A | [`batch-4-decisions.md`](./batch-4-decisions.md) — RFC fechado (`ANALYTICS_DATA_SOURCE`, tolerâncias hybrid, breaking changes) |
| SA-0B | [`batch-4-field-mapping.md`](./batch-4-field-mapping.md) — matriz LiteLLM_SpendLogs ↔ `model_proxy_requests` |
| SA-0C | [`batch-4-query-priority.md`](./batch-4-query-priority.md) — classificação P1–P5 dos 48 métodos |

### Onda 1 — Logs (P1)

| ID | Entregável |
|----|------------|
| SA-1A | `ModelProxyDataSource` skeleton + `createDataSource()` factory |
| SA-1B | `queries/proxy/spend-queries.ts` + `proxy-spend-methods.ts` |
| SA-1C | `presenter/proxy-request-log.ts` — contrato nativo `ProxyRequestLog` |
| SA-1D | `ANALYTICS_DATA_SOURCE` em `packages/config` |

### Onda 2 — Dashboard (P2)

| ID | Entregável |
|----|------------|
| SA-2A | `proxy/analytics-queries.ts`, `proxy/trend-queries.ts`, `proxy/distribution-queries.ts` |
| SA-2B | `proxy-dashboard-methods.ts` wired em `ModelProxyDataSource` |
| SA-2C | NOOP stubs (`getSpendByUser`, `getSpendByKey`, `getApiKeyStats`) |
| SA-2D | Web dashboard hooks normalizados para `ProxyRequestLog` |

### Onda 3 — Model detail, errors, monitor (P3–P5)

| ID | Entregável |
|----|------------|
| SA-3A | `proxy/model-queries.ts` + `proxy-model-methods.ts` (trends, TTFT, cache, provider) |
| SA-3B | `proxy/error-queries.ts` + `proxy-error-methods.ts` |
| SA-3C | `proxy/monitor-queries.ts` + `proxy-monitor-methods.ts` |
| SA-3D | MUT: `mergeModels`, `deleteModelLogs` no schema proxy |

### Onda 4 — UI logs e badges estimados

| ID | Entregável |
|----|------------|
| SA-4A | `/logs` table + detail dialog com `ProxyRequestLog` |
| SA-4B | `log-estimated-badges.tsx` (`usage_estimated`, `cost_estimated`) |
| SA-4C | Model detail logs tab + summary cards |
| SA-4D | Ocultar widgets user/api_key quando NOOP |

### Onda 5 — Import histórico e sync cloud

| ID | Entregável |
|----|------------|
| SA-5A | `legacy-spend-adapter.ts` + `run-history-import.ts` |
| SA-5B | CLI `pnpm model-proxy:import-history` |
| SA-5C | `sync:cloud` import → `model_proxy_requests` (não `LiteLLM_SpendLogs`) |
| SA-5D | `HybridDataSource` com merge P1 + `compareTotals()` |

### Onda 6 — Validação e fechamento (final)

| ID | Entregável |
|----|------------|
| SA-6A | Testes monitor com mock `ModelProxyDataSource`; P5 methods verificados |
| SA-6B | CLI `pnpm analytics:compare-sources` (`HybridDataSource.compareTotals`) |
| SA-6C | `HybridDataSource` delega P2–P5 ao proxy; docs + AGENTS.md; wiring `createDataSource()` |

## Decisões fechadas

| Decisão | Escolha |
|---------|---------|
| Presenter | `ProxyRequestLog` nativo; sem shim `SpendLogEntry` |
| `ANALYTICS_DATA_SOURCE` | `litellm` (default) \| `model-proxy` \| `hybrid` |
| Modo `hybrid` | Ferramenta de transição; P1 merge por `request_id` (proxy ganha); P2–P5 leem proxy |
| User/API key agregações | NOOP `[]` em `model-proxy`; hybrid mantém LiteLLM para NOOP |
| Import histórico | Idempotente por `request_id`; não sobrescreve logs novos |
| Tolerâncias compare | requests/erros exatos; tokens ±0,1%; custo ±1%; latência média inteiro |

## Resultados Onda 6 (2026-06-16)

| Pacote | Testes | Typecheck |
|--------|--------|-----------|
| `@lite-llm/analytics-service` | 32 passed (9 files) | OK |
| `@lite-llm/monitor` | 5 passed (2 files, +2 novos proxy) | OK |
| `server` (apps) | 19 passed | OK |
| `@lite-llm/server` | — | OK |
| **Monorepo (`pnpm test`)** | **32 tasks OK** | — |

Novos artefatos:

- `scripts/src/compare-analytics-sources/index.ts` — `pnpm analytics:compare-sources`
- `packages/monitor/src/services/__tests__/monitor-service-proxy-data-source.test.ts`
- `services/analytics-service/src/data-source/hybrid.test.ts` — delegação P2–P5
- `docs/litellm-removal-batch-4-implementation-plan.md` (este arquivo)

Wiring verificado: `apps/server/src/contexts/analytics-context.ts` →
`createDataSource()` → usado em `app-runtime.ts`, `monitor-runtime.ts`,
`health-check-runtime.ts`.

## Critérios de pronto

- Dashboard funciona com `ANALYTICS_DATA_SOURCE=model-proxy`
- Monitor funciona com `ANALYTICS_DATA_SOURCE=model-proxy`
- Histórico importável via `pnpm model-proxy:import-history`
- `sync:cloud` grava em `model_proxy_requests`
- `pnpm analytics:compare-sources` compara totais na janela escolhida
- Modo `hybrid` é apenas ferramenta de transição/comparação

## Referências

- [`litellm-removal-batch-4-analytics-history.md`](./litellm-removal-batch-4-analytics-history.md)
- [`batch-4-decisions.md`](./batch-4-decisions.md)
- [`batch-4-field-mapping.md`](./batch-4-field-mapping.md)
- [`batch-4-query-priority.md`](./batch-4-query-priority.md)
- [`litellm-removal-migration-plan.md`](./litellm-removal-migration-plan.md)
