# 🔍 Code Review Completo — LiteLLM Analytics Monorepo

**Data:** 2026-05-06 (v2 — segunda verificação consolidada)
**Escopo:** `apps/web`, `apps/server`, `packages/*` (9 pacotes)
**Método:** Rodada 1: 5 agentes paralelos (código, duplicação, estrutura). Rodada 2: verificação manual direcionada (segurança, auth, logging, operacional, CI/CD, maturidade)

---

## 📊 Resumo

| Gravidade | Categoria                               | Findings |
| --------- | --------------------------------------- | -------- |
| 🔴 Crítico | Segurança                               | 3        |
| 🔴 Crítico | Correção (dados/RCE/erros silenciosos)  | 5        |
| 🟠 Alto    | Duplicação de código/tipos              | 8        |
| 🟠 Alto    | Testes (zero cobertura em pacotes core) | 6        |
| 🟡 Médio   | Estrutura/manutenibilidade              | 9        |
| 🟡 Médio   | Performance/risco de produção           | 4        |
| ⚪ Baixo   | Padronização/cosmético                  | 5        |
| 🆕 Crítico | Segunda verificação — Segurança         | 3        |
| 🆕 Crítico | Segunda verificação — Correção          | 4        |
| 🆕 Alto    | Segunda verificação — Operacional       | 4        |
| 🆕 Médio   | Segunda verificação — Maturidade        | 5        |

# 🔴 CRÍTICO — SEGURANÇA

### S1. API sem proteção — sem CORS, Helmet, Rate Limiting

**Arquivo:** `apps/server/src/runtime/api-server.ts:9-21`

```typescript
export function createApiServer(opts: RouteOptions): Application {
  const app = express();
  app.use(express.json());  // ← só isso
  registerAllRoutes(app, opts);
  return app;
}
```

**Problema:** Qualquer origin pode chamar a API. Sem headers de segurança (X-Frame-Options, CSP, etc). Sem proteção contra brute-force/DoS.

**Solução:** Adicionar `cors()`, `helmet()`, `express-rate-limit` como middleware.

> - [ ] **Executar:** Adicionar middleware de segurança (cors, helmet, rate-limit)

---

### S2. Credenciais hardcoded em 3 lugares

| Arquivo                                                     | Linha   | Valor                                               |
| ----------------------------------------------------------- | ------- | --------------------------------------------------- |
| `packages/agents-manager/src/storage/file-storage.ts`       | 102-103 | `apiKey: "sk-123456789"`                            |
| `packages/agents-manager/src/generators/providers/index.ts` | 66-67   | `apiKey: "sk-123456789"`                            |
| `packages/config/src/server.ts`                             | 15      | `DB_PASSWORD: z.string().default("dbpassword9090")` |

**Problema:** Se o `.env` não for configurado, defaults inseguros vão para produção.

**Solução:** Substituir por `z.string().min(1)` sem default, ou usar placeholder que force erro explícito.

> - [x] **Executar:** Remover credenciais hardcoded e substituir por validação obrigatória

---

### S3. `delete /agent-config/:key` — type inválido deleta agent silenciosamente

**Arquivo:** `packages/server-core/src/routes/agent-config/item-routes.ts:114-124`

```typescript
const { type } = req.query;
if (type === "category") {
  await deleteCategoryFromConfig(key);
} else {
  await deleteAgentFromConfig(key);  // ← fallback perigoso para type=qualquer_coisa
}
```

**Problema:** `?type=invalid` tenta deletar um agent que pode ser uma category.

**Solução:** Adicionar validação explícita e retornar 400 se `type` não for `"agent"` nem `"category"`.

> - [x] **Executar:** Validar `type` query param no DELETE de agent-config

---

# 🔴 CRÍTICO — CORREÇÃO

### C1. 52 blocos `try/catch` idênticos nos routes — sem error handler global

**Arquivo:** `packages/server-core/src/routes/analytics-routes.ts:81-269` (+ 5 outros route files)

```typescript
try {
  // ... lógica
} catch (_err) {
  res.status(500).json({ error: String(_err) });
}
```

Este pattern aparece 52 vezes. Nenhum log estruturado, nenhum error code, nenhum stack trace.

**Solução:** Adicionar error handler global do Express:
```typescript
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[API Error]", err);
  res.status(500).json({ error: err.message });
});
```
E usar wrapper `asyncHandler` para propagar erros ao handler.

> - [x] **Executar:** Adicionar error handler global do Express e eliminar 52 catch blocks

---

### C2. Zero validação Zod em inputs de API — 79 `as` casts em dados não confiáveis

**Arquivos:** Todos os route handlers em `packages/server-core/src/routes/` + `apps/server/src/routes/`

```typescript
const model = req.query.model as string;     // ← sem validação
const limit = Number.parseInt(req.query.limit as string, 10) || 1000;
// Se req.query.limit = "abc", parseInt → NaN → || 1000 salva por acidente
```

**Problema:** Inputs maliciosos ou malformados passam sem validação. Parsing frágil que funciona "por sorte".

**Solução:** Adicionar schemas Zod para query params e body em todas as rotas.

