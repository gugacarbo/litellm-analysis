---
status: implemented
date: 2026-07-20
builds-on:
  - ADR-0002
  - ADR-0004
  - ADR-0006
  - ADR-0007
  - SPEC-0006
implemented-by:
  - apps/ui/src/features/benchmarks
  - apps/ui/src/routes/_protected/benchmarks
  - database/src/schema/model-proxy/benchmarks.ts
  - repositories/benchmarks-repository/src
---

# Visualizar snapshots de benchmarks AA e OpenRouter na UI

Usuários autenticados leem snapshots persistidos de Artificial Analysis e
OpenRouter; somente administradores sincronizam cada catálogo manualmente.

## Objetivo

As rotas protegidas `/benchmarks/aa` e `/benchmarks/openrouter` exibem busca,
filtros, ordenação, paginação, data da coleta e atribuição. A leitura nunca
resolve um segredo nem consulta um fornecedor externo.

## Contrato

- `benchmark_snapshots` mantém somente o snapshot atual por catálogo;
  `benchmark_snapshot_entries` preserva projeções pesquisáveis e payload nativo.
- A sincronização valida a resposta inteira antes de substituir, em transação,
  somente o catálogo solicitado. Falhas deixam o snapshot anterior intacto.
- Server functions exigem sessão para leitura e `admin` antes de criar serviço,
  resolver chave cifrada ou chamar upstream. Erros públicos são
  `UNAUTHENTICATED`, `FORBIDDEN`, `SNAPSHOT_NOT_FOUND`,
  `CREDENTIAL_NOT_CONFIGURED`, `UPSTREAM_UNAVAILABLE` e
  `UPSTREAM_RATE_LIMIT`.
- OpenRouter coleta `artificial-analysis` e `design-arena` separadamente e
  preserva subfonte/atribuição por item. Quando `meta` é nulo, usa o endpoint
  público específico da subfonte como atribuição; ELO e índices AA não formam
  um ranking único.

## Casos de borda

| #   | QUANDO ⟨gatilho⟩               | o sistema DEVE ⟨resposta⟩                                             |
| --- | ------------------------------ | --------------------------------------------------------------------- |
| 1   | um viewer sincroniza           | retornar `FORBIDDEN` antes de resolver serviço ou segredo             |
| 2   | não existe snapshot            | retornar `SNAPSHOT_NOT_FOUND` e manter estado configurável na tela    |
| 3   | OpenRouter retorna `meta` nulo | atribuir cada entrada pela sua subfonte sem cruzar URLs/citações      |
| 4   | upstream falha ou limita       | manter snapshot anterior e retornar erro público retryable apropriado |

## Questões em aberto

Nenhuma.

## Definition of Done

```bash
pnpm --filter ui exec vitest run src/features/benchmarks/server/normalizers.test.ts src/features/benchmarks/server/benchmarks.handlers.test.ts # exit 0; casos 1 e 3
pnpm --filter ui typecheck # exit 0
pnpm --filter @lite-llm/database test:migrations # exit 0 com TEST_DATABASE_URL guardada; caso 4
```

## Revisão humana

- Conferir a legibilidade das duas tabelas e dos filtros em viewport estreita.

## Verificação

```text
Implementação e testes focados executados nesta entrega; ver evidência da issue #5.
```
