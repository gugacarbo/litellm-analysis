# Batch 2: ledger de uso, custo e erro

## Objetivo

Fazer o proxy virar o ledger local de chamadas LLM. Ao final deste batch, toda
chamada que passar pelo proxy deve gerar log persistido com status, tokens,
custo, latencia, TTFT e erro estruturado quando houver falha.

## Checklist de Preparacao

- [x] Confirmar que Batch 1 esta concluido.
- [x] Confirmar schema `model_proxy_requests`.
- [x] Confirmar campos de usage e custo no schema.
- [x] Confirmar campos de erro estruturado no schema.
- [x] Definir status finais aceitos:
  - [x] `success`;
  - [x] `failed`;
  - [x] `cancelled`;
  - [x] `timeout`.
- [x] Definir campos sensiveis que devem ser mascarados.

## Checklist de Implementacao

- [x] Criar `logging/request-ledger.ts`.
- [x] Implementar operacao `start`.
- [x] Implementar operacao `complete`.
- [x] Implementar operacao `fail`.
- [x] Implementar operacao `cancel`.
- [x] Implementar operacao `timeout`.
- [x] Criar `logging/payload-redactor.ts`.
- [x] Mascarar headers sensiveis.
- [x] Mascarar API keys em payloads.
- [x] Mascarar credenciais upstream.
- [x] Persistir `request_payload`.
- [x] Persistir `response_payload`.
- [x] Persistir `messages`.
- [x] Criar `logging/usage-extractor.ts`.
- [x] Normalizar `prompt_tokens`.
- [x] Normalizar `completion_tokens`.
- [x] Normalizar `total_tokens`.
- [x] Normalizar `cached_tokens` quando existir.
- [x] Normalizar `reasoning_tokens` quando existir.
- [x] Marcar `usage_estimated` quando usage for estimado.
- [x] Criar `logging/cost-calculator.ts`.
- [x] Salvar snapshot de `input_cost_per_token`.
- [x] Salvar snapshot de `output_cost_per_token`.
- [x] Calcular `input_cost`.
- [x] Calcular `output_cost`.
- [x] Calcular `total_cost`.
- [x] Marcar `cost_estimated` quando custo depender de usage estimado.
- [x] Medir TTFT em stream.
- [x] Preservar chunks SSE sem buffering indevido.
- [x] Detectar `[DONE]`.
- [x] Detectar stream interrompido pelo cliente.
- [x] Persistir erro estruturado:
  - [x] `error_type`;
  - [x] `error_message`;
  - [x] `error_status_code`;
  - [x] `error_details`.
- [x] Integrar mudancas com `spend_logs_changed`.

## Fora de Escopo

- [ ] Nao reescrever todas as queries de analytics neste batch.
- [ ] Nao importar historico antigo neste batch.
- [ ] Nao criar UI completa de detalhe de log neste batch.
- [ ] Nao implementar rate limit/budget neste batch.

## Checklist de Validacao

- [x] Request non-stream com sucesso grava log `success`.
- [x] Request stream com sucesso grava log `success`.
- [x] Request stream grava TTFT.
- [x] Request stream grava usage quando provider enviar.
- [x] Erro upstream grava log `failed`.
- [x] Timeout grava log `timeout`.
- [x] Stream interrompido grava log `cancelled`.
- [x] Credenciais nao aparecem em `request_payload`.
- [x] Credenciais nao aparecem em `response_payload`.
- [x] Custo salvo nao muda quando o preco do modelo muda depois.
- [x] `spend_logs_changed` e emitido ou acionado para request novo.

## Checks

- [x] `pnpm --filter @lite-llm/server typecheck`
- [x] `pnpm --filter @lite-llm/monitor typecheck`
- [x] `pnpm --filter @lite-llm/model-proxy-service test`

## Criterios de Pronto

- [x] Toda chamada pelo proxy gera um registro persistido.
- [x] Sucesso, erro, timeout e cancelamento sao persistidos.
- [x] Usage e custo estao normalizados.
- [x] Payloads persistidos estao mascarados.
- [x] Streaming continua incremental.