> - [x] **Executar:** Adicionar Zod validation nos inputs de todas as rotas da API

---

### C3. `parseDays()` sem limite máximo — permite `?days=999999`

**Arquivo:** `packages/server-core/src/orchestration/lite-llm-params.ts:3-13`

```typescript
export function parseDays(rawValue: unknown, fallback: number): number {
  if (typeof rawValue !== "string") return fallback;
  const parsed = Number.parseFloat(rawValue);
  if (Number.isNaN(parsed) || parsed < 0) return fallback;
  return parsed;  // ← sem Math.min(parsed, MAX_DAYS)!
}
```

**Problema:** Usuário pode puxar `?days=999999`, causando OOM no servidor com full table scans.

**Solução:** Adicionar `Math.min(parsed, 365)` ou constante configurável.

> - [x] **Executar:** Adicionar limite máximo em `parseDays()`

---

### C4. Operações destrutivas sem transação — dados parcialmente corrompidos em falha

**Arquivo:** `packages/analytics/src/queries/model-queries.ts:160-176`

```typescript
export async function mergeModels(source: string, target: string) {
  await db.update(spendLogs).set({ model: target }).where(eq(spendLogs.model, source));
  // ← sem db.transaction()! Falha no meio = dados parcialmente migrados
}
```

**Afetados:** `mergeModels()`, `deleteModel()`, `deleteModelLogs()` — todos sem rollback.

**Solução:** Envolver em `db.transaction(async (tx) => { ... })`.

> - [x] **Executar:** Adicionar `db.transaction()` em operações destrutivas do analytics

---

### C5. Monitor engole erros do data source — zero alertas quando DB cai

**Arquivo:** `packages/monitor/src/services/monitor-service.ts:69-85`

```typescript
.catch(() => [] as ErrorLogEntry[]),       // ← DB caiu? retorna array vazio
.catch(() => null as ModelHealth | null),    // ← DB caiu? retorna null
```

**Problema:** Se o analytics DB cair, o monitor reporta "zero erros / zero anomalias" em vez de alertar sobre a falha do data source.

**Solução:** Logar o erro e propagar métrica de "data source unavailable" em vez de engolir.

> - [x] **Executar:** Substituir catches silenciosos no MonitorService por métricas de falha

---

# 🟠 ALTO — DUPLICAÇÃO DE CÓDIGO/TIPOS

### D1. `AgentConfig` / `CategoryConfig` definidos em 2 lugares — divergentes

| Local                      | Característica                                         |
| -------------------------- | ------------------------------------------------------ |
| `@litellm/shared`          | Zod schemas, sem index signature                       |
| `@lite-llm/agents-manager` | `[key: string]: unknown` — aceita qualquer campo extra |

**Problema:** Não são estruturalmente compatíveis. `agents-manager` nem depende de `@litellm/shared`. Mudanças em um lado não propagam ao outro.

**Solução:** Adicionar `@litellm/shared` como dependency de `agents-manager`, remover tipos locais, usar os do shared.

> - [x] **Executar:** Unificar tipos AgentConfig/CategoryConfig no `@litellm/shared`

---

### D2. Alias dialog state/functions copiados 3x

**Arquivos:**
- `apps/web/src/pages/models/use-models-alias-state.ts`
- `apps/web/src/pages/agent-routing/use-agent-routing-dialog-state.ts`
- `apps/web/src/pages/aliases.tsx` (linhas 35-38)

Mesmo padrão em 3 lugares: `aliasDialogOpen`, `aliasDialogMode`, `aliasDialogKey`, `aliasDialogValue` + `openAddAlias()` / `openEditAlias()` + `handleAliasSave()` / `handleAliasDelete()`.

**Solução:** Extrair `useAliasDialogState()` e `useAliasActions()` hooks compartilhados.

> - [x] **Executar:** Extrair hook compartilhado de alias dialog state + actions

---

### D3. Model-stats tem DOIS sistemas paralelos (um deve morrer)

| Sistema A (composed hooks)   | Sistema B (page-level)                  |
| ---------------------------- | --------------------------------------- |
| `use-model-stats-state.ts`   | `dialog-state.ts`                       |
| `use-model-stats-actions.ts` | `dialog-handlers.ts`                    |
| `use-model-stats-derived.ts` | Inline derivations em `model-stats.tsx` |

Ambos implementam `handleSort`, `toggleColumn`, `openDeleteDialog`, `handleDelete`, `handleMerge`, `confirmMerge`. Apenas um está ativo.

**Solução:** Remover `dialog-state.ts` + `dialog-handlers.ts` + inline derivations; consolidar nos composed hooks.

> - [x] **Executar:** Remover sistema paralelo de model-stats (dialog-state + dialog-handlers)

---

### D4. `formatDuration` implementado 4x com comportamentos diferentes

