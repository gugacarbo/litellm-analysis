---
status: draft
date: 2026-07-04
builds-on: []
implemented-by: []
---

# Decisions for Benchmarks Database Storage

> Captura as decisões da Fase 1 (brainstorm) para persistir dados de benchmark
> do Artificial Analysis no PostgreSQL.

## Summary

Hoje os benchmarks do Artificial Analysis (540 modelos, 27 métricas) são
baixados e salvos apenas como JSON estático em `@storage/benchmarks/`. Esta
feature adiciona uma tabela `model_proxy_benchmarks` no PostgreSQL (Drizzle ORM)
para permitir queries relacionais, joins com `model_proxy_models`, e servir
dados enriquecidos via API.

## Chosen Approach

**Tabela plana `model_proxy_benchmarks`** com 27 colunas tipadas (uma por campo
do `NormalizedModelBenchmark`) + metadados (`fetched_at`, `source_url`).

O sync script (`scripts/src/sync-aa-benchmarks/`) passa a escrever no banco
via um novo `repositories/benchmarks-repository/`, mantendo o JSON como cache
de fallback. A API de benchmarks existente passa a ler do banco.

## Requirements Shaping These Decisions

- JOINs com `model_proxy_models` para enriquecer benchmarks com status de
  configuração (`isConfigured`, `matchedConfiguredModel`)
- Manter compatibilidade com os contracts existentes em
  `packages/contracts/src/benchmarks.ts`
- Seguir o padrão de nomenclatura `model_proxy_*` do projeto
- Usar Drizzle ORM (único ORM permitido — ADR-0004, CONVENTIONS.md)

## Constraints

- PostgreSQL é a única fonte de verdade (ADR-0006: dual-read/single-write)
- Drizzle ORM exclusivo — sem raw SQL para operações CRUD
- Schema Drizzle é a fonte de verdade para migrations
- Manter `@storage/benchmarks/*.json` como cache de fallback (não remover)
- Contracts em `packages/contracts/src/benchmarks.ts` não devem ser alterados
  (são consumidos pelo frontend)

## Assumptions

- A tabela armazena apenas o snapshot mais recente (sem versionamento histórico)
- O sync script faz UPSERT (sobrescreve registros existentes pelo `id` do modelo)
- O endpoint de API de benchmarks já existe e só precisa ser adaptado para ler
  do banco
- Não há necessidade de migrar dados existentes do JSON para o banco — o
  próximo sync popula a tabela

## Non-Goals

- Versionamento histórico de benchmarks
- UI nova de comparação de modelos
- Tabela separada para creators/providers (usamos campos inline)
- Alterar os contracts TypeScript existentes
- Sincronização incremental/parcial (sempre full sync)

## Risks and Tradeoffs

- **Risco:** Se o schema da API do Artificial Analysis mudar, a tabela plana
  precisa de migration. **Mitigação:** O sync script já normaliza os dados;
  adicionar novos campos é uma migration aditiva simples.
- **Tradeoff:** Tabela plana vs JSONB — escolhemos plana para ter tipagem forte
  nas queries Drizzle e seguir o padrão do projeto. Perdemos flexibilidade,
  mas os 27 campos são estáveis.

## Alternatives Considered

| Option | Why it was not chosen |
| ------ | --------------------- |
| JSONB único com todos os scores | Perde tipagem nas queries SQL, vai contra o padrão de colunas tipadas do projeto |
| EAV (entity-attribute-value) | Complexidade desnecessária para 27 campos estáveis; performance pior em queries de ranking |
| Tabela separada para creators | Over-engineering; `creatorId`/`creatorName`/`creatorSlug` são suficientes como colunas inline |

## Open Questions

- [ ]

## Carry Forward to Spec

- [x] Nome da tabela: `model_proxy_benchmarks`
- [x] Estrutura: flat com 27 colunas + metadados
- [x] Novo pacote: `repositories/benchmarks-repository/`
- [x] Sync script atualizado para escrever no banco
- [x] API existente adaptada para ler do banco
- [x] Migration Drizzle para criar a tabela
