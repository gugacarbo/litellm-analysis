# Spec: Prompt Evals com WebUI (`@lite-llm/prompt-eval`)

## Contexto
Precisamos avaliar se as descrições de categorias em `@storage/agents.jsonc` estão sendo acionadas no contexto correto, sem reescrever do zero infraestrutura de eval. A execução deve funcionar por CLI e também pela WebUI, com histórico persistido e progresso por etapa.

## Objetivo
Implementar um sistema de avaliação de prompts baseado em categorias com:

- pacote público em `packages/` (`@lite-llm/prompt-eval`),
- arquitetura por adapters (interface mínima, Promptfoo v1 como implementação),
- execução assíncrona via backend com EventEmitter para progresso,
- acompanhamento e histórico via WebUI (WebSocket + polling fallback),
- review com IA não-bloqueante (diagnóstico, sem bloquear run),
- gate objetivo por `macroF1` (multi-label, one-vs-rest),
- cancelamento de run via API.

## Escopo Funcional

### 1) Pacote novo: `@lite-llm/prompt-eval`
Criar pacote dedicado com API pública estável.

Responsabilidades:

- carregar dataset de eval (`@storage/category-eval.dataset.json`),
- classificar prompts em categorias (multi-label),
- calcular métricas (accuracy, precision/recall/F1 per label via one-vs-rest, macroF1, hamming loss, confusion matrix multi-label),
- executar review com IA,
- emitir progresso por etapa via `EventEmitter`,
- gerar relatórios JSON e Markdown,
- suportar cancelamento via `AbortSignal`.

### 2) Adapter de eval (interface + Promptfoo v1)
Interface mínima `PromptEvalAdapter` com dois métodos:

```typescript
interface PromptEvalAdapter {
  classify(input: ClassifyInput): Promise<ClassifyOutput>;
  review(input: ReviewInput): Promise<ReviewOutput>;
}
```

Implementação `PromptfooAdapter` como backend v1:

- classificação zero-shot via LiteLLM (provider configurável, default = proxy local),
- temperatura padrão `0`,
- parsing de saída estruturada (JSON array de labels),
- retry controlado para falhas transitórias (3 tentativas, exponential backoff),
- review IA via rubric/model-graded (diagnóstico, sem bloquear run),
- suporte a `AbortSignal` em todas as operações.

### 3) Workflow de categoria
Workflow inicial especializado em classificação multi-label de categoria:

- entrada: `CategoryDefinition[]` + `CategoryEvalCase[]`,
- saída: `CategoryEvalReport` + `AiReviewReport`,
- gate: falhar run quando `macroF1 < 0.80`,
- provider do modelo de classificação configurável via `CategoryEvalOptions.model` (ex: `"openai/gpt-4o-mini"` ou `"litellm/gpt-4o"`).

### 4) Execução via WebUI
Usuário consegue disparar eval pela interface e acompanhar progresso.

- execução em background (fila in-process, concorrência inicial = 1),
- progresso por etapa em tempo real via WebSocket (bridge com EventEmitter do pacote),
- histórico persistido de runs,
- detalhe de run com métricas, timeline de etapas e artefatos,
- cancelamento de run em andamento,
- runs órfãs (servidor reinicia) → marcadas como `failed` automaticamente,
- sem comparação lado a lado na v1.

## Interfaces Públicas (Contrato)

### Pacote `@lite-llm/prompt-eval`

Funções exportadas:

- `createEvalAdapter(options: EvalAdapterOptions): PromptEvalAdapter`
- `runCategoryEvaluation(input: CategoryEvalInput, signal?: AbortSignal): Promise<CategoryEvalReport>`
- `runCategoryAiReview(input: AiReviewInput): Promise<AiReviewReport>`
- `runCategoryEvalWithReview(input: CategoryEvalInput, signal?: AbortSignal): Promise<{ report: CategoryEvalReport; review: AiReviewReport }>`

Tipos principais:

