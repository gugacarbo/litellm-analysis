---
status: proposed
date: 2026-07-09
builds-on: [ADR-0001, ADR-0002]
superseded-by: null
deciders: ["produto", "engenharia"]
---

# UI e gateway Hebo operam como runtimes separados

## Contexto e problema

O `apps/server` atual reúne gateway/proxy, rotas administrativas, sincronizações, health checks e adaptadores HTTP. A nova direção mantém o Hebo como gateway, mas move a administração para server functions do TanStack Start.

## Direcionadores da decisão

- Manter o gateway de inferência isolado das telas administrativas.
- Evitar que a UI dependa de rotas REST do `apps/server`.
- Preservar credenciais, roteamento de modelos e logging no lado servidor.
- Permitir deploy, escala e troubleshooting independentes.

## Opções consideradas

### Opção 1 — Runtimes separados

**Prós:** reduz acoplamento, mantém o gateway especializado e facilita migração progressiva.
**Contras:** exige configuração operacional para dois processos e uma fronteira interna clara.

### Opção 2 — Integrar gateway ao runtime TanStack Start

**Prós:** simplifica o número de processos.
**Contras:** aumenta acoplamento entre UI, SSR, administração e tráfego de inferência.

## Decisão

O TanStack Start hospedará a UI e suas server functions. O gateway Hebo continuará como processo separado, responsável pelo proxy de inferência, resolução de upstream, credenciais de provider e logging relacionado ao tráfego. As rotas administrativas HTTP do `apps/server` serão aposentadas conforme a nova UI cubra seus domínios.

## Consequências

- O runtime da UI acessará serviços e banco server-side sem usar o gateway como API administrativa.
- O gateway continuará sendo o único caminho para o tráfego de inferência compatível com o proxy.
- Configuração de modelos poderá ser alterada pela UI, mas será executada e persistida no servidor.
- Deploy e ambiente local precisarão iniciar os dois runtimes.
- Rotas antigas só permanecerão enquanto servirem consumidores externos ou durante a migração.

## Confirmação

```bash
rg -n "registerAllRoutes|/analytics|/providers|/models|/health-check" apps/ui/src && exit 1 || true
rg -n "Hebo|model-proxy|/v1" apps/server/src packages/server/src | head
```

## Notas

Esta ADR não autoriza o browser a chamar o gateway diretamente para operações administrativas; essa regra é definida pela ADR-0002.
