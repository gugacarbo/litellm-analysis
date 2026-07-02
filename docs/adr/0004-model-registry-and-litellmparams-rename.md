---
status: accepted
date: 2026-06-16
builds-on: []
superseded-by: null
deciders: [architecture-team]
---

> ⚠️ VERDADE ATUAL: A decisão de usar `model_proxy_models` como registry primário e `modelRoute` como tipo canônico foi absorvida como convenção de projeto. A nomenclatura e regras vigentes estão em `docs/context/CONVENTIONS.md` (seções Nomenclatura e Modelos e providers). A política de leitura/escrita que rege o registry está no ADR-0006.

# Adotar `model_proxy_models` como registry primário e renomear `litellmParams` para `modelRoute`

## Contexto e problema

O schema legado (`LiteLLM_ProxyModelTable`) armazena a configuração de modelos de proxy com campos acoplados à nomenclatura LiteLLM. Com a migração para o schema próprio (`model_proxy_*`), é necessário (a) estabelecer `model_proxy_models` como fonte primária para dados novos e (b) renomear o tipo `litellmParams` para `modelRoute`, eliminando a referência ao LiteLLM da API pública.

## Direcionadores da decisão

- Eliminar dependência de nomenclatura LiteLLM da API pública e do código novo.
- Compatibilidade retroativa: clientes existentes que usam `litellmParams` não devem quebrar.
- Código novo deve usar o tipo `modelRoute` e o módulo `model-route.ts`.
- Adapters devem isolar todo o código de compatibilidade legado.

## Opções consideradas

### Opção 1 — Renomear com shim de compatibilidade (escolhida)
**Prós:** Migração transparente para clientes; código novo limpo; adapters isolam legado.
**Contras:** Complexidade temporária do shim; necessidade de remover o alias futuramente.

### Opção 2 — Manter `litellmParams` e adicionar `modelRoute` como alias
**Prós:** Menos mudanças imediatas.
**Contras:** Perpetua nomenclatura LiteLLM na API pública; confusão entre dois nomes.

### Opção 3 — Breaking change: substituir `litellmParams` por `modelRoute` sem shim
**Prós:** Código mais limpo; sem dívida técnica de compatibilidade.
**Contras:** Quebra clientes existentes; requer coordenação de release.

## Decisão

Adotar `model_proxy_models` como fonte primária para dados novos de modelos. Renomear o tipo `litellmParams` para `modelRoute` na API pública e no código novo. A API aceita `litellmParams` via shim e normaliza internamente para `modelRoute`. A resposta expõe `modelRoute`; `litellmParams` é mantido como alias deprecado temporário. Código novo usa exclusivamente `modelRoute` e o módulo `model-route.ts`.

## Consequências

- Positivas: API pública livre de nomenclatura LiteLLM; migração transparente; código novo limpo.
- Negativas: Shim de compatibilidade temporário aumenta complexidade; dívida técnica a ser removida.
- Obrigatório: Código novo usa `modelRoute`; adapters isolam toda lógica legada.
- Proibido: Usar `litellmParams` em código novo.

## Confirmação

```bash
# Verificar que código novo não usa litellmParams
grep -rn "litellmParams" packages/server/src/ --include="*.ts" | grep -v "adapter\|shim\|legacy\|test\|\.spec\|\.d\.ts" && exit 1
# Verificar que model-route.ts existe e exporta ModelRoute
test -f packages/server/src/model-route.ts && grep "export" packages/server/src/model-route.ts | head -3
```

## Notas

A matriz campo-a-campo entre `litellmParams` e `modelRoute` está documentada em `docs/batch-3-field-mapping.md` (SA-0B). As colunas Prisma em `model_proxy_models` já cobrem o mapeamento (`modelName`, custos, `credentialName`, `requestOptions`, etc.).