- `PromptEvalAdapter` — interface mínima (`classify`, `review`)
- `ClassifyInput` / `ClassifyOutput`
- `ReviewInput` / `ReviewOutput`
- `EvalAdapterOptions` — `{ provider: string; apiKey?: string; baseUrl?: string }`
- `CategoryDefinition` — `{ id: string; name: string; description: string }`
- `CategoryEvalCase` — `{ id: string; input: string; expectedCategories: string[] }`
- `CategoryEvalInput` — `{ categories: CategoryDefinition[]; cases: CategoryEvalCase[]; model: string; threshold: number }`
- `CategoryEvalOptions` — `{ adapter: PromptEvalAdapter; model: string; threshold: number }`
- `CategoryEvalReport` — `{ runId: string; metrics: CategoryEvalMetrics; predictions: CategoryPrediction[]; durationMs: number }`
- `CategoryEvalMetrics` — `{ accuracy: number; macroF1: number; perLabel: Record<string, { precision: number; recall: number; f1: number; support: number }>; hammingLoss: number; confusionMatrix: number[][] }`
- `CategoryPrediction` — `{ caseId: string; expected: string[]; predicted: string[]; correct: boolean }`
- `AiReviewFinding` — `{ caseId: string; input: string; expected: string[]; predicted: string[]; assessment: "correct" | "incorrect" | "ambiguous"; reasoning: string }`
- `AiReviewSuggestion` — `{ categoryId: string; currentDescription: string; suggestedDescription: string; rationale: string }`
- `AiReviewReport` — `{ findings: AiReviewFinding[]; suggestions: AiReviewSuggestion[]; summary: string }`

Tipos de runtime (eventos e status):

- `EvalEvent` — union type para eventos do EventEmitter:
  - `{ type: "step:start"; step: EvalStep; message: string }`
  - `{ type: "step:progress"; step: EvalStep; progressPct: number; message: string }`
  - `{ type: "step:end"; step: EvalStep }`
  - `{ type: "run:completed"; report: CategoryEvalReport }`
  - `{ type: "run:failed"; error: string }`
- `EvalStep` — `"loading_dataset" | "classifying" | "scoring" | "reviewing" | "reporting"`
- `EvalRunStatus` — `"queued" | "loading_dataset" | "classifying" | "scoring" | "reviewing" | "reporting" | "succeeded" | "failed" | "cancelled"`

Tipos de persistência (entidades DB):

- `EvalRun` — `{ id: string; type: "category_eval"; status: EvalRunStatus; model: string; macroF1: number | null; threshold: number; error: string | null; startedAt: number; finishedAt: number | null }`
- `EvalRunStep` — `{ id: number; runId: string; step: EvalStep; status: "pending" | "running" | "completed" | "failed"; startedAt: number; finishedAt: number | null; message: string | null; progressPct: number }`
- `EvalRunArtifact` — `{ id: number; runId: string; kind: "eval_report_json" | "eval_report_md" | "review_report_json" | "review_report_md"; path: string; summaryJson: string | null }`

## Backend/API para WebUI

### Application Service (`apps/server/src/application/prompt-eval-application-service.ts`)

Factory function `createPromptEvalApplicationService(opts)` que retorna objeto com:

- `startRun(input: CategoryEvalInput): Promise<EvalRun>`
- `listRuns(page: number, pageSize: number): Promise<{ runs: EvalRun[]; total: number }>`
- `getRun(id: string): Promise<EvalRun & { steps: EvalRunStep[] } | null>`
- `getRunArtifacts(id: string): Promise<EvalRunArtifact[]>`
- `cancelRun(id: string): Promise<boolean>`

Responsável por:

- criar registros no SQLite,
- disparar execução em background (não-bloqueante),
- fazer bridge entre `EventEmitter` do pacote e WebSocket,
- atualizar steps e status no SQLite conforme eventos,
- no startup, marcar todas as runs com status não-terminal como `failed` (erro: "server restarted").

### Novas rotas (`apps/server/src/routes/prompt-eval-routes.ts`)

Factory function `createPromptEvalRouter(service)` retornando `Router`:

- `POST /api/prompt-evals/runs` — cria e inicia run em background
  - Body: `{ model: string; threshold?: number }`
  - Response 201: `EvalRun`
