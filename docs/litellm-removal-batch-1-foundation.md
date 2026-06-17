# Batch 1: fundacao do proxy

## Status

- [x] Consolidado sem fallback legacy no runtime principal.
- [x] `local-proxy` e `MODEL_PROXY_*` viraram o caminho canônico interno.
- [x] Contratos públicos legados permanecem isolados nas bordas.
- [x] Plugin `litellm-alias` renomeado para `model-alias` (shim de API apenas).

## Objetivo

Criar a base do proxy TypeScript e o schema PostgreSQL novo. Ao final deste
batch, clientes locais devem conseguir chamar rotas OpenAI-compatible do app em
vez de chamar o LiteLLM diretamente.

## Variaveis de ambiente do proxy

| Variavel | Obrigatoria | Papel |
|----------|-------------|-------|
| `MODEL_PROXY_API_KEY` | Sim (rotas `/v1/*`) | Auth Bearer local nas rotas OpenAI-compatible |
| `MODEL_PROXY_DATABASE_URL` | Sim (`POST /v1/chat/completions`) | PostgreSQL do ledger (`model_proxy_*`) |
| `MODEL_PROXY_UPSTREAM_BASE_URL` | Sim* | Base URL upstream quando o modelo nao define `upstream_base_url` |
| `MODEL_PROXY_UPSTREAM_API_KEY` | Sim* | API key upstream quando credential/secret_ref nao resolvem |
| `MODEL_PROXY_BASE_URL` | Nao | Base URL do proxy para health-check e consumidores (`http://localhost:3008/v1`) |

\* Pelo menos uma fonte de upstream (env, credential no DB ou campo no modelo) deve
estar configurada por modelo.

Schema e migration: `repositories/model-proxy-repository/prisma/`.

## Checklist de Preparacao

- [x] Inventariar usos de `LITELLM_*`.
- [x] Inventariar usos de `litellmParams`.
- [x] Inventariar usos de `provider.litellm`.
- [x] Inventariar queries em `LiteLLM_SpendLogs`.
- [x] Inventariar queries em `LiteLLM_Config`.
- [x] Inventariar queries em `LiteLLM_CredentialsTable`.
- [x] Inventariar queries em `LiteLLM_ProxyModelTable`.
- [x] Definir matriz de renome:
  - [x] `litellmParams` -> `modelRoute` (rotas HTTP e registry; adapters legado so import);
  - [x] `provider.litellm` -> `provider.local-proxy`;
  - [x] `litellm-alias` -> `model-alias`;
  - [x] tabelas `LiteLLM_*` -> `model_proxy_*` (schema novo);
  - [x] env `LITELLM_*` -> `MODEL_PROXY_*` (runtime do proxy).
- [x] Confirmar se o proxy entra como rota do server atual em `:3008`.

## Checklist de Implementacao

- [x] Criar migracoes PostgreSQL iniciais
  (`repositories/model-proxy-repository/prisma/migrations/`).
- [x] Criar tabela `model_proxy_requests`.
- [x] Criar tabela `model_proxy_messages`.
- [x] Criar tabela `model_proxy_models`.
- [x] Criar tabela `model_proxy_credentials`.
- [x] Criar tabela `model_proxy_api_keys`.
- [x] Criar tabela `model_proxy_settings`.
- [x] Criar tabela `model_proxy_aliases`.
- [x] Criar tabela `model_proxy_import_jobs`.
- [x] Criar pacote `services/model-proxy-service` +
  `repositories/model-proxy-repository`.
- [x] Criar schemas base para chat completions.
- [x] Criar schemas base para provider/upstream.
- [x] Implementar `ModelResolver` minimo lendo modelos habilitados
  (fallback `models.jsonc` quando `model_proxy_models` esta vazio).
- [x] Implementar `CredentialResolver` minimo usando env ou `secret_ref`.
- [x] Implementar adapter `openai-compatible`.
- [x] Registrar `POST /v1/chat/completions` no server.
- [x] Registrar `GET /v1/models` no server.
- [x] Implementar validacao local simples via `MODEL_PROXY_API_KEY`.
- [x] Criar `provider.local-proxy` na config de modelos.
- [x] Criar provider upstream neutro para chamadas reais (hoje via
  `MODEL_PROXY_UPSTREAM_*` ou credentials no DB).

## Fora de Escopo

- [ ] Nao migrar analytics completo neste batch.
- [ ] Nao importar historico antigo neste batch.
- [ ] Nao remover `repositories/litellm-repository` neste batch.
- [ ] Nao implementar adapter Anthropic nativo neste batch.
- [ ] Nao implementar rate limit/budget neste batch.
- [ ] Nao sincronizar `models.jsonc` -> `model_proxy_models` neste batch.

## Checklist de Validacao

- [x] `GET /v1/models` retorna modelos configurados.
- [x] `POST /v1/chat/completions` sem stream retorna formato
  OpenAI-compatible.
- [x] `POST /v1/chat/completions` com `stream: true` retorna SSE incremental.
- [x] Request sem API key local e rejeitado.
- [x] Request com API key local valida chega no upstream.
- [x] Config nova nao usa `provider.litellm`.
- [x] Health-check consegue apontar manualmente para
  `http://localhost:3008/v1`.
- [x] Plugin e configs usam `model-alias` / `model-aliases.json`.

## Checks

- [x] `pnpm --filter @lite-llm/server typecheck`
- [x] `pnpm --filter @lite-llm/monitor typecheck`
- [x] `pnpm test`

## Criterios de Pronto

- [x] Proxy TS responde em `/v1/chat/completions`.
- [x] Proxy TS responde em `/v1/models`.
- [x] O caminho novo usa `MODEL_PROXY_API_KEY`.
- [x] O schema PostgreSQL base existe.
- [x] O app ainda roda sem depender de mudancas nos dashboards.