| Arquivo                                 | NaN/null handling                          | Seguro?          |
| --------------------------------------- | ------------------------------------------ | ---------------- |
| `lib/format.ts:42`                      | ✅ Completo (null, undefined, NaN, <1000ms) | ✅                |
| `dashboard/dashboard-utils.ts:24`       | ❌ Nenhum                                   | ❌ Quebra com NaN |
| `model-stats/model-stats-utils.ts:18`   | ⚠️ Parcial (`!ms`, NaN)                     | ⚠️                |
| `model-detail/model-detail-utils.ts:16` | ⚠️ Apenas NaN                               | ⚠️                |

**O mesmo vale para:**
- `formatDate` — 3 implementações diferentes
- `formatPercent` — 3 implementações com retornos diferentes (`"N/A"` vs `"-"`)
- `maskApiKey` — 2 implementações com lógicas DIFERENTES (6 chars vs 4 chars)
- `formatRelativeTime` — 2 implementações (locale-based vs English hardcoded)

**Solução:** Consolidar tudo em `lib/format.ts` como single source of truth.

> - [x] **Executar:** Consolidar todos os formatters em `lib/format.ts`

---

### D5. Error badge classes copiadas 3x

**Original (exportado):** `components/errors/errors-utils.ts` — `getStatusBadgeClass()`, `getErrorTypeBadgeClass()`

**Duplicatas:**
- `components/errors/error-detail-dialog.tsx` (linhas 33-60) — redefine ambas + `getSpendStatusBadgeClass`
- `components/errors/errors-table-cell.tsx` (linhas 8-36) — redefine ambas

**Solução:** Importar de `errors-utils.ts` nos 2 arquivos que duplicam.

> - [x] **Executar:** Importar badge classes de errors-utils.ts nos 2 arquivos que duplicam

---

### D6. Chart colors duplicados

`pages/model-stats/model-stats-chart-utils.ts` duplica exatamente as cores de `lib/chart-colors.ts` com nomes ligeiramente diferentes:
```
MODEL_STATS_CHART_COLORS ≈ CHART_COLORS
LATENCY_CHART_COLORS ≈ LATENCY_COLORS
ERROR_CHART_COLOR ≈ ERROR_COLOR
HEALTH_COLORS ≈ HEALTH_STATUS_COLORS
CHART_HEIGHT = 300 (idêntico)
```

**Solução:** Importar de `lib/chart-colors.ts` em vez de redefinir.

> - [x] **Executar:** Unificar chart colors — importar de lib/chart-colors.ts

---

### D7. Query de erros duplicada — `error-queries.ts` ≈ `monitor-queries.ts`

65 linhas idênticas de SELECT (13 colunas com COALESCE) + fallback query com `try/catch`.

**Solução:** Extrair função `buildErrorSelectQuery()` compartilhada.

> - [x] **Executar:** Extrair query builder de erros compartilhado

---

### D8. `ConnectionState` type definido em 2 lugares

`pages/monitor/monitor-types.ts` e `pages/health-status/health-status-types.ts` — mesmo union: `"connecting" | "connected" | "disconnected" | "reconnecting"`.

**Solução:** Mover para um local compartilhado (ex: `types/connection.ts`).

> - [x] **Executar:** Unificar ConnectionState type em local compartilhado

---

# 🟠 ALTO — TESTES

### T1. 5 pacotes com ZERO testes

| Pacote                    | Função                                     | ~Linhas |
| ------------------------- | ------------------------------------------ | ------- |
| `@lite-llm/analytics`     | 14 queries + 46-method data source + types | 2000+   |
| `@lite-llm/server-core`   | 9 route files + orchestration + types      | 1500+   |
| `@lite-llm/monitor`       | SQLite schema + 4 detectors + service      | 1500+   |
| `@litellm/shared`         | Types + Zod schemas                        | 200     |
| `@lite-llm/api-contracts` | API type contracts                         | 200     |

**Solução:** Priorizar testes para analytics (data backbone) e server-core (routes).

> - [x] **Executar:** Criar testes para `@lite-llm/analytics` (queries + data source)
> - [x] **Executar:** Criar testes para `@lite-llm/server-core/routes/`
> - [x] **Executar:** Criar testes para `@lite-llm/monitor` (detectors + service)
> - [x] **Executar:** Criar testes para `@litellm/shared` (Zod schema validation)
> - [x] **Executar:** Criar testes para `@lite-llm/api-contracts`

---

### T2. 5 dos 6 hooks web sem testes

Apenas `use-page-filters` tem teste. Sem cobertura para:
- `use-dashboard-data.ts` (155 linhas, 8+ queries compostas)
- `use-model-detail-data.ts` (303 linhas, 16 queries paralelas)
- `use-monitor-websocket.ts` (65 linhas, WebSocket com reconnect)
- `use-logs.ts` (76 linhas)
- `use-errors.ts` (34 linhas)

**Solução:** Criar testes unitários com React Query wrapper mockado.

> - [x] **Executar:** Criar testes para hooks sem cobertura (5 hooks)

---

### T3. 7 páginas web sem testes

`dashboard`, `errors`, `logs`, `model-detail`, `monitor`, `health-status`, `aliases` — zero cobertura de renderização e interação.

**Solução:** Testes de smoke (renderização) + testes de interação para cada página.

> - [ ] **Executar:** Criar testes de smoke para páginas sem cobertura

---