- `GET /api/prompt-evals/runs` — lista histórico paginado
  - Query: `?page=1&pageSize=20`
  - Response: `{ runs: EvalRun[]; total: number }`
- `GET /api/prompt-evals/runs/:id` — detalhes + steps + métricas
  - Response: `EvalRun & { steps: EvalRunStep[] }`
- `GET /api/prompt-evals/runs/:id/artifacts` — metadados/paths de relatório
  - Response: `EvalRunArtifact[]`
- `POST /api/prompt-evals/runs/:id/cancel` — cancela run em andamento
  - Sinaliza `AbortController` da run
  - Response 200: `{ cancelled: true }` ou 409 se run não estiver ativa

### Eventos WebSocket
Aproveitar servidor WS existente (`apps/server/src/ws/websocket-server.ts`), adicionar ao `MessageType`:

- `"prompt_eval_run_update"` — payload: `{ runId: string; step: EvalStep; status: string; progressPct: number; message: string | null }`
- `"prompt_eval_run_completed"` — payload: `{ runId: string; status: "succeeded" | "failed" | "cancelled"; macroF1: number | null; error: string | null }`

Formato envelope: `{ type: MessageType; data: unknown }` (padrão existente).

### Runtime Wiring (`apps/server/src/runtime/`)
Criar `PromptEvalRuntime` seguindo padrão do `MonitorRuntime`:

1. Instanciar `createEvalAdapter({ provider: "litellm" })` com config do env,
2. Criar `createPromptEvalApplicationService({ adapter, db, wsServer })`,
3. Instanciar `WebSocketServer` (compartilhado ou dedicado),
4. Conectar eventos do adapter ao WS server.

## Persistência

Reaproveitar SQLite existente (`@db/app.db` via `@lite-llm/app-repository`).

### Schema (seguir padrão dual existente: Drizzle + raw SQL)

**Drizzle** (`repositories/app-repository/src/schema.ts` — adicionar):

```typescript
export const promptEvalRuns = sqliteTable("prompt_eval_runs", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  status: text("status").notNull(),
  model: text("model").notNull(),
  macroF1: real("macro_f1"),
  threshold: real("threshold").notNull(),
  error: text("error"),
  startedAt: integer("started_at").notNull(),
  finishedAt: integer("finished_at"),
});
export type EvalRun = typeof promptEvalRuns.$inferSelect;
export type NewEvalRun = typeof promptEvalRuns.$inferInsert;
```

**Raw SQL** (`repositories/app-repository/src/client.ts` — adicionar em `initDb()`):

```sql
CREATE TABLE IF NOT EXISTS prompt_eval_runs (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  status TEXT NOT NULL,
  model TEXT NOT NULL,
  macro_f1 REAL,
  threshold REAL NOT NULL,
  error TEXT,
  started_at INTEGER NOT NULL,
  finished_at INTEGER
);
```

Tabelas novas (mesmo padrão):

- `prompt_eval_runs` — colunas: `id`, `type`, `status`, `model`, `macro_f1`, `threshold`, `error`, `started_at`, `finished_at`
- `prompt_eval_run_steps` — colunas: `id` (PK autoincrement), `run_id` (FK), `step`, `status`, `started_at`, `finished_at`, `message`, `progress_pct`
- `prompt_eval_run_artifacts` — colunas: `id` (PK autoincrement), `run_id` (FK), `kind`, `path`, `summary_json`

Timestamps: **Unix timestamps em segundos** (`Math.floor(Date.now() / 1000)`), consistente com tabelas existentes.

IDs de run: UUID v4 gerado no servidor (não autoincrement, para evitar colisões em ambientes distribuídos futuros).

### Queries (`repositories/app-repository/src/queries.ts` — adicionar)

Funções exportadas seguindo padrão verb-first existente:

