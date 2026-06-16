# Batch 3: settings, registry e credenciais

## Objetivo

Remover a dependencia operacional de `LiteLLM_Config`,
`LiteLLM_CredentialsTable` e `LiteLLM_ProxyModelTable` para dados novos. Ao
final deste batch, settings, modelos, credenciais upstream e API keys locais
devem viver no schema `model_proxy_*`.

## Checklist de Preparacao

- [ ] Confirmar que Batch 1 esta concluido.
- [ ] Confirmar que Batch 2 nao depende mais de secrets brutos.
- [ ] Definir estrategia de credenciais:
  - [ ] `secret_ref` por env/secret manager no MVP;
  - [ ] sem persistir segredo upstream bruto.
- [ ] Definir campos minimos de API key local.
- [ ] Definir adapter temporario para configs antigas.
- [ ] Definir estados novos de sync:
  - [ ] `registry-only`;
  - [ ] `config-only`;
  - [ ] `synced`;
  - [ ] `config-to-registry`;
  - [ ] `registry-to-config`.

## Checklist de Implementacao

- [ ] Criar repository/service para `model_proxy_settings`.
- [ ] Migrar `default_credential` para `model_proxy_settings`.
- [ ] Migrar `health_check_prompt` para `model_proxy_settings`.
- [ ] Migrar `router_settings` para `model_proxy_settings`.
- [ ] Migrar metadados de aliases gerenciados para `model_proxy_settings`.
- [ ] Criar repository/service para `model_proxy_models`.
- [ ] Implementar CRUD de modelos no registry novo.
- [ ] Trocar rotas de modelos para usar `model_proxy_models`.
- [ ] Trocar services de modelos para usar `model_proxy_models`.
- [ ] Renomear `litellmParams` para `modelRoute` no codigo novo.
- [ ] Atualizar UI para usar `modelRoute`.
- [ ] Atualizar UI para mostrar estados novos de registry/config.
- [ ] Criar repository/service para `model_proxy_credentials`.
- [ ] Criar fluxo de credenciais upstream por `secret_ref`.
- [ ] Criar repository/service para `model_proxy_api_keys`.
- [ ] Ajustar validacao local do proxy para usar `model_proxy_api_keys`.
- [ ] Adicionar adapter de leitura para `provider.litellm`.
- [ ] Adicionar adapter de leitura para `litellmParams`.
- [ ] Regravar configs antigas no formato novo.

## Fora de Escopo

- [ ] Nao importar historico completo neste batch.
- [ ] Nao remover `repositories/litellm-repository` neste batch.
- [ ] Nao reescrever dashboards completos neste batch.
- [ ] Nao implementar UI avancada de rotacao de chaves se isso atrasar o batch.

## Checklist de Validacao

- [ ] Default credential salva em `model_proxy_settings`.
- [ ] Default credential le de `model_proxy_settings`.
- [ ] Health-check prompt salva em `model_proxy_settings`.
- [ ] Health-check prompt le de `model_proxy_settings`.
- [ ] Router aliases salvam em `model_proxy_settings`.
- [ ] Router aliases leem de `model_proxy_settings`.
- [ ] Modelo novo e criado em `model_proxy_models`.
- [ ] Modelo existente e atualizado em `model_proxy_models`.
- [ ] UI nao mostra novos estados com nomenclatura LiteLLM.
- [ ] API key local valida request no proxy.
- [ ] Credencial upstream nao aparece em config gerada.
- [ ] Config antiga e lida e regravada em formato novo.

## Checks

- [ ] `pnpm --filter @lite-llm/server typecheck`
- [ ] `pnpm --filter @lite-llm/analytics-service typecheck`
- [ ] `pnpm --filter @lite-llm/monitor typecheck`
- [ ] `pnpm test`

## Criterios de Pronto

- [ ] Dados operacionais novos nao dependem de `LiteLLM_Config`.
- [ ] Model registry novo substitui `LiteLLM_ProxyModelTable` para dados novos.
- [ ] Credenciais upstream e API keys locais estao separadas.
- [ ] Nomes novos aparecem no codigo novo.
- [ ] Compatibilidade antiga fica isolada em adapters temporarios.

