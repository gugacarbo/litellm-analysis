---
status: accepted
date: 2026-06-16
builds-on: []
superseded-by: null
deciders: [architecture-team]
---

> ⚠️ **VERDADE ATUAL:** Configurações operacionais do proxy (default_credential, health_check_prompt, router_settings) são armazenadas em linhas `model_proxy_settings` com `key` único e `value` JSON. A leitura consulta `model_proxy_settings` primeiro, com fallback para `LiteLLM_Config` via adapter. Metadados de aliases gerenciados permanecem em `router_settings.value.__lite_llm_analytics.managedModelGroupAliasKeys`.

# Substituir `LiteLLM_Config` por `model_proxy_settings` como fonte de configuração operacional

## Contexto e problema

O sistema legado usa a tabela `LiteLLM_Config` para armazenar configurações operacionais do proxy (credencial padrão, health check prompt, router settings). Com a migração para o schema próprio (`model_proxy_*`), é necessário um mecanismo substituto que seja simples, flexível e que preserve a compatibilidade com dados existentes.

## Direcionadores da decisão

- Substituir dependência da tabela `LiteLLM_Config` por schema próprio.
- Suporte a valores JSON arbitrários para diferentes tipos de configuração.
- Compatibilidade retroativa: leitura com fallback para `LiteLLM_Config` durante migração.
- Preservar metadados de aliases gerenciados usados por `reconcileManagedAliases`.

## Opções consideradas

### Opção 1 — Tabela chave-valor `model_proxy_settings` (escolhida)
**Prós:** Simples; flexível (value JSON); sem schema rígido; fácil de migrar linha a linha.
**Contras:** Sem integridade referencial por tipo; validação delegada ao service layer.

### Opção 2 — Colunas dedicadas na tabela de configuração
**Prós:** Tipagem forte no DB; validação nativa.
**Contras:** Menos flexível; requer migração de schema para cada nova configuração; acoplamento.

### Opção 3 — Arquivo de configuração YAML/JSON externo
**Prós:** Desacoplado do DB; fácil de versionar.
**Contras:** Não escalável para multi-tenant; dificulta atualização em runtime.

## Decisão

Adotar `model_proxy_settings` com `key` único e `value` JSON. Três chaves iniciais: `default_credential`, `health_check_prompt`, e `router_settings`. Writes novos vão apenas para `model_proxy_settings` via `settings.service`. Reads consultam `model_proxy_settings` primeiro; se ausente, um adapter lê `LiteLLM_Config` e opcionalmente faz upsert idempotente. Metadados de aliases gerenciados (`__lite_llm_analytics.managedModelGroupAliasKeys`) permanecem dentro de `router_settings.value`.

## Consequências

- Positivas: Schema simples e flexível; migração incremental linha a linha; fallback transparente.
- Negativas: Validação de tipos JSON delegada ao service layer; metadados aninhados em `router_settings` criam dependência temporária.
- Obrigatório: Usar `settings.service` para writes; manter fallback para `LiteLLM_Config` até migração completa.
- Proibido: Escrever em `LiteLLM_Config` para configurações novas.

## Confirmação

```bash
# Verificar que writes novos usam settings.service, não LiteLLM_Config
grep -rn "LiteLLM_Config" packages/server/src/services/settings/ | grep -v "adapter\|legacy\|import\|test" && exit 1
# Verificar que as três chaves esperadas existem no schema ou na validação
grep -rn "default_credential\|health_check_prompt\|router_settings" packages/server/src/services/settings/ | head -5
```

## Notas

O delete de `default_credential` é feito removendo a linha com `key = 'default_credential'`, equivalente ao DELETE legado. Os metadados `__lite_llm_analytics.managedModelGroupAliasKeys` permanecem em `router_settings.value` até a refatoração na Onda 3, preservando o contrato de `reconcileManagedAliases` em `router-queries.ts`.
