---
status: accepted
date: 2026-06-16
builds-on: []
superseded-by: null
deciders: [architecture-team]
---

# Usar `model_proxy_settings` como tabela chave-valor para configuração operacional

## Contexto e problema

O proxy precisa armazenar configurações operacionais de tipos variados: credencial padrão, prompt de health check, aliases de roteamento, e futuramente outras. É necessário um mecanismo de armazenamento que seja simples, flexível e não exija migração de schema para cada nova configuração.

## Direcionadores da decisão

- Flexibilidade: suportar valores JSON arbitrários para diferentes tipos de configuração.
- Simplicidade: evitar schema rígido que exija migração a cada nova chave.
- Desacoplamento: configurações operacionais não devem depender de arquivos externos.

## Opções consideradas

### Opção 1 — Tabela chave-valor `model_proxy_settings` (escolhida)
**Prós:** Simples; flexível (value JSON); sem schema rígido; fácil de migrar incrementalmente.
**Contras:** Sem integridade referencial por tipo; validação delegada ao service layer.

### Opção 2 — Colunas dedicadas por configuração
**Prós:** Tipagem forte no DB; validação nativa.
**Contras:** Menos flexível; requer migração de schema para cada nova configuração; acoplamento.

### Opção 3 — Arquivo de configuração externo (YAML/JSON)
**Prós:** Desacoplado do DB; fácil de versionar.
**Contras:** Não escalável para multi-tenant; dificulta atualização em runtime.

## Decisão

Adotar `model_proxy_settings` com `key` único e `value` JSON. Chaves iniciais: `default_credential`, `health_check_prompt`, `router_settings`. Writes vão exclusivamente para `model_proxy_settings` via `settings.service`. Metadados de aliases gerenciados (`__lite_llm_analytics.managedModelGroupAliasKeys`) vivem dentro de `router_settings.value`.

## Consequências

- **Positivas:** Schema simples e flexível; migração incremental; sem dependência de arquivos externos.
- **Negativas:** Validação de tipos JSON delegada ao service layer.
- **Obrigatório:** Usar `settings.service` para writes.
- **Proibido:** Escrever configurações operacionais em qualquer outra tabela ou arquivo.

## Confirmação

```bash
# Writes novos usam settings.service
grep -rn "model_proxy_settings" packages/server/src/services/settings/ | grep -v "adapter\|legacy\|import\|test" | head -5
# As três chaves esperadas existem na validação
grep -rn "default_credential\|health_check_prompt\|router_settings" packages/server/src/services/settings/ | head -5
```
