# Real-Time Log Analyzer — Monitor de Anomalias

## TL;DR
> **Summary**: Sistema de monitoramento em tempo real que analisa logs do LiteLLM via WebSocket, detecta anomalias (modelo offline, spike de erros, timeout/stuck, falha silenciosa) server-side, e notifica via toast + Browser Notification API. Histórico persistido em SQLite separado.
> **Deliverables**: Serviço de detecção server-side, WebSocket transport, página `/monitor`, alertas persistidos em SQLite, notificações proativas
> **Effort**: Large
> **Parallel**: YES - 5 waves
> **Critical Path**: SQLite schema → Monitor Service → WebSocket Broadcast → Monitor Page → Final Verification

## Context
### Original Request
Criar um analisador de logs em tempo real que detecta quando modelos estão offline ou travados, quando agentes não tentam novamente e não reportam erros, e dispara notificações proativas.

### Interview Summary
- **Transporte**: WebSocket (escolha do usuário, bidirecional)
- **Análise**: Server-side (serviço background que polla PostgreSQL)
- **Escopo**: Monitorar + Notificar + Histórico
- **Anomalias**: Model Offline, Error Spike, Timeout/Stuck, Silent Failure
- **Notificações**: Toast (Sonner) + Browser Notification API
- **UI**: Página nova `/monitor`
- **Persistência**: SQLite com Drizzle ORM (separado do PostgreSQL do LiteLLM)

### Metis Review (gaps addressed)
- **SQLite justificado**: LiteLLM gerencia o PostgreSQL; SQLite separado evita conflito com upgrades/migrações do LiteLLM. Arquivo em `db/monitor.db`.
- **Novo package**: `packages/monitor/` contém toda a lógica de monitoramento (detecção, persistência, tipos). `apps/server/` apenas consome o package e gerencia WebSocket.
- **DB em `/db`**: Schema, client e queries do SQLite ficam em `packages/monitor/src/db/`. Arquivo `.db` gerado em `db/monitor.db`.
- **Polling interval definido**: 15s (balanço entre responsividade e carga no DB)
- **Thresholds hardcoded**: Definidos como defaults para v1 (ver seção Anomaly Thresholds)
- **Notification dedup**: Cooldown de 5 min por anomalia+modelo
- **Incremental query**: Adicionar `getErrorsSince(since: Date)` ao analytics package
- **Sonner mounting**: Task separada (cross-cutting, afeta todas as páginas)
- **Vite proxy**: Precisa `ws: true` no proxy config
- **DB pool**: Serviço de monitoramento usa 1 conexão dedicada do pool
- **Edge cases**: Zero-traffic = "unknown" health, modelo novo = sem baseline por 1h

## Work Objectives
### Core Objective
Construir sistema de monitoramento em tempo real que detecta anomalias nos logs do LiteLLM e notifica o usuário proativamente via WebSocket, com histórico persistido em SQLite.

### Deliverables
1. Schema SQLite + Drizzle ORM para alertas (`db/monitor.db`) em `packages/monitor`
2. Queries incrementais no `packages/analytics` (`getErrorsSince`, `getModelHealth`)
3. Serviço background de detecção de anomalias (4 detectores)
4. Servidor WebSocket (`ws` package) no Express
5. Hook React `useMonitorWebSocket` com reconexão automática
6. Página `/monitor` com dashboard de saúde + histórico de alertas
7. Notificações proativas via Sonner toast + Browser Notification API
8. Mount do `<Toaster />` na raiz do app
9. API endpoints para histórico de alertas
10. Vite proxy config para WebSocket

### Definition of Done (verifiable conditions with commands)
```bash
# Build sem erros
pnpm build  # exit 0

# Typecheck sem erros
pnpm typecheck  # exit 0

# Lint sem erros
pnpm lint  # exit 0

# Testes passando
pnpm test  # exit 0

# WebSocket conecta e recebe mensagens
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" -H "Sec-WebSocket-Version: 13" -H "Sec-WebSocket-Key: test" http://localhost:3008/ws/monitor  # 101 Switching Protocols

# Página /monitor renderiza
curl -s http://localhost:5178/monitor | head -1  # <!DOCTYPE html>

# API de alertas responde
curl http://localhost:3008/api/monitor/alerts?limit=10  # JSON array

# SQLite criado
ls db/monitor.db  # file exists
```

### Must Have
- 4 detectores de anomalia funcionais (offline, spike, timeout, silent)
- WebSocket push de alertas em tempo real
- Histórico persistido em SQLite
- Página `/monitor` com tabela de alertas + status por modelo
- Toast notifications proativas
- Browser Notification (quando aba em background)
- Deduplicação de notificações (5 min cooldown)
- Reconexão automática do WebSocket

### Must NOT Have (guardrails, AI slop patterns, scope boundaries)
- **NÃO** criar tabela no PostgreSQL do LiteLLM (usar SQLite separado)
- **NÃO** modificar queries existentes do analytics (apenas adicionar novas)
- **NÃO** adicionar threshold configurável via UI em v1
- **NÃO** implementar notificações por email/Slack/webhook em v1
- **NÃO** usar ML/detecção estatística avançada (thresholds fixos em v1)
- **NÃO** fazer streaming de logs brutos (só anomalias detectadas)
- **NÃO** colocar lógica de monitoramento no `apps/server/` — server APENAS consome `@lite-llm/monitor` e gerencia WebSocket
- **NÃO** usar `as any`, `@ts-ignore`, `@ts-expect-error`
- **NÃO** consumir mais que 1 conexão do pool PostgreSQL para monitoramento
- **NÃO** usar `console.log` — usar o logger do server se existir

### Anomaly Thresholds (v1 hardcoded defaults)
| Anomaly | Trigger | Cooldown |
|---------|---------|----------|
| **Model Offline** | 0 successful requests + ≥1 failure nos últimos 15 min para um modelo que teve ≥1 request nas últimas 2h | 10 min |
| **Error Spike** | Error rate > 3x a média da última 1h, mínimo 10 erros em 5 min | 5 min |
| **Timeout/Stuck** | p95 latency > 3x o p95 normal (últimas 24h) do modelo, OU requests com `startTime` sem `endTime` há >5 min | 10 min |
| **Silent Failure** | Request com `status != 'success'` mas status NÃO é um tipo conhecido (timeout/rate_limit/auth), E sem entrada no `errorLogs` | 5 min |

## Verification Strategy
> ZERO HUMAN INTERVENTION - all verification is agent-executed.
- Test decision: tests-after + Vitest
- QA policy: Every task has agent-executed scenarios
- Evidence: .sisyphus/evidence/task-{N}-{slug}.{ext}

## Execution Strategy
### Parallel Execution Waves

**Wave 1** (Foundation - 5 tasks, ALL parallel):
- T1: SQLite schema + Drizzle setup
- T2: Incremental analytics queries
- T3: Mount Sonner Toaster at app root
- T4: WebSocket server setup (`ws`)
- T5: Vite proxy config

**Wave 2** (Detection Core - 3 tasks, depends on T1, T2):
- T6: Background monitor service (skeleton + lifecycle + polling)
- T7: 4 anomaly detectors (offline, spike, timeout, silent) + alert persistence
- T8: Alert history API endpoints

**Wave 3** (Transport + Client - 2 tasks, depends on T4, T7):
- T9: WebSocket broadcast service (push alerts to clients)
- T10: WebSocket client hook + reconnection

**Wave 4** (UI - 4 tasks, depends on T8, T9, T10):
- T11: `/monitor` route + page skeleton
- T12: Model health dashboard component
- T13: Alert history table component
- T14: Browser Notification API + toast integration

**Wave 5** (Final Verification):
- F1-F4: Review agents

