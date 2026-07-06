# Infraestrutura

> Estado atual, imperativo e atemporal. Carregar ao configurar ambiente, deploy ou diagnosticar infra.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Runtime | Node.js (monorepo pnpm + Turborepo) |
| Linguagem | TypeScript |
| Banco de dados | PostgreSQL (único banco) |
| ORM | Drizzle ORM (`drizzle-orm` + `drizzle-kit`) |
| Servidor | Express (apps/server) |
| Frontend | Web app (apps/web) |
| Proxy LLM | TypeScript (services/model-proxy) — substituiu LiteLLM |

## Banco de dados

### Conexão
- **Única variável:** `DATABASE_URL` (PostgreSQL connection string).
- Configurada em `@lite-llm/config/server`.
- `.env.example` e `.env.local` contêm a variável.

### Tabelas do proxy (`model_proxy_*`)
| Tabela | Propósito |
|--------|-----------|
| `model_proxy_requests` | Ledger de chamadas LLM (request, tokens, custo, latência, erro) |
| `model_proxy_messages` | Mensagens individuais por request |
| `model_proxy_usage_adjustments` | Correções manuais/importadas de uso |
| `model_proxy_models` | Registry de modelos roteáveis |
| `model_proxy_providers` | Configuração de providers upstream |
| `model_proxy_api_keys` | Chaves locais de autenticação do proxy |
| `model_proxy_settings` | Configurações operacionais (chave-valor JSON) |
| `model_proxy_aliases` | Aliases de roteamento |
| `model_proxy_import_jobs` | Registro de importações de dados legados |
| `model_proxy_benchmarks` | Benchmarks de modelos (Artificial Analysis, OpenRouter) |

### Migrations
- Local: `repositories/database/drizzle/`.
- Comandos: `db:generate`, `db:migrate`, `db:push`, `db:studio` (via `drizzle-kit`).
- **Migrations são descartáveis** — o schema Drizzle é a fonte da verdade.
- Package: `@lite-llm/database` (`pnpm --filter @lite-llm/database db:migrate`).

## Ambiente local

### Pré-requisitos
- Node.js (ver `.nvmrc` ou `package.json` engines).
- PostgreSQL rodando (instância local ou Docker).
- pnpm instalado.

### Variáveis de ambiente
```bash
DATABASE_URL=postgresql://user:password@localhost:5432/lite_llm_analytics
MODEL_PROXY_API_KEY=dev-key-123   # bootstrap para dev
OPENROUTER_API_KEY=sk-or-...      # para sync de benchmarks do OpenRouter
```

### Comandos
```bash
pnpm install                       # instalar dependências
pnpm --filter @lite-llm/database db:migrate   # aplicar migrations
pnpm dev                           # subir server + web + proxy
pnpm typecheck                     # validar tipos
pnpm test                          # rodar testes
```

## Deploy

### O que é self-hosted
- **PostgreSQL:** instância própria (não gerenciada por cloud).
- **Model Proxy TS:** roda no mesmo processo Express do server.
- **Nenhum container LiteLLM** — removido do deploy.

### O que NUNCA usar
- `prisma` CLI ou `@prisma/client` (substituído por Drizzle).
- `better-sqlite3` (substituído por PostgreSQL).
- `LITELLM_API_URL` / `LITELLM_API_KEY` (substituído por `MODEL_PROXY_*`).
- Docker do LiteLLM.

### CI
- Workflow `docs-check` em `.github/workflows/docs-check.yml`.
- Valida imutabilidade de ADRs e consistência de docs.

## Estrutura de packages

```
repositories/
  database/          # @lite-llm/database — schemas Drizzle + client PostgreSQL
  model-proxy-repository/  # re-exporta de database (barrel público)
  app-repository/    # re-exporta de database (barrel público)
  agents-repository/ # agentes (Drizzle)
  models-repository/ # modelos (Drizzle)
services/
  model-proxy/       # proxy LLM TypeScript
  llm-config-service/          # CRUD de registry
  analytics-service/ # queries de analytics (raw SQL via Drizzle)
  agent-plugins/     # plugins de agentes
  llm-gateway/       # gateway/resolver upstream
packages/
  config/            # @lite-llm/config — configuração centralizada
  server/            # rotas e lógica do servidor
  agents-manager/    # gerenciamento de agentes
  monitor/           # health checks
apps/
  server/            # entry point Express
  web/               # frontend
```
