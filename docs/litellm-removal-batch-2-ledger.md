# Batch 2: ledger de uso, custo e erro

## Objetivo

Fazer o proxy virar o ledger local de chamadas LLM. Ao final deste batch, toda
chamada que passar pelo proxy deve gerar log persistido com status, tokens,
custo, latencia, TTFT e erro estruturado quando houver falha.

## Checklist de Preparacao

- [ ] Confirmar que Batch 1 esta concluido.
- [ ] Confirmar schema `model_proxy_requests`.
- [ ] Confirmar campos de usage e custo no schema.
- [ ] Confirmar campos de erro estruturado no schema.
- [ ] Definir status finais aceitos:
  - [ ] `success`;
  - [ ] `failed`;
  - [ ] `cancelled`;
  - [ ] `timeout`.
- [ ] Definir campos sensiveis que devem ser mascarados.

## Checklist de Implementacao

- [ ] Criar `logging/request-ledger.ts`.
- [ ] Implementar operacao `start`.
- [ ] Implementar operacao `complete`.
- [ ] Implementar operacao `fail`.
- [ ] Implementar operacao `cancel`.
- [ ] Implementar operacao `timeout`.
- [ ] Criar `logging/payload-redactor.ts`.
- [ ] Mascarar headers sensiveis.
- [ ] Mascarar API keys em payloads.
- [ ] Mascarar credenciais upstream.
- [ ] Persistir `request_payload`.
- [ ] Persistir `response_payload`.
- [ ] Persistir `messages`.
- [ ] Criar `logging/usage-extractor.ts`.
- [ ] Normalizar `prompt_tokens`.
- [ ] Normalizar `completion_tokens`.
- [ ] Normalizar `total_tokens`.
- [ ] Normalizar `cached_tokens` quando existir.
- [ ] Normalizar `reasoning_tokens` quando existir.
- [ ] Marcar `usage_estimated` quando usage for estimado.
- [ ] Criar `logging/cost-calculator.ts`.
- [ ] Salvar snapshot de `input_cost_per_token`.
- [ ] Salvar snapshot de `output_cost_per_token`.
- [ ] Calcular `input_cost`.
- [ ] Calcular `output_cost`.
- [ ] Calcular `total_cost`.
- [ ] Marcar `cost_estimated` quando custo depender de usage estimado.
- [ ] Medir TTFT em stream.
- [ ] Preservar chunks SSE sem buffering indevido.
- [ ] Detectar `[DONE]`.
- [ ] Detectar stream interrompido pelo cliente.
- [ ] Persistir erro estruturado:
  - [ ] `error_type`;
  - [ ] `error_message`;
  - [ ] `error_status_code`;
  - [ ] `error_details`.
- [ ] Integrar mudancas com `spend_logs_changed`.

## Fora de Escopo

- [ ] Nao reescrever todas as queries de analytics neste batch.
- [ ] Nao importar historico antigo neste batch.
- [ ] Nao criar UI completa de detalhe de log neste batch.
- [ ] Nao implementar rate limit/budget neste batch.

## Checklist de Validacao

- [ ] Request non-stream com sucesso grava log `success`.
- [ ] Request stream com sucesso grava log `success`.
- [ ] Request stream grava TTFT.
- [ ] Request stream grava usage quando provider enviar.
- [ ] Erro upstream grava log `failed`.
- [ ] Timeout grava log `timeout`.
- [ ] Stream interrompido grava log `cancelled`.
- [ ] Credenciais nao aparecem em `request_payload`.
- [ ] Credenciais nao aparecem em `response_payload`.
- [ ] Custo salvo nao muda quando o preco do modelo muda depois.
- [ ] `spend_logs_changed` e emitido ou acionado para request novo.

## Checks

- [ ] `pnpm --filter @lite-llm/server typecheck`
- [ ] `pnpm --filter @lite-llm/monitor typecheck`
- [ ] `pnpm test`

## Criterios de Pronto

- [ ] Toda chamada pelo proxy gera um registro persistido.
- [ ] Sucesso, erro, timeout e cancelamento sao persistidos.
- [ ] Usage e custo estao normalizados.
- [ ] Payloads persistidos estao mascarados.
- [ ] Streaming continua incremental.