### T4. Testes com assertions condicionais — sempre passam

**Arquivo:** `apps/web/src/pages/__tests__/agent-routing.test.tsx:127-171`

```typescript
if (paletteButtons.length > 0) {  // ← se o botão não renderiza, teste passa!
  await userEvent.click(paletteButtons[0]);
  await waitFor(() => {
    expect(screen.getByText(/Edit Agent Configuration:/)).toBeInTheDocument();
  });
}
```

**Problema:** Se o componente mudar e os botões sumirem, testes passam silenciosamente.

**Solução:** Substituir `if` por `expect(paletteButtons.length).toBeGreaterThan(0)` ou usar Testing Library queries.

> - [x] **Executar:** Corrigir assertions condicionais em agent-routing.test.tsx

---

### T5. `getServer()` helper copiado 4x nos testes de server

`agent-routing.test.ts`, `agent-definitions.test.ts`, `agent-config-delete.test.ts`, `agent-config-alias-resolution.test.ts` — todos definem a mesma factory `getServer()` com orchestration mock.

**Solução:** Extrair para `__tests__/helpers/create-test-server.ts`.

> - [x] **Executar:** Extrair getServer() helper compartilhado nos testes de server

---

### T6. `sortAliasesByDefinitionOrder` testado 2x

`packages/alias-router/__tests__/sort/index.test.ts` e `apps/server/src/__tests__/alias-generator.test.ts` testam a mesma função com cenários sobrepostos.

**Solução:** Manter apenas o teste no pacote de origem (`alias-router`); remover o do server.

> - [x] **Executar:** Remover teste duplicado de sortAliasesByDefinitionOrder

---

# 🟡 MÉDIO — ESTRUTURA/MANUTENIBILIDADE

### M1. `health-status.tsx` — 601 linhas com 3 sub-componentes inline

**Arquivo:** `apps/web/src/pages/health-status.tsx`

`StatusDetailsDialog` (122 linhas) + 2 tabelas (models tab, history tab) deveriam ser componentes extraídos.

**Solução:** Extrair para `components/health-status/status-details-dialog.tsx`, `models-table.tsx`, `history-table.tsx`.

> - [x] **Executar:** Extrair sub-componentes de health-status.tsx

---

### M2. `alert-history-table.tsx` — 486 linhas com `ModelDetailDialog` inline

**Arquivo:** `apps/web/src/components/monitor/alert-history-table.tsx:124-246`

122 linhas de dialog inline + paginação manual sem componente compartilhado.

**Solução:** Extrair `ModelDetailDialog` como componente + usar componente de paginação compartilhado.

> - [x] **Executar:** Extrair ModelDetailDialog e paginação de alert-history-table.tsx

---

### M3. `health-check-service.ts` — 769 linhas

**Arquivo:** `packages/monitor/src/services/health-check-service.ts`

SSE parsing, HTTP retry, model workarounds, token calculation — tudo em um único arquivo.

**Solução:** Separar em módulos: `sse-parser.ts`, `http-client.ts`, `token-calculator.ts`, `model-workarounds.ts`.

> - [x] **Executar:** Split health-check-service.ts (769 linhas) em módulos menores

---

### M4. `use-model-stats-derived.ts` — 16 `useMemo` individuais

Todas dependem do mesmo `data` array. Poderiam ser 1-2 `useMemo` agrupados computando todos os agregados de uma vez.

**Solução:** Consolidar em 1 `useMemo` com único `reduce` que computa todos os agregados.

> - [x] **Executar:** Consolidar 16 useMemo de model-stats em 1-2 agrupados

---

### M5. Types definidos em `agent-config/types.ts` nunca usados

`GlobalFallbackBody`, `AgentConfigItemBody`, `BulkConfigBody`, `RouteRegistrar` — os handlers usam `as` casts inline em vez de importar esses tipos.

**Solução:** Usar os tipos definidos nos handlers ou remover o arquivo de tipos se não for usado.

> - [x] **Executar:** Usar ou remover tipos não utilizados de agent-config/types.ts

---

### M6. 13x bloco "model is required" copiado em `analytics-routes.ts`

**Arquivo:** `packages/server-core/src/routes/analytics-routes.ts:91-269`

```typescript
const model = String(req.query.model || "");
if (!model) { res.status(400).json({ error: "model is required" }); return; }
const days = parseDays(req.query.days, 30);
```

Deveria ser um middleware compartilhado.

**Solução:** Extrair `requireModelParam` middleware.

> - [x] **Executar:** Extrair middleware requireModelParam (elimina 13x duplicação)

---

### M7. Duas rotas DELETE para `/models/logs` com params diferentes

**Arquivo:** `packages/server-core/src/routes/model-routes.ts:126-141`

`DELETE /models/logs?model=X` e `DELETE /models/logs/:model` — ambiguidade na API. Ambos chamam o mesmo handler.

**Solução:** Remover uma das rotas; preferir path param (`:model`) por ser RESTful.

> - [x] **Executar:** Remover rota DELETE duplicada de /models/logs

---

### M8. Dynamic imports desnecessários em hot path