### Dependency Matrix
```
T1 ──→ T6 ──→ T7 ──→ T9 ──→ T11, T12, T13, T14
T2 ──→ T6                   T10 ──→ T11, T14
T3 ──→ (independent)        T8  ──→ T13
T4 ──→ T9
T5 ──→ (independent)
```

### Agent Dispatch Summary
| Wave | Tasks | Categories |
|------|-------|------------|
| 1 | 5 | quick(3), unspecified-low(2) |
| 2 | 3 | deep(1), unspecified-high(2) |
| 3 | 2 | unspecified-high(2) |
| 4 | 4 | visual-engineering(2), unspecified-high(2) |
| 5 | 4 | oracle(1), unspecified-high(2), deep(1) |

## TODOs

- [x] T1. Package `@lite-llm/monitor` Setup + SQLite Schema + Drizzle

  **What to do**:
  1. Criar `packages/monitor/package.json`:
     - Name: `@lite-llm/monitor`
     - Dependencies: `better-sqlite3`, `drizzle-orm`, `@lite-llm/analytics` (workspace:*)
     - DevDependencies: `@types/better-sqlite3`, `typescript`, `vitest`
     - Main: `dist/index.js`, Types: `dist/index.d.ts`
     - Scripts: `build: tsc`, `typecheck: tsc --noEmit`, `test: vitest run`
  2. Criar `packages/monitor/tsconfig.json`:
     - Extends root tsconfig, `declaration: true`, `verbatimModuleSyntax`, `erasableSyntaxOnly`
     - Path alias para `@/` → `./src/` se seguir pattern do web app
  3. Criar `packages/monitor/src/db/monitor-schema.ts` com Drizzle SQLite schema:
     - Tabela `alerts`: id (integer PK auto-increment), anomaly_type (text, NOT NULL), model (text), severity (text: 'critical'|'warning'|'info'), message (text, NOT NULL), metadata (text, JSON string), detected_at (integer, unix timestamp, NOT NULL), acknowledged_at (integer, nullable), created_at (integer, default current timestamp)
     - Tabela `alert_rules`: id (integer PK), name (text), anomaly_type (text), threshold_config (text, JSON), enabled (integer, 0|1), cooldown_seconds (integer), created_at (integer)
  4. Criar `packages/monitor/src/db/monitor-client.ts`:
     - Inicializar `better-sqlite3` com path `db/monitor.db` (relativo à raiz do projeto)
     - Criar Drizzle instance com `drizzle()` usando SQLite schema
     - Auto-criar tabelas via `CREATE TABLE IF NOT EXISTS` no init
     - Exportar `getMonitorDb()` singleton
  5. Criar `packages/monitor/src/db/monitor-queries.ts` com funções:
     - `insertAlert(alert)`, `getAlerts(limit, offset, filters)`, `acknowledgeAlert(id)`, `getActiveAlerts()`, `countAlertsSince(since)`
  6. Criar `packages/monitor/src/index.ts` — barrel export de tudo que o server precisa consumir
  7. Garantir que `db/monitor.db` é criado automaticamente se não existe
  8. Adicionar `db/monitor.db` ao `.gitignore`
  9. Registrar `packages/monitor` no `pnpm-workspace.yaml`

  **Must NOT do**: Não modificar o schema PostgreSQL existente em `packages/analytics`. Não criar migration system — usar `CREATE TABLE IF NOT EXISTS`. Não colocar lógica de detecção neste task (só DB).

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: New package setup with multiple config files, SQLite+Drizzle integration, workspace registration
  - Skills: `[]`
  - Omitted: `[]`

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: T6, T7, T8 | Blocked By: none

  **References**:
  - Pattern: `packages/analytics/src/queries/schema.ts` — Drizzle table definition pattern (mas usar `drizzle-orm/sqlite-core` em vez de `drizzle-orm/pg-core`)
  - Pattern: `packages/analytics/src/queries/client.ts` — DB client singleton pattern
  - Pattern: `packages/analytics/package.json` — Workspace package structure
  - Pattern: `packages/analytics/tsconfig.json` — TypeScript config for packages
  - Config: `pnpm-workspace.yaml` — Workspace registration
  - External: `https://orm.drizzle.team/docs/get-started-sqlite` — Drizzle SQLite setup

  **Acceptance Criteria**:
  - [ ] `packages/monitor/package.json` existe com nome `@lite-llm/monitor` e deps corretas
  - [ ] `packages/monitor/tsconfig.json` existe
  - [ ] `packages/monitor/src/db/monitor-schema.ts` exporta tabelas `alerts` e `alertRules`
  - [ ] `packages/monitor/src/db/monitor-client.ts` exporta `getMonitorDb()`
  - [ ] `packages/monitor/src/db/monitor-queries.ts` exporta `insertAlert`, `getAlerts`, `acknowledgeAlert`, `getActiveAlerts`, `countAlertsSince`
  - [ ] `packages/monitor/src/index.ts` barrel export de todas as funções e tipos
  - [ ] `pnpm-workspace.yaml` inclui `packages/monitor`
  - [ ] `db/monitor.db` aparece no `.gitignore`
  - [ ] `pnpm install` resolve o novo package sem erros
  - [ ] `pnpm --filter @lite-llm/monitor typecheck` passa sem erros

  **QA Scenarios**:
  ```
  Scenario: Package setup
    Tool: Bash
    Steps: pnpm install, pnpm --filter @lite-llm/monitor typecheck
    Expected: Install succeeds, typecheck exits 0
    Evidence: .sisyphus/evidence/task-t1-package-setup.txt

  Scenario: SQLite DB creation
    Tool: interactive_bash (node)
    Steps: Import getMonitorDb from @lite-llm/monitor, call it, check db/monitor.db exists
    Expected: File created at db/monitor.db, tables exist, no errors
    Evidence: .sisyphus/evidence/task-t1-sqlite-creation.txt

  Scenario: Alert CRUD
    Tool: interactive_bash (node)
    Steps: Insert alert → getAlerts → acknowledgeAlert → getAlerts again
    Expected: Alert appears in list, acknowledged_at set after acknowledge
    Evidence: .sisyphus/evidence/task-t1-alert-crud.txt
  ```

  **Commit**: YES | Message: `feat(monitor): create @lite-llm/monitor package with SQLite schema` | Files: `packages/monitor/**, .gitignore, pnpm-workspace.yaml`

---

