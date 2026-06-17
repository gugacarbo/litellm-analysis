# Batch 3: settings, registry e credenciais

## Objetivo

Remover a dependencia operacional de `LiteLLM_Config`,
`LiteLLM_CredentialsTable` e `LiteLLM_ProxyModelTable` para dados novos. Ao
final deste batch, settings, modelos, credenciais upstream e API keys locais
devem viver no schema `model_proxy_*`.

## Checklist de Preparacao

- [x] Confirmar que Batch 1 esta concluido.
- [x] Confirmar que Batch 2 nao depende mais de secrets brutos.
- [x] Definir estrategia de credenciais ([`batch-3-decisions.md`](./batch-3-decisions.md) §1):
  - [x] `secret_ref` por env/secret manager no MVP;
  - [x] sem persistir segredo upstream bruto.
- [x] Definir campos minimos de API key local ([`batch-3-decisions.md`](./batch-3-decisions.md) §2).
- [x] Definir adapter temporario para configs antigas ([`batch-3-decisions.md`](./batch-3-decisions.md) §6).
- [x] Definir estados novos de sync ([`batch-3-decisions.md`](./batch-3-decisions.md) §5):
  - [x] `registry-only`;
  - [x] `config-only`;
  - [x] `synced`;
  - [x] `config-to-registry`;
  - [x] `registry-to-config`.

## Checklist de Implementacao

- [x] Criar repository/service para `model_proxy_settings`.
- [x] Migrar `default_credential` para `model_proxy_settings`.
- [x] Migrar `health_check_prompt` para `model_proxy_settings`.
- [x] Migrar `router_settings` para `model_proxy_settings`.
- [x] Migrar metadados de aliases gerenciados para `model_proxy_settings`.
- [x] Criar repository/service para `model_proxy_models`.
- [x] Implementar CRUD de modelos no registry novo.
- [x] Trocar rotas de modelos para usar `model_proxy_models`.
- [x] Trocar services de modelos para usar `model_proxy_models`.
- [x] Renomear `litellmParams` para `modelRoute` no codigo novo.
- [x] Atualizar UI para usar `modelRoute`.
- [x] Atualizar UI para mostrar estados novos de registry/config.
- [x] Criar repository/service para `model_proxy_credentials`.
- [x] Criar fluxo de credenciais upstream por `secret_ref`.
- [x] Criar repository/service para `model_proxy_api_keys`.
- [x] Ajustar validacao local do proxy para usar `model_proxy_api_keys`.
- [x] Adicionar adapter de leitura para `provider.litellm`.
- [x] Adicionar adapter de leitura para `litellmParams`.
- [x] Regravar configs antigas no formato novo.

## Fora de Escopo

- [ ] Nao importar historico completo neste batch.
- [ ] Nao remover `repositories/litellm-repository` neste batch.
- [ ] Nao reescrever dashboards completos neste batch.
- [ ] Nao implementar UI avancada de rotacao de chaves se isso atrasar o batch.

## Checklist de Validacao

- [x] Default credential salva em `model_proxy_settings`.
- [x] Default credential le de `model_proxy_settings`.
- [x] Health-check prompt salva em `model_proxy_settings`.
- [x] Health-check prompt le de `model_proxy_settings`.
- [x] Router aliases salvam em `model_proxy_settings`.
- [x] Router aliases leem de `model_proxy_settings`.
- [x] Modelo novo e criado em `model_proxy_models`.
- [x] Modelo existente e atualizado em `model_proxy_models`.
- [x] UI nao mostra novos estados com nomenclatura LiteLLM.
- [x] API key local valida request no proxy.
- [x] Credencial upstream nao aparece em config gerada.
- [x] Config antiga e lida e regravada em formato novo.

## Checks

- [x] `pnpm --filter @lite-llm/server typecheck`
- [x] `pnpm --filter @lite-llm/analytics-service typecheck`
- [x] `pnpm --filter @lite-llm/monitor typecheck`
- [x] `pnpm test`

## Criterios de Pronto

- [x] Dados operacionais novos nao dependem de `LiteLLM_Config`.
- [x] Model registry novo substitui `LiteLLM_ProxyModelTable` para dados novos.
- [x] Credenciais upstream e API keys locais estao separadas.
- [x] Nomes novos aparecem no codigo novo.
- [x] Compatibilidade antiga fica isolada em adapters temporarios.
