---
status: accepted
date: 2026-06-16
builds-on: []
superseded-by: null
deciders: [architecture-team]
---

> ⚠️ VERDADE ATUAL: A decisão de renomear os estados de sync foi absorvida como convenção de nomenclatura. Os nomes vigentes e regras de uso estão em `docs/context/CONVENTIONS.md` (seção Nomenclatura).

# Renomear estados de sync para eliminar nomenclatura LiteLLM

## Contexto e problema

Os estados de sync entre o registry (`model_proxy_models`) e a configuração do dashboard usam nomenclatura herdada do LiteLLM: `litellm-only`, `config-to-litellm`, `litellm-to-config`. Com a migração para schema próprio, esses nomes não fazem mais sentido e confundem usuários que não conhecem o histórico LiteLLM.

## Direcionadores da decisão

- Eliminar referências ao LiteLLM da interface de usuário e contratos de API.
- Compatibilidade temporária com clientes externos que usam os nomes legados.
- Consistência: os novos nomes devem descrever o que o estado significa, não a origem histórica.

## Opções consideradas

### Opção 1 — Renomear com shim de compatibilidade (escolhida)
**Prós:** Clareza na UI e contratos novos; migração controlada via header `legacySyncNames=1`.
**Contras:** Complexidade temporária do shim; necessidade de remover suporte legado na Onda 4.

### Opção 2 — Apenas renomear na UI, manter nomes internos
**Prós:** Mudança mínima no backend.
**Contras:** Inconsistência entre API e UI; confusão em integrações.

### Opção 3 — Breaking change: renomear tudo sem compatibilidade
**Prós:** Simples; sem dívida técnica.
**Contras:** Quebra clientes externos.

## Decisão

Adotar a nova nomenclatura: `synced`, `config-only`, `registry-only`, `config-to-registry`, `registry-to-config`. A entrada da API aceita valores legados e normaliza internamente. A saída expõe apenas os nomes novos, com suporte opcional via header/query `legacySyncNames=1` para clientes que precisam dos alias deprecados. A UI usa exclusivamente os novos nomes. O campo de contagens `litellmOnly` é renomeado para `registryOnly`.

## Consequências

- Positivas: UI e API livres de nomenclatura LiteLLM; migração controlada.
- Negativas: Shim de compatibilidade temporário; suporte legado a ser removido na Onda 4.
- Obrigatório: Normalizar valores legados na entrada; expor apenas nomes novos na saída por padrão.
- Proibido: Usar `litellm-only`, `config-to-litellm`, `litellm-to-config` em código novo ou UI.

## Confirmação

```bash
# Verificar que UI não usa nomes legados
grep -rn "litellm-only\|config-to-litellm\|litellm-to-config" apps/web/src/ && exit 1
# Verificar que o shim de normalização existe
grep -rn "legacySyncNames\|normalizeSyncState" packages/server/src/ | head -3
```

## Notas

O contrato de contagens agregadas (`counts`) renomeia `litellmOnly` para `registryOnly`. Um shim de resposta pode manter ambos os nomes até a Onda 4, quando o suporte legado será removido. Compatibilidade temporária tem duração prevista de 1 release.