**Arquivo:** `packages/server-core/src/routes/agent-config/item-routes.ts`

6 `await import()` dentro de request handlers. Já são dependencies do package.

**Solução:** Mover para top-level static imports.

> - [x] **Executar:** Substituir dynamic imports por static imports em item-routes.ts

---

### M9. `AGENT_KEYS` vs `AGENT_DEFINITIONS` — 3 agents sem aliases

| Constante           | Pacote          | Entradas |
| ------------------- | --------------- | -------- |
| `AGENT_KEYS`        | `alias-router`  | 11       |
| `AGENT_DEFINITIONS` | `api-contracts` | 14       |

"build", "plan", "OpenCode-Builder" não têm aliases gerados.

**Solução:** Sincronizar `AGENT_KEYS` com `AGENT_DEFINITIONS`.

> - [x] **Executar:** Sincronizar AGENT_KEYS com AGENT_DEFINITIONS (3 agents faltando)

---

# 🟡 MÉDIO — PERFORMANCE/RISCO

### P1. `getSpendLogs` com `limit=0` = 100.000 linhas

**Arquivo:** `packages/analytics/src/queries/spend-queries.ts:56`

```typescript
const effectiveLimit = params.limit === 0 ? 100000 : (params.limit ?? 50);
```

**Solução:** Usar cursor-based pagination ou reduzir máximo para 1000.

> - [x] **Executar:** Reduzir limit máximo de getSpendLogs ou usar cursor-based pagination

---

### P2. `getStuckRequests()` — sem `.limit()`

**Arquivo:** `packages/analytics/src/queries/monitor-queries.ts:143-153`

Durante outages, pode retornar milhares de linhas.

**Solução:** Adicionar `.limit(1000)`.

> - [x] **Executar:** Adicionar .limit() em getStuckRequests()

---

### P3. `getLatestHealthChecks` carrega TODOS registros antes de filtrar

**Arquivo:** `packages/monitor/src/db/monitor-queries.ts:207-222`

```typescript
const all = db.select().from(modelHealthChecks).orderBy(...).all();
// ← filtra unique models em JS, não em SQL. Cresce sem limites.
```

**Solução:** Usar `DISTINCT ON` ou subquery no SQL.

> - [x] **Executar:** Otimizar getLatestHealthChecks com DISTINCT ON no SQL

---

### P4. WebSocket heartbeat `setTimeout` acumula sem limpeza

**Arquivo:** `apps/server/src/ws/websocket-server.ts:91-96`

A cada heartbeat (30s), novo `setTimeout` por cliente. Nunca `clearTimeout`. Sob churn alto, acumula timers.

**Solução:** Armazenar timer ID e chamar `clearTimeout` no disconnect ou próximo tick.

> - [x] **Executar:** Corrigir setTimeout leak no WebSocket heartbeat

---

# ⚪ BAIXO — PADRONIZAÇÃO/COSMÉTICO

### L1. Dead code / unused exports

| Item                                          | Arquivo                            | Linha |
| --------------------------------------------- | ---------------------------------- | ----- |
| `usePageFilters` hook (não importado)         | `hooks/use-page-filters.ts`        | 1-30  |
| `modelMerges` singleton (nunca escrito)       | `queries/model-queries.ts`         | 178   |
| `getCredentialByName` (nunca chamado)         | `queries/key-queries.ts`           | 58    |
| `getModelByName` (nunca chamado)              | `queries/model-queries.ts`         | 101   |
| `ModelQueryParams` (nunca importado)          | `types/index.ts`                   | 277   |
| `FilterOptions` (nunca importado)             | `types/index.ts`                   | 304   |
| `GitMaster` type (exportado, nunca importado) | `shared/src/types/agent-config.ts` | 78    |

> - [x] **Executar:** Remover dead code listado (7 itens)

---

### L2. Duas organizações de teste coexistem

`__tests__/` directories + colocated `.test.ts` files — sem padrão único.

**Solução:** Escolher um padrão e migrar o outro.

> - [x] **Executar:** Padronizar organização de testes (__tests__/ ou colocado)

---

### L3. 3 versões de TypeScript no monorepo

| Versão  | Pacotes                                                               |
| ------- | --------------------------------------------------------------------- |
| `5.7.2` | analytics, agents-manager, alias-router, server-core, shared, monitor |
| `5.9.3` | apps/server                                                           |
| `6.0.3` | root, apps/web, config                                                |

**Solução:** Unificar em `^6.0.3` (já usado no root).

> - [x] **Executar:** Unificar versão TypeScript para ^6.0.3
> - Em Pacotes que são utilizados em vários packages do monorepo, definir a versão no pnpm-workspace.yaml para evitar múltiplas versões. Ex: `@lite-llm/shared` é usado em vários lugares, então definir a versão de TypeScript no shared para ^6.0.3 e garantir que os outros pacotes dependam da versão do shared.
---

### L4. Zod v3 (`shared`) vs Zod v4 (`config`) — APIs quebradas

Se `@litellm/shared` schemas forem importados no contexto de `@lite-llm/env`, quebram em runtime.

