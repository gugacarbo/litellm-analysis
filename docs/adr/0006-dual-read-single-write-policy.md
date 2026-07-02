---
status: accepted
date: 2026-06-16
builds-on: [ADR-0001, ADR-0003]
superseded-by: null
deciders: [architecture-team]
---

# Adotar política dual-read / single-write com registry como fonte primária

## Contexto e problema

O sistema opera com dois bancos de dados: o schema próprio (`model_proxy_*`) e o legado (LiteLLM). É necessário definir uma política clara de como reads e writes são direcionados para evitar inconsistências e garantir que o schema próprio se torne a fonte da verdade.

## Direcionadores da decisão

- Consistência: evitar dual-write que pode levar a divergência de dados.
- Disponibilidade: reads devem funcionar mesmo durante a transição, com fallback para dados legados.
- Progresso: writes novos só vão para o schema próprio, forçando a migração completa.
- Isolamento: adapters temporários encapsulam toda lógica de compatibilidade com o legado.

## Opções consideradas

### Opção 1 — Dual-read / single-write (escolhida)
**Prós:** Consistência (sem dual-write); reads com fallback garantem disponibilidade; migração progressiva e segura.
**Contras:** Adapters temporários aumentam complexidade; dados legados podem ficar obsoletos (leitura apenas).

### Opção 2 — Dual-read / dual-write
**Prós:** Sincronia entre os dois bancos durante migração.
**Contras:** Risco de divergência; complexidade de transações distribuídas; overhead operacional.

### Opção 3 — Migração big-bang com cutover
**Prós:** Sem período de dualidade; mais simples.
**Contras:** Risco alto; sem fallback; requer parada do sistema.

## Decisão

Adotar política **dual-read / single-write**:

| Operação | Destino | Legado |
|----------|---------|--------|
| Create/update/delete settings | `model_proxy_settings` | Read-only via adapter |
| CRUD modelos | `model_proxy_models` | Read-only via adapter |
| CRUD credenciais upstream | `model_proxy_providers` | Read-only via adapter |
| CRUD API keys locais | `model_proxy_api_keys` | N/A |
| Analytics / spend | `model_proxy_requests` | Source para import histórico |

**Writes:** exclusivamente nas tabelas `model_proxy_*`. O banco LiteLLM não recebe writes operacionais novos — apenas leitura e import one-shot.

**Reads:** consultam o registry-service primeiro, com fallback para adapters legados que leem do banco LiteLLM.

## Consequências

- **Positivas:** Consistência nos writes; disponibilidade nos reads com fallback; migração progressiva e segura.
- **Negativas:** Complexidade dos adapters temporários; dados legados podem ficar obsoletos.
- **Obrigatório:** Todo write operacional novo deve ir para `model_proxy_*`.
- **Proibido:** Escrever em tabelas LiteLLM para operações novas; dual-write registry + LiteLLM.

## Confirmação

```bash
# Nenhum write em tabelas LiteLLM no código novo
grep -rn "LiteLLM_" packages/server/src/services/ --include="*.ts" \
  | grep -v "adapter\|legacy\|import\|test\|\.spec\|\.d\.ts" \
  | grep -i "create\|update\|delete\|save\|insert" && exit 1
```