- [x] T2. Incremental Analytics Queries

  **What to do**:
  1. Adicionar query `getErrorsSince(since: Date, limit?: number)` em `packages/analytics/src/queries/error-queries.ts`:
     - Mesmo LEFT JOIN pattern do `getErrorLogs` mas filtrando por `spendLogs.startTime > since`
     - Retorna `ErrorLogEntry[]`
  2. Adicionar query `getErrorCountByModelSince(since: Date)` em `packages/analytics/src/queries/error-queries.ts`:
     - GROUP BY model, WHERE status != 'success' AND startTime > since
     - Retorna `{ model: string, error_count: number }[]`
  3. Adicionar query `getModelHealthSince(model: string, since: Date, baselineHours: number)`:
     - Retorna `{ total_requests, success_count, error_count, avg_latency_ms, last_success_at, last_error_at, p95_latency_ms }` para um modelo desde `since`
     - Usa o baselineHours para calcular a média de referência
  4. Adicionar query `getStuckRequests(since: Date)`:
     - Requests com `startTime` mas sem `endTime` (NULL) onde `startTime < now - 5 minutes`
     - Retorna `{ request_id, model, startTime }[]`
  5. Adicionar métodos correspondentes ao `AnalyticsDataSource` interface em `packages/analytics/src/types/index.ts`
  6. Implementar em `packages/analytics/src/data-source/error-methods.ts` e/ou criar `model-health-methods.ts`
  7. Registrar em `packages/analytics/src/data-source/database.ts`

  **Must NOT do**: Não modificar queries existentes. Não alterar assinaturas de métodos existentes.

  **Recommended Agent Profile**:
  - Category: `deep` - Reason: Extends interface + implementation across multiple files, needs careful TypeScript
  - Skills: `[]`
  - Omitted: `[]`

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: T6, T7 | Blocked By: none

  **References**:
  - Pattern: `packages/analytics/src/queries/error-queries.ts:12-61` — Existing `getErrorLogs` LEFT JOIN pattern to follow
  - Pattern: `packages/analytics/src/queries/helpers.ts:38-39` — `getFailedSpendLogsCondition()` to reuse
  - Pattern: `packages/analytics/src/queries/model-queries.ts:50` — Error count via CASE WHEN pattern
  - Pattern: `packages/analytics/src/queries/model-queries.ts:294-318` — `getErrorBreakdownByModel` GROUP BY pattern
  - API/Type: `packages/analytics/src/types/index.ts:108-116` — `ErrorLogEntry` type
  - API/Type: `packages/analytics/src/types/index.ts:2` — `AnalyticsDataSource` interface
  - Pattern: `packages/analytics/src/data-source/database.ts:59-84` — DatabaseDataSource method wiring

  **Acceptance Criteria**:
  - [ ] `getErrorsSince(since, limit)` existe e retorna `ErrorLogEntry[]`
  - [ ] `getErrorCountByModelSince(since)` existe e retorna contagens por modelo
  - [ ] `getModelHealthSince(model, since, baselineHours)` existe e retorna métricas de saúde
  - [ ] `getStuckRequests(since)` existe e retorna requests travadas
  - [ ] Todos os 4 métodos adicionados ao `AnalyticsDataSource` interface
  - [ ] Implementações registradas em `DatabaseDataSource`
  - [ ] `pnpm --filter @lite-llm/analytics typecheck` passa sem erros

  **QA Scenarios**:
  ```
  Scenario: Incremental error query
    Tool: Bash (vitest)
    Steps: Mock DB with errors at T1, T2, T3. Call getErrorsSince(T2). Assert only T3 errors returned
    Expected: Only errors after 'since' timestamp returned
    Evidence: .sisyphus/evidence/task-t2-incremental-query.txt

  Scenario: Stuck requests detection
    Tool: Bash (vitest)
    Steps: Insert request with startTime=now-10min, endTime=NULL. Call getStuckRequests(now-15min)
    Expected: Request returned in stuck list
    Evidence: .sisyphus/evidence/task-t2-stuck-requests.txt
  ```

  **Commit**: YES | Message: `feat(analytics): add incremental error queries for monitoring` | Files: `packages/analytics/src/queries/error-queries.ts, packages/analytics/src/types/index.ts, packages/analytics/src/data-source/*.ts`

---

- [x] T3. Mount Sonner Toaster at App Root

  **What to do**:
  1. Ler `apps/web/src/components/sonner.tsx` para entender o wrapper existente
  2. Importar e renderizar `<Toaster />` em `apps/web/src/App.tsx` (ou `main.tsx`), dentro do `<QueryClientProvider>` mas fora do `<Router>`
  3. Configurar props: `position="top-right"`, `richColors`, `closeButton`, `duration=5000`
  4. Verificar que toasts funcionam em todas as páginas (não só model-stats)

  **Must NOT do**: Não mover o Toaster existente se já está em uso em alguma página. Não alterar os estilos do Sonner wrapper.

  **Recommended Agent Profile**:
  - Category: `quick` - Reason: 2-file change, simple import + JSX
  - Skills: `[]`

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: T14 | Blocked By: none

  **References**:
  - Component: `apps/web/src/components/sonner.tsx` — Toaster wrapper existente
  - Pattern: `apps/web/src/main.tsx` — Root component tree (QueryClientProvider, ThemeProvider)
  - Pattern: `apps/web/src/App.tsx` — Router setup

  **Acceptance Criteria**:
  - [ ] `<Toaster />` renderizado no root do app
  - [ ] `pnpm --filter apps/web typecheck` passa
  - [ ] Toasts podem ser disparados de qualquer página via `toast()` import

  **QA Scenarios**:
  ```
  Scenario: Toast renders globally
    Tool: Playwright
    Steps: Navigate to /, trigger a toast via browser console (window.__test_toast = true), verify toast appears
    Expected: Toast notification visible at top-right
    Evidence: .sisyphus/evidence/task-t3-toast-global.png

  Scenario: Toast on different page
    Tool: Playwright
    Steps: Navigate to /model-stats, trigger toast, verify visible
    Expected: Toast notification visible at top-right
    Evidence: .sisyphus/evidence/task-t3-toast-model-stats.png
  ```

  **Commit**: YES | Message: `feat(web): mount Sonner Toaster at app root` | Files: `apps/web/src/App.tsx or main.tsx`

---

- [x] T4. WebSocket Server Setup

  **What to do**:
  1. Instalar `ws` + `@types/ws` em `apps/server/`: `pnpm --filter apps/server add ws` e `pnpm --filter apps/server add -D @types/ws`
  2. Criar `apps/server/src/ws/websocket-server.ts`:
     - Criar `WebSocketServer` classe que recebe o `http.Server` do Express
     - Path: `/ws/monitor`
     - Gerenciar connections set (`Set<WebSocket>`)
     - Métodos: `start()`, `stop()`, `broadcast(message)`, `getConnectionCount()`
     - Heartbeat: ping/pong a cada 30s, remover clients mortos
     - Message protocol: JSON `{ type: 'alert' | 'health_update' | 'connected', data: {...} }`
     - On client connect: enviar `connected` message com timestamp
     - On client disconnect: remover do set
  3. Integrar em `apps/server/src/index.ts`:
     - Após Express `listen()`, pegar o `server` instance
     - Passar para `WebSocketServer.start(server)`
     - Exportar instância para uso pelo monitor service
  4. Graceful shutdown: `stop()` no SIGTERM/SIGINT

  **Must NOT do**: Não usar socket.io (overkill). Não criar rotas Express para WebSocket (é upgrade HTTP). Não autenticar WebSocket em v1.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: New infrastructure, needs careful lifecycle management
  - Skills: `[]`

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: T9 | Blocked By: none

  **References**:
  - External: `https://github.com/websockets/ws/blob/master/doc/ws.md` — ws API docs
  - Pattern: `apps/server/src/index.ts` — Server bootstrap and lifecycle
  - Pattern: `apps/server/src/api-server.ts` — Express app creation

  **Acceptance Criteria**:
  - [ ] `apps/server/src/ws/websocket-server.ts` existe com classe `WebSocketServer`
  - [ ] WebSocket server inicia com o Express server
  - [ ] `pnpm --filter apps/server typecheck` passa
  - [ ] Conexão WebSocket em `/ws/monitor` responde com 101 Switching Protocols

  **QA Scenarios**:
  ```
  Scenario: WebSocket connection
    Tool: Bash (curl/wscat)
    Steps: Start server, connect to ws://localhost:3008/ws/monitor
    Expected: Connection established, receive {"type":"connected","data":{"timestamp":"..."}}
    Evidence: .sisyphus/evidence/task-t4-ws-connect.txt

  Scenario: WebSocket broadcast
    Tool: Bash (node test script)
    Steps: Connect 2 clients, broadcast message, verify both receive
    Expected: Both clients receive the broadcast message
    Evidence: .sisyphus/evidence/task-t4-ws-broadcast.txt

  Scenario: Graceful shutdown
    Tool: Bash
    Steps: Connect client, send SIGTERM to server, verify clean disconnect
    Expected: Client receives close frame, no hanging connections
    Evidence: .sisyphus/evidence/task-t4-ws-shutdown.txt
  ```

  **Commit**: YES | Message: `feat(server): add WebSocket server for real-time monitoring` | Files: `apps/server/src/ws/websocket-server.ts, apps/server/src/index.ts`