**Solução:** Unificar versão Zod (recomendado: migrar shared para v4).

> - [x] **Executar:** Unificar versão Zod (migrar shared para v4)
> - Em Pacotes que são utilizados em vários packages do monorepo, definir a versão no pnpm-workspace.yaml para evitar múltiplas versões. Ex: `@lite-llm/shared` é usado em vários lugares, então definir a versão de TypeScript no shared para ^6.0.3 e garantir que os outros pacotes dependam da versão do shared.
---

### L5. Naming inconsistente: `@litellm/shared` vs `@lite-llm/*`

Todos os pacotes usam `@lite-llm/` (com dash), exceto `@litellm/shared` (sem dash).

**Solução:** Renomear para `@lite-llm/shared` (requer atualizar imports em todos os consumers).

> - [x] **Executar:** Renomear @litellm/shared → @lite-llm/shared

---

---

# 🔴 SEGUNDA VERIFICAÇÃO — SEGURANÇA (Novos)

### N1. API inteira sem autenticação — zero proteção

**Verificação:** Busca por `passport`, `jwt`, `authenticate`, `authMiddleware`, `requireAuth`, `authorization`, `session` em `apps/server/src/`.

**Resultado:** Zero resultados. Nenhum middleware de auth, nenhum token, nenhuma sessão.

**Problema:** Todos os endpoints são públicos. Qualquer pessoa que acessar a API pode ver dados de spend, modelos, logs de erros, deletar modelos, mesclar dados, disparar health checks.

**Solução:** Adicionar autenticação via API key (header `x-api-key`) ou JWT. Middleware `requireApiKey()` validando contra env var ou banco.

> - [ ] **Executar:** Adicionar middleware de autenticação por API key

---

### N2. Sem proteção XSS no frontend — dados do banco renderizados sem sanitização

**Verificação:** Busca por `DOMPurify`, `sanitize-html`, `escape` em `apps/web/src/`.

**Resultado:** Zero resultados. Dados do banco (model names, user IDs, error messages) são renderizados diretamente com `{value}`.

**Problema:** Se um model name ou error message contiver `<script>`, será executado no browser (stored XSS via banco LiteLLM).

**Solução:** Adicionar `DOMPurify.sanitize()` em dados vindos do banco antes de renderizar. Para React, usar `dangerouslySetInnerHTML` apenas com sanitização prévia.

> - [x] **Executar:** Adicionar sanitização XSS nos dados vindos do banco

---

### N3. `LITELLM_API_KEY` default vazio — falha silenciosa

**Arquivo:** `packages/config/src/server.ts:18`

```typescript
LITELLM_API_KEY: z.string().default(""),
```

**Problema:** Se não configurar `.env`, o app inicia com API key vazia. Chamadas ao LiteLLM falham silenciosamente (ou pior: funcionam sem key se o LiteLLM estiver em modo dev).

**Solução:** Remover `.default("")` e usar `.min(1, "LITELLM_API_KEY is required")`. Ou `.optional()` com log de warning explícito.

> - [x] **Executar:** Remover default vazio de LITELLM_API_KEY

---

# 🔴 SEGUNDA VERIFICAÇÃO — CORREÇÃO (Novos)

### N4. Pool PostgreSQL não é fechado no shutdown

**Arquivo:** `apps/server/src/runtime/app-runtime.ts:84-89`

```typescript
const stop = () => {
  console.log("\nShutting down gracefully...");
  healthCheckRuntime.stop();
  monitorRuntime.stop();
  httpServer.close(() => process.exit(0));  // ← fecha HTTP, mas NÃO fecha pool PG!
};
```

**Problema:** O pool de conexões PostgreSQL (`packages/analytics/src/queries/client.ts`) é criado como singleton e nunca fechado. No shutdown, conexões ativas são abandonadas — o PG server mantém idle connections até timeout.

**Solução:** Exportar `closePool()` do client.ts e chamar no handler de shutdown:
```typescript
import { closePool } from "@lite-llm/analytics/queries";
// ...
await closePool();
```

> - [x] **Executar:** Fechar pool PostgreSQL no graceful shutdown

---

### N5. App não tem React Error Boundary — crash branco em produção

**Verificação:** Busca por `ErrorBoundary`, `componentDidCatch`, `getDerivedStateFromError` em `apps/web/src/`.

**Resultado:** Zero resultados. Nenhum error boundary em toda a árvore React.

**Problema:** Qualquer erro não tratado em um componente quebra a página inteira (tela branca). Sem boundary, o React desmonta toda a árvore.

**Solução:** Criar `<ErrorBoundary>` wrapper que captura erros e mostra fallback UI com botão de retry. Encapsular cada página ou seção crítica.

> - [x] **Executar:** Criar ErrorBoundary wrapper para a árvore React

---

### N6. Zero logging estruturado — erros viram `String(_err)`

**Verificação:** Busca por `winston`, `pino`, `bunyan`, `morgan`, `logger.info`, `logger.error`, `logger.warn` no monorepo inteiro.

**Resultado:** Zero resultados. Nenhum logger estruturado, nenhum request logger. Todos os "logs" são `console.log()`.

