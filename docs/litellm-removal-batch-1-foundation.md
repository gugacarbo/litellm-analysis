# Batch 1: fundacao do proxy

## Objetivo

Criar a base do proxy TypeScript e o schema PostgreSQL novo. Ao final deste
batch, clientes locais devem conseguir chamar rotas OpenAI-compatible do app em
vez de chamar o LiteLLM diretamente.

## Checklist de Preparacao

- [ ] Inventariar usos de `LITELLM_*`.
- [ ] Inventariar usos de `litellmParams`.
- [ ] Inventariar usos de `provider.litellm`.
- [ ] Inventariar queries em `LiteLLM_SpendLogs`.
- [ ] Inventariar queries em `LiteLLM_Config`.
- [ ] Inventariar queries em `LiteLLM_CredentialsTable`.
- [ ] Inventariar queries em `LiteLLM_ProxyModelTable`.
- [ ] Definir matriz de renome:
  - [ ] `litellmParams` -> `modelRoute`;
  - [ ] `provider.litellm` -> `provider.local-proxy`;
  - [ ] `litellm-alias` -> `model-alias`;
  - [ ] `LiteLLM_*` -> `model_proxy_*`;
  - [ ] `LITELLM_*` -> `MODEL_PROXY_*`.
- [ ] Confirmar se o proxy entra como rota do server atual em `:3008`.

## Checklist de Implementacao

- [ ] Criar migracoes PostgreSQL iniciais.
- [ ] Criar tabela `model_proxy_requests`.
- [ ] Criar tabela `model_proxy_messages`.
- [ ] Criar tabela `model_proxy_models`.
- [ ] Criar tabela `model_proxy_credentials`.
- [ ] Criar tabela `model_proxy_api_keys`.
- [ ] Criar tabela `model_proxy_settings`.
- [ ] Criar tabela `model_proxy_aliases`.
- [ ] Criar tabela `model_proxy_import_jobs`.
- [ ] Criar pacote `services/model-proxy`.
- [ ] Criar schemas base para chat completions.
- [ ] Criar schemas base para provider/upstream.
- [ ] Implementar `ModelResolver` minimo lendo modelos habilitados.
- [ ] Implementar `CredentialResolver` minimo usando env ou `secret_ref`.
- [ ] Implementar adapter `openai-compatible`.
- [ ] Registrar `POST /v1/chat/completions` no server.
- [ ] Registrar `GET /v1/models` no server.
- [ ] Implementar validacao local simples via `MODEL_PROXY_API_KEY`.
- [ ] Criar `provider.local-proxy` na config de modelos.
- [ ] Criar provider upstream neutro para chamadas reais.

## Fora de Escopo

- [ ] Nao migrar analytics completo neste batch.
- [ ] Nao importar historico antigo neste batch.
- [ ] Nao remover `repositories/litellm-repository` neste batch.
- [ ] Nao implementar adapter Anthropic nativo neste batch.
- [ ] Nao implementar rate limit/budget neste batch.

## Checklist de Validacao

- [ ] `GET /v1/models` retorna modelos configurados.
- [ ] `POST /v1/chat/completions` sem stream retorna formato
  OpenAI-compatible.
- [ ] `POST /v1/chat/completions` com `stream: true` retorna SSE incremental.
- [ ] Request sem API key local e rejeitado.
- [ ] Request com API key local valida chega no upstream.
- [ ] Config nova nao usa `provider.litellm`.
- [ ] Health-check consegue apontar manualmente para
  `http://localhost:3008/v1`.

## Checks

- [ ] `pnpm --filter @lite-llm/server typecheck`
- [ ] `pnpm --filter @lite-llm/monitor typecheck`
- [ ] `pnpm test`

## Criterios de Pronto

- [ ] Proxy TS responde em `/v1/chat/completions`.
- [ ] Proxy TS responde em `/v1/models`.
- [ ] O caminho novo usa `MODEL_PROXY_API_KEY`.
- [ ] O schema PostgreSQL base existe.
- [ ] O app ainda roda sem depender de mudancas nos dashboards.

