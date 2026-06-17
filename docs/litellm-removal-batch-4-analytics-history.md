# Batch 4: analytics e historico

## Objetivo

Fazer o dashboard e o monitor funcionarem sobre `model_proxy_*`, preservando
historico por importacao. Ao final deste batch, `ANALYTICS_DATA_SOURCE` deve
conseguir apontar para `model-proxy` sem perder `/logs`, graficos, error logs
ou detectores do monitor.

## Checklist de Preparacao

- [x] Confirmar que Batch 2 grava logs suficientes.
- [x] Confirmar que Batch 3 moveu settings/model registry/credenciais novos.
- [x] Listar todos os metodos de `AnalyticsDataSource`.
- [x] Classificar metodos por prioridade:
  - [x] `/logs`;
  - [x] dashboard principal;
  - [x] model detail;
  - [x] errors;
  - [x] monitor.
- [x] Definir contrato de presenter para campos legados ([`batch-4-decisions.md`](./batch-4-decisions.md) §1 — contrato nativo `ProxyRequestLog`, sem shim).
- [x] Definir comportamento de dados estimados ([`batch-4-decisions.md`](./batch-4-decisions.md) §2).
- [x] Definir janela de comparacao com fonte antiga ([`batch-4-decisions.md`](./batch-4-decisions.md) §4 — tolerancias `hybrid`).

**Artefatos Onda 0:** [`batch-4-decisions.md`](./batch-4-decisions.md), [`batch-4-field-mapping.md`](./batch-4-field-mapping.md), [`batch-4-query-priority.md`](./batch-4-query-priority.md).

## Checklist de Implementacao

- [x] Criar implementacao `AnalyticsDataSource` para `model_proxy_*`.
- [x] Criar presenter/mapper para `SpendLogEntry`.
- [x] Mapear `spend`.
- [x] Mapear `api_key`.
- [x] Mapear `proxy_server_request`.
- [x] Mapear `messages`.
- [x] Mapear `response`.
- [x] Mapear `custom_llm_provider`.
- [x] Mapear `model_group`.
- [x] Mapear `time_to_first_token_ms`.
- [x] Mapear `litellm_model_name` quando necessario para compat.
- [x] Implementar `getSpendLogs`.
- [x] Implementar `getSpendLogsCount`.
- [x] Implementar `getSpendLogDetail`.
- [x] Migrar dashboard principal.
- [x] Migrar spend diario e horario.
- [x] Migrar token trends.
- [x] Migrar cost efficiency.
- [x] Migrar distribuicao por modelo.
- [x] Migrar distribuicao por API key.
- [x] Migrar top users por modelo.
- [x] Migrar top API keys por modelo.
- [x] Migrar latencia media.
- [x] Migrar percentis p50/p95/p99.
- [x] Migrar TTFT percentiles.
- [x] Migrar cache hit rate.
- [x] Migrar status distribution.
- [x] Migrar provider breakdown.
- [x] Migrar error breakdown.
- [x] Migrar error trend.
- [x] Migrar `getErrorsSince`.
- [x] Migrar `getNonSuccessCountByModelSince`.
- [x] Migrar `getStuckRequests`.
- [x] Migrar `getModelHealthSince`.
- [x] Implementar `ANALYTICS_DATA_SOURCE=model-proxy`.
- [x] Implementar `ANALYTICS_DATA_SOURCE=hybrid` apenas para comparacao.
- [x] Criar importador historico idempotente.
- [x] Importar `LiteLLM_SpendLogs` para `model_proxy_requests`.
- [x] Importar `LiteLLM_ErrorLogs` para campos de erro.
- [x] Importar `LiteLLM_Config` para `model_proxy_settings`.
- [x] Importar `LiteLLM_CredentialsTable` para `model_proxy_credentials`.
- [x] Importar `LiteLLM_ProxyModelTable` para `model_proxy_models`.
- [x] Registrar execucoes em `model_proxy_import_jobs`.
- [x] Migrar `sync:cloud` para inserir no novo schema.

## Fora de Escopo

- [x] Nao remover pacotes LiteLLM neste batch.
- [x] Nao fazer mudanca visual grande no dashboard neste batch.
- [x] Nao recalcular custo historico salvo, exceto quando dado estiver faltando
  e for marcado como estimado.

## Checklist de Validacao

- [x] `/logs` mostra dados novos do proxy.
- [x] Detalhe de log mostra payload mascarado.
- [x] Detalhe de log mostra mensagens.
- [x] Error logs funcionam sem `LiteLLM_ErrorLogs`.
- [x] Detectores do monitor funcionam sem tabelas LiteLLM.
- [x] Dados importados aparecem nos mesmos graficos dos dados novos.
- [x] Importador preserva `request_id`.
- [x] Importador nao sobrescreve logs novos.
- [ ] Totais de requests batem com a fonte antiga na janela escolhida.
- [ ] Totais de tokens batem com a fonte antiga na janela escolhida.
- [ ] Totais de custo batem com a fonte antiga na janela escolhida.
- [ ] Totais de erro batem com a fonte antiga na janela escolhida.
- [ ] Latencia agregada bate com a fonte antiga dentro da tolerancia definida.

## Checks

- [x] `pnpm --filter @lite-llm/analytics-service typecheck`
- [x] `pnpm --filter @lite-llm/server typecheck`
- [x] `pnpm --filter @lite-llm/monitor typecheck`
- [x] `pnpm test`

## Criterios de Pronto

- [x] Dashboard funciona com `ANALYTICS_DATA_SOURCE=model-proxy`.
- [x] Monitor funciona com `ANALYTICS_DATA_SOURCE=model-proxy`.
- [x] Historico antigo foi importado para o schema novo.
- [x] `sync:cloud` nao escreve mais em `LiteLLM_SpendLogs`.
- [x] Modo `hybrid` e apenas ferramenta de transicao/comparacao.
