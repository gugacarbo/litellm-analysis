---
status: proposed
date: 2026-07-09
builds-on: []
superseded-by: null
deciders: ["produto", "engenharia"]
---

# TanStack Start substitui o apps/web

## Contexto e problema

O monorepo possui uma SPA em `apps/web` e um novo scaffold TanStack Start em `apps/ui`. A SPA atual concentra a apresentação e o consumo de uma API HTTP, enquanto a nova direção exige que a aplicação seja reconstruída usando as capacidades server-side do TanStack Start.

## Direcionadores da decisão

- Recriar o produto com uma arquitetura TanStack Start desde a fundação.
- Alcançar paridade funcional completa com o `apps/web`.
- Evitar transportar o `api-client` e as fronteiras HTTP administrativas existentes.
- Preservar `apps/web` durante a migração para permitir comparação e rollback.

## Opções consideradas

### Opção 1 — Migrar incrementalmente dentro do apps/web

**Prós:** menor mudança inicial.
**Contras:** preserva decisões estruturais que motivaram a reconstrução e mistura os runtimes.

### Opção 2 — Reconstruir no apps/ui e substituir o apps/web

**Prós:** permite uma arquitetura limpa, paridade verificável e remoção gradual da dívida da SPA.
**Contras:** exige duplicar temporariamente a superfície de produto e migrar os testes.

## Decisão

O `apps/ui` será a aplicação principal e substituirá o `apps/web` após atingir paridade funcional. O `apps/web` permanecerá legado durante a migração e será usado apenas como referência de comportamento, fluxos e cobertura.

## Consequências

- Novas rotas e funcionalidades administrativas devem ser criadas em `apps/ui`.
- A paridade será validada por domínio antes de remover funcionalidades do `apps/web`.
- O `apps/ui` não deve importar o cliente HTTP do `apps/web`.
- A remoção do `apps/web` fica condicionada à validação final de paridade.

## Confirmação

```bash
test ! -d apps/ui/src/shared/lib/api-client
rg -n "apps/web|shared/lib/api-client" apps/ui/src && exit 1 || true
```

## Notas

Esta ADR define a sucessão da aplicação; a fronteira de dados e a topologia do gateway são decisões separadas.
