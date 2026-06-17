# Batch 4: Field Mapping — LiteLLM_SpendLogs + LiteLLM_ErrorLogs → model_proxy_requests

Canonical reference for SA-5A legacy spend adapter and historical import. Source of
truth for **new writes**: native columns on `model_proxy_requests` only — no legacy
shim columns. Messages land in `model_proxy_messages` when normalized; import may
also rely on relation hydration for API presenter.

**Prisma target:** [`repositories/model-proxy-repository/prisma/schema.prisma`](../repositories/model-proxy-repository/prisma/schema.prisma)  
**LiteLLM source:** [`repositories/litellm-repository/prisma/schema.prisma`](../repositories/litellm-repository/prisma/schema.prisma)

## Naming conventions

| Layer | Convention | Example |
|-------|------------|---------|
| LiteLLM DB columns | `camelCase` in Prisma (`startTime`) | `prompt_tokens` mixed in SQL |
| Import adapter (internal) | `camelCase` Prisma fields | `upstreamModel` |
| API `ProxyRequestLog` | `snake_case` | `upstream_model` |

## Import identity rule

```
model_proxy_requests.id  ←  LiteLLM_SpendLogs.request_id   (string, preserved)
```

- **Não** gerar novo `cuid()` no import histórico.
- `LiteLLM_ErrorLogs.request_id` faz join lógico na mesma PK ao popular `error_*`.
- `upstream_request_id` permanece `null` no import (reservado para IDs do provider upstream em requests novas do ledger).

Idempotência: skip se row existe e não foi criada por import (`error_details` sem
`source: "litellm-import"` ou `status` terminal do ledger).

---

## LiteLLM_SpendLogs → model_proxy_requests

### Mapped (native columns)

| LiteLLM_SpendLogs | Prisma `ModelProxyRequest` | API `ProxyRequestLog` | Conversion notes |
|-------------------|----------------------------|----------------------|------------------|
| `request_id` | `id` | `id` | **PK preservada**; ver regra acima |
| — | `upstreamRequestId` | — | `null` no import |
| `model` | `model` | `model` | Default `""` → manter string vazia ou `"unknown"` se política de validação exigir |
| `litellm_model_name`¹ | `upstreamModel` | `upstream_model` | Fallback: `model` quando ErrorLogs ausente |
| `api_base` | `upstreamBaseUrl` | `upstream_base_url` | Default `""` → `""` |
| `status` | `status` | `status` | Map: `success`→`success`, failure-like→`failed`, pending/null+sem end→`started`; ver tabela de status |
| `startTime` | `startedAt` | `started_at` | UTC |
| `endTime` | `finishedAt` | `finished_at` | Nullable se request incompleta |
| `request_duration_ms` | `latencyMs` | `latency_ms` | Se null: `EXTRACT(EPOCH FROM (endTime - startTime)) * 1000` |
| `completionStartTime`² | `ttftMs` | `ttft_ms` | `EXTRACT(EPOCH FROM (completionStartTime - startTime)) * 1000` quando presente |
| `prompt_tokens` | `inputTokens` | `input_tokens` | |
| `completion_tokens` | `outputTokens` | `output_tokens` | |
| `total_tokens` | `totalTokens` | `total_tokens` | Se 0 e sem breakdown: ver flags estimados |
| — | `cachedTokens` | `cached_tokens` | De `metadata` / `provider_usage` se existir; senão `0` ou `null` |
| — | `reasoningTokens` | `reasoning_tokens` | De `metadata` se existir; senão `null` |
| (derivado) | `usageEstimated` | `usage_estimated` | `true` se tokens ausentes ou só `total_tokens` sem breakdown confiável |
| (registry snapshot) | `inputCostPerToken` | `input_cost_per_token` | Lookup `model_proxy_models` por `model` na data do import |
| (registry snapshot) | `outputCostPerToken` | `output_cost_per_token` | Idem |
| (calculado) | `inputCost` | `input_cost` | `input_tokens * input_cost_per_token` quando rates disponíveis |
| (calculado) | `outputCost` | `output_cost` | `output_tokens * output_cost_per_token` |
| `spend` | `totalCost` | `total_cost` | Direto; se 0 com tokens: calcular ou marcar estimado |
| (derivado) | `costEstimated` | `cost_estimated` | `true` se `usage_estimated` ou `spend` ausente com tokens |
| (fallback) | `estimatedCostUsd` | `estimated_cost_usd` | Só se `total_cost` null e estimativa aplicada |
| `proxy_server_request` | `requestBody` | `request_body` | Aplicar `payload-redactor` no import |
| `response` | `responseBody` | `response_body` | Redigir |
| — | `responseHeaders` | `response_headers` | `null` no import (LiteLLM não persiste) |

¹ `litellm_model_name` vem de `LiteLLM_ErrorLogs` quando spend row não tem upstream explícito; senão inferir de `model` / `model_group` só para `upstreamModel`, **sem** coluna `model_group` no destino.

² LiteLLM não tem coluna `time_to_first_token_ms`; TTFT é derivado de `completionStartTime`.

### Status mapping (import)

| LiteLLM `status` / heurística | `model_proxy_requests.status` |
|------------------------------|-------------------------------|
| `success`, null com `endTime` e sem erro | `success` |
| `failure`, `error`, non-2xx em ErrorLogs | `failed` |
| `timeout` | `timeout` |
| sem `endTime`, idade > threshold | `started` (stuck) ou `failed` se ErrorLogs |
| cancelamento explícito em metadata | `cancelled` |