- `insertEvalRun(run: NewEvalRun): EvalRun`
- `updateEvalRunStatus(id: string, status: string, updates: Partial<Pick<EvalRun, "macroF1" | "error" | "finishedAt">>): void`
- `getEvalRun(id: string): EvalRun | undefined`
- `listEvalRuns(limit: number, offset: number): { runs: EvalRun[]; total: number }`
- `failOrphanedRuns(): number` — marca todas as runs não-terminadas como `failed`
- `insertEvalRunStep(step: NewEvalRunStep): EvalRunStep`
- `updateEvalRunStep(id: number, updates: Partial<Pick<EvalRunStep, "status" | "progressPct" | "message" | "finishedAt">>): void`
- `getEvalRunSteps(runId: string): EvalRunStep[]`
- `insertEvalRunArtifact(artifact: NewEvalRunArtifact): EvalRunArtifact`
- `getEvalRunArtifacts(runId: string): EvalRunArtifact[]`

### Artefatos em disco (auditáveis)
Gerados pelo pacote `@lite-llm/prompt-eval` no final da run:

- `@storage/reports/{runId}/category-eval.json`
- `@storage/reports/{runId}/category-eval.md`
- `@storage/reports/{runId}/category-review.json`
- `@storage/reports/{runId}/category-review.md`

Paths persistidos na tabela `prompt_eval_run_artifacts`. Diretório `@storage/reports/` versionado no `.gitignore`.

## Frontend (WebUI)

### Página nova
Criar página de evals no padrão State-Actions-Derived:

- `apps/web/src/pages/prompt-evals.tsx` — página principal (JSX)
- `apps/web/src/pages/prompt-evals/types.ts` — tipos da página
- `apps/web/src/pages/prompt-evals/utils.ts` — formatadores puros
- `apps/web/src/pages/prompt-evals/use-prompt-evals-state.ts` — `useQuery` para runs + detalhe
- `apps/web/src/pages/prompt-evals/use-prompt-evals-actions.ts` — `useMutation` para start/cancel
- `apps/web/src/pages/prompt-evals/use-prompt-evals-derived.ts` — `useMemo` para ordenação/filtros
- `apps/web/src/pages/prompt-evals/use-prompt-evals-page.ts` — composição
- `apps/web/src/lib/api-client/prompt-evals.ts` — client HTTP

### Client HTTP (`apps/web/src/lib/api-client/prompt-evals.ts`)
Funções exportadas:

- `startEval(model: string, threshold?: number): Promise<EvalRun>`
- `listEvals(page?: number, pageSize?: number): Promise<{ runs: EvalRun[]; total: number }>`
- `getEval(id: string): Promise<EvalRun & { steps: EvalRunStep[] }>`
- `getEvalArtifacts(id: string): Promise<EvalRunArtifact[]>`
- `cancelEval(id: string): Promise<{ cancelled: boolean }>`

### WebSocket Client
Hook `useEvalWebSocket(runId?: string)` que conecta ao WS existente (`/ws/monitor`) e filtra eventos `prompt_eval_run_update` e `prompt_eval_run_completed` para atualizar React Query cache.

### UX v1

- formulário de execução: dropdown de `model` + slider/input de `threshold` (default 0.80) + botão "Run Eval"
- lista de runs (histórico): tabela com status badge, modelo, macroF1, data, duração
- detalhe do run: timeline vertical de etapas com ícones de status + progresso
- métricas: macroF1 destacado (verde ≥ 0.80, vermelho < 0.80), tabela per-label, matriz de confusão
- AI review: seção colapsável com findings e suggestions
- links para abrir relatórios JSON/MD (abre em nova aba ou download)
- botão "Cancel" visível apenas em runs ativas

### Sidebar
Adicionar entrada em Agents → `Evals` (entre `Config` e `Plugins + Routing`).

### Rota
`apps/web/src/App.tsx`: adicionar `<Route path="/prompt-evals" element={<ErrorBoundary><PromptEvalsPage /></ErrorBoundary>} />`

## Dataset
Dataset manual versionado (ground truth) multi-label:

- arquivo: `@storage/category-eval.dataset.json`
- shape:
  ```typescript
  interface CategoryEvalDataset {
    version: number;
    description: string;
    cases: Array<{
      id: string;
      input: string;
      expectedCategories: string[];  // IDs de CategoryDefinition
      notes?: string;
    }>;
  }
  ```
- single-label é caso especial (array com 1 elemento)
- validação: toda `expectedCategory` deve existir nas `CategoryDefinition` carregadas

