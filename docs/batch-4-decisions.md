# Batch 4: decisões fechadas (RFC)

**Status:** fechado (Onda 0)  
**Data:** 2026-06-16  
**Escopo:** analytics, logs, monitor e histórico (`model_proxy_requests`)  
**Pré-requisitos:** Batch 1 (schema + proxy); Batch 2 (ledger); Batch 3 (registry/settings/credentials)

Este RFC fixa as decisões de arquitetura para a Onda 0+ do Batch 4. Mapeamento
campo-a-campo fica em [`batch-4-field-mapping.md`](./batch-4-field-mapping.md)
(SA-0B); prioridade de queries em [`batch-4-query-priority.md`](./batch-4-query-priority.md)
(SA-0C).

**Schema de referência:** [`repositories/model-proxy-repository/prisma/schema.prisma`](../repositories/model-proxy-repository/prisma/schema.prisma)

---

## 1. Contrato nativo `ProxyRequestLog` (sem shim legado)

### Decisão

O contrato público de analytics/logs **não** preserva campos legados de
`SpendLogEntry`. A API expõe **`ProxyRequestLog`** alinhado às colunas nativas de
`model_proxy_requests` + relação `model_proxy_messages`.

| Campo API (`snake_case`) | Origem Prisma | Notas |
|---------------------------|---------------|-------|
| `id` | `id` | PK; import histórico usa `id = LiteLLM.request_id` |
| `model` | `model` | Alias roteado pelo proxy |
| `upstream_model` | `upstreamModel` | Substitui `litellm_model_name` |
| `upstream_base_url` | `upstreamBaseUrl` | Substitui `api_base` |
| `status` | `status` | `started` \| `success` \| `failed` \| `cancelled` \| `timeout` |
| `started_at` | `startedAt` | ISO 8601 |
| `finished_at` | `finishedAt` | ISO 8601; nullable enquanto `started` |
| `latency_ms` | `latencyMs` | Substitui `request_duration_ms` |
| `ttft_ms` | `ttftMs` | Substitui `time_to_first_token_ms` / `completionStartTime` derivado |
| `input_tokens` | `inputTokens` | Substitui `prompt_tokens` |
| `output_tokens` | `outputTokens` | Substitui `completion_tokens` |
| `total_tokens` | `totalTokens` | |
| `cached_tokens` | `cachedTokens` | `> 0` substitui semântica de `cache_hit` |
| `reasoning_tokens` | `reasoningTokens` | |
| `usage_estimated` | `usageEstimated` | Ver §2 |
| `cost_estimated` | `costEstimated` | Ver §2 |
| `input_cost_per_token` | `inputCostPerToken` | Snapshot no momento da request |
| `output_cost_per_token` | `outputCostPerToken` | Snapshot no momento da request |
| `input_cost` | `inputCost` | |
| `output_cost` | `outputCost` | |
| `total_cost` | `totalCost` | Substitui `spend` |
| `estimated_cost_usd` | `estimatedCostUsd` | Reserva para fallback de custo sem rates |
| `error_type` | `errorType` | Inline; sem JOIN `LiteLLM_ErrorLogs` |
| `error_message` | `errorMessage` | |
| `error_status_code` | `errorStatusCode` | |
| `error_summary` | `errorSummary` | Resumo curto para listagens |
| `error_details` | `errorDetails` | JSON estruturado (opcional na API de lista) |
| `request_body` | `requestBody` | Payload redigido; substitui `proxy_server_request` |
| `response_body` | `responseBody` | Substitui `response` |
| `response_headers` | `responseHeaders` | Somente detalhe |
| `messages` | `model_proxy_messages` | `{ role, content }[]` |

### Campos removidos do contrato público

Não são mapeados, reexportados nem preenchidos com placeholders:

`user`, `api_key`, `team_id`, `end_user`, `organization_id`, `cache_hit`,
`cache_key`, `model_group`, `custom_llm_provider`, `metadata`, `request_tags`,
`session_id`, `agent_id`, `model_id`, `call_type`, `mcp_namespaced_tool_name`,
`requester_ip_address`, `completion_start_time`, `spend`, `prompt_tokens`,
`completion_tokens`, `time_to_first_token_ms`, `proxy_server_request`,
`response` (nome legado).

### Compatibilidade de transição

