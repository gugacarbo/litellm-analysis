# ADRs

<!-- GERADO por scripts/docs-check — não editar à mão -->

| id | título | status |
|---|---|---|
| [ADR-0001](0001-secret-ref-upstream-credentials.md) | Usar `secretRef` em vez de segredo bruto para credenciais upstream | accepted |
| [ADR-0002](0002-local-api-keys-model-proxy-api-keys.md) | Armazenar chaves locais do proxy com hash em `model_proxy_api_keys` | accepted |
| [ADR-0003](0003-settings-in-model-proxy-settings.md) | Substituir `LiteLLM_Config` por `model_proxy_settings` como fonte de configuração operacional | accepted |
| [ADR-0004](0004-model-registry-and-litellmparams-rename.md) | Adotar `model_proxy_models` como registry primário e renomear `litellmParams` para `modelRoute` | accepted |
| [ADR-0005](0005-sync-state-names-rename.md) | Renomear estados de sync para eliminar nomenclatura LiteLLM | accepted |
| [ADR-0006](0006-dual-read-single-write-policy.md) | Adotar política dual-read / single-write com registry como fonte primária | accepted |
