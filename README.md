# LiteLLM Analytics Dashboard

Dashboard de analytics para monitoramento de uso e custos de APIs LLM via [LiteLLM](https://github.com/BerriAI/litellm).

## Funcionalidades

- **Dashboard Principal**: Visão geral com métricas de spend, tokens, modelos ativos e erros
- **Gráficos Interativos**: Tendências de spend diário, distribuição de tokens, padrões horários de uso
- **Análise por Entidade**: Filtros por modelo, usuário e API key
- **Logs de Requisições**: Histórico detalhado de todas as chamadas com paginação
- **Error Tracking**: Monitoramento de erros com classificação por tipo (rate limit, timeout, auth)
- **Estatísticas de Modelos**: Latência p50/p95/p99, success rate, custos por token
- **Gerenciamento de Modelos**: CRUD completo com configuração de preços
- **Merge de Logs**: Consolidação de logs entre modelos

## Stack

| Camada   | Tecnologia                          |
| -------- | ----------------------------------- |
| Frontend | React 19, Vite 7, React Router 7    |
| UI       | shadcn/ui, Radix UI, Tailwind CSS 4 |
| Gráficos | Recharts                            |
| Backend  | Express.js                          |
| ORM      | Drizzle ORM                         |
| Database | PostgreSQL                          |
| Monorepo | Turborepo, pnpm                     |

## Estrutura do Projeto

```
lite-llm-analytics/
├── apps/
│   └── web/                    # Aplicação principal
│       └── src/
│           ├── components/      # Componentes UI (shadcn/ui)
│           ├── db/             # Schema e queries Drizzle
│           │   ├── schema.ts    # Definição das tabelas
│           │   ├── queries.ts   # Funções de consulta
│           │   └── client.ts    # Configuração do banco
│           ├── hooks/          # React hooks
│           ├── lib/            # Utilitários e API client
│           ├── pages/          # Páginas da aplicação
│           ├── server/         # API Express
│           │   ├── api-server.ts  # Rotas da API
│           │   └── db-server.ts  # Re-export das queries
│           ├── styles/         # CSS global
│           └── types/          # Definições TypeScript
├── package.json               # Root package (monorepo)
├── turbo.json                 # Configuração Turborepo
└── biome.json                 # Configuração Biome (linter)
```

## Tabelas do Banco

### LiteLLM_SpendLogs
Registro de todas as requisições aos modelos LLM.

| Campo             | Tipo      | Descrição                    |
| ----------------- | --------- | ---------------------------- |
| request_id        | varchar   | ID único da requisição (PK)  |
| model             | varchar   | Nome do modelo utilizado     |
| user              | varchar   | Usuário que fez a requisição |
| total_tokens      | integer   | Total de tokens utilizados   |
| prompt_tokens     | integer   | Tokens de input              |
| completion_tokens | integer   | Tokens de output             |
| spend             | real      | Custo da requisição          |
| startTime         | timestamp | Início da requisição         |
| endTime           | timestamp | Fim da requisição            |
| apiKey            | varchar   | Chave API utilizada          |
| status            | varchar   | Status (success/pending/etc) |

### LiteLLM_ProxyModelTable
Configuração de modelos e seus preços.

| Campo          | Tipo    | Descrição           |
| -------------- | ------- | ------------------- |
| model_name     | varchar | Nome do modelo (PK) |
| litellm_params | jsonb   | Parâmetros LiteLLM  |

### LiteLLM_ErrorLogs
Registro de erros ocorridos.

| Campo              | Tipo      | Descrição                  |
| ------------------ | --------- | -------------------------- |
| request_id         | varchar   | ID da requisição (PK)      |
| exception_type     | varchar   | Tipo da exceção            |
| litellm_model_name | varchar   | Modelo que originou o erro |
| request_kwargs     | jsonb     | Parâmetros da requisição   |
| exception_string   | text      | Mensagem do erro           |
| startTime          | timestamp | Quando ocorreu             |
| status_code        | integer   | Código HTTP do erro        |

## API Endpoints

### Spend & Usage
- `GET /spend/model` - Spend agrupado por modelo
- `GET /spend/user` - Spend agrupado por usuário
- `GET /spend/key` - Spend agrupado por API key
- `GET /spend/logs` - Logs detalhados (com filtros)
- `GET /spend/trend` - Tendência diária de spend

### Analytics
- `GET /metrics` - Métricas resumidas do dashboard
- `GET /analytics/tokens` - Distribuição de tokens por modelo
- `GET /analytics/performance` - Métricas de performance
- `GET /analytics/temporal` - Padrões de uso por hora
- `GET /analytics/keys` - Estatísticas detalhadas por API key
- `GET /analytics/cost-efficiency` - Custo por 1K tokens
- `GET /analytics/model-distribution` - Distribuição de requisições
- `GET /analytics/token-trend` - Tendência diária de tokens
- `GET /analytics/model-stats` - Estatísticas completas por modelo

### Models
- `GET /models` - Lista todos os modelos
- `POST /models` - Cria novo modelo
- `PUT /models/:name` - Atualiza modelo
- `DELETE /models/:name` - Remove modelo
- `POST /models/merge` - Mescla logs de um modelo em outro
- `DELETE /models/logs/:model` - Remove logs de um modelo

### Errors
- `GET /errors` - Lista de erros

## Setup

### 1. Pré-requisitos

- Node.js >= 20
- pnpm 9
- PostgreSQL 14+

### 2. Instalar dependências

```bash
pnpm install
```

### 3. Configurar variáveis de ambiente

Crie `apps/web/.env.local`:

```env
# Conexão com o banco LiteLLM
VITE_DB_HOST=localhost
VITE_DB_PORT=5432
VITE_DB_NAME=litellm
VITE_DB_USER=llmproxy
VITE_DB_PASSWORD=sua_senha

# Opcional: URL da API LiteLLM
VITE_LITELLM_API_URL=http://0.0.0.0:4000
VITE_LITELLM_API_KEY=sk-...
```

### 4. Iniciar o projeto

Desenvolvimento (roda frontend + API server):

```bash
pnpm dev
```

Produção:

```bash
pnpm build
pnpm start
```

## Scripts Disponíveis

| Comando          | Descrição                       |
| ---------------- | ------------------------------- |
| `pnpm dev`       | Inicia desenvolvimento          |
| `pnpm build`     | Build para produção             |
| `pnpm lint`      | Executa linter (Biome)          |
| `pnpm format`    | Formata código                  |
| `pnpm typecheck` | Verificação de tipos TypeScript |

## Páginas

| Rota           | Descrição                                   |
| -------------- | ------------------------------------------- |
| `/`            | Dashboard principal com métricas e gráficos |
| `/model-stats` | Estatísticas detalhadas por modelo          |
| `/logs`        | Logs de spend com filtros e paginação       |
| `/errors`      | Lista de erros com classificação            |
| `/models`      | Gerenciamento de modelos e preços           |

## License

MIT
