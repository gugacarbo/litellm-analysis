# Dual-Mode Architecture: API-Only + Database

## TL;DR

> **Quick Summary**: Dividir o app em dois modos de operação — "API-only" (quando só tem LiteLLM Proxy URL+Key) e "Database" (quando tem acesso direto ao PostgreSQL). Ambos os modos compartilham a mesma UI, mas usam data sources diferentes via Adapter Pattern. Um badge no sidebar indica o modo ativo, e componentes condicionais mostram/escondem features baseado nas capacidades disponíveis.
> 
> **Deliverables**:
> - Server mode detection (auto-detecção via env vars)
> - Adapter Pattern com interface `AnalyticsDataSource` + duas implementações
> - `ApiDataSource` consumindo LiteLLM Proxy endpoints
> - Refatoração do `DatabaseDataSource` existente para implementar a interface
> - UI context provider com `capabilities` para renderização condicional
> - Sidebar com badge de modo + itens condicionais
> - Pages adaptadas para renderizar baseado em capacidades
> - Feature flags/capabilities documentadas
> 
> **Estimated Effort**: Large
> **Parallel Execution**: YES - 5 waves
> **Critical Path**: T1 (types) → T3/T4 (adapters) → T5 (server) → T6 (context) → T7 (sidebar) → T8-T11 (pages) → T12 (integration) → F1-F4

---

## Context

### Original Request
"Quero dividir o app em duas partes — uma para quando tiver somente a chave de API e URL válidas e outra quando tiver acesso ao banco de dados. Não sei quais dados a API do LiteLLM prove, mas quero ter a maior parte dos dados possíveis no modo API-only. Quero que faça algo como um toggle do elemento exibido dependendo do modo do server."

### Interview Summary
**Key Discussions**:
- Modo API-only deve cobrir o máximo possível do dashboard
- Toggle visual no sidebar para indicar modo ativo
- Componentes que dependem de dados indisponíveis devem ser ocultados ou mostrar placeholder informativo
- Não duplicar lógica de UI — Adapter Pattern com interface unificada

**Research Findings**:
- LiteLLM Proxy API fornece: `/global/spend/report` (por model/user/key), `/spend/logs`, `/daily_metrics`, `/user/daily/activity`, `/key/info`, `/team/info`, `/v1/models`, `/metrics` (Prometheus)
- Banco PostgreSQL tem: SpendLogs, ProxyModelTable, ErrorLogs — permite aggregações customizadas (p50/p95/p99 latency, hourly patterns, etc.)
- App atual é 100% database-mode: Express server faz SQL queries via Drizzle ORM
- Frontend fala com Express server próprio (não com LiteLLM diretamente)
- Hooks customizados (`useDashboardData`) chamam `api-client.ts` que chama o Express server

### Metis Review (Self-Analysis)
**Identified Gaps** (addressed):
- Gap: "Como o server Express sabe qual modo usar?" → Resolvido: env vars determinam modo. Se VITE_DB_HOST existe → database, senão se VITE_LITELLM_API_URL+VITE_LITELLM_API_KEY existem → api-only
- Gap: "O server Express vira proxy para a API do LiteLLM no modo api-only?" → Resolvido: Sim, o Express atua como BFF (Backend-for-Frontend), chamando a API do LiteLLM e normalizando dados
- Gap: "Como o frontend sabe o modo?" → Resolvido: Endpoint `/api/mode` retorna `{ mode, capabilities }`. O frontend consulta isso ao inicializar
- Gap: "O que acontece se ambos DB e API estão configurados?" → Resolvido: DB tem prioridade (mais dados disponíveis)
- Gap: "As rotas de CRUD de modelos no modo api-only?" → Resolvido: No modo api-only, usa `/model/new`, `/model/update`, `/model/delete` do proxy LiteLLM

---

## Work Objectives

### Core Objective
Criar uma arquitetura dual-mode onde o app funciona completamente com apenas API key+URL do LiteLLM Proxy, e em modo completo quando tem acesso ao banco de dados.

### Concrete Deliverables
- `apps/server/src/data-source.ts` — Interface `AnalyticsDataSource` com capabilities
- `apps/server/src/api-data-source.ts` — Implementação que chama LiteLLM Proxy API
- `apps/server/src/db-data-source.ts` — Refatoração das queries existentes para implementar a interface
- `apps/server/src/api-server.ts` — Rotas condicionais baseadas no modo detectado
- `apps/web/src/lib/server-mode.ts` — Detecção de modo + tipos
- `apps/web/src/hooks/use-server-mode.tsx` — React context provider
- `apps/web/src/components/layout/sidebar.tsx` — Badge de modo + nav condicional
- `apps/web/src/pages/*.tsx` — Componentes condicionais por capability

### Definition of Done
- [ ] App inicia com apenas `LITELLM_API_URL` + `LITELLM_API_KEY` e funciona
- [ ] App inicia com credenciais DB e funciona como antes
- [ ] Badge no sidebar mostra "🟢 Full Access" ou "🟡 API Mode"
- [ ] Componentes que dependem de dados indisponíveis em API mode são ocultados com mensagem informativa
- [ ] Zero duplicação de lógica de UI entre modos
- [ ] Todos os endpoints existentes continuam funcionando em modo database

### Must Have
- Detecção automática do modo via env vars
- Interface `AnalyticsDataSource` com method signatures idênticas + capabilities
- ApiDataSource cobrindo 80%+ dos dados do dashboard
- Capabilities flag system para renderização condicional
- Server-side mode detection com fallback graceful

### Must NOT Have (Guardrails)
- NÃO duplicar componentes de UI para cada modo
- NÃO criar dois apps separados — é UM app com dois data sources
- NÃO quebrar funcionalidade existente em modo database
- NÃO adicionar over-engineering: sem state management complexo, sem DI containers
- NÃO adicionar JSDoc excessivo — comentários mínimos necessários
- NÃO modificar o schema do banco de dados existente

---

## Verification Strategy

> **ZERO HUMAN INTERVENTION** - ALL verification is agent-executed. No exceptions.

### Test Decision
- **Infrastructure exists**: NO (no test framework found)
- **Automated tests**: NO — focused on agent-executed QA scenarios
- **Framework**: None (no test setup)
- **Agent-Executed QA**: ALWAYS (mandatory for all tasks)

### QA Policy
Every task MUST include agent-executed QA scenarios.
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **Frontend/UI**: Use Playwright (playwright skill) - Navigate, interact, assert DOM, screenshot
- **TUI/CLI**: Use interactive_bash (tmux) - Run command, validate output
- **API/Backend**: Use Bash (curl) - Send requests, assert status + response fields
- **Library/Module**: Use Bash (bun/node REPL) - Import, call functions, compare output

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately - foundation + types):
├── Task 1: Type definitions + capabilities spec [quick]
├── Task 2: Env vars configuration + mode detection logic [quick]
└── Task 3: AnalyticsDataSource interface [quick]

Wave 2 (After Wave 1 - adapters, MAX PARALLEL):
├── Task 4: DatabaseDataSource implementation [deep]
├── Task 5: ApiDataSource implementation [deep]
├── Task 6: Express server refactoring + mode routing [unspecified-high]
└── Task 7: Vite proxy config for API mode [quick]

Wave 3 (After Wave 2 - frontend context + UI):
├── Task 8: ServerMode context provider + hook [quick]
├── Task 9: Sidebar mode badge + conditional nav [visual-engineering]
├── Task 10: CapabilityGuard component [quick]
└── Task 11: ApiClient refactoring for mode-aware requests [unspecified-high]