---

- [x] T5. Vite Proxy Config for WebSocket

  **What to do**:
  1. Ler `apps/web/vite.config.ts` para ver o proxy atual
  2. Adicionar `ws: true` ao proxy config existente do `/api`
  3. Adicionar entrada para `/ws` → `localhost:3008` com `ws: true` (se o path do WebSocket for diferente do `/api`)

  **Must NOT do**: Não mudar o target do proxy existente. Não remover configs existentes.

  **Recommended Agent Profile**:
  - Category: `quick` - Reason: 1-file config change
  - Skills: `[]`

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: none | Blocked By: none

  **References**:
  - File: `apps/web/vite.config.ts` — Current proxy config

  **Acceptance Criteria**:
  - [ ] `ws: true` adicionado ao proxy config do Vite
  - [ ] `pnpm dev` funciona sem erros
  - [ ] WebSocket do browser conecta via Vite proxy

  **QA Scenarios**:
  ```
  Scenario: WebSocket through Vite proxy
    Tool: Playwright
    Steps: Start pnpm dev, open browser, attempt WebSocket connection to ws://localhost:5178/ws/monitor
    Expected: Connection established via proxy
    Evidence: .sisyphus/evidence/task-t5-vite-ws-proxy.txt
  ```

  **Commit**: YES | Message: `feat(web): enable WebSocket proxy in Vite dev config` | Files: `apps/web/vite.config.ts`

---

- [x] T6. Background Monitor Service + Types (in `packages/monitor`)

  **What to do**:
  1. Criar `packages/monitor/src/services/monitor-service.ts`:
     - Classe `MonitorService` com lifecycle: `start()`, `stop()`, `isRunning()`
     - Polling interval: 15 segundos (configurável via `MONITOR_POLL_INTERVAL_MS` env)
     - Usa `setInterval` para polling loop
     - Recebe `AnalyticsDataSource` (para queries PostgreSQL) e `MonitorDb` (para SQLite)
     - Emite eventos via `EventEmitter`: `'alert'` (novo alerta detectado), `'health_update'` (atualização de saúde dos modelos)
     - Mantém state: `lastPollTimestamp: Date`
     - On start: carrega `lastPollTimestamp` do SQLite (ou usa `now - 15s` se primeira vez)
     - On each tick:
       a. Chama `getErrorsSince(lastPollTimestamp)` do analytics
       b. Chama `getErrorCountByModelSince(lastPollTimestamp - 1h)` para baseline
       c. Passa dados para os detectores
       d. Atualiza `lastPollTimestamp = now`
     - On stop: limpa interval, salva state
  2. Criar `packages/monitor/src/services/monitor-types.ts`:
     - Tipos: `AnomalyAlert`, `AnomalyType`, `AlertSeverity`, `DetectorInput`, `DetectorResult`, `ModelHealthStatus`
     - `AnomalyType = 'model_offline' | 'error_spike' | 'timeout_stuck' | 'silent_failure'`
     - `AlertSeverity = 'critical' | 'warning' | 'info'`
     - `DetectorInput = { recentErrors: ErrorLogEntry[], errorCountsByModel: ModelErrorCount[], stuckRequests: StuckRequest[], modelHealthMap: Map<string, ModelHealthStats> }`
     - `DetectorResult = { detected: boolean, alert?: Omit<AnomalyAlert, 'id' | 'created_at'> }`
  3. Exportar tudo de `packages/monitor/src/index.ts`
  4. O `apps/server/` consumirá este serviço em T9 (WebSocket integration) — este task NÃO integra no server

  **Must NOT do**: Não usar mais que 1 conexão do pool PostgreSQL. Não bloquear o event loop. Não crashar se tick falha. Não criar integração com WebSocket neste task.

  **Recommended Agent Profile**:
  - Category: `deep` - Reason: Complex lifecycle, TypeScript interfaces, EventEmitter pattern, integration with analytics data source
  - Skills: `[]`

  **Parallelization**: Can Parallel: NO | Wave 2 | Blocks: T7 | Blocked By: T1, T2

  **References**:
  - Pattern: `packages/analytics/src/data-source/database.ts` — Data source access pattern
  - Pattern: `packages/analytics/src/data-source/index.ts:5` — `createDataSource()` factory
  - API/Type: `packages/analytics/src/types/index.ts:108-116` — `ErrorLogEntry` type
  - New: `packages/monitor/src/db/monitor-queries.ts` (from T1) — SQLite query functions
  - Pattern: Node.js `EventEmitter` — Service event emission pattern

  **Acceptance Criteria**:
  - [ ] `MonitorService` classe existe com `start()`, `stop()`, `isRunning()`
  - [ ] Emite eventos `'alert'` e `'health_update'` via EventEmitter
  - [ ] Polling executa a cada 15s (ou env var)
  - [ ] `lastPollTimestamp` é atualizado após cada tick
  - [ ] Service não crasha se tick falha
  - [ ] Todos os tipos exportados de `packages/monitor/src/index.ts`
  - [ ] `pnpm --filter @lite-llm/monitor typecheck` passa sem erros

  **QA Scenarios**:
  ```
  Scenario: Service lifecycle
    Tool: Bash (vitest)
    Steps: Create MonitorService with mock data sources. Start. Wait 2 ticks. Stop. Assert isRunning=false
    Expected: Service polls twice, timestamps updated, clean stop
    Evidence: .sisyphus/evidence/task-t6-service-lifecycle.txt

  Scenario: Tick failure resilience
    Tool: Bash (vitest)
    Steps: Create MonitorService with data source that throws. Start. Wait 2 ticks.
    Expected: Service continues despite tick errors
    Evidence: .sisyphus/evidence/task-t6-tick-resilience.txt

  Scenario: Event emission
    Tool: Bash (vitest)
    Steps: Create MonitorService with mock detector that returns anomaly. Listen for 'alert' event.
    Expected: Event emitted with correct AnomalyAlert payload
    Evidence: .sisyphus/evidence/task-t6-event-emission.txt
  ```

  **Commit**: YES | Message: `feat(monitor): add background monitor service with event emission` | Files: `packages/monitor/src/services/monitor-service.ts, packages/monitor/src/services/monitor-types.ts, packages/monitor/src/index.ts`

---

