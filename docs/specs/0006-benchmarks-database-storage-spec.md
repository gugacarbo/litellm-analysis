---
status: draft
date: 2026-07-04
builds-on: []
implemented-by: []
---

# Persistir dados de benchmark do Artificial Analysis no banco de dados

> Convenções compartilhadas: `docs/context/CONVENTIONS.md`. Esta spec não as
> repete — só desvia delas explicitamente quando necessário.

## Objective

Que os dados de benchmark do Artificial Analysis (540 modelos, 27 métricas)
sejam persistidos no PostgreSQL via Drizzle ORM, permitindo queries relacionais,
joins com `model_proxy_models`, e servindo dados enriquecidos via API — em vez
de existirem apenas como JSON estático em `@storage/benchmarks/`.

## Flow

### 1. Migration — criar tabela `model_proxy_benchmarks`

1. Adiciona-se a definição da tabela em `repositories/database/src/schema/model-proxy.ts`.
2. Gera-se a migration com `pnpm db:generate`.
3. A migration é aplicada com `pnpm db:migrate`.

### 2. Repository — `repositories/benchmarks-repository/`

4. Cria-se o pacote `@lite-llm/benchmarks-repository` em `repositories/benchmarks-repository/`.
5. Implementa a interface `IBenchmarksRepository`:
   - `upsert(models: NormalizedModelBenchmark[]): Promise<void>` — UPSERT em batch
   - `getAll(): Promise<NormalizedModelBenchmark[]>` — SELECT all
   - `getById(id: string): Promise<NormalizedModelBenchmark | null>`
   - `count(): Promise<number>`
   - `clear(): Promise<void>` — DELETE all (útil para full sync)
6. O repository usa o client `db` de `@lite-llm/database`.

### 3. Sync script — atualizar `scripts/src/sync-aa-benchmarks/`

7. Após normalizar os dados e salvar os JSONs (comportamento existente
   preservado), o script também:
   - Conecta ao banco via `@lite-llm/database`
   - Chama `benchmarksRepository.clear()` para limpar dados antigos
   - Chama `benchmarksRepository.upsert(models)` para inserir o novo snapshot
   - Registra `fetchedAt` e `sourceUrl` no banco (via colunas dedicadas ou
     settings)
8. O script mantém a geração dos arquivos JSON como cache de fallback.

### 4. API — adaptar endpoint de benchmarks

9. O endpoint existente que serve `ModelBenchmarkApiResponse` passa a:
   - Ler benchmarks do banco via `IBenchmarksRepository.getAll()`
   - Fazer JOIN/merge com `model_proxy_models` para preencher `isConfigured`
     e `matchedConfiguredModel`
   - Retornar o mesmo formato de resposta (contract inalterado)

### 5. Validação

10. `pnpm typecheck` passa.
11. Testes do repository passam (usando `pg-mem` conforme CONVENTIONS.md).
12. Testes do sync script passam.
13. Endpoint de benchmarks retorna dados do banco.

## Contract

### Tabela `model_proxy_benchmarks`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | `uuid` PK, defaultRandom | ID do registro no banco |
| `aa_model_id` | `text` NOT NULL, UNIQUE | ID do modelo na API do Artificial Analysis |
| `name` | `text` NOT NULL | Nome de exibição do modelo |
| `slug` | `text` | Slug URL-friendly |
| `creator_id` | `text` | ID do creator/provider |
| `creator_name` | `text` NOT NULL | Nome do creator/provider |
| `creator_slug` | `text` | Slug do creator |
| `intelligence_index` | `double precision` | Artificial Analysis Intelligence Index |
| `coding_index` | `double precision` | Coding capability score |
| `math_index` | `double precision` | Math capability score |
| `mmlu_pro` | `double precision` | MMLU-Pro benchmark |
| `gpqa` | `double precision` | GPQA Diamond benchmark |
| `hle` | `double precision` | Humanity's Last Exam |
| `livecodebench` | `double precision` | LiveCodeBench |
| `scicode` | `double precision` | SciCode |
| `math_500` | `double precision` | MATH-500 |
| `aime` | `double precision` | AIME (math competition) |
| `aime_25` | `double precision` | AIME 2025 |
| `tau2` | `double precision` | Tau2 benchmark |
| `ifbench` | `double precision` | IFBench |
| `lcr` | `double precision` | LCR benchmark |
| `terminalbench_hard` | `double precision` | TerminalBench Hard |
| `price_input_1m_tokens` | `double precision` | Preço por 1M tokens de input (USD) |
| `price_output_1m_tokens` | `double precision` | Preço por 1M tokens de output (USD) |
| `price_blended_1m_tokens` | `double precision` | Preço blended 3:1 (USD) |
| `median_output_tokens_per_second` | `double precision` | Velocidade (tokens/s) |
| `median_ttft_seconds` | `double precision` | Tempo até primeiro token |
| `median_ttft_answer_seconds` | `double precision` | Tempo até primeiro token de resposta |
| `source_url` | `text` NOT NULL | URL da fonte (Artificial Analysis) |
| `fetched_at` | `timestamp` NOT NULL | Timestamp da sincronização |

### Interface `IBenchmarksRepository`

```typescript
export interface IBenchmarksRepository {
  upsert(models: NormalizedModelBenchmark[]): Promise<void>;
  getAll(): Promise<NormalizedModelBenchmark[]>;
  getByAaModelId(aaModelId: string): Promise<NormalizedModelBenchmark | null>;
  count(): Promise<number>;
  clear(): Promise<void>;
}
```

### API (inalterada — já existe)

O endpoint de benchmarks continua retornando `ModelBenchmarkApiResponse`
conforme definido em `packages/contracts/src/benchmarks.ts`. A única mudança é
a fonte dos dados: de leitura de JSON para leitura do banco.

## Edge cases

| # | WHEN ⟨trigger⟩ | the system MUST ⟨response⟩ |
|---|----------------|---------------------------|
| 1 | O banco está vazio (nunca houve sync) | a API retorna `models: []`, `count: 0`, `datasetExists: false` |
| 2 | O sync script é executado e o banco já tem dados | `clear()` remove todos os registros antigos antes do `upsert()` |
| 3 | Um modelo some da API do Artificial Analysis entre syncs | o modelo é removido na próxima sincronização (full replace) |
| 4 | A API do Artificial Analysis adiciona um novo campo de avaliação | o sync script normaliza o que conhece; campos desconhecidos são ignorados até que o schema seja atualizado |
| 5 | O banco está indisponível durante o sync | o script loga o erro e ainda salva os JSONs de fallback; o status do sync vai para `failed` |
| 6 | A migration `model_proxy_benchmarks` já foi aplicada | `db:migrate` é idempotente — não reaplica |
| 7 | `model_proxy_models` tem um modelo com nome que não existe nos benchmarks | `isConfigured: true` mas `matchedConfiguredModel: null` (modelo configurado sem benchmark correspondente) |

## Open questions

- [ ]

## Definition of Done

```bash
pnpm typecheck                    # exit 0
pnpm test                         # todos os testes passam
pnpm --filter @lite-llm/database db:generate   # gera migration sem erros
pnpm --filter @lite-llm/database db:migrate    # aplica migration sem erros
```

## Human review

- Verificar se a migration gerada está correta (nomes de colunas, tipos)
- Validar que o endpoint de benchmarks retorna os mesmos campos de antes

## Verification

```text
(fill in at close)
```