**Problema:** Sem níveis de log (debug/info/warn/error). Sem contexto (request ID, timestamp, user). Sem output configurável (stdout vs file vs external). Debugging em produção é às cegas.

**Solução:** Adicionar `pino` (leve, rápido, JSON nativo) como logger. Middleware `pino-http` para request logging automático. Substituir `console.log()` por `logger.info()`.

> - [x] **Executar:** Adicionar pino como logger estruturado + middleware de request logging

---

### N7. DB connection não tem retry — crash no startup se PG offline

**Arquivo:** `packages/analytics/src/queries/client.ts:6-14`

```typescript
const pool = new Pool({
  host: serverEnv.DB_HOST,
  // ... sem connectionTimeoutMillis? sem retry?
  max: 10,
  idleTimeoutMillis: 30000,
});
```

**Problema:** Se PostgreSQL estiver indisponível no startup, a primeira query falha e o app não tem mecanismo de retry. O pool tenta conectar, falha, e o erro se propaga sem tratamento.

**Solução:** Adicionar `connectionTimeoutMillis: 5000` e implementar retry com backoff no startup (ex: 3 tentativas com 1s/2s/4s delay). Health check de readiness que depende do DB estar conectado.

> - [x] **Executar:** Adicionar retry + connectionTimeout no pool PostgreSQL

---

# 🟠 SEGUNDA VERIFICAÇÃO — OPERACIONAL (Novos)

### N8. Sem CI/CD — zero automação

**Verificação:** Busca por `.github/workflows/`, `.gitlab-ci.yml`, `Jenkinsfile`.

**Resultado:** Nenhum arquivo de CI/CD. O repositório não tem pipeline automatizado.

**Problema:** Lint, typecheck, build e testes dependem de execução manual. PRs podem ser mergeados com type errors, lint violations ou testes quebrados.

**Solução:** Criar `.github/workflows/ci.yml` com jobs: `lint`, `typecheck`, `build`, `test`. Executar em PRs e push na main.

> - [ ] **Executar:** Criar GitHub Actions CI pipeline (lint + typecheck + build + test)

---

### N9. Sem health check endpoint para orquestradores

**Verificação:** Busca por `/health`, `/healthz`, `/ready`, `/livez` em `packages/server-core/src/routes/`.

**Resultado:** Zero resultados nas rotas do server-core. Existe `/health-check/run` no `app-runtime.ts` mas é para disparar health checks de modelos, não para readiness/liveness do próprio servidor.

**Problema:** Load balancers e orquestradores (K8s, Docker Swarm, PM2) não conseguem verificar se o app está healthy. Se o DB cair, o app continua recebendo tráfego.

**Solução:** Adicionar `GET /health` (liveness — app está rodando?) e `GET /ready` (readiness — DB está conectado?).

> - [x] **Executar:** Criar endpoints GET /health e GET /ready

---

### N10. Sem versionamento de API

**Verificação:** Busca por `/v1/`, `/v2/`, `apiVersion`, version headers.

**Resultado:** Zero resultados. Nenhum versionamento nos paths ou headers.

**Problema:** Qualquer breaking change na API quebra todos os clients simultaneamente.

**Solução:** Prefixar rotas com `/api/v1/`. Ou usar header `Accept-Version: 1.0`.

> - [ ] **Executar:** Versionar API com prefixo /api/v1/

---

### N11. README desatualizado — estrutura e env vars erradas

**Arquivo:** `README.md` (raiz)

**Problemas:**
- Mostra estrutura antiga (`apps/web/` como app única, sem `apps/server/`)
- Referencia `apps/web/src/db/` que não existe mais (movido para `packages/analytics/`)
- Referencia `apps/web/src/server/` que não existe mais (movido para `packages/server-core/`)
- `.env.example` usa `VITE_DB_*` (Vite client-side) mas o DB agora é server-side (config `packages/config/src/server.ts` com `DB_*`)
- Lista de scripts no README não inclui os novos (não mostra `typecheck`, não mostra `test` por pacote)

**Solução:** Atualizar README para refletir estrutura atual, variáveis de ambiente corretas e novos scripts.

> - [x] **Executar:** Atualizar README.md com estrutura e env vars corretas

---

# 🟡 SEGUNDA VERIFICAÇÃO — MATURIDADE (Novos)

### N12. Sem API documentation — endpoints invisíveis

**Verificação:** Busca por `swagger`, `openapi`, `redoc`, `api-docs`.

**Resultado:** Zero resultados. Nenhuma documentação de API gerada automaticamente ou manual.

**Problema:** Desenvolvedores precisam ler o código-fonte para descobrir endpoints, parâmetros e respostas. Frontend e backend facilmente dessincronizam.

**Solução:** Adicionar `swagger-jsdoc` + `swagger-ui-express` com anotações JSDoc nas rotas. Ou usar `@elysiajs/swagger` se migrar para Elysia.

> - [x] **Executar:** Adicionar OpenAPI/Swagger documentation

---

### N13. Sem request tracing — debugar é às cegas

**Verificação:** Busca por `requestId`, `traceId`, `correlationId`, `X-Request-Id`, `uuid`.