- [x] T7. Anomaly Detectors (in `packages/monitor`)

  **What to do**:
  1. Criar `packages/monitor/src/services/detectors/` directory
  2. Criar `packages/monitor/src/services/detectors/model-offline-detector.ts`:
     - Recebe `DetectorInput`
     - Para cada modelo que teve requests nas últimas 2h: verifica se houve 0 sucessos + ≥1 falha nos últimos 15 min
     - Cooldown: 10 min por modelo (consulta SQLite `alerts` para último alerta desse tipo+modelo)
     - Retorna `DetectorResult[]`
  3. Criar `packages/monitor/src/services/detectors/error-spike-detector.ts`:
     - Para cada modelo com ≥10 erros nos últimos 5 min: compara error rate com baseline (última 1h)
     - Se error rate > 3x baseline → spike detectado
     - Cooldown: 5 min por modelo
  4. Criar `packages/monitor/src/services/detectors/timeout-stuck-detector.ts`:
     - Verifica `getStuckRequests()` (requests sem endTime há >5 min)
     - Verifica se p95 latency > 3x o p95 normal (últimas 24h) para qualquer modelo
     - Cooldown: 10 min por modelo
  5. Criar `packages/monitor/src/services/detectors/silent-failure-detector.ts`:
     - Busca requests com `status != 'success'` E `status NOT IN ('timeout', 'rate_limit_error', 'authentication_error')` E sem entrada no `errorLogs`
     - Agrupa por modelo, se count > 3 em 5 min → alerta
     - Cooldown: 5 min por modelo
  6. Criar `packages/monitor/src/services/detectors/index.ts`:
     - Exporta `runAllDetectors(input): DetectorResult[]`
     - Executa todos os detectores e coleta resultados
  7. Integrar no `MonitorService.tick()` (T6):
     - Após coletar dados do PostgreSQL, passar para `runAllDetectors()`
     - Para cada resultado `detected=true`: persistir alerta no SQLite via `insertAlert()`
     - Verificar cooldown antes de persistir
     - Se alerta novo: emitir evento `'alert'` via EventEmitter
  8. Exportar tudo de `packages/monitor/src/index.ts`

  **Must NOT do**: Não implementar ML ou estatísticas complexas. Não crashar se um detector falha (try/catch individual).

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: 4 detector implementations with business logic, cooldown tracking
  - Skills: `[]`

  **Parallelization**: Can Parallel: NO | Wave 2 | Blocks: T9 | Blocked By: T6

  **References**:
  - API/Type: `packages/monitor/src/services/monitor-types.ts` (from T6) — `DetectorInput`, `DetectorResult`
  - Pattern: `packages/analytics/src/queries/helpers.ts:38-39` — `getFailedSpendLogsCondition()` error check
  - Pattern: `packages/analytics/src/queries/model-queries.ts:294-318` — Error breakdown GROUP BY pattern
  - API/Type: `packages/monitor/src/db/monitor-queries.ts` (from T1) — `insertAlert`, `getActiveAlerts`
  - API/Type: `packages/analytics/src/queries/schema.ts:36-47` — `errorLogs` table columns

  **Acceptance Criteria**:
  - [ ] 4 detectores implementados em `packages/monitor/src/services/detectors/`
  - [ ] `runAllDetectors()` executa todos e retorna resultados
  - [ ] Cooldown verificado antes de criar novo alerta
  - [ ] Alertas detectados são persistidos no SQLite
  - [ ] Novos alertas emitem evento `'alert'` no MonitorService
  - [ ] `pnpm --filter @lite-llm/monitor typecheck` passa
  - [ ] Testes unitários para cada detector com dados sintéticos

  **QA Scenarios**:
  ```
  Scenario: Model Offline detection
    Tool: Bash (vitest)
    Steps: Create DetectorInput with model X having 5 failures, 0 successes. Run model-offline-detector.
    Expected: detected=true, anomaly_type='model_offline', severity='critical'
    Evidence: .sisyphus/evidence/task-t7-offline-detect.txt

  Scenario: Error Spike detection
    Tool: Bash (vitest)
    Steps: Create input with model Y having 50 errors in 5 min, baseline 5/hour. Run error-spike-detector.
    Expected: detected=true, anomaly_type='error_spike'
    Evidence: .sisyphus/evidence/task-t7-spike-detect.txt

  Scenario: Cooldown prevents duplicate alerts
    Tool: Bash (vitest)
    Steps: Insert alert for model X offline 2 min ago. Run detector again.
    Expected: No new alert created (cooldown active)
    Evidence: .sisyphus/evidence/task-t7-cooldown.txt
  ```

  **Commit**: YES | Message: `feat(monitor): add anomaly detectors with cooldown and persistence` | Files: `packages/monitor/src/services/detectors/*.ts, packages/monitor/src/services/monitor-service.ts`

---

- [x] T8. Alert History API Endpoints (in `apps/server/`, consumes `@lite-llm/monitor`)

  **What to do**:
  1. Criar `apps/server/src/routes/monitor-routes.ts`:
     - Importar `getAlerts`, `getActiveAlerts`, `acknowledgeAlert`, `countAlertsSince` de `@lite-llm/monitor`
     - `GET /api/monitor/alerts` — Lista alertas com paginação e filtros
       - Query params: `limit` (default 50), `offset` (default 0), `anomaly_type`, `model`, `severity`, `since` (ISO timestamp), `acknowledged` (boolean)
       - Retorna `{ alerts: Alert[], total: number, limit: number, offset: number }`
     - `GET /api/monitor/alerts/active` — Apenas alertas não acknowledged
       - Retorna `{ alerts: Alert[] }`
     - `POST /api/monitor/alerts/:id/acknowledge` — Marca alerta como acknowledged
       - Retorna `{ success: true, alert: Alert }`
     - `GET /api/monitor/stats` — Estatísticas de alertas
       - Retorna `{ total_alerts, active_alerts, alerts_by_type: Record<AnomalyType, number>, alerts_by_severity: Record<AlertSeverity, number>, last_24h_count }`
     - `GET /api/monitor/models/health` — Saúde atual dos modelos
       - Retorna `{ models: { model: string, status: 'healthy'|'degraded'|'offline'|'unknown', last_error_at: string|null, error_rate_1h: number }[] }`
  2. Registrar rotas em `apps/server/src/index.ts` (após `createApiServer()`, antes de `listen()`)
  3. Adicionar `@lite-llm/monitor` como dependência de `apps/server/`: `pnpm --filter apps/server add @lite-llm/monitor@workspace:*`
  4. Adicionar funções de API client em `apps/web/src/lib/api-client/monitor.ts`:
     - `getMonitorAlerts(filters)`, `getActiveAlerts()`, `acknowledgeAlert(id)`, `getMonitorStats()`, `getModelsHealth()`

  **Must NOT do**: Não expor detalhes internos do SQLite. Não criar endpoints de escrita além de acknowledge.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: Multiple endpoints + API client, needs consistency with existing routes
  - Skills: `[]`

  **Parallelization**: Can Parallel: NO | Wave 2 | Blocks: T13 | Blocked By: T1

  **References**:
  - Pattern: `packages/server-core/src/routes/spend-routes.ts:83-92` — Route pattern to follow
  - Pattern: `packages/server-core/src/routes/analytics-routes.ts` — Multiple GET endpoints pattern
  - Pattern: `apps/server/src/index.ts` — Route registration on Express app
  - Pattern: `apps/web/src/lib/api-client/analytics.ts` — API client functions pattern
  - Package: `packages/monitor/src/db/monitor-queries.ts` (from T1) — Query functions to import from `@lite-llm/monitor`

  **Acceptance Criteria**:
  - [ ] 5 endpoints criados e registrados no Express app em `apps/server/src/index.ts`
  - [ ] API client com 5 funções correspondentes
  - [ ] `pnpm typecheck` passa em `apps/server` e `apps/web`
  - [ ] `curl http://localhost:3008/api/monitor/alerts` retorna JSON

  **QA Scenarios**:
  ```
  Scenario: List alerts with filters
    Tool: Bash (curl)
    Steps: Insert test alerts via SQLite, call GET /api/monitor/alerts?anomaly_type=model_offline&limit=10
    Expected: JSON with filtered alerts array
    Evidence: .sisyphus/evidence/task-t8-alerts-list.txt

  Scenario: Acknowledge alert
    Tool: Bash (curl)
    Steps: Insert alert, call POST /api/monitor/alerts/1/acknowledge, verify acknowledged_at set
    Expected: Alert marked as acknowledged
    Evidence: .sisyphus/evidence/task-t8-acknowledge.txt

  Scenario: Model health endpoint
    Tool: Bash (curl)
    Steps: Call GET /api/monitor/models/health
    Expected: JSON with models array, each with status field
    Evidence: .sisyphus/evidence/task-t8-model-health.txt
  ```

  **Commit**: YES | Message: `feat(monitor): add alert history API endpoints` | Files: `apps/server/src/routes/monitor-routes.ts, apps/server/src/index.ts, apps/web/src/lib/api-client/monitor.ts`