- `SpendLogEntry` permanece no pacote como tipo **deprecated** até o Batch 5;
  **não** há presenter que reintroduz campos legados na resposta nova.
- Rotas HTTP (`/api/spend/*`, `/api/analytics/*`) mantêm paths; payloads mudam
  quando `ANALYTICS_DATA_SOURCE=model-proxy`.
- Web migra na Onda 4 para consumir `ProxyRequestLog` diretamente.

---

## 2. Semântica `usage_estimated` e `cost_estimated` na UI

### Definição (ledger Batch 2)

| Flag | `true` quando | Fonte |
|------|---------------|-------|
| `usage_estimated` | Tokens vieram de estimativa local (provider não retornou usage confiável ou stream sem usage final) | `usage-extractor.ts` |
| `cost_estimated` | Custo calculado sobre usage estimado **ou** rates ausentes no registry no momento da request | `cost-calculator.ts` |

Regra de propagação: `cost_estimated = true` se `usage_estimated = true` ou se
não houver `input_cost_per_token` / `output_cost_per_token` utilizáveis.

### Comportamento na UI (Onda 4)

| Contexto | Comportamento |
|----------|---------------|
| Tabela `/logs` | Badge discreto **"Uso estimado"** quando `usage_estimated`; badge **"Custo estimado"** quando `cost_estimated` (ambos podem aparecer) |
| Detalhe do log | Tooltip explicando que valores podem divergir do billing do provider |
| Dashboard agregado | Totais **incluem** linhas estimadas; opcional filtro futuro `exclude_estimated=1` (fora do MVP Batch 4) |
| Import histórico | Marcar `usage_estimated`/`cost_estimated` quando LiteLLM não tinha tokens/custo; **não** recalcular custo salvo |

### Import

- Registros importados de `LiteLLM_SpendLogs` com `total_tokens = 0` e sem
  breakdown: `usage_estimated = true`.
- `spend = 0` com tokens presentes: `cost_estimated = true` se rates não
  recuperáveis do registry na época do import.

---

## 3. `ANALYTICS_DATA_SOURCE` — modos de leitura

### Decisão

Nova variável em `packages/config` (Onda 1):

| Valor | Default | Comportamento |
|-------|---------|---------------|
| `litellm` | **sim** | `DatabaseDataSource` → `LiteLLM_SpendLogs` / `LiteLLM_ErrorLogs` (comportamento atual) |
| `model-proxy` | não | `ModelProxyDataSource` → `model_proxy_requests` |
| `hybrid` | não | `HybridDataSource`: leitura paralela; **somente** validação/comparação |

Factory (`createDataSource()`):

```ts
switch (env.ANALYTICS_DATA_SOURCE) {
  case "model-proxy":
    return new ModelProxyDataSource();
  case "hybrid":
    return new HybridDataSource(litellm, proxy);
  default:
    return new DatabaseDataSource();
}
```

### Política por modo

| Modo | Produção | Monitor | WebSocket `spend-logs-watcher` |
|------|----------|---------|--------------------------------|
| `litellm` | Sim (default até cutover) | Sim | Poll LiteLLM |
| `model-proxy` | Alvo pós-import | Sim | Poll proxy DB |
| `hybrid` | **Não** — ferramenta de transição | Não recomendado | Não usar em dev estável |

`hybrid` **não** é modo operacional: expõe helper `compareTotals(window)` e
script `pnpm analytics:compare-sources` (Onda 6). Respostas de API em `hybrid`
preferem fonte **proxy** quando o mesmo `id` existe nas duas bases.

---

## 4. Tolerâncias do modo `hybrid` (comparação)

Comparação em janela `[startDate, endDate]` (UTC), mesmos filtros de modelo
quando aplicável.

| Métrica | Tolerância | Notas |
|---------|------------|-------|
| Contagem de requests | **exata** (0 delta) | União por `id` = `request_id`; proxy ganha em conflito |
| Total tokens (`input` + `output`) | ±0,1% ou ±1 token (o maior) | Arredondamentos de import |
| Custo total (`total_cost` / `spend`) | **±1%** | Rates históricos vs snapshot proxy |
| Contagem de erros (`failed` + `timeout`) | exata | Status mapeados na importação |
| Latência agregada (`avg_latency_ms`) | **±0 ms** na comparação reportada | Comparar médias arredondadas a inteiro; divergência > 1 ms → investigar, não falhar gate |
| TTFT agregado | mesma regra de latência | Usar `ttft_ms` proxy vs `completionStartTime - startTime` LiteLLM |