Wave 4 (After Wave 3 - page adaptations):
├── Task 12: Dashboard page adaptation [unspecified-high]
├── Task 13: Logs page adaptation [quick]
├── Task 14: Model Stats page adaptation [unspecified-high]
├── Task 15: Errors page adaptation (conditional) [quick]
└── Task 16: Models page adaptation (conditional) [unspecified-high]

Wave 5 (After Wave 4 - integration + polish):
├── Task 17: End-to-end integration testing [deep]
└── Task 18: Documentation + env vars example [writing]

Wave FINAL (After ALL tasks — 4 parallel reviews, then user okay):
├── Task F1: Plan compliance audit (oracle)
├── Task F2: Code quality review (unspecified-high)
├── Task F3: Real manual QA (unspecified-high)
└── Task F4: Scope fidelity check (deep)
-> Present results -> Get explicit user okay

Critical Path: T1 → T3 → T5 → T6 → T11 → T12 → T17 → F1-F4
Parallel Speedup: ~60% faster than sequential
Max Concurrent: 4 (Wave 2)
```

### Dependency Matrix

| Task | Depends On | Blocks |
|------|-----------|--------|
| 1 | - | 3, 4, 5, 8 |
| 2 | - | 6, 7, 8 |
| 3 | 1 | 4, 5, 6 |
| 4 | 1, 3 | 12, 14 |
| 5 | 1, 3 | 12, 14 |
| 6 | 2, 3 | 11 |
| 7 | 2 | 11 |
| 8 | 1, 2 | 9, 10 |
| 9 | 8 | 12 |
| 10 | 8 | 12, 13, 14, 15, 16 |
| 11 | 6, 7 | 12, 13, 14, 15, 16 |
| 12 | 4, 5, 9, 10, 11 | 17 |
| 13 | 10, 11 | 17 |
| 14 | 4, 5, 10, 11 | 17 |
| 15 | 10, 11 | 17 |
| 16 | 10, 11 | 17 |
| 17 | 12-16 | F1-F4 |

### Agent Dispatch Summary

- **Wave 1**: 3 tasks - T1-T3 → `quick`
- **Wave 2**: 4 tasks - T4 → `deep`, T5 → `deep`, T6 → `unspecified-high`, T7 → `quick`
- **Wave 3**: 4 tasks - T8 → `quick`, T9 → `visual-engineering`, T10 → `quick`, T11 → `unspecified-high`
- **Wave 4**: 5 tasks - T12 → `unspecified-high`, T13 → `quick`, T14 → `unspecified-high`, T15 → `quick`, T16 → `unspecified-high`
- **Wave 5**: 2 tasks - T17 → `deep`, T18 → `writing`
- **FINAL**: 4 tasks - F1 → `oracle`, F2 → `unspecified-high`, F3 → `unspecified-high`, F4 → `deep`

---

## TODOs

- [x] 1. Type System — Shared Analytics Types + Capability Flags

  **What to do**:
  - Criar `apps/web/src/types/analytics.ts` com todas as interfaces tipadas que ambas fontes (DB e API) devem retornar
  - Migrar tipos de `dashboard.ts` para o novo arquivo, mantendo backward compatibility
  - Definir `AnalyticsCapabilities` interface com flags: `errorLogs`, `detailedLatency`, `modelManagement`, `logMerge`, `hourlyPatterns`
  - Definir `ServerMode` type union: `'database' | 'api-only'`
  - Definir `ServerModeConfig` interface com campos: `mode`, `litellmApiUrl?`, `litellmApiKey?`, `dbHost?`, `dbPort?`, `dbName?`, `dbUser?`, `dbPassword?`
  - Exportar tudo de um barrel `index.ts`

  **Must NOT do**:
  - Não alterar os tipos existentes em `dashboard.ts` ainda (será migrado na task de refactor)
  - Não criar lógica de negócio nos tipos

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Pure TypeScript type definitions, no logic
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 2, 3)
  - **Blocks**: Tasks 4, 5, 6, 7, 8, 9, 10
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `apps/web/src/types/dashboard.ts` — Tipos existentes a serem consolidados/migrados
  - `apps/server/src/db/schema.ts` — Schema Drizzle que define os shapes dos dados retornados pelo DB
  - `apps/web/src/lib/api-client.ts` — Tipos de retorno das funções de API existentes

  **API/Type References**:
  - `apps/server/src/db/queries.ts` — Shape dos dados retornados por cada query (colunas SELECT, tipos mapWith)
  - `apps/web/src/hooks/use-dashboard-data.ts:20-62` — State types que mostram o que o UI espera

  **WHY Each Reference Matters**:
  - `dashboard.ts`: Source of truth atual dos tipos — novo arquivo deve ser compatível
  - `schema.ts`: Define os shapes crus do banco — tipos precisam cobrir esses campos
  - `api-client.ts`: Mostra os contratos atuais entre frontend e server
  - `queries.ts`: Cada query tem um shape de retorno específico — tipos devem cobrir todos

  **Acceptance Criteria**:

  - [ ] Arquivo `apps/web/src/types/analytics.ts` criado com todas as interfaces
  - [ ] `AnalyticsCapabilities`, `ServerMode`, `ServerModeConfig` definidos
  - [ ] Todos os tipos de `dashboard.ts` presentes no novo arquivo
  - [ ] `tsconfig` do projeto compila sem erros

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: Tipos compilan sem erros
    Tool: Bash
    Preconditions: Arquivo analytics.ts existe
    Steps:
      1. cd apps/web && npx tsc --noEmit src/types/analytics.ts
      2. Verificar exit code 0
    Expected Result: Nenhum erro de compilação
    Failure Indicators: Erro de tipo, import não resolvido
    Evidence: .sisyphus/evidence/task-1-types-compile.txt

  Scenario: Tipos cobrem todos os dados existentes
    Tool: Bash
    Preconditions: Arquivo analytics.ts existe
    Steps:
      1. grep -c "interface\|type " apps/web/src/types/analytics.ts
      2. Resultado deve ser >= 15 (todas as interfaces de dashboard.ts + novas)
    Expected Result: Contagem >= 15
    Failure Indicators: Contagem < 15 indica tipos faltando
    Evidence: .sisyphus/evidence/task-1-types-coverage.txt
  ```

  **Commit**: YES (group with Task 2, 3)
  - Message: `feat(types): add shared analytics types and capability flags`
  - Files: `apps/web/src/types/analytics.ts`
  - Pre-commit: `cd apps/web && npx tsc --noEmit`