---

- [x] T9. Server Integration: Monitor Service + WebSocket Broadcast (in `apps/server/`)

  **What to do**:
  1. Em `apps/server/src/index.ts`:
     - Importar `MonitorService`, `createMonitorDataSource`, `getMonitorDb` de `@lite-llm/monitor`
     - Importar `WebSocketServer` de `./ws/websocket-server`
     - Após `listen()`, instanciar `MonitorService` com:
       - `AnalyticsDataSource` do `createDataSource()`
       - `MonitorDb` do `getMonitorDb()`
     - Chamar `monitorService.start()`
     - Escutar eventos do monitor:
       - `monitorService.on('alert', (alert) => wsServer.broadcast({ type: 'alert', data: alert }))`
       - `monitorService.on('health_update', (data) => wsServer.broadcast({ type: 'health_update', data }))`
     - Graceful shutdown: `monitorService.stop()` + `wsServer.stop()` no SIGTERM/SIGINT
  2. Adicionar `@lite-llm/monitor` como dependência de `apps/server/` (se já não foi adicionado em T8)

  **Must NOT do**: Não colocar lógica de detecção no server — tudo fica em `@lite-llm/monitor`. Não enviar dados sensíveis. Não serializar objetos pesados.

  **Recommended Agent Profile**:
  - Category: `deep` - Reason: Integration between 3 systems (monitor package, WebSocket, Express lifecycle)
  - Skills: `[]`

  **Parallelization**: Can Parallel: NO | Wave 3 | Blocks: T11, T12 | Blocked By: T4, T7

  **References**:
  - New: `apps/server/src/ws/websocket-server.ts` (from T4) — `broadcast(message)` method
  - Package: `packages/monitor/src/services/monitor-service.ts` (from T6) — `MonitorService` class with EventEmitter
  - Package: `packages/monitor/src/services/monitor-types.ts` (from T6) — Event payload types
  - Pattern: `apps/server/src/index.ts` — Server bootstrap and lifecycle

  **Acceptance Criteria**:
  - [ ] `MonitorService` instanciado e iniciado em `apps/server/src/index.ts`
  - [ ] Novos alertas do monitor são broadcast via WebSocket
  - [ ] Health updates são broadcast a cada tick
  - [ ] Broadcast com clientes conectados funciona
  - [ ] Broadcast sem clientes (Set vazio) não gera erro
  - [ ] Tick não bloqueia se broadcast falha
  - [ ] `pnpm --filter apps/server typecheck` passa

  **QA Scenarios**:
  ```
  Scenario: Alert broadcast to connected clients
    Tool: Bash (node test script)
    Steps: Connect WS client, trigger anomaly detection via test data, verify client receives alert message
    Expected: Client receives { type: 'alert', data: { anomaly_type, model, severity, message } }
    Evidence: .sisyphus/evidence/task-t9-alert-broadcast.txt

  Scenario: Health update broadcast
    Tool: Bash (node test script)
    Steps: Connect WS client, wait 2 tick cycles, verify health_update messages received
    Expected: Client receives { type: 'health_update', data: { models, timestamp } }
    Evidence: .sisyphus/evidence/task-t9-health-broadcast.txt
  ```

  **Commit**: YES | Message: `feat(server): integrate monitor service with WebSocket broadcast` | Files: `apps/server/src/index.ts`

---

- [x] T10. WebSocket Client Hook + Reconnection

  **What to do**:
  1. Criar `apps/web/src/hooks/use-monitor-websocket.ts`:
     - Hook React que gerencia conexão WebSocket com `ws://localhost:5178/ws/monitor` (dev) ou `ws://current-host/ws/monitor` (prod)
     - Auto-connect quando a página `/monitor` é montada
     - Auto-disconnect quando desmontada (cleanup)
     - Reconexão automática com exponential backoff: 1s, 2s, 4s, 8s, max 30s
     - Estados: `connecting`, `connected`, `disconnected`, `reconnecting`
     - Expor: `{ status, lastAlerts: AnomalyAlert[], healthData: ModelHealthStatus[], connectionState }`
     - Buffer de alertas: manter últimos 50 alertas em memória
     - Quando conecta: solicitar estado atual via `GET /api/monitor/alerts/active`
  2. Criar `apps/web/src/pages/monitor/monitor-types.ts`:
     - Tipos frontend para alertas e health status (espelhando os tipos do server)
     - `MonitorAlert`: id, anomaly_type, model, severity, message, metadata, detected_at, acknowledged_at
     - `ModelHealthStatus`: model, status ('healthy'|'degraded'|'offline'|'unknown'), last_error_at, error_rate_1h
     - `WebSocketMessage`: type, data
     - `ConnectionState`: 'connecting' | 'connected' | 'disconnected' | 'reconnecting'
  3. Criar `apps/web/src/lib/api-client/ws-client.ts`:
     - Wrapper simples do WebSocket nativo
     - `connect(url)`, `disconnect()`, `onMessage(callback)`, `onStatusChange(callback)`, `reconnect()`
     - JSON parse/stringify automático
     - Heartbeat client-side (responde ping com pong)

  **Must NOT do**: Não usar biblioteca WebSocket de terceiros (usar WebSocket nativo). Não criar estado global (hook é por-instance). Não conectar fora da página `/monitor`.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: React hook with WebSocket lifecycle, reconnection logic, state management
  - Skills: `[]`

  **Parallelization**: Can Parallel: NO | Wave 3 | Blocks: T11, T14 | Blocked By: T4

  **References**:
  - Pattern: `apps/web/src/hooks/use-errors.ts` — Hook pattern with React Query
  - Pattern: `apps/web/src/hooks/dashboard/dashboard-queries.ts` — AUTO_REFRESH_MS pattern
  - API/Type: `packages/monitor/src/services/monitor-types.ts` (from T6) — Server types to mirror
  - Component: `apps/web/src/components/sonner.tsx` — Sonner toast (will be used in T14)
  - Config: `apps/web/vite.config.ts` (from T5) — WebSocket proxy URL

  **Acceptance Criteria**:
  - [ ] `useMonitorWebSocket` hook exportado de `apps/web/src/hooks/use-monitor-websocket.ts`
  - [ ] Conecta automaticamente ao montar
  - [ ] Reconecta com exponential backoff após desconexão
  - [ ] Exibe estados: connecting, connected, disconnected, reconnecting
  - [ ] Buffer de últimos 50 alertas mantido
  - [ ] `pnpm --filter apps/web typecheck` passa

  **QA Scenarios**:
  ```
  Scenario: Hook connects and receives data
    Tool: Bash (vitest + testing-library)
    Steps: Render component using hook with mock WebSocket, verify status transitions connecting → connected
    Expected: Hook reports 'connected' state and receives messages
    Evidence: .sisyphus/evidence/task-t10-hook-connect.txt

  Scenario: Reconnection on disconnect
    Tool: Bash (vitest)
    Steps: Mock WebSocket close, verify reconnect scheduled with backoff
    Expected: Reconnection attempted with increasing delays (1s, 2s, 4s, 8s, 30s cap)
    Evidence: .sisyphus/evidence/task-t10-reconnect.txt
  ```

  **Commit**: YES | Message: `feat(web): add WebSocket client hook with reconnection` | Files: `apps/web/src/hooks/use-monitor-websocket.ts, apps/web/src/lib/api-client/ws-client.ts, apps/web/src/pages/monitor/monitor-types.ts`

---

