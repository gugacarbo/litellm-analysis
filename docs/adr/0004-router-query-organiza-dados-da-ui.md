---
status: proposed
date: 2026-07-09
builds-on: [ADR-0001, ADR-0002]
superseded-by: null
deciders: ["produto", "engenharia"]
---

# Router e Query organizam os dados da UI

## Contexto e problema

A reconstrução precisa lidar com dados de rota, cache compartilhado, refetch, mutações e invalidação em vários domínios. O `apps/web` atual usa hooks sobre clientes HTTP independentes, o que não deve ser reproduzido.

## Direcionadores da decisão

- Dados essenciais devem estar disponíveis antes da renderização da rota.
- Cache e invalidação devem ser consistentes entre telas.
- Mutações devem atualizar as consultas relacionadas sem cópias manuais de estado.
- A estratégia deve se integrar às server functions da ADR-0002.

## Opções consideradas

### Opção 1 — Router loaders + TanStack Query

**Prós:** separa dados críticos de cache reativo e oferece primitives maduras para mutações e invalidação.
**Contras:** exige definir query keys e evitar duplicação entre loaders e queries.

### Opção 2 — Somente estado local por tela

**Prós:** baixo custo inicial.
**Contras:** perde cache compartilhado, refetch previsível e consistência entre rotas.

### Opção 3 — TanStack DB como camada principal

**Prós:** modelo reativo e sincronização local mais ampla.
**Contras:** adiciona uma camada beta desnecessária para a primeira migração.

## Decisão

O TanStack Router fará o carregamento mínimo necessário para entrada de rota. TanStack Query gerenciará cache, estados de carregamento, refetch, mutações e invalidação. Todas as query functions e mutation functions chamarão server functions, nunca endpoints HTTP manuais.

## Consequências

- Cada domínio deve definir query keys estáveis e políticas de invalidação.
- Loader e Query não devem manter duas fontes de verdade para o mesmo dado.
- A UI deve tratar erro, carregamento e sessão expirada como estados explícitos.
- A migração pode portar comportamento sem portar a estrutura de hooks HTTP atual.

## Confirmação

```bash
rg -n "useQuery|useMutation|loader" apps/ui/src/routes apps/ui/src/features 2>/dev/null
rg -n "fetch\(|/api/|API_BASE" apps/ui/src && exit 1 || true
```

## Notas

O uso de TanStack DB permanece fora da primeira implementação e exigirá uma nova decisão caso se torne necessário.
