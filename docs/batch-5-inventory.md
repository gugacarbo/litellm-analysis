# Batch 5: inventário de consumidores LiteLLM

**Data:** 2026-06-16  
**Política:** cutover duro — runtime usa model-proxy; LiteLLM só em CLIs históricos.

---

## Env vars `LITELLM_*` / `DB_*`

| Variável | Runtime principal | Uso |
|----------|-------------------|-----|
| `MODEL_PROXY_DATABASE_URL` | **Sim** | Prisma model-proxy, backup, analytics default |
| `MODEL_PROXY_API_KEY` | **Sim** | Proxy local, health-check, configs geradas |
| `MODEL_PROXY_BASE_URL` | **Sim** | Health-check, prompt-eval |
| `ANALYTICS_DATA_SOURCE` | **Sim** | Default `model-proxy` |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | Opcional | Só `litellm` / `hybrid` / compare CLI |
| `DATABASE_URL` | Opcional | Backup legado, compare CLI |
| `LITELLM_API_URL`, `LITELLM_API_KEY` | **Removido** do runtime | — |
| `LITELLM_CLOUD_*` | Offline | `sync:cloud` CLI |

---

## Dependências `@lite-llm/litellm-repository`

| Pacote | Pós-Batch 5 |
|--------|-------------|
| `analytics-service` | Lazy load só em `litellm`/`hybrid` |
| `model-proxy-registry-service` | `devDependency` (import adapters) |
| `scripts` (compare, sync) | Mantém para CLIs |
| Apps runtime (`apps/server`) | Não importa prisma LiteLLM diretamente |

---

## `@storage/output` (gitignored)

Regenerar localmente:

```bash
pnpm generate:plugin-configs
```

Artefatos esperados: `opencode.json`, `vscode-oaicopilot.json`, `oh-my-openagent.json`, `model-aliases.json`, `agent-routing.json`.

---

## Compare gate (SA-7C)

Template quando DBs não estão disponíveis localmente:

```bash
pnpm analytics:compare-sources --days 7
# Requer DB_* (LiteLLM) + MODEL_PROXY_DATABASE_URL
# Gate PASS quando todas as métricas within_tolerance
```

_Executar com ambos os bancos populados após import histórico._

**2026-06-17:** Compare gate não executado neste ambiente (LiteLLM DB indisponível).
Código e queries user/key implementados; revalidar localmente com:

```bash
pnpm model-proxy:import-history   # se necessário
pnpm analytics:compare-sources --days 7
```

| Métrica | litellm | proxy | within_tolerance |
|---------|---------|-------|------------------|
| request_count | _pending_ | _pending_ | _pending_ |
| total_tokens | _pending_ | _pending_ | _pending_ |
| total_cost | _pending_ | _pending_ | _pending_ |

| Script | Classificação |
|--------|---------------|
| `pnpm dev`, `pnpm backup` | **Runtime** — model-proxy |
| `pnpm analytics:compare-sources` | **Ferramenta** — requer ambos DBs |
| `pnpm model-proxy:import-history` | **Offline/histórico** |
| `pnpm model-proxy:import-legacy` | **Offline/histórico** |
| `pnpm sync:cloud` | **Offline/histórico** — `LITELLM_CLOUD_*` |
| `pnpm backup:litellm` | **Offline/histórico** (alias) |

---

## Docs/skills históricos

- `.agents/skills/lite-llm-db-access/` — marcado import-only
- `docs/litellm-query-inventory.md` — referência histórica