- [ ] T11. `/monitor` Route + Page Skeleton

  **What to do**:
  1. Adicionar rota `/monitor` em `apps/web/src/App.tsx`:
     - Seguir pattern existente de rotas no App.tsx
  2. Criar `apps/web/src/pages/monitor.tsx`:
     - Página principal do monitor
     - Usa `useMonitorWebSocket` hook (T10) para dados em tempo real
     - Usa `getActiveAlerts()` e `getMonitorStats()` do API client (T8) para dados iniciais
     - Layout: header com título "Monitor" + indicador de conexão WebSocket + contagem de alertas ativos
     - Grid layout com 2 seções: Model Health Dashboard (esquerda) + Alert History (direita)
     - Badge de conexão: verde (connected), amarelo (reconnecting), vermelho (disconnected)
     - Loading skeleton enquanto dados carregam
  3. Criar `apps/web/src/pages/monitor/index.ts` para barrel exports se necessário
  4. Adicionar link para `/monitor` na sidebar se existir componente de sidebar

  **Must NOT do**: Não adicionar gráficos complexos (só tabela/cards). Não adicionar funcionalidade de configuração de thresholds.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` - Reason: New page with layout, responsive grid, connection indicator
  - Skills: `[]`

  **Parallelization**: Can Parallel: NO | Wave 4 | Blocks: T12, T13 | Blocked By: T9, T10

  **References**:
  - Pattern: `apps/web/src/App.tsx` — Route definitions (React Router)
  - Pattern: `apps/web/src/pages/logs.tsx` — Page with tabs structure
  - Pattern: `apps/web/src/pages/model-stats.tsx` — Page with grid layout
  - Hook: `apps/web/src/hooks/use-monitor-websocket.ts` (from T10) — WebSocket data hook
  - API: `apps/web/src/lib/api-client/monitor.ts` (from T8) — REST API client
  - Component: `apps/web/src/components/errors/errors-summary-cards.tsx` — Summary cards pattern to follow

  **Acceptance Criteria**:
  - [ ] Rota `/monitor` acessível e renderiza a página
  - [ ] Indicador de conexão WebSocket visível no header
  - [ ] Grid layout com 2 seções renderizado
  - [ ] Loading skeleton enquanto dados carregam
  - [ ] `pnpm --filter apps/web typecheck` passa

  **QA Scenarios**:
  ```
  Scenario: Page renders
    Tool: Playwright
    Steps: Navigate to /monitor, verify page renders with header and grid layout
    Expected: Page title "Monitor" visible, connection indicator visible, 2-column grid rendered
    Evidence: .sisyphus/evidence/task-t11-page-render.png

  Scenario: Connection indicator states
    Tool: Playwright
    Steps: Navigate to /monitor, verify green indicator when connected
    Expected: Green dot/badge visible indicating WebSocket connected
    Evidence: .sisyphus/evidence/task-t11-connection-indicator.png
  ```

  **Commit**: YES | Message: `feat(web): add /monitor route and page skeleton` | Files: `apps/web/src/App.tsx, apps/web/src/pages/monitor.tsx`

---

- [ ] T12. Model Health Dashboard Component

  **What to do**:
  1. Criar `apps/web/src/components/monitor/model-health-grid.tsx`:
     - Grid de cards, um por modelo ativo
     - Cada card mostra: nome do modelo, status (healthy/degraded/offline/unknown), error rate (última 1h), último erro
     - Cores: usar `HEALTH_COLORS` existentes (#10b981 healthy, #f59e0b degraded, #ef4444 critical/offline)
     - Ordenação: modelos com problemas primeiro (offline > degraded > healthy > unknown)
     - Atualiza em tempo real via dados do WebSocket (health_update messages)
     - Se não há dados: mostrar "Aguardando dados..." com skeleton
  2. Criar `apps/web/src/components/monitor/model-health-card.tsx`:
     - Card individual para um modelo
     - Badge de status colorido
     - Métricas: total requests, success rate %, error count, avg latency
     - Click no card pode navegar para model detail (se existir)
  3. Integrar no `monitor.tsx` (T11) na seção esquerda

  **Must NOT do**: Não criar gráficos (só cards com métricas). Não adicionar drill-down em v1.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` - Reason: Card component with status colors, responsive grid, real-time updates
  - Skills: `[]`

  **Parallelization**: Can Parallel: NO | Wave 4 | Blocks: none | Blocked By: T11

  **References**:
  - Pattern: `apps/web/src/pages/model-stats/model-stats-chart-utils.ts` — `HEALTH_COLORS` constant
  - Pattern: `apps/web/src/components/errors/errors-summary-cards.tsx` — Summary card pattern
  - Component: `apps/web/src/components/errors/errors-table-cell.tsx` — Color-coded badge pattern
  - Type: `apps/web/src/pages/monitor/monitor-types.ts` (from T10) — `ModelHealthStatus` type
  - Hook: `apps/web/src/hooks/use-monitor-websocket.ts` (from T10) — `healthData` state

  **Acceptance Criteria**:
  - [ ] `model-health-grid.tsx` renderiza grid de cards por modelo
  - [ ] Cards mostram status, error rate, último erro
  - [ ] Cores corretas: healthy=verde, degraded=amarelo, offline=vermelho
  - [ ] Modelos com problemas aparecem primeiro
  - [ ] Atualiza em tempo real com dados do WebSocket

  **QA Scenarios**:
  ```
  Scenario: Health grid renders models
    Tool: Playwright
    Steps: Navigate to /monitor with test data, verify model cards rendered with correct colors
    Expected: Cards for each model, offline model in red, healthy in green
    Evidence: .sisyphus/evidence/task-t12-health-grid.png

  Scenario: Real-time health update
    Tool: Playwright
    Steps: On /monitor, simulate WebSocket health_update with model going offline, verify card turns red
    Expected: Model card updates from green to red within 1s of message
    Evidence: .sisyphus/evidence/task-t12-health-update.png
  ```

  **Commit**: YES | Message: `feat(web): add model health dashboard grid component` | Files: `apps/web/src/components/monitor/model-health-grid.tsx, apps/web/src/components/monitor/model-health-card.tsx`

---

