# LiteLLM Query Inventory

Inventário de queries SQL que acessam tabelas LiteLLM legadas no
`services/analytics-service`. Referência para migração nos batches 3–4.

## LiteLLM_SpendLogs

**Diretório principal:** `services/analytics-service/src/queries/`

| Arquivo | Funções | Operações |
|---------|---------|-----------|
| `analytics-queries.ts` | `getMetricsSummary`, `getPerformanceMetrics`, `getCostEfficiencyByModel` | SELECT |
| `spend-queries.ts` | `getSpendByModel`, `getSpendLogs`, `getSpendLogsCount`, `getSpendByUser`, `getSpendByKey`, `getSpendLogById` | SELECT |
| `trend-queries.ts` | `getDailySpendTrend`, `getDailyTokenTrend`, `getHourlySpendTrend`, `getHourlyUsagePatterns` | SELECT |
| `distribution-queries.ts` | `getTokenDistribution`, `getApiKeyDetailedStats`, `getModelRequestDistribution`, `getTopModelsByRequests` | SELECT |
| `monitor-queries.ts` | `getErrorsSince`, `getErrorCountByModelSince`, `getModelHealthSince`, `getStuckRequests`, `getSpendAnomaliesSince`, `getSpendByModelSince`, `getNonSuccessLogsSince`, `getNonSuccessCountByModelSince`, `getLowThroughputRequestsSince` | SELECT (JOIN com `LiteLLM_ErrorLogs` em 2 funções) |
| `error-queries.ts` | `getErrorLogs` | SELECT (JOIN com `LiteLLM_ErrorLogs`) |
| `model-queries.ts` | `getModelStatistics`, `mergeModels`, `deleteModelLogs`, `getDailySpendTrendByModel`, `getDailyTokenTrendByModel`, `getHourlyUsageByModel`, `getDailyLatencyTrendByModel`, `getErrorBreakdownByModel`, `getDailyErrorTrendByModel`, `getTopUsersByModel`, `getTopApiKeysByModel`, `getModelCacheHitRateByModel`, `getModelTTFTPercentilesByModel`, `getModelStatusDistributionByModel`, `getModelProviderBreakdownByModel` | SELECT, UPDATE, DELETE |
| `time-buckets.ts` | `getSpendLogsDateRange` (interno) | SELECT MIN/MAX |

**Total:** ~11 arquivos, ~45 funções exportadas.

## LiteLLM_Config

| Arquivo | Funções | Operações |
|---------|---------|-----------|
| `router-queries.ts` | `getRouterSettings`, `updateRouterSettings` | SELECT, INSERT |
| `credential-settings-queries.ts` | `getDefaultCredential`, `setDefaultCredential` | SELECT, DELETE, INSERT |
| `health-check-settings-queries.ts` | `getHealthCheckPrompt` | SELECT |

**Uso indireto:** `data-source/routing-methods.ts` lê/escreve aliases via `getRouterSettings` / `updateRouterSettings`.

**Total:** 3 arquivos de queries + 1 data-source, 5 funções exportadas.

## LiteLLM_CredentialsTable

| Arquivo | Funções | Operações |
|---------|---------|-----------|
| `key-queries.ts` | `getAllCredentials` | SELECT |

**Total:** 1 arquivo, 1 função exportada.

## LiteLLM_ProxyModelTable

| Arquivo | Funções | Operações |
|---------|---------|-----------|
| `model-queries.ts` | `getModelDetails`, `getAllModels`, `createModel`, `updateModel`, `deleteModel` | SELECT, INSERT, UPDATE, DELETE |

Coluna `litellm_params` acessada em `getModelDetails`, `getAllModels`, `createModel`, `updateModel`.

**Total:** 1 arquivo, 5 funções exportadas (CRUD + leitura de `litellm_params`).

## Notas de migração

- `litellmParams` permanece sem renomear neste inventário (deferido ao Batch 4).
- `LiteLLM_ErrorLogs` aparece em JOINs de `monitor-queries.ts` e `error-queries.ts` mas não faz parte deste inventário.
- Destino planejado: `model_proxy_requests` + `model_proxy_models` + `model_proxy_credentials` (Batch 4).