- [x] 2. Server Mode Detection — Config + Context Provider

  **What to do**:
  - Criar `apps/web/src/lib/server-mode.ts` com função `detectServerMode()` que lê env vars e retorna `ServerModeConfig`
  - Lógica: se `VITE_DB_HOST` ou `VITE_DB_PASSWORD` presentes → `database`, senão se `VITE_LITELLM_API_URL` e `VITE_LITELLM_API_KEY` presentes → `api-only`, senão → throw Error
  - Criar `apps/web/src/hooks/use-server-mode.tsx` com React Context que:
    - Providencia `ServerModeConfig`, `ServerMode`, `AnalyticsCapabilities` globalmente
    - Inicializa o `dataSource` correto (DatabaseDataSource ou ApiDataSource) no mount
    - Expõe `mode`, `capabilities`, `dataSource` via hook `useServerMode()`
  - Atualizar `App.tsx` para envolver app com `<ServerModeProvider>`

  **Must NOT do**:
  - Não implementar os DataSources ainda (Tasks 4-5)
  - Não modificar pages ou componentes existentes

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Pequena configuração de env vars + React Context simples
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 3)
  - **Blocks**: Tasks 4, 5, 7
  - **Blocked By**: Task 1 (types)

  **References**:

  **Pattern References**:
  - `apps/web/src/lib/db-client.ts` — Como env vars são lidas hoje (padrão `import.meta.env.VITE_*`)
  - `apps/web/src/hooks/use-dashboard-data.ts` — Padrão de hook existente (useState + useEffect)
  - `apps/web/src/App.tsx` — Onde o Provider será envolvido

  **API/Type References**:
  - `apps/web/src/types/analytics.ts` (Task 1) — `ServerMode`, `ServerModeConfig`, `AnalyticsCapabilities`

  **WHY Each Reference Matters**:
  - `db-client.ts`: Seguir o mesmo padrão de leitura de env vars com fallbacks
  - `use-dashboard-data.ts`: Manter consistência com o padrão de hooks
  - `App.tsx`: Ponto de entrada onde o Provider será inserido

  **Acceptance Criteria**:

  - [ ] `server-mode.ts` com `detectServerMode()` funcional
  - [ ] `use-server-mode.tsx` com Context, Provider e hook
  - [ ] `App.tsx` envolvido com `<ServerModeProvider>`
  - [ ] TypeScript compila sem erros

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: Detecção de modo database
    Tool: Bash
    Preconditions: VITE_DB_HOST e VITE_DB_PASSWORD setados
    Steps:
      1. Verificar que detectServerMode() retorna { mode: 'database', ... }
    Expected Result: mode === 'database'
    Failure Indicators: Retorna 'api-only' ou lança erro
    Evidence: .sisyphus/evidence/task-2-db-detect.txt

  Scenario: Detecção de modo api-only
    Tool: Bash
    Preconditions: VITE_LITELLM_API_URL e VITE_LITELLM_API_KEY setados, sem DB vars
    Steps:
      1. Verificar que detectServerMode() retorna { mode: 'api-only', ... }
    Expected Result: mode === 'api-only'
    Failure Indicators: Retorna 'database' ou lança erro
    Evidence: .sisyphus/evidence/task-2-api-detect.txt

  Scenario: Nenhuma credencial lança erro
    Tool: Bash
    Preconditions: Nenhuma env var de DB ou API configurada
    Steps:
      1. Verificar que detectServerMode() lança Error com mensagem clara
    Expected Result: Error thrown com "Need either DB credentials or LiteLLM API URL+Key"
    Failure Indicators: Retorna undefined ou silenciosamente falha
    Evidence: .sisyphus/evidence/task-2-no-creds.txt
  ```

  **Commit**: YES (group with Task 1, 3)
  - Message: `feat(core): add server mode detection and context provider`
  - Files: `apps/web/src/lib/server-mode.ts`, `apps/web/src/hooks/use-server-mode.tsx`, `apps/web/src/App.tsx`
  - Pre-commit: `cd apps/web && npx tsc --noEmit`

- [x] 3. Data Source Interface — Adapter Contract

  **What to do**:
  - Criar `apps/web/src/lib/data-source/types.ts` com a interface `AnalyticsDataSource`
  - Todos os métodos que o UI precisa, com tipos de retorno usando as interfaces de `analytics.ts`
  - Definir `DataSourceMethod` helper type que wraps cada método com loading/error states opcionais
  - A interface deve incluir:
    - `getMetricsSummary(): Promise<MetricsSummary>`
    - `getDailySpendTrend(days: number): Promise<DailySpend[]>`
    - `getSpendByModel(): Promise<SpendByModel[]>`
    - `getSpendByUser(): Promise<UserSpend[]>`
    - `getSpendByKey(): Promise<KeySpend[]>`
    - `getSpendLogs(filters: LogFilters): Promise<SpendLog[]>`
    - `getTokenDistribution(): Promise<TokenDistribution[]>`
    - `getPerformanceMetrics(): Promise<PerformanceMetrics>`
    - `getHourlyUsagePatterns(): Promise<HourlyPattern[]>`
    - `getApiKeyStats(): Promise<KeyAnalytics[]>`
    - `getCostEfficiency(): Promise<CostEfficiency[]>`
    - `getModelDistribution(): Promise<ModelDistribution[]>`
    - `getDailyTokenTrend(days: number): Promise<DailyTokenTrend[]>`
    - `getModelStatistics(): Promise<ModelStatistics[]>`
    - `getModels(): Promise<ModelConfig[]>`
    - `getErrorLogs(limit: number): Promise<ErrorLog[]>`
    - `capabilities: AnalyticsCapabilities` (propriedade)

  **Must NOT do**:
  - Não implementar nenhum DataSource concreto
  - Não criar funções utilitárias de fetch

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Interface TypeScript pura, sem lógica
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2)
  - **Blocks**: Tasks 4, 5, 6, 7, 8
  - **Blocked By**: Task 1 (types)

  **References**:

  **Pattern References**:
  - `apps/web/src/lib/api-client.ts` — Contratos atuais das funções de API (parâmetros e retornos)
  - `apps/server/src/db/queries.ts` — Contratos das queries SQL (shapes de retorno)
  - `apps/web/src/types/dashboard.ts` — Tipos existentes que devem ser cobertos

  **API/Type References**:
  - `apps/web/src/types/analytics.ts` (Task 1) — Tipos canônicos

  **WHY Each Reference Matters**:
  - `api-client.ts`: Cada função de API é um método que o adapter precisa ter
  - `queries.ts`: Cada query representa um método que o DatabaseDataSource vai implementar
  - `dashboard.ts`: Garantir que todos os tipos usados no UI estão cobertos na interface

  **Acceptance Criteria**:

  - [ ] Interface `AnalyticsDataSource` criada com todos os métodos
  - [ ] `AnalyticsCapabilities` integrada como propriedade da interface
  - [ ] Todos os tipos de retorno referenciam `analytics.ts`
  - [ ] TypeScript compila sem erros

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: Interface cobre todos os métodos existentes
    Tool: Bash
    Preconditions: data-source/types.ts criado
    Steps:
      1. Contar métodos em api-client.ts: grep -c "export async function" apps/web/src/lib/api-client.ts
      2. Contar métodos na interface: grep -c "Promise<" apps/web/src/lib/data-source/types.ts
      3. Interface deve ter >= número de funções no api-client
    Expected Result: métodos na interface >= funções no api-client (pode ter mais)
    Failure Indicators: Interface com menos métodos que api-client
    Evidence: .sisyphus/evidence/task-3-interface-coverage.txt
  ```

  **Commit**: YES (group with Task 1, 2)
  - Message: `feat(core): add analytics data source interface`
  - Files: `apps/web/src/lib/data-source/types.ts`
  - Pre-commit: `cd apps/web && npx tsc --noEmit`