**Resultado:** Zero resultados. Nenhum ID de request para tracing.

**Problema:** Impossível correlacionar logs do frontend com backend. Se um usuário reporta erro, não há como rastrear qual request no servidor causou.

**Solução:** Adicionar middleware que gera `X-Request-Id` (UUID), anexa ao `res.locals`, e retorna no header de resposta. Incluir nos logs.

> - [ ] **Executar:** Adicionar middleware de request ID (UUID + X-Request-Id header)

---

### N14. Sem suporte a i18n — texto hardcoded em inglês

**Verificação:** Busca por `i18n`, `react-i18next`, `useTranslation`, formatjs.

**Resultado:** Zero resultados. Todo texto da UI está hardcoded em inglês nos componentes.

**Problema:** Para adicionar português ou qualquer outro idioma, seria necessário reescrever todos os componentes.

**Solução:** Adicionar `react-i18next` com namespace por página. Extrair strings para arquivos JSON de tradução.

> - [ ] **Executar:** Configurar i18n com react-i18next (começar com en + pt-BR)

---

### N15. Sem .nvmrc — versão Node inconsistente entre devs

**Verificação:** Busca por `.nvmrc`, `.node-version`, `engines` no `package.json` raiz.

**Resultado:** Nenhum arquivo. Nenhum campo `engines` no root `package.json`.

**Problema:** Desenvolvedores podem usar Node 18, 20, 22, causando inconsistências. O AGENTS.md diz "Node.js >= 20" mas não há enforcement.

**Solução:** Criar `.nvmrc` com `20` e adicionar `"engines": { "node": ">=20" }` no root `package.json`.

> - [x] **Executar:** Criar .nvmrc e adicionar engines field

---

### N16. Fetch hooks não cancelam requests no unmount

**Verificação:** Busca por `AbortController`, `isMounted` em `apps/web/src/hooks/`.

**Resultado:** Zero resultados. Nenhum hook usa `AbortController` para cancelar fetch no cleanup.

**Problema:** Se o usuário navega rápido entre páginas, requests em andamento continuam consumindo recursos. Pior: callbacks de sucesso podem tentar atualizar estado de componente desmontado (memory leak + warning React).

**Solução:** Adicionar `AbortController` no `useEffect` de cada hook de fetch. Passar `signal` para `fetch()`. No cleanup: `controller.abort()`.

> - [x] **Executar:** Adicionar AbortController nos hooks de fetch

---

# 📋 ORDEM DE EXECUÇÃO RECOMENDADA (ATUALIZADA)

### Fase 0 — Imediato (Blast Radius)
- [ ] N1: Adicionar middleware de autenticação por API key
- [ ] N2: Adicionar sanitização XSS nos dados vindos do banco
- [ ] N3: Remover default vazio de LITELLM_API_KEY

### Fase 1 — Crítico (Semana 1)
- [ ] S1: Adicionar middleware de segurança (cors, helmet, rate-limit)
- [ ] S2: Remover credenciais hardcoded
- [ ] S3: Validar `type` query param no DELETE de agent-config
- [ ] C1: Adicionar error handler global do Express
- [ ] C2: Adicionar Zod validation nos inputs das rotas da API
- [ ] C3: Adicionar limite máximo em `parseDays()`
- [ ] C4: Adicionar `db.transaction()` em operações destrutivas
- [ ] C5: Substituir catches silenciosos no MonitorService
- [ ] N4: Fechar pool PostgreSQL no graceful shutdown
- [ ] N5: Criar ErrorBoundary wrapper para a árvore React
- [ ] N6: Adicionar pino como logger estruturado
- [ ] N7: Adicionar retry + connectionTimeout no pool PostgreSQL

### Fase 2 — Alto (Semanas 2-3)
- [ ] D1: Unificar tipos AgentConfig/CategoryConfig no shared
- [ ] D2: Extrair hook de alias dialog state + actions
- [ ] D3: Remover sistema paralelo de model-stats
- [ ] D4: Consolidar formatters em lib/format.ts
- [ ] D5: Importar badge classes de errors-utils.ts
- [ ] D6: Unificar chart colors
- [ ] D7: Extrair query builder de erros compartilhado
- [ ] D8: Unificar ConnectionState type
- [ ] T1-T6: Iniciar cobertura de testes nos pacotes críticos
- [ ] N8: Criar GitHub Actions CI pipeline
- [ ] N9: Criar endpoints GET /health e GET /ready
- [ ] N10: Versionar API com prefixo /api/v1/

### Fase 3 — Médio (Semanas 4-5)
- [ ] M1-M9: Melhorias estruturais
- [ ] P1-P4: Performance/risco
- [ ] N11: Atualizar README.md
- [ ] N12: Adicionar OpenAPI/Swagger documentation
- [ ] N13: Adicionar middleware de request ID

### Backlog — Baixo
- [ ] L1-L5: Padronização
- [ ] N14: Configurar i18n com react-i18next
- [ ] N15: Criar .nvmrc e adicionar engines field
- [ ] N16: Adicionar AbortController nos hooks de fetch
