# Batch 5: decisões fechadas (RFC)

**Status:** fechado (Onda 0)  
**Data:** 2026-06-16  
**Escopo:** cutover duro para model-proxy, remoção de shims runtime, backup/docs/env  
**Plano de implementação:** [litellm-removal-batch-5-implementation-plan.md](./litellm-removal-batch-5-implementation-plan.md)

---

## 1. Cutover duro

- Default `ANALYTICS_DATA_SOURCE=model-proxy` no runtime (`packages/config/src/server.ts`).
- `pnpm dev` sobe com `MODEL_PROXY_DATABASE_URL` — **sem** PostgreSQL LiteLLM obrigatório.
- Rotas HTTP expõem apenas `ProxyRequestLog` (spend/logs) e `modelRoute` (models).
- Shims removidos das rotas: `litellmParams`, `litellm-alias`, `SpendLogEntry`.

## 2. Modos legados (somente CLIs)

| Modo | Uso |
|------|-----|
| `litellm` | Compare/import histórico com `DB_*` / `DATABASE_URL` |
| `hybrid` | `pnpm analytics:compare-sources` — totais SQL, sem teto 1000 rows |
| `model-proxy` | **Runtime default** — dashboard, monitor, API |

## 3. Janela de adapters

- Import histórico permanece offline: `model-proxy:import-history`, `model-proxy:import-legacy`, `sync:cloud`.
- `LITELLM_CLOUD_*` e `LITELLM_API_*` **não** fazem parte do runtime principal.
- `@storage/output` é regenerado localmente (`pnpm generate:plugin-configs`); artefatos gitignored.

## 4. Backup operacional

- `pnpm backup` / `backup:list` miram `MODEL_PROXY_DATABASE_URL` (schema `model_proxy_*`).
- Prefixo de arquivo: `model_proxy_*` (não `litellm_*`).
- Alias opcional `backup:litellm` só para import histórico.

## 5. `litellm-repository`

- Pacote permanece no monorepo para CLIs compare/import.
- **Não** é dependência de runtime em modo `model-proxy`.
- `model-proxy-registry-service`: `litellm-repository` como `devDependency` (adapters de import).

## 6. Critérios de pronto

- [x] `pnpm dev` sem container LiteLLM (DB_* opcional com `model-proxy`)
- [x] Dashboard/logs com default `model-proxy` (user/key analytics via ledger)
- [x] `pnpm backup` no banco model-proxy
- [x] `.env.example` e README sem `LITELLM_API_*` como runtime
- [x] Rotas sem `litellmParams`, `SpendLogEntry`, plugin `litellm-alias`
- [x] `pnpm test` + `pnpm build` verdes (33 test tasks, 20 build tasks — 2026-06-17)

## 7. Sprint 6 — decisões pendentes do plano mestre (RFC)

**Status:** fechado (2026-06-17)

| Decisão (plano mestre) | Escolha |
|------------------------|---------|
| Proxy como rota do server vs processo separado | **Rota do server** (`registerModelProxyRoutes` em `@lite-llm/server`) — já implementado |
| Credenciais no banco local | **`secret_ref` + env** (Batch 3); `api_key` legado só em import; configs geradas nunca expõem upstream |
| Adapter Anthropic nativo | **Adiado** — upstream via OpenAI-compatible; sem adapter Anthropic neste ciclo |
| Janela adapters `litellm*` | **Somente CLIs offline** (`import-history`, `import-legacy`, `sync:cloud`, `analytics:compare-sources`); sem novos shims runtime |
| `model_proxy_usage_adjustments` | **Implementado** — tabela + deltas em analytics agregados e `ProxyRequestLog` |
| `POST /v1/responses` | **Stub 501** — documentado; clientes devem usar `/v1/chat/completions` |
| Root `tsc` vs `turbo typecheck` | Root `tsconfig.json` com `"files": []` — typecheck por pacote via `pnpm typecheck` (turbo) |