Gate de cutover (Onda 6): todas as métricas acima dentro da tolerância na
janela de validação escolhida (sugestão: últimos 7 dias + amostra de histórico
importado).

---

## 5. Breaking changes documentados

### Agregações por usuário e API key removidas

O ledger proxy **não** persiste `user` nem `api_key` (hash). Métodos afetados
retornam **`[]`** em `model-proxy`; rotas podem emitir header
`X-Lite-LLM-Deprecated: user-aggregation` (opcional Onda 2).

| Método | Comportamento `model-proxy` |
|--------|----------------------------|
| `getSpendByUser` | `[]` |
| `getTopUsersByModel` | `[]` |
| `getSpendByKey` | `[]` |
| `getTopApiKeysByModel` | `[]` |
| `getApiKeyStats` | `[]` |

Widgets de dashboard que dependem desses métodos devem **ocultar-se** quando a
resposta for vazia (Onda 4). `ModelStatistics.unique_users` e
`unique_api_keys` passam a `0`.

### Cache hit

- Coluna `cache_hit` removida do contrato.
- Métrica: `SUM(cached_tokens) / NULLIF(SUM(input_tokens), 0)` em
  `getCacheHitRateByModel`.

### Provider breakdown

- `getProviderBreakdownByModel`: agrupar por `upstream_base_url` ou `owned_by` do
  registry (Batch 3), não por `custom_llm_provider`.

### Error logs

- Sem tabela `LiteLLM_ErrorLogs`; erros vêm de `status IN ('failed','timeout')`
  e colunas `error_*` em `model_proxy_requests`.

---

## 6. Delegação ao registry (Batch 3) — fora do escopo de reimplementação SQL

Estes métodos de `AnalyticsDataSource` **não** ganham queries em
`model_proxy_requests`; continuam delegando ao registry-service / settings
(Batch 3):

`getModels`, `getModelDetails`, `createModel`, `updateModel`, `deleteModel`,
`getCredentials`, `getDefaultCredential`, `getHealthCheckPrompt`,
`setDefaultCredential`.

`getAgentRoutingConfig` / `updateAgentRoutingConfig` permanecem em
agents-manager (inalterado neste batch).

---

## 7. Import histórico e `sync:cloud` (referência)

- `id` = `LiteLLM_SpendLogs.request_id` (preservação de identidade).
- Erros de `LiteLLM_ErrorLogs` inlined nas colunas `error_*` da mesma row
  (match por `request_id`).
- Não sobrescrever rows criadas pelo ledger (`status != imported` ou sem marker
  de import).
- Config/Credentials/ProxyModel: reusar `pnpm model-proxy:import-legacy` (Batch 3).
- Detalhes: [`batch-4-field-mapping.md`](./batch-4-field-mapping.md).

---

## 8. Fora de escopo (confirmado)

- Remover `repositories/litellm-repository` (Batch 5)
- Redesign visual do dashboard
- Recalcular custo histórico salvo (apenas marcar `cost_estimated`)
- Coluna `api_key_label` no ledger (opcional pós-Batch 4)

---

## 9. Gates para ondas seguintes

| Gate | Condição |
|------|----------|
| Onda 1 | Este RFC + SA-0B + SA-0C aprovados |
| Onda 6 | Tolerâncias §4 verdes + checklists em [`litellm-removal-batch-4-analytics-history.md`](./litellm-removal-batch-4-analytics-history.md) |

---

## Referências

- Plano Batch 4: `.cursor/plans/batch_4_analytics_plan_f3e26003.plan.md`
- [`batch-4-field-mapping.md`](./batch-4-field-mapping.md)
- [`batch-4-query-priority.md`](./batch-4-query-priority.md)
- [`litellm-query-inventory.md`](./litellm-query-inventory.md)
- [`litellm-removal-batch-2-ledger.md`](./litellm-removal-batch-2-ledger.md)
- [`litellm-removal-batch-3-settings-registry-credentials.md`](./litellm-removal-batch-3-settings-registry-credentials.md)
- Ledger: [`services/model-proxy-service/src/logging/request-ledger.ts`](../services/model-proxy-service/src/logging/request-ledger.ts)
