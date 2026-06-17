# Batch 2 Schema Gap

Auditoria entre o checklist do Batch 2 e o schema Prisma em
`repositories/model-proxy-repository/prisma/schema.prisma`.

## Estado antes da migration

`ModelProxyRequest` tinha campos básicos de ledger:

| Campo existente | Status |
|-----------------|--------|
| `status`, `startedAt`, `finishedAt` | OK |
| `latencyMs`, `ttftMs` | OK |
| `inputTokens`, `outputTokens`, `totalTokens` | OK |
| `estimatedCostUsd` | OK (será alias de `totalCost`) |
| `errorSummary` | OK (legado; complementado por erro estruturado) |
| `requestBody`, `responseBody`, `responseHeaders` | OK |

## Campos faltantes (adicionados na migration `20260616120000_ledger_extended_fields`)

| Campo Prisma | Coluna SQL | Propósito |
|--------------|------------|-----------|
| `cachedTokens` | `cached_tokens` | Tokens de cache (prompt cache hit) |
| `reasoningTokens` | `reasoning_tokens` | Tokens de reasoning quando provider reporta |
| `usageEstimated` | `usage_estimated` | Flag quando usage foi estimado localmente |
| `inputCostPerToken` | `input_cost_per_token` | Snapshot de preço input no momento da request |
| `outputCostPerToken` | `output_cost_per_token` | Snapshot de preço output no momento da request |
| `inputCost` | `input_cost` | Custo decomposto input |
| `outputCost` | `output_cost` | Custo decomposto output |
| `totalCost` | `total_cost` | Custo total calculado |
| `costEstimated` | `cost_estimated` | Flag quando custo depende de usage estimado |
| `errorType` | `error_type` | Tipo de erro estruturado |
| `errorMessage` | `error_message` | Mensagem de erro estruturada |
| `errorStatusCode` | `error_status_code` | HTTP status do upstream |
| `errorDetails` | `error_details` | Detalhes JSON do erro |

## Status finais aceitos

`started` → `success` | `failed` | `cancelled` | `timeout`

## Compatibilidade

- `estimated_cost_usd` continua sendo escrito como alias de `total_cost`.
- `error_summary` mantido para consumidores legados; novos campos estruturados coexistem.

## Migration SQL

Ver `repositories/model-proxy-repository/prisma/migrations/20260616120000_ledger_extended_fields/migration.sql`.