- [x] 2. Server-side: DataSource Interface + Adapters + Mode Detection

  **What to do**:
  - Criar `apps/server/src/data-source.ts` com a interface `AnalyticsDataSource` que define todos os métodos que o frontend precisa
  - Criar `apps/server/src/data-source/database.ts` que implementa a interface usando as queries Drizzle existentes (refatorar de `db-server.ts` → adapter)
  - Criar `apps/server/src/data-source/api.ts` que implementa a interface chamando a API REST do LiteLLM Proxy
  - Criar `apps/server/src/data-source/types.ts` com os tipos compartilhados de retorno (padronizar snake_case do DB vs camelCase da API)
  - Criar `apps/server/src/data-source/index.ts` que exporta factory function `createDataSource()` que detecta o modo e retorna instância correta
  - A detecção de modo: se `DB_HOST` existe → database mode, senão se `LITELLM_API_URL` + `LITELLM_API_KEY` existem → api-only mode
  - O adapter API deve normalizar os dados do proxy para o MESMO formato que o DB adapter retorna — o frontend NÃO deve saber qual modo está rodando

  **Must NOT do**:
  - Não alterar os tipos de retorno existentes — manter compatibilidade
  - Não criar endpoints novos no server antes de ter a interface definida
  - Não misturar lógica de detecção de modo no frontend

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: []
  - Reason: Arquitetura de adapters com normalização de dados requer raciocínio profundo sobre mapeamento de tipos

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 1, 3)
  - **Parallel Group**: Wave 1
  - **Blocks**: Tasks 4, 5, 6, 7, 8
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `apps/server/src/db/queries.ts` — Todas as 20+ query functions que o DatabaseDataSource deve chamar
  - `apps/server/src/db/schema.ts` — Tipos de retorno do Drizzle (SpendLog, ErrorLog, etc.) que definem o contrato de dados
  - `apps/server/src/db/client.ts` — Configuração do Pool PostgreSQL para entender as env vars de DB

  **API/Type References**:
  - `apps/web/src/types/dashboard.ts` — Tipos do frontend que DEVEM ser o contrato canônico entre adapters e UI
  - `apps/web/src/lib/api-client.ts` — Funções atuais do frontend que definem os tipos de retorno esperados

  **External References**:
  - LiteLLM Proxy API: `/global/spend/report?group_by=model&start_date=X&end_date=X` — Spend agrupado por modelo
  - LiteLLM Proxy API: `/global/spend/report?group_by=user` — Spend agrupado por usuário
  - LiteLLM Proxy API: `/global/spend/report?group_by=api_key` — Spend agrupado por key
  - LiteLLM Proxy API: `/spend/logs` — Logs de transação individuais
  - LiteLLM Proxy API: `/daily_metrics` — Métricas agregadas diárias
  - LiteLLM Proxy API: `/user/daily/activity` — Atividade diária com breakdown
  - LiteLLM Proxy API: `/key/info?key=X` — Info de key individual
  - LiteLLM Proxy API: `/v1/models` — Lista de modelos disponíveis

  **WHY Each Reference Matters**:
  - `queries.ts`: É o coração do modo database — cada query vira um método no DatabaseDataSource
  - `dashboard.ts` (types): Define o contrato canônico — ambos adapters DEVEM retornar exatamente esses tipos
  - LiteLLM API endpoints: Mostram quais dados estão disponíveis no modo API-only e qual normalização é necessária

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: Database adapter retorna dados no formato correto
    Tool: Bash
    Preconditions: Variáveis de ambiente DB configuradas, banco com dados
    Steps:
      1. Rodar `pnpm --filter server exec node -e "import('./dist/data-source/index.js').then(m => m.createDataSource().then(ds => ds.getMetricsSummary().then(console.log)))"`
      2. Verificar que o retorno tem shape `{ totalSpend: number, totalTokens: number, activeModels: number, errorCount: number }`
      3. Rodar `ds.getSpendByModel()` e verificar que retorna `Array<{ model: string, total_spend: number }>`
    Expected Result: Todos os métodos retornam dados no formato definido em types.ts
    Failure Indicators: TypeError, campos faltando, tipos incorretos
    Evidence: .sisyphus/evidence/task-2-db-adapter-shapes.txt

  Scenario: API adapter normaliza dados do proxy corretamente
    Tool: Bash
    Preconditions: LITELLM_API_URL e LITELLM_API_KEY configurados, proxy acessível
    Steps:
      1. Rodar teste que cria ApiDataSource e chama getMetricsSummary()
      2. Verificar que o retorno normalizado tem o MESMO shape que o DatabaseDataSource
      3. Chamar getSpendByModel() e comparar shape com o retorno do DatabaseDataSource
    Expected Result: Ambos adapters retornam dados no mesmo formato canônico
    Failure Indicators: Campos com nomes diferentes, tipos incompatíveis, valores undefined
    Evidence: .sisyphus/evidence/task-2-api-adapter-normalization.txt

  Scenario: Mode detection funciona corretamente
    Tool: Bash
    Preconditions: Nenhum
    Steps:
      1. Com DB_HOST setado → createDataSource() retorna DatabaseDataSource
      2. Sem DB_HOST, com LITELLM_API_URL + LITELLM_API_KEY → retorna ApiDataSource
      3. Sem nenhuma variável → lança erro com mensagem clara
    Expected Result: Detecção automática correta em todos os 3 cenários
    Failure Indicators: Retorna tipo errado ou não lança erro quando deve
    Evidence: .sisyphus/evidence/task-2-mode-detection.txt
  ```

  **Commit**: YES (group with Task 1)
  - Message: `feat(server): add DataSource interface with database and API adapters`
  - Files: `apps/server/src/data-source/*.ts`
  - Pre-commit: `pnpm typecheck`

- [x] 3. Server-side: API Routes Refatorados com DataSource Injection

  **What to do**:
  - Refatorar `apps/server/src/api-server.ts` para receber DataSource via injeção de dependência em vez de importar queries diretamente
  - Cada endpoint (`/spend/model`, `/metrics`, etc.) deve chamar `dataSource.getSpendByModel()` em vez de `getSpendByModel()` direto
  - Criar `apps/server/src/index.ts` que orquestra: detecta modo → cria DataSource → injeta no server → inicia
  - Endpoints que não estão disponíveis no modo API-only devem retornar 501 com mensagem informativa (ex: `/errors` quando em API mode)
  - Criar endpoint `GET /api/mode` que retorna `{ mode: "database" | "api-only", capabilities: { ... } }` para o frontend saber o que está disponível
  - Manter todos os endpoints existentes funcionando — refatoração interna apenas

  **Must NOT do**:
  - Não quebrar endpoints existentes — refatorar, não reescrever
  - Não adicionar lógica de negócio nos routes — manter como thin wrappers
  - Não remover nenhum endpoint existente

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []
  - Reason: Refatoração mecânica de imports, sem lógica complexa

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 1)
  - **Parallel Group**: Wave 1
  - **Blocks**: Tasks 4, 5, 6, 7, 8
  - **Blocked By**: Task 2

  **References**:

  **Pattern References**:
  - `apps/server/src/api-server.ts` — Todos os 25+ endpoints que precisam ser refatorados para usar DataSource
  - `apps/server/src/db-server.ts` — Re-export que será substituído pela injeção de DataSource

  **API/Type References**:
  - `apps/web/src/lib/api-client.ts` — Cliente do frontend que define os contratos de resposta que os endpoints devem manter

  **WHY Each Reference Matters**:
  - `api-server.ts`: É o arquivo principal a refatorar — cada route handler chama funções do db-server que viram chamadas ao dataSource
  - `api-client.ts`: Garante que os tipos de retorno não mudam

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: Refactored server starts and serves endpoints in database mode
    Tool: Bash
    Preconditions: DB credentials configured
    Steps:
      1. Rodar `pnpm --filter server build && pnpm --filter server start`
      2. curl http://localhost:3000/api/metrics — verificar 200 com dados
      3. curl http://localhost:3000/api/mode — verificar `{"mode":"database","capabilities":{...}}`
    Expected Result: Server inicia sem erros, endpoints retornam dados normalmente
    Failure Indicators: Build errors, runtime crashes, endpoints retornando 500
    Evidence: .sisyphus/evidence/task-3-server-db-mode.txt

  Scenario: API-only mode serves available endpoints and 501 for unavailable
    Tool: Bash
    Preconditions: LITELLM_API_URL e LITELLM_API_KEY configurados, sem DB
    Steps:
      1. Rodar server em modo API-only
      2. curl http://localhost:3000/api/metrics — verificar 200 com dados do proxy
      3. curl http://localhost:3000/api/errors — verificar 501 com mensagem clara
      4. curl http://localhost:3000/api/mode — verificar `{"mode":"api-only","capabilities":{"errorLogs":false,...}}`
    Expected Result: Endpoints disponíveis retornam 200, indisponíveis retornam 501
    Failure Indicators: Erros 500 em endpoints disponíveis, 200 em endpoints que deveriam ser 501
    Evidence: .sisyphus/evidence/task-3-server-api-mode.txt
  ```

  **Commit**: YES (group with Task 2)
  - Message: `refactor(server): inject DataSource into API routes`
  - Files: `apps/server/src/api-server.ts`, `apps/server/src/index.ts`
  - Pre-commit: `pnpm typecheck`

- [x] 4. Frontend: Server Mode Context + API Client Refatorado

  **What to do**:
  - Criar `apps/web/src/hooks/use-server-mode.tsx` com React context que:
    - Chama `GET /api/mode` na inicialização
    - Expõe `{ mode, capabilities, dataSource }` para toda a app
    - Disponibiliza `isAvailable(feature)` helper para checar capacidades
  - Refatorar `apps/web/src/lib/api-client.ts` para usar URL e headers consistentes
  - Adicionar tipos para `ServerMode` e `ServerCapabilities` em `apps/web/src/types/server.ts`
  - As capabilities devem incluir: `errorLogs`, `modelManagement`, `logMerge`, `detailedLatency`, `hourlyPatterns`
  - Criar hook `useDataSource()` que simplifica o acesso ao context

  **Must NOT do**:
  - Não adicionar lógica de negócio no context — apenas dados de modo e capabilities
  - Não remover funções existentes do api-client — apenas adicionar consistência
  - Não criar providers globais pesados

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []
  - Reason: Criação de context/hooks padrão React

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 2 (depends on Task 2)
  - **Blocks**: Tasks 5, 6, 7, 8
  - **Blocked By**: Task 2, Task 3

  **References**:

  **Pattern References**:
  - `apps/web/src/hooks/use-dashboard-data.ts` — Hook existente que consome api-client diretamente — precisa migrar para usar DataSource

  **API/Type References**:
  - `apps/web/src/types/dashboard.ts` — Tipos canônicos do frontend que precisam ser alinhados com os tipos do server

  **WHY Each Reference Matters**:
  - `use-dashboard-data.ts`: É o consumidor principal — precisa ser refatorado para usar o DataSource indiretamente via capabilities

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: Server mode context provides correct mode and capabilities
    Tool: Playwright
    Preconditions: App rodando em modo database
    Steps:
      1. Navegar para http://localhost:5173/
      2. Verificar que o context renderiza com mode="database"
      3. Verificar que capabilities.errorLogs === true
      4. Verificar que capabilities.modelManagement === true
    Expected Result: Context inicializa com dados corretos do servidor
    Failure Indicators: Mode undefined, capabilities vazias
    Evidence: .sisyphus/evidence/task-4-mode-context.png

  Scenario: API-only mode context correctly reflects limited capabilities
    Tool: Playwright
    Preconditions: App rodando em modo API-only
    Steps:
      1. Navegar para http://localhost:5173/
      2. Verificar que o context renderiza com mode="api-only"
      3. Verificar que capabilities.errorLogs === false
      4. Verificar que capabilities.detailedLatency === false
    Expected Result: Context reflete limitações do modo API
    Failure Indicators: Capabilities incorretas, mode errado
    Evidence: .sisyphus/evidence/task-4-api-mode-context.png
  ```

  **Commit**: YES
  - Message: `feat(web): add ServerMode context with capabilities`
  - Files: `apps/web/src/hooks/use-server-mode.tsx`, `apps/web/src/types/server.ts`, `apps/web/src/lib/api-client.ts`
  - Pre-commit: `pnpm typecheck`

- [x] 5. Frontend: Conditional UI Components + Mode Badge

  **What to do**:
  - Criar componente `<FeatureGate>` em `apps/web/src/components/feature-gate.tsx` que:
    - Recebe `capability: keyof ServerCapabilities` e `fallback?: ReactNode`
    - Se a capability está disponível → renderiza children
    - Se não está → renderiza fallback (default: `<UnavailableFeature>` card)
  - Criar componente `<UnavailableFeature>` em `apps/web/src/components/unavailable-feature.tsx` que:
    - Mostra card informativo: "Este recurso requer acesso ao banco de dados" com ícone e descrição
    - Tem variante compacta (inline) e expandida (card)
  - Criar componente `<ModeBadge>` em `apps/web/src/components/mode-badge.tsx` que:
    - Mostra badge no sidebar: "🟢 Full Access" ou "🟡 API Mode"
    - Tooltip explicativo com lista de limitações
  - Integrar `<ModeBadge>` no sidebar existente

  **Must NOT do**:
  - Não criar componentes over-engineered — FeatureGate é simples (capability check + render children ou fallback)
  - Não adicionar animações ou transações complexas
  - Não criar sistema de permissões granular — apenas capability flags

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: []
  - Reason: Componentes UI com shadcn/ui requerem atenção visual

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 4)
  - **Parallel Group**: Wave 2
  - **Blocks**: Tasks 6, 7, 8
  - **Blocked By**: Task 4

  **References**:

  **Pattern References**:
  - `apps/web/src/components/layout/sidebar.tsx` — Sidebar atual onde o ModeBadge será integrado
  - `apps/web/src/components/card.tsx` — Componente Card do shadcn/ui para referência de estilo
  - `apps/web/src/components/badge.tsx` — Badge existente para referência de estilo

  **WHY Each Reference Matters**:
  - `sidebar.tsx`: Onde o ModeBadge será adicionado
  - `card.tsx`, `badge.tsx`: Para manter consistência visual com os componentes existentes

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: FeatureGate renders children when capability is available
    Tool: Playwright
    Preconditions: App rodando em modo database
    Steps:
      1. Renderizar `<FeatureGate capability="errorLogs"><ErrorsTable /></FeatureGate>`
      2. Verificar que ErrorsTable é renderizado
      3. Verificar que nenhum UnavailableFeature card aparece
    Expected Result: Children renderizados normalmente quando capability disponível
    Failure Indicators: Children não aparecem, ou fallback aparece incorretamente
    Evidence: .sisyphus/evidence/task-5-feature-gate-available.png

  Scenario: FeatureGate renders fallback when capability is unavailable
    Tool: Playwright
    Preconditions: App rodando em modo API-only
    Steps:
      1. Renderizar `<FeatureGate capability="errorLogs"><ErrorsTable /></FeatureGate>`
      2. Verificar que UnavailableFeature card aparece com mensagem sobre necessidade de DB
      3. Verificar que ErrorsTable NÃO é renderizado
    Expected Result: Fallback card aparece com mensagem informativa
    Failure Indicators: Children renderizados apesar de capability indisponível, ou card sem mensagem
    Evidence: .sisyphus/evidence/task-5-feature-gate-unavailable.png

  Scenario: ModeBadge shows correct mode in sidebar
    Tool: Playwright
    Preconditions: App rodando
    Steps:
      1. Navegar para qualquer página
      2. Verificar que o sidebar mostra "Full Access" em database mode ou "API Mode" em api-only mode
      3. Hover sobre o badge e verificar que tooltip com limitações aparece
    Expected Result: Badge mostra modo correto com tooltip informativo
    Failure Indicators: Badge não aparece, mostra modo errado, tooltip sem conteúdo
    Evidence: .sisyphus/evidence/task-5-mode-badge.png
  ```

  **Commit**: YES
  - Message: `feat(web): add FeatureGate, UnavailableFeature, and ModeBadge components`
  - Files: `apps/web/src/components/feature-gate.tsx`, `apps/web/src/components/unavailable-feature.tsx`, `apps/web/src/components/mode-badge.tsx`
  - Pre-commit: `pnpm typecheck`

- [x] 6. Frontend: Refatorar Pages com FeatureGate (Dashboard + Logs + Model Stats)

  **What to do**:
  - Refatorar `apps/web/src/pages/dashboard.tsx` para usar `<FeatureGate>` nas seções condicionais:
    - Seções que dependem de `detailedLatency` (performance cards): wrap em FeatureGate
    - Seções que dependem de `hourlyPatterns`: wrap em FeatureGate
  - Refatorar `apps/web/src/pages/logs.tsx` para funcionar em ambos modos (logs vêm de ambas fontes)
  - Refatorar `apps/web/src/pages/model-stats.tsx` para:
    - Esconder colunas de latência (p50/p95/p99) em modo API-only via FeatureGate
    - Mostrar versão simplificada dos stats em API-only
  - Refatorar `apps/web/src/hooks/use-dashboard-data.ts` para usar o DataSource via context em vez de importar api-client diretamente

  **Must NOT do**:
  - Não reescrever toda a página — apenas adicionar FeatureGate wrappers em seções condicionais
  - Não duplicar componentes — FeatureGate + fallback é suficiente
  - Não remover funcionalidade existente — apenas ocultar quando indisponível

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: []
  - Reason: Modificação de componentes UI existentes com guards condicionais

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 3 (depends on Tasks 4, 5)
  - **Blocks**: Task 8
  - **Blocked By**: Task 4, Task 5

  **References**:

  **Pattern References**:
  - `apps/web/src/pages/dashboard.tsx` — Página principal com 7 seções de dados, algumas precisam de FeatureGate
  - `apps/web/src/pages/logs.tsx` — Página de logs que funciona em ambos os modos
  - `apps/web/src/pages/model-stats.tsx` — Página com latência detalhada que precisa de FeatureGate

  **API/Type References**:
  - `apps/web/src/types/server.ts` (Task 4) — Tipos de capabilities que controlam o que é visível

  **WHY Each Reference Matters**:
  - `dashboard.tsx`: A página mais complexa — tem seções de performance e hourly patterns que são DB-only
  - `model-stats.tsx`: Tem colunas de p50/p95/p99 que não existem em API mode

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: Dashboard in database mode shows all sections
    Tool: Playwright
    Preconditions: App rodando em database mode
    Steps:
      1. Navegar para http://localhost:5173/
      2. Verificar que "Total Requests", "Avg Latency", "Success Rate", "Avg Tokens/Request" cards aparecem
      3. Verificar que "Hourly Usage Pattern" chart aparece
      4. Verificar que "Top API Keys" table aparece com coluna "Success"
    Expected Result: Todas as seções visíveis, nenhuma UnavailableFeature card
    Failure Indicators: Seções faltando, UnavailableFeature cards aparecendo
    Evidence: .sisyphus/evidence/task-6-dashboard-db-mode.png

  Scenario: Dashboard in API-only mode hides DB-only sections and shows fallbacks
    Tool: Playwright
    Preconditions: App rodando em API-only mode
    Steps:
      1. Navegar para http://localhost:5173/
      2. Verificar que "Avg Latency" card NÃO aparece (replaced by fallback)
      3. Verificar que "Hourly Usage Pattern" chart NÃO aparece (replaced by fallback)
      4. Verificar que "Total Spend", "Total Tokens", "Active Models" cards APARECEM normalmente
      5. Verificar que "Daily Spend Trend" chart APARECE normalmente
    Expected Result: Seções DB-only ocultas com fallbacks, seções API-available visíveis
    Failure Indicators: Fallbacks onde não deveria, ou seções API-available ocultas
    Evidence: .sisyphus/evidence/task-6-dashboard-api-mode.png

  Scenario: Model Stats page hides latency columns in API mode
    Tool: Playwright
    Preconditions: App rodando em API-only mode
    Steps:
      1. Navegar para http://localhost:5173/model-stats
      2. Verificar que colunas p50/p95/p99 NÃO aparecem na tabela
      3. Verificar que outras colunas (model, requests, spend, tokens) APARECEM
    Expected Result: Latência columns ocultas, dados básicos visíveis
    Failure Indicators: Colunas de latência aparecendo em API mode
    Evidence: .sisyphus/evidence/task-6-model-stats-api-mode.png
  ```

  **Commit**: YES
  - Message: `feat(web): add FeatureGate to dashboard, logs, and model-stats pages`
  - Files: `apps/web/src/pages/dashboard.tsx`, `apps/web/src/pages/logs.tsx`, `apps/web/src/pages/model-stats.tsx`, `apps/web/src/hooks/use-dashboard-data.ts`
  - Pre-commit: `pnpm typecheck`

- [x] 7. Frontend: Refatorar Pages com FeatureGate (Errors + Models + Sidebar)

  **What to do**:
  - Refatorar `apps/web/src/pages/errors.tsx` para ser completamente wrapped em `<FeatureGate capability="errorLogs">` — em API mode, mostra UnavailableFeature com explicação
  - Refatorar `apps/web/src/pages/models.tsx` para:
    - Em API mode: usar endpoints do proxy (`/model/new`, `/model/update`) em vez de DB CRUD
    - Em database mode: manter comportamento existente
    - Wrap em `<FeatureGate capability="modelManagement">`
  - Atualizar `apps/web/src/components/layout/sidebar.tsx` para:
    - Adicionar `<ModeBadge>` no topo
    - Filtrar nav items baseado em capabilities (Errors page escondida se `errorLogs=false`)
  - Atualizar `apps/web/src/App.tsx` para:
    - Wrap Routes em ServerModeProvider
    - Adicionar rota condicional para errors (mostra UnavailableFeature se capability indisponível)

  **Must NOT do**:
  - Não remover rotas — adicionar FeatureGate na página, não no router
  - Não duplicar lógica — models page deve usar o mesmo componente com dataSource diferente
  - Não criar pages separadas para cada modo

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: []
  - Reason: Modificação de UI com lógica condicional

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 6)
  - **Parallel Group**: Wave 3
  - **Blocks**: Task 8
  - **Blocked By**: Task 4, Task 5

  **References**:

  **Pattern References**:
  - `apps/web/src/pages/errors.tsx` — Página de erros que é DB-only
  - `apps/web/src/pages/models.tsx` — Página de modelos que precisa ser dual
  - `apps/web/src/components/layout/sidebar.tsx` — Sidebar que precisa do ModeBadge e filtrar nav items
  - `apps/web/src/App.tsx` — Router que precisa do ServerModeProvider

  **API/Type References**:
  - `apps/web/src/types/server.ts` (Task 4) — Capabilities que controlam visibilidade

  **WHY Each Reference Matters**:
  - `errors.tsx`: Precisa de FeatureGate completo — página inteira é DB-only
  - `models.tsx`: Precisa de lógica dual — CRUD funciona em ambos modos, mas via fontes diferentes
  - `sidebar.tsx`: Onde o badge e a filtragem de nav items acontece
  - `App.tsx`: Provider precisa envolver toda a app

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: Errors page shows UnavailableFeature in API mode
    Tool: Playwright
    Preconditions: App rodando em API-only mode
    Steps:
      1. Navegar para http://localhost:5173/errors
      2. Verificar que a página mostra card "Este recurso requer acesso ao banco de dados"
      3. Verificar que NENHUMA tabela de erros é renderizada
    Expected Result: FeatureGate bloqueia conteúdo e mostra fallback
    Failure Indicators: Tabela de erros renderizada em API mode, ou página em branco
    Evidence: .sisyphus/evidence/task-7-errors-api-mode.png

  Scenario: Errors page shows data in database mode
    Tool: Playwright
    Preconditions: App rodando em database mode
    Steps:
      1. Navegar para http://localhost:5173/errors
      2. Verificar que a tabela de erros aparece com dados
      3. Verificar que nenhum UnavailableFeature card aparece
    Expected Result: Tabela de erros renderizada normalmente
    Failure Indicators: FeatureGate bloqueando conteúdo em DB mode
    Evidence: .sisyphus/evidence/task-7-errors-db-mode.png

  Scenario: Sidebar shows ModeBadge and filters nav items by capabilities
    Tool: Playwright
    Preconditions: App rodando em API-only mode
    Steps:
      1. Verificar que sidebar mostra badge "API Mode"
      2. Verificar que link "Errors" NÃO aparece no sidebar
      3. Verificar que links "Dashboard", "Model Stats", "Spend Logs" APARECEM
    Expected Result: Badge mostra modo correto, nav items filtrados por capabilities
    Failure Indicators: Errors link visível em API mode, badge mostrando modo errado
    Evidence: .sisyphus/evidence/task-7-sidebar-api-mode.png
  ```

  **Commit**: YES (group with Task 6)
  - Message: `feat(web): add FeatureGate to errors, models pages and update sidebar with ModeBadge`
  - Files: `apps/web/src/pages/errors.tsx`, `apps/web/src/pages/models.tsx`, `apps/web/src/components/layout/sidebar.tsx`, `apps/web/src/App.tsx`
  - Pre-commit: `pnpm typecheck`

- [x] 8. Server-side: API Adapter Implementation Completa (LiteLLM Proxy)

  **What to do**:
  - Implementar todos os métodos do `ApiDataSource` em `apps/server/src/data-source/api.ts`:
    - `getMetricsSummary()` → Chama `/daily_metrics` + normaliza para `{ totalSpend, totalTokens, activeModels, errorCount }`
    - `getSpendByModel()` → Chama `/global/spend/report?group_by=model&start_date=...&end_date=...` + normaliza
    - `getSpendByUser()` → Chama `/global/spend/report?group_by=user` + normaliza
    - `getSpendByKey()` → Chama `/global/spend/report?group_by=api_key` + normaliza
    - `getSpendLogs()` → Chama `/spend/logs` + normaliza para o formato SpendLog
    - `getDailySpendTrend()` → Chama `/global/spend/report` com date range + agrupa por dia
    - `getTokenDistribution()` → Deriva de `/global/spend/report` + cálculos client-side
    - `getPerformanceMetrics()` → Chama `/daily_metrics` + deriva success_rate
    - `getHourlyUsagePatterns()` → Deriva de `/spend/logs` com agregação por hora (client-side)
    - `getApiKeyDetailedStats()` → Chama `/global/spend/report?group_by=api_key` + enriquece com `/key/info`
    - `getCostEfficiencyByModel()` → Deriva de `/global/spend/report?group_by=model`
    - `getModelRequestDistribution()` → Deriva de `/global/spend/report`
    - `getDailyTokenTrend()` → Deriva de `/global/spend/report` com date range
    - `getModelStatistics()` → Versão reduzida sem p50/p95/p99 (capabilities.detailedLatency = false)
    - `getModels()` → Chama `/v1/models`
    - `getErrorLogs()` → Retorna array vazio com capabilities.errorLogs = false
  - Para métodos que são derivações client-side, implementar funções helper de agregação em `apps/server/src/data-source/api-helpers.ts`
  - Adicionar cache simples em memória (TTL 30s) para reduzir chamadas ao proxy

  **Must NOT do**:
  - Não fazer over-engineering no cache — Map com TTL é suficiente
  - Não implementar métodos que a API não suporta — marcar como unsupported via capabilities
  - Não adicionar bibliotecas externas de cache como Redis

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: []
  - Reason: Implementação complexa de mapeamento de dados com agregações client-side

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 3 (depends on Task 2 interface)
  - **Blocks**: None (final implementation task)
  - **Blocked By**: Task 2

  **References**:

  **Pattern References**:
  - `apps/server/src/db/queries.ts` — Cada query function que o ApiDataSource precisa espelhar, mostrando exatamente que dados e formato retornar

  **API/Type References**:
  - `apps/web/src/types/dashboard.ts` — Tipos canônicos que o ApiDataSource deve retornar

  **External References**:
  - LiteLLM Proxy API: `/daily_metrics` — Retorna `{ daily_spend: [...], total_spend, top_models, top_api_keys }`
  - LiteLLM Proxy API: `/global/spend/report?group_by=model&start_date=X&end_date=X` — Retorna `{ model_details: [...] }`
  - LiteLLM Proxy API: `/global/spend/report?group_by=api_key` — Retorna dados por key
  - LiteLLM Proxy API: `/global/spend/report?group_by=user` — Retorna dados por user
  - LiteLLM Proxy API: `/spend/logs` — Logs de transação
  - LiteLLM Proxy API: `/v1/models` — Lista modelos
  - LiteLLM Proxy API: `/key/info?key=X` — Info de key específica
  - LiteLLM Proxy API: `/user/daily/activity` — Atividade diária com breakdown

  **WHY Each Reference Matters**:
  - `queries.ts`: É o "contrato" — cada método do ApiDataSource deve retornar exatamente os mesmos tipos que as queries Drizzle
  - LiteLLM API docs: Mostram o formato exato das respostas do proxy que precisam ser normalizadas

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: API DataSource returns all dashboard data correctly
    Tool: Bash (curl)
    Preconditions: LiteLLM Proxy rodando com dados de teste, server em API mode
    Steps:
      1. curl http://localhost:3000/api/metrics — verificar shape correto
      2. curl http://localhost:3000/api/spend/model — verificar array de { model, total_spend }
      3. curl http://localhost:3000/api/spend/trend?days=30 — verificar array de { date, spend }
      4. curl http://localhost:3000/api/analytics/tokens — verificar dados de distribuição
      5. curl http://localhost:3000/api/analytics/performance — verificar { total_requests, avg_duration_ms, success_rate }
    Expected Result: Todos endpoints retornam dados no mesmo formato que o database mode
    Failure Indicators: Shapes diferentes, campos faltando, valores undefined
    Evidence: .sisyphus/evidence/task-8-api-adapter-all-endpoints.txt

  Scenario: API DataSource returns empty for unsupported endpoints
    Tool: Bash (curl)
    Preconditions: Server em API mode
    Steps:
      1. curl http://localhost:3000/api/errors — verificar 501 com mensagem clara
      2. curl http://localhost:3000/api/analytics/model-stats — verificar que dados vêm SEM colunas de latência
    Expected Result: Endpoints não suportados retornam 501, dados parciais vêm sem campos indisponíveis
    Failure Indicators: 500 errors, dados com campos undefined
    Evidence: .sisyphus/evidence/task-8-api-adapter-unsupported.txt

  Scenario: Cache reduces duplicate calls to proxy
    Tool: Bash
    Preconditions: Server em API mode
    Steps:
      1. Fazer 3 requests para /api/metrics em sequência
      2. Verificar logs do server mostrando apenas 1 chamada ao proxy (2 servidas do cache)
      3. Esperar TTL expirar (30s) e fazer outro request
      4. Verificar que uma nova chamada ao proxy é feita
    Expected Result: Cache funciona com TTL de 30s, reduzindo chamadas duplicadas
    Failure Indicators: Cada request faz chamada ao proxy, ou cache nunca expira
    Evidence: .sisyphus/evidence/task-8-cache-behavior.txt
  ```

  **Commit**: YES
  - Message: `feat(server): implement complete ApiDataSource with LiteLLM Proxy integration`
  - Files: `apps/server/src/data-source/api.ts`, `apps/server/src/data-source/api-helpers.ts`
  - Pre-commit: `pnpm typecheck`

- [x] 3. Implementar DatabaseDataSource (adapter para queries SQL existentes)

  **What to do**:
  - Criar `apps/server/src/data-sources/database-data-source.ts`
  - Implementar a interface `AnalyticsDataSource` mapeando cada método para as queries Drizzle existentes
  - Usar as funções já existentes em `apps/server/src/db/queries.ts` como implementação
  - Mapear os retornos das queries para os tipos canônicos da interface
  - O `capabilities` deve ter TUDO como `true` (full access)

  **Must NOT do**:
  - Não alterar as queries SQL existentes — apenas envolvê-las
  - Não duplicar lógica de banco — usar as funções importadas
  - Não adicionar campos que não vêm do banco

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []
  - Reason: Tarefa mecânica de adaptação/cola — criar um wrapper que chama funções existentes

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (com Task 4)
  - **Blocks**: Task 5 (server provider), Task 6 (page adapters)
  - **Blocked By**: Task 1 (types)

  **References**:
  - `apps/server/src/db/queries.ts` — Todas as funções de query existentes (getSpendByModel, getSpendLogs, getMetricsSummary, etc.) que serão chamadas pelo adapter
  - `apps/server/src/db/schema.ts` — Tipos de retorno das queries (SpendByModelResult, etc.) que precisam ser mapeados para tipos canônicos
  - `apps/server/src/db/client.ts` — Instância `db` do Drizzle usada pelas queries
  - Tipos canônicos de Task 1 (ainda não existem, mas serão a interface que este arquivo implementa)

  **Acceptance Criteria**:
  - [ ] Arquivo `database-data-source.ts` existe e implementa `AnalyticsDataSource`
  - [ ] Cada método da interface chama a query SQL correspondente e mapeia o retorno
  - [ ] `capabilities` retorna todos os campos como `true`
  - [ ] TypeScript compila sem erros

  **QA Scenarios**:
  ```
  Scenario: DatabaseDataSource implementa todos os métodos da interface
    Tool: Bash
    Preconditions: Task 1 (types) completada, TypeScript configurado
    Steps:
      1. Rodar `pnpm typecheck` no workspace do server
      2. Verificar que `DatabaseDataSource` não tem erros de tipo
      3. Confirmar que todos os métodos de `AnalyticsDataSource` estão implementados
    Expected Result: `pnpm typecheck` passa sem erros, classe implementa interface completamente
    Failure Indicators: Erros de tipo, métodos faltando, imports quebrados
    Evidence: .sisyphus/evidence/task-3-typecheck-datasource.txt

  Scenario: Mapeamento de tipos preserva dados corretamente
    Tool: Bash
    Preconditions: Types canônicos definidos
    Steps:
      1. Verificar que `getMetricsSummary()` mapeia campos do retorno SQL para tipo canônico
      2. Verificar que `getSpendLogs()` mapeia `startTime` → `start_time`, `apiKey` → `api_key`, etc.
      3. Confirmar que não há perda de dados no mapeamento
    Expected Result: Todos os campos relevantes mapeados, nomes normalizados
    Failure Indicators: Campos undefined, nomes incorretos
    Evidence: .sisyphus/evidence/task-3-mapping-check.txt
  ```

  **Commit**: YES (grupo com Tasks 1-4)
  - Message: `feat(server): add data source types, interface, and database adapter`
  - Files: `apps/server/src/types/analytics.ts`, `apps/server/src/data-sources/analytics-data-source.ts`, `apps/server/src/data-sources/database-data-source.ts`
  - Pre-commit: `pnpm typecheck`

---

## Final Verification Wave

> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.

- [x] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, curl endpoint, run command). For each "Must NOT Have": search codebase for forbidden patterns — reject with file:line if found. Check evidence files exist in .sisyphus/evidence/. Compare deliverables against plan.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [x] F2. **Code Quality Review** — `unspecified-high`
  Run `pnpm typecheck` + `pnpm lint`. Review all changed files for: `as any`/`@ts-ignore`, empty catches, console.log in prod, commented-out code, unused imports. Check AI slop: excessive comments, over-abstraction, generic names (data/result/item/temp).
  Output: `Build [PASS/FAIL] | Lint [PASS/FAIL] | Types [PASS/FAIL] | Files [N clean/N issues] | VERDICT`

- [x] F3. **Real Manual QA** — `unspecified-high` (+ `playwright` skill if UI)
  Start from clean state. Execute EVERY QA scenario from EVERY task — follow exact steps, capture evidence. Test cross-task integration (features working together, not isolation). Test edge cases: empty state, invalid input, rapid actions. Save to `.sisyphus/evidence/final-qa/`.
  Output: `Scenarios [N/N pass] | Integration [N/N] | Edge Cases [N tested] | VERDICT`

- [x] F4. **Scope Fidelity Check** — `deep`
  For each task: read "What to do", read actual diff (git log/diff). Verify 1:1 — everything in spec was built (no missing), nothing beyond spec was built (no creep). Check "Must NOT do" compliance. Detect cross-task contamination: Task N touching Task M's files. Flag unaccounted changes.
  Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

- **Wave 1**: `feat(types): add dual-mode type definitions and capabilities spec` - types files
- **Wave 2**: `feat(adapters): implement database and API data source adapters` - adapter files, server
- **Wave 3**: `feat(ui): add server mode context, sidebar badge, and capability guards` - context, sidebar, guard
- **Wave 4**: `feat(pages): adapt all pages for dual-mode rendering` - page files
- **Wave 5**: `feat(integration): end-to-end testing and documentation` - all remaining

---

## Success Criteria

### Verification Commands
```bash
# Type checking
pnpm typecheck  # Expected: no errors

# Linting
pnpm lint  # Expected: no errors

# Build
pnpm build  # Expected: successful build

# Dev server starts in API-only mode
LITELLM_API_URL=http://localhost:4000 LITELLM_API_KEY=sk-test pnpm dev  # Expected: starts without DB

# Dev server starts in database mode
VITE_DB_HOST=localhost pnpm dev  # Expected: starts with DB as before
```

### Final Checklist
- [ ] All "Must Have" present
- [ ] All "Must NOT Have" absent
- [ ] App works in both modes
- [ ] Badge shows correct mode
- [ ] Conditional rendering works
- [ ] No UI duplication between modes