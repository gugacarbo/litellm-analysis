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
| Database | PostgreSQL (`MODEL_PROXY_DATABASE_URL`) |
| Monorepo | Turborepo, pnpm                     |

## Quick start

```bash
cp .env.example .env
# Configure MODEL_PROXY_DATABASE_URL, MODEL_PROXY_API_KEY, MODEL_PROXY_BASE_URL

pnpm install
pnpm --filter @lite-llm/model-proxy-repository db:generate
pnpm dev   # web :5178, API :3008
```

## Variáveis de ambiente (runtime)

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `MODEL_PROXY_DATABASE_URL` | Sim | PostgreSQL do proxy (`model_proxy_*`) |
| `MODEL_PROXY_API_KEY` | Sim | Chave do proxy local |
| `MODEL_PROXY_BASE_URL` | Recomendada | Base URL `/v1` para health-check |
## Settings no banco

Agents, plugins e models vivem em `model_proxy_settings` e `model_proxy_*`. `@settings` vira seed/backup opcional.

```bash
pnpm db:up && pnpm db:migrate
pnpm settings:import --dry-run   # conferir mapeamento
pnpm settings:import             # importar @settings → PostgreSQL
pnpm dev
pnpm settings:export             # snapshot opcional para git
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