- [ ] T13. Alert History Table Component

  **What to do**:
  1. Criar `apps/web/src/components/monitor/alert-history-table.tsx`:
     - Tabela de alertas com colunas: timestamp, tipo, modelo, severidade, mensagem, ações
     - Paginação server-side (usando limit/offset do API T8)
     - Filtros: anomaly_type (select), severity (select), model (text), since (date picker)
     - Botão "Acknowledged" para marcar alerta como lido
     - Badge de severidade colorido: critical=vermelho, warning=amarelo, info=azul
     - Badge de tipo: model_offline, error_spike, timeout_stuck, silent_failure — com ícone/emoji
     - Auto-update: quando novo alerta chega via WebSocket, adicionar ao topo da lista (optimistic)
     - Empty state: "Nenhum alerta detectado" com ícone de check
  2. Criar `apps/web/src/components/monitor/alert-filters.tsx`:
     - Barra de filtros com selects e input de texto
     - Follow pattern de `apps/web/src/components/errors/errors-filter-card.tsx`
  3. Criar `apps/web/src/components/monitor/alert-severity-badge.tsx`:
     - Badge component para severidade
     - Follow pattern de `apps/web/src/components/errors/errors-table-cell.tsx`
  4. Criar `apps/web/src/components/monitor/alert-type-badge.tsx`:
     - Badge para tipo de anomalia com label amigável
  5. Integrar no `monitor.tsx` (T11) na seção direita

  **Must NOT do**: Não criar export CSV/PDF. Não criar gráficos de tendência de alertas. Não usar datatables library complexa.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: Table component with server-side pagination, filters, real-time updates
  - Skills: `[]`

  **Parallelization**: Can Parallel: NO | Wave 4 | Blocks: none | Blocked By: T8, T11

  **References**:
  - Pattern: `apps/web/src/components/errors/errors-table.tsx` — Table with pagination pattern
  - Pattern: `apps/web/src/components/errors/errors-table-columns.ts` — Column definition pattern
  - Pattern: `apps/web/src/components/errors/errors-filter-card.tsx` — Filter card pattern
  - Pattern: `apps/web/src/components/errors/errors-table-cell.tsx` — Badge/cell renderer pattern
  - Pattern: `apps/web/src/pages/logs-errors-tab.tsx` — Auto-refetch and client-side filter pattern
  - API: `apps/web/src/lib/api-client/monitor.ts` (from T8) — `getMonitorAlerts()`, `acknowledgeAlert()`
  - Hook: `apps/web/src/hooks/use-monitor-websocket.ts` (from T10) — `lastAlerts` for optimistic updates

  **Acceptance Criteria**:
  - [ ] Tabela renderiza com colunas: timestamp, tipo, modelo, severidade, mensagem, ações
  - [ ] Paginação server-side funcional
  - [ ] Filtros funcionam e atualizam a tabela
  - [ ] Botão acknowledge marca alerta como lido
  - [ ] Novos alertas via WebSocket aparecem no topo (optimistic update)
  - [ ] Empty state exibido quando não há alertas

  **QA Scenarios**:
  ```
  Scenario: Alert table renders
    Tool: Playwright
    Steps: Navigate to /monitor, verify alert table visible with columns
    Expected: Table with headers: Timestamp, Type, Model, Severity, Message, Actions
    Evidence: .sisyphus/evidence/task-t13-alert-table.png

  Scenario: Acknowledge alert
    Tool: Playwright
    Steps: Click acknowledge button on an alert row, verify badge changes to "Acknowledged"
    Expected: Alert marked, visual change confirmed
    Evidence: .sisyphus/evidence/task-t13-acknowledge.png

  Scenario: Real-time alert insertion
    Tool: Playwright
    Steps: On /monitor, simulate WebSocket alert message, verify new row appears at top
    Expected: New alert row added to top of table without full page reload
    Evidence: .sisyphus/evidence/task-t13-realtime-alert.png
  ```

  **Commit**: YES | Message: `feat(web): add alert history table with filters and real-time updates` | Files: `apps/web/src/components/monitor/alert-history-table.tsx, alert-filters.tsx, alert-severity-badge.tsx, alert-type-badge.tsx`

---

- [ ] T14. Browser Notification API + Toast Integration

  **What to do**:
  1. Criar `apps/web/src/hooks/use-monitor-notifications.ts`:
     - Hook que observa `lastAlerts` do WebSocket e dispara notificações
     - Para cada novo alerta:
       a. Dispara `toast.error()` (Sonner) com: título do tipo de anomalia + mensagem + nome do modelo
       b. Tenta `new Notification(title, { body, icon, tag })` via Browser Notification API
     - Permission request: ao montar o hook, chamar `Notification.requestPermission()`
     - Se permissão negada: só toasts (fallback)
     - Deduplication client-side: não notificar o mesmo alerta (por ID) duas vezes
     - Se aba em foco: toast visível + notification silenciosa (ou sem notification)
     - Se aba em background: notification + toast para quando voltar
  2. Criar `apps/web/src/lib/monitor-notification-utils.ts`:
     - `formatAlertToast(anomaly): { title, description }` — formata texto amigável
     - `getAlertIcon(severity): string` — ícone/emoji por severidade (🔴 critical, 🟡 warning, 🔵 info)
     - `shouldNotify(alert, lastNotifiedIds): boolean` — dedup check
  3. Integrar `useMonitorNotifications` no `monitor.tsx`:
     - Importar e usar dentro da página `/monitor`
     - Toasts aparecem no canto superior direito (configurado no T3)
  4. Garantir que o `<Toaster />` montado no T3 está visível na página `/monitor`

  **Must NOT do**: Não criar notification personalizada (usar API nativa). Não notificar quando a aba está em foco E o usuário já está na página `/monitor` (toast é suficiente). Não bloquear a página pedindo permissão — pedir de forma não-intrusiva.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: Browser API integration, dedup logic, conditional behavior based on focus state
  - Skills: `[]`

  **Parallelization**: Can Parallel: NO | Wave 4 | Blocks: none | Blocked By: T3, T10

  **References**:
  - Component: `apps/web/src/components/sonner.tsx` (from T3) — Toaster component
  - Pattern: `apps/web/src/pages/model-stats/use-model-stats-actions.ts` — `toast.success/error/warning` usage pattern
  - Hook: `apps/web/src/hooks/use-monitor-websocket.ts` (from T10) — `lastAlerts` to observe
  - Type: `packages/monitor/src/services/monitor-types.ts` (from T6) — `MonitorAlert` type
  - External: `https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API` — Browser Notification API

  **Acceptance Criteria**:
  - [ ] `useMonitorNotifications` hook existe e é usado na página `/monitor`
  - [ ] Novos alertas disparam toast Sonner
  - [ ] Novos alertas disparam Browser Notification (se permissão concedida)
  - [ ] Permissão negada → fallback para toast-only
  - [ ] Mesmo alerta não notificado duas vezes (dedup por ID)
  - [ ] `pnpm --filter apps/web typecheck` passa

  **QA Scenarios**:
  ```
  Scenario: Toast notification on new alert
    Tool: Playwright
    Steps: Navigate to /monitor, simulate WebSocket alert, verify toast appears at top-right
    Expected: Sonner toast with alert type title, model name, and message visible
    Evidence: .sisyphus/evidence/task-t14-toast-notification.png

  Scenario: Browser notification permission flow
    Tool: Playwright
    Steps: Navigate to /monitor, verify permission request dialog appears, grant permission, trigger alert
    Expected: Browser notification displayed with alert details
    Evidence: .sisyphus/evidence/task-t14-browser-notification.png

  Scenario: Dedup prevents double notification
    Tool: Bash (vitest)
    Steps: Pass same alert ID twice to notification hook, assert second call does not trigger notification
    Expected: Only one notification triggered per alert ID
    Evidence: .sisyphus/evidence/task-t14-dedup.txt
  ```

  **Commit**: YES | Message: `feat(web): add browser notifications and toast alerts for anomalies` | Files: `apps/web/src/hooks/use-monitor-notifications.ts, apps/web/src/lib/monitor-notification-utils.ts, apps/web/src/pages/monitor.tsx`

## Final Verification Wave (MANDATORY — after ALL implementation tasks)
> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.
> **Do NOT auto-proceed after verification. Wait for user's explicit approval before marking work complete.**
> **Never mark F1-F4 as checked before getting user's okay.** Rejection or user feedback -> fix -> re-run -> present again -> wait for okay.
- [ ] F1. Plan Compliance Audit — oracle
- [ ] F2. Code Quality Review — unspecified-high
- [ ] F3. Real Manual QA — unspecified-high (+ playwright for /monitor page)
- [ ] F4. Scope Fidelity Check — deep

## Commit Strategy
- Commits por task conforme indicado. Conventional Commits: `feat(monitor): description`
- Wave 1: 5 commits independentes
- Wave 2: 2-3 commits (service + detectors podem ser 1 commit)
- Wave 3: 2 commits
- Wave 4: 2-3 commits
- Total estimado: ~12 commits

## Success Criteria
1. WebSocket conecta e empurra alertas em <1s após detecção
2. Anomalias detectadas aparecem na página `/monitor` em tempo real
3. Toast + Browser Notification disparam para cada anomalia nova
4. Histórico de alertas sobrevive restart do server (SQLite)
5. Build/typecheck/lint/test passam sem erros
6. Zero impacto nas funcionalidades existentes
