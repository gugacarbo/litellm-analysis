# Batch 4: analytics e historico

## Objetivo

Fazer o dashboard e o monitor funcionarem sobre `model_proxy_*`, preservando
historico por importacao. Ao final deste batch, `ANALYTICS_DATA_SOURCE` deve
conseguir apontar para `model-proxy` sem perder `/logs`, graficos, error logs
ou detectores do monitor.

## Checklist de Preparacao

- [ ] Confirmar que Batch 2 grava logs suficientes.
- [ ] Confirmar que Batch 3 moveu settings/model registry/credenciais novos.
- [ ] Listar todos os metodos de `AnalyticsDataSource`.
- [ ] Classificar metodos por prioridade:
  - [ ] `/logs`;
  - [ ] dashboard principal;
  - [ ] model detail;
  - [ ] errors;
  - [ ] monitor.
- [ ] Definir contrato de presenter para campos legados.
- [ ] Definir comportamento de dados estimados.
- [ ] Definir janela de comparacao com fonte antiga.

## Checklist de Implementacao

- [ ] Criar implementacao `AnalyticsDataSource` para `model_proxy_*`.
- [ ] Criar presenter/mapper para `SpendLogEntry`.
- [ ] Mapear `spend`.
- [ ] Mapear `api_key`.
- [ ] Mapear `proxy_server_request`.
- [ ] Mapear `messages`.
- [ ] Mapear `response`.
- [ ] Mapear `custom_llm_provider`.
- [ ] Mapear `model_group`.
- [ ] Mapear `time_to_first_token_ms`.
- [ ] Mapear `litellm_model_name` quando necessario para compat.
- [ ] Implementar `getSpendLogs`.
- [ ] Implementar `getSpendLogsCount`.
- [ ] Implementar `getSpendLogDetail`.
- [ ] Migrar dashboard principal.
- [ ] Migrar spend diario e horario.
- [ ] Migrar token trends.
- [ ] Migrar cost efficiency.
- [ ] Migrar distribuicao por modelo.
- [ ] Migrar distribuicao por API key.
- [ ] Migrar top users por modelo.
- [ ] Migrar top API keys por modelo.
- [ ] Migrar latencia media.
- [ ] Migrar percentis p50/p95/p99.
- [ ] Migrar TTFT percentiles.
- [ ] Migrar cache hit rate.
- [ ] Migrar status distribution.
- [ ] Migrar provider breakdown.
- [ ] Migrar error breakdown.
- [ ] Migrar error trend.
- [ ] Migrar `getErrorsSince`.
- [ ] Migrar `getNonSuccessCountByModelSince`.
- [ ] Migrar `getStuckRequests`.
- [ ] Migrar `getModelHealthSince`.
- [ ] Implementar `ANALYTICS_DATA_SOURCE=model-proxy`.
- [ ] Implementar `ANALYTICS_DATA_SOURCE=hybrid` apenas para comparacao.
- [ ] Criar importador historico idempotente.
- [ ] Importar `LiteLLM_SpendLogs` para `model_proxy_requests`.
- [ ] Importar `LiteLLM_ErrorLogs` para campos de erro.
- [ ] Importar `LiteLLM_Config` para `model_proxy_settings`.
- [ ] Importar `LiteLLM_CredentialsTable` para `model_proxy_credentials`.
- [ ] Importar `LiteLLM_ProxyModelTable` para `model_proxy_models`.
- [ ] Registrar execucoes em `model_proxy_import_jobs`.
- [ ] Migrar `sync:cloud` para inserir no novo schema.

## Fora de Escopo

- [ ] Nao remover pacotes LiteLLM neste batch.
- [ ] Nao fazer mudanca visual grande no dashboard neste batch.
- [ ] Nao recalcular custo historico salvo, exceto quando dado estiver faltando
  e for marcado como estimado.

## Checklist de Validacao

- [ ] `/logs` mostra dados novos do proxy.
- [ ] Detalhe de log mostra payload mascarado.
- [ ] Detalhe de log mostra mensagens.
- [ ] Error logs funcionam sem `LiteLLM_ErrorLogs`.
- [ ] Detectores do monitor funcionam sem tabelas LiteLLM.
- [ ] Dados importados aparecem nos mesmos graficos dos dados novos.
- [ ] Importador preserva `request_id`.
- [ ] Importador nao sobrescreve logs novos.
- [ ] Totais de requests batem com a fonte antiga na janela escolhida.
- [ ] Totais de tokens batem com a fonte antiga na janela escolhida.
- [ ] Totais de custo batem com a fonte antiga na janela escolhida.
- [ ] Totais de erro batem com a fonte antiga na janela escolhida.
- [ ] Latencia agregada bate com a fonte antiga dentro da tolerancia definida.

## Checks

- [ ] `pnpm --filter @lite-llm/analytics-service typecheck`
- [ ] `pnpm --filter @lite-llm/server typecheck`
- [ ] `pnpm --filter @lite-llm/monitor typecheck`
- [ ] `pnpm test`

## Criterios de Pronto

- [ ] Dashboard funciona com `ANALYTICS_DATA_SOURCE=model-proxy`.
- [ ] Monitor funciona com `ANALYTICS_DATA_SOURCE=model-proxy`.
- [ ] Historico antigo foi importado para o schema novo.
- [ ] `sync:cloud` nao escreve mais em `LiteLLM_SpendLogs`.
- [ ] Modo `hybrid` e apenas ferramenta de transicao/comparacao.

