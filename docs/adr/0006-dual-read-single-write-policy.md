---
status: accepted
date: 2026-06-16
builds-on: [ADR-0001, ADR-0003, ADR-0004]
superseded-by: null
deciders: [architecture-team]
---

> ⚠️ **VERDADE ATUAL:** Writes operacionais vão exclusivamente para as tabelas `model_proxy_*`. Leituras consultam o registry-service primeiro, com fallback para adapters legados que leem do banco LiteLLM. Não há dual-write: o banco LiteLLM deixou de receber writes operacionais novos, servindo apenas como fonte de leitura para migração e adapters temporários.

# Adotar política dual-read / single-write com registry como fonte primária

## Contexto e problema

Durante a migração do LiteLLM para o schema próprio (`model_proxy_*`), o sistema precisa operar com dois bancos de dados: o novo (model_proxy_*) e o legado (LiteLLM). É necessário definir uma política clara de como reads e writes são direcionados para evitar inconsistências e garantir que o novo schema se torne a fonte da verdade progressivamente.

## Direcionadores da decisão

- Consistência: evitar dual-write que pode levar a divergência de dados.
- Disponibilidade: reads devem funcionar mesmo durante a migração, com fallback para dados legados.
- Progresso: writes novos só vão para o schema novo, forçando a migração completa.
- Isolamento: adapters temporários encapsulam toda lógica de compatibilidade.

## Opções consideradas

### Opção 1 — Dual-read / single-write (escolhida)
**Prós:** Consistência (sem dual-write); reads com fallback garantem disponibilidade; migração forçada.
**Contras:** Adapters temporários aumentam complexidade; dados legados podem ficar dessincronizados (leitura apenas).

### Opção 2 — Dual-read / dual-write
**Prós:** Sincronia entre os dois bancos durante migração.
**Contras:** Risco de divergência; complexidade de transações distribuídas; overhead operacional.

### Opção 3 — Migração big-bang com cutover
**Prós:** Sem período de dualidade; mais simples.
**Contras:** Risco alto; sem fallback; requer parada do sistema.

## Decisão

Adotar política **dual-read / single-write**: writes operacionais vão exclusivamente para as tabelas `model_proxy_*`; reads consultam o registry-service primeiro, com fallback para adapters legados que leem do banco LiteLLM. Quatro adapters temporários encapsulam a lógica de compatibilidade: `litellm-params-adapter`, `legacy-config-adapter`, `legacy-credentials-adapter`, `import-legacy-registry`. O banco LiteLLM não recebe writes operacionais novos — apenas leitura e import one-shot.

## Consequências

- Positivas: Consistência nos writes; disponibilidade nos reads com fallback; migração progressiva e segura.
- Negativas: Complexidade dos adapters temporários; dados legados podem ficar obsoletos (leitura apenas).
- Obrigatório: Todo write operacional novo deve ir para `model_proxy_*`; adapters devem ser removidos na Onda 4.
- Proibido: Escrever em tabelas `LiteLLM_*` para operações novas; dual-write registry + LiteLLM.

## Confirmação

```bash
# Verificar que não há writes em tabelas LiteLLM no código novo
grep -rn "LiteLLM_" packages/server/src/services/ --include="*.ts" | grep -v "adapter\|legacy\|import\|test\|\.spec\|\.d\.ts" | grep -i "create\|update\|delete\|save\|insert" && exit 1
# Verificar que os 4 adapters existem
for a in litellm-params-adapter legacy-config-adapter legacy-credentials-adapter import-legacy-registry; do
  find packages/server/src -name "*$a*" -o -name "*${a//-/_}*" | head -1
done
```

## Notas

O repositório `repositories/litellm-repository` não é removido neste batch. Queries em `analytics-service` permanecem inalteradas; rotas operacionais migram para registry-service nas Ondas 1–3. Riscos mitigados: dual-write não ocorre porque o LiteLLM deixa de receber writes operacionais novos. Para detalhes dos adapters, ver `docs/batch-3-field-mapping.md` e `docs/batch-3-legacy-import.md`.