### Messages

| LiteLLM_SpendLogs | Prisma | Notes |
|-----------------|--------|-------|
| `messages` (JSON) | `ModelProxyMessage[]` | Parse array; `requestId` = `id`; `role` + `content` por item; ignorar campos extras ou guardar em `content` JSON |

Presenter API agrega `messages` a partir da relação; não há coluna `messages` em
`model_proxy_requests` no schema atual.

---

## LiteLLM_ErrorLogs → colunas `error_*` (mesma row)

Join: `LiteLLM_ErrorLogs.request_id = LiteLLM_SpendLogs.request_id` (mesmo valor
que `model_proxy_requests.id`).

| LiteLLM_ErrorLogs | Prisma `ModelProxyRequest` | API field | Notes |
|-------------------|----------------------------|-----------|-------|
| `exception_type` | `errorType` | `error_type` | |
| `exception_string` | `errorMessage` | `error_message` | Truncar como `trimErrorMessage` |
| `status_code` | `errorStatusCode` | `error_status_code` | `parseInt`; inválido → `null` |
| (derivado) | `errorSummary` | `error_summary` | Primeiros ~120 chars de `exception_string` |
| `request_kwargs`, `model_id`, etc. | `errorDetails` | `error_details` | JSON: `{ source: "litellm-import", request_kwargs, litellm_model_name, model_group, model_id, api_base }` |

Quando só ErrorLogs existe sem SpendLog correspondente: **criar** row mínima em
`model_proxy_requests` com `status = failed`, `startedAt`/`finishedAt` de ErrorLogs,
`model` de `model_group` ou `litellm_model_name`.

Erros em requests `success` no spend: preferir spend; anexar warning em
`error_details` se ErrorLogs orphan existir.

---

## LiteLLM_SpendLogs — explicit DROP (no native column)

Estes campos **não** são persistidos em `model_proxy_requests` nem reexportados
no contrato `ProxyRequestLog`. Dados auditáveis opcionais podem ir apenas em
`error_details` / metadata de import quando estritamente necessário para suporte.

| LiteLLM_SpendLogs | Destino Batch 4 |
|-------------------|-----------------|
| `call_type` | DROP |
| `api_key` | DROP |
| `user` | DROP |
| `team_id` | DROP |
| `organization_id` | DROP |
| `end_user` | DROP |
| `metadata` | DROP (exceto chaves de tokens em `cached_tokens`/`reasoning_tokens` se mapeáveis) |
| `cache_hit` | DROP — usar `cached_tokens` |
| `cache_key` | DROP |
| `request_tags` | DROP |
| `requester_ip_address` | DROP |
| `session_id` | DROP |
| `agent_id` | DROP |
| `mcp_namespaced_tool_name` | DROP |
| `model_id` | DROP (opcional cópia em `error_details`) |
| `model_group` | DROP (opcional cópia em `error_details`) |
| `custom_llm_provider` | DROP — provider via registry `owned_by` |

---

## Colunas proxy sem fonte LiteLLM direta

| Prisma column | Import default |
|---------------|----------------|
| `upstreamRequestId` | `null` |
| `cachedTokens` | `0` ou parse metadata |
| `reasoningTokens` | `null` |
| `usageEstimated` | heurística § Mapped |
| `costEstimated` | heurística § Mapped |
| `inputCostPerToken` / `outputCostPerToken` | snapshot registry ou `null` |
| `estimatedCostUsd` | `null` unless fallback cost |
| `responseHeaders` | `null` |

---

## model_proxy_import_jobs (auditoria)

Cada execução `pnpm model-proxy:import-history` registra:

| Campo | Valor típico |
|-------|----------------|
| `source` | `litellm-spend` \| `litellm-errors` \| `cloud-sync` |
| `status` | `running` → `completed` \| `failed` |
| `summary` | `{ imported, skipped, errors }` |

---

## Conversion rules (summary)

1. **PK:** `id = request_id` (SpendLogs); nunca auto-gerar no import histórico.
2. **Tokens:** `prompt_tokens`→`inputTokens`, `completion_tokens`→`outputTokens`.
3. **Custo:** `spend`→`totalCost`; decompor com rates do registry quando possível.
4. **TTFT:** derivar de `completionStartTime - startTime` → `ttftMs`.
5. **Latência:** `request_duration_ms` ou delta `endTime - startTime`.
6. **Erro:** merge ErrorLogs → `error_*`; não manter tabela separada.
7. **Payloads:** redigir antes de `requestBody` / `responseBody`.
8. **Messages:** normalizar JSON → rows `model_proxy_messages`.
9. **Skip:** row ledger existente com terminal status e sem marker import.

---

## References

- Batch 4 RFC: [`batch-4-decisions.md`](./batch-4-decisions.md)
- Batch 3 import pattern: [`batch-3-legacy-import.md`](./batch-3-legacy-import.md)
- Ledger write shape: [`services/model-proxy-service/src/logging/request-ledger.ts`](../services/model-proxy-service/src/logging/request-ledger.ts)
- Redactor: [`services/model-proxy-service/src/logging/payload-redactor.ts`](../services/model-proxy-service/src/logging/payload-redactor.ts)
- LiteLLM spend SQL (TTFT): [`services/analytics-service/src/queries/spend-queries.ts`](../services/analytics-service/src/queries/spend-queries.ts)