## Regras de Aprovação

- critério principal: `macroF1` (one-vs-rest sobre labels)
- threshold inicial: `0.80` (configurável via `CategoryEvalInput.threshold`)
- AI review: não-bloqueante (diagnóstico e sugestões, executado após scoring)
- run falha (status `failed`) automaticamente quando `macroF1 < threshold`

## Gerenciamento de Estado de Run

### Ciclo de vida
```
queued → loading_dataset → classifying → scoring → reviewing → reporting → succeeded
                                                                              ↘ failed (macroF1 < threshold ou erro)
```

### Cancelamento
- `POST /runs/:id/cancel` → sinaliza `AbortController`
- Run no estado `cancelling` faz cleanup, salva passos até o momento, status final → `cancelled`
- Runs em `cancelled` não têm métricas (exceto passos concluídos)

### Recuperação pós-restart
- No startup do servidor: `failOrphanedRuns()` marca todas as runs com status não-terminal como `failed`
- Erro registrado: `"server restarted during run"`
- Passos que estavam `running` viram `failed` também

## Testes

### Unit (`packages/prompt-eval/src/__tests__/`)

- cálculo de métricas multi-label (macroF1, one-vs-rest, hamming loss, confusion matrix)
- validação de dataset (labels inexistentes, casos vazios, formato inválido)
- parser de saída do classificador (extração de JSON array, handling de malformed output)
- parser de saída do reviewer (rubric/model-graded parsing)
- transições de estado por etapa
- cancelamento via AbortSignal (step não inicia após signal)

### Contrato de adapter

- suite de conformidade para `PromptEvalAdapter` (interface test)
- `PromptfooAdapter` deve passar 100%

### Integração

- criação de run em background (não bloqueia request)
- persistência de runs/steps/artifacts
- broadcast de eventos WS (`prompt_eval_run_update`, `prompt_eval_run_completed`)
- geração de relatórios JSON/MD com paths corretos
- cancelamento de run (signal propaga, status atualiza)
- recuperação pós-restart (órfãs viram failed)

### Web

- disparo de run via formulário
- atualização de progresso em tempo real via WS (mock com `ws` ou stub)
- render de histórico e detalhe com métricas
- cancelamento via botão na UI

## Não-objetivos (v1)

- comparação lado a lado entre runs
- execução em CI
- múltiplos adapters ativos em produção (LangSmith fica preparado, não implementado)
- fila de execução externa (Redis, BullMQ)
- edição de dataset via WebUI
- agendamento de runs

## Critérios de Aceite

1. É possível disparar eval pela WebUI sem usar CLI.
2. O usuário vê progresso por etapa em tempo real via WebSocket.
3. Histórico de runs persiste após reinício do servidor.
4. Run falha quando `macroF1 < 0.80` (threshold configurável).
5. AI review aparece no resultado, mas não bloqueia aprovação.
6. Relatórios JSON/MD ficam disponíveis para download/inspeção via UI.
7. É possível cancelar uma run em andamento pela UI.
8. Runs em progresso no restart do servidor são marcadas como `failed` automaticamente.
9. Dataset multi-label com validação de consistência de labels.
10. Provider do modelo de classificação é configurável (default = proxy LiteLLM local).

## Assunções

- execução local nesta fase,
- concorrência inicial da fila = 1 (in-process),
- dataset manual versionado é fonte oficial de ground truth,
- classificação de categoria é multi-label (one-vs-rest para métricas),
- provider default é o proxy LiteLLM local (`litellm/`), mas pode ser sobrescrito para provider externo,
- WebSocket reutiliza servidor existente em `/ws/monitor`,
- SQLite reutiliza `@db/app.db` com o padrão dual Drizzle + raw SQL existente.

## Dependências do Pacote (`packages/prompt-eval/package.json`)

```json
{
  "name": "@lite-llm/prompt-eval",
  "private": true,
  "type": "module",
  "dependencies": {
    "@lite-llm/app-repository": "workspace:*",
    "@litellm/shared": "workspace:*"
  },
  "devDependencies": {
    "vitest": "catalog:"
  }
}
```
