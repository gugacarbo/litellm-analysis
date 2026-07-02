# LiteLLM Analytics Dashboard

Dashboard de analytics para monitoramento de uso, custos e erros de LLMs via **model proxy local** (`model_proxy_*`).

## Funcionalidades

- **Dashboard**: métricas de spend, tokens, modelos ativos e erros
- **Logs nativos**: `ProxyRequestLog` do ledger `model_proxy_requests`
- **Model registry**: rotas em `model_proxy_models` + settings em `model_proxy_settings`
- **Health-check / monitor**: proxy local OpenAI-compatible
- **Agent routing**: plugins com provider `local-proxy`

## Stack

| Camada   | Tecnologia                          |
| -------- | ----------------------------------- |
| Frontend | React 19, Vite 7, React Router 7    |
| UI       | shadcn/ui, Tailwind CSS 4           |
| Backend  | Express.js                          |
| Database | PostgreSQL (`DATABASE_URL`) |
| Monorepo | Turborepo, pnpm                     |

## Quick start

```bash
cp .env.example .env
# Configure DATABASE_URL, MODEL_PROXY_API_KEY, MODEL_PROXY_BASE_URL

pnpm install
pnpm --filter @lite-llm/database db:generate
pnpm dev   # web :5178, API :3008
```

## Variáveis de ambiente (runtime)

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `DATABASE_URL` | Sim | PostgreSQL do proxy (`model_proxy_*`) |
| `MODEL_PROXY_API_KEY` | Sim | Chave do proxy local |
| `MODEL_PROXY_BASE_URL` | Recomendada | Base URL `/v1` para health-check |
## Database as single source of truth

Agents, plugins e models são lidos e escritos exclusivamente no PostgreSQL (`model_proxy_settings` e `model_proxy_*`). O diretório `@settings/` foi removido — não há mais seed/backup via arquivos JSONC.

```bash
pnpm db:up && pnpm db:migrate
pnpm dev
```

## Operação

```bash
pnpm backup              # pg_dump do banco model-proxy
pnpm backup:list
pnpm generate:plugin-configs   # @storage/output (local, gitignored)
```

## Documentação

- [AGENTS.md](./AGENTS.md) — mapa do monorepo
- [docs/litellm-legacy-support-inventory.md](./docs/litellm-legacy-support-inventory.md) — remoção do suporte legado (2026-06-17)
