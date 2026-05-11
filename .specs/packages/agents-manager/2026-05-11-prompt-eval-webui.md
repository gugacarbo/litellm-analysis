# Spec: Prompt Evals com WebUI (`@lite-llm/prompt-eval`)

## Contexto
Precisamos avaliar se as descrições de categorias em `@storage/agents.jsonc` estão sendo acionadas no contexto correto, sem reescrever do zero infraestrutura de eval. A execução deve funcionar por CLI e também pela WebUI, com histórico persistido e progresso por etapa.

## Objetivo
Implementar um sistema de avaliação de prompts baseado em categorias com:

- pacote público em `packages/` (`@lite-llm/prompt-eval`),
- arquitetura por adapters (Promptfoo v1),
- execução assíncrona via backend,
- acompanhamento e histórico via WebUI,
- review com IA não-bloqueante,
- gate objetivo por `macroF1`.

## Escopo Funcional

### 1) Pacote novo: `@lite-llm/prompt-eval`
Criar pacote dedicado com API pública estável e engine-agnostic.

Responsabilidades:

- carregar dataset de eval,
- classificar prompts em categorias,
- calcular métricas (accuracy, precision/recall/F1 por categoria, macroF1, confusion matrix),
- executar review com IA,
- emitir progresso por etapa,
- gerar relatórios JSON e Markdown.

### 2) Adapter de eval (v1 Promptfoo)
Implementar `PromptfooAdapter` como backend de execução para evitar reescrita de framework.

- classificação zero-shot via LiteLLM,
- temperatura padrão `0`,
- parsing de saída estruturada,
- retry controlado para falhas transitórias,
- review IA via rubric/model-graded (diagnóstico, sem bloquear run).

### 3) Workflow de categoria
Workflow inicial especializado em classificação de categoria:

- entrada: `CategoryDefinition[]` + `CategoryEvalCase[]`,
- saída: `CategoryEvalReport` + `AiReviewReport`,
- gate: falhar run quando `macroF1 < 0.80`.

### 4) Execução via WebUI
Usuário consegue disparar eval pela interface e acompanhar progresso.

- execução em background,
- progresso por etapa em tempo real,
- histórico persistido de runs,
- detalhe de run com métricas e artefatos,
- sem comparação lado a lado na v1.

## Interfaces Públicas (Contrato)

### Pacote `@lite-llm/prompt-eval`

- `PromptEvalAdapter`
- `createEvalAdapter(options)`
- `runCategoryEvaluation(input)`
- `runCategoryAiReview(input)`
- `runCategoryEvalWithReview(input)`

Tipos principais:

- `PromptEvalCase`
- `PromptEvalPrediction`
- `PromptEvalMetrics`
- `PromptEvalRunStatus`
- `PromptEvalRunStep`
- `PromptEvalReport`
- `CategoryDefinition`
- `CategoryEvalCase`
- `CategoryEvalOptions`
- `CategoryEvalReport`
- `AiReviewFinding`
- `AiReviewSuggestion`
- `AiReviewReport`

Estados de execução:

- `queued`
- `loading_dataset`
- `classifying`
- `scoring`
- `reviewing`
- `reporting`
- `succeeded`
- `failed`

## Backend/API para WebUI

### Novas rotas (`/api/prompt-evals`)

- `POST /runs`
  - cria e inicia run em background
- `GET /runs`
  - lista histórico paginado
- `GET /runs/:id`
  - retorna detalhes + steps + métricas
- `GET /runs/:id/artifacts`
  - retorna metadados/paths de relatório

### Eventos WebSocket
Aproveitar servidor WS existente e adicionar eventos:

- `prompt_eval_run_update`
- `prompt_eval_run_completed`

## Persistência
Reaproveitar SQLite já existente (`@db/app.db` via `@lite-llm/app-repository`).

Tabelas novas:

- `prompt_eval_runs`
  - `id`, `type`, `status`, `startedAt`, `finishedAt`, `macroF1`, `threshold`, `model`, `error`
- `prompt_eval_run_steps`
  - `runId`, `step`, `status`, `startedAt`, `finishedAt`, `message`, `progressPct`
- `prompt_eval_run_artifacts`
  - `runId`, `kind`, `path`, `summaryJson`

Artefatos em disco (auditáveis):

- `@storage/reports/category-eval.json`
- `@storage/reports/category-eval.md`
- `@storage/reports/category-review.json`
- `@storage/reports/category-review.md`

## Frontend (WebUI)

### Página nova
Criar página de evals no padrão atual:

- `apps/web/src/pages/prompt-evals.tsx`
- `apps/web/src/pages/prompt-evals/*` (state/actions/derived/types/utils)
- client HTTP em `apps/web/src/lib/api-client/prompt-evals.ts`

### UX v1

- formulário de execução (`dataset`, `model`, `threshold`)
- lista de runs (histórico)
- detalhe do run com timeline de etapas
- métricas agregadas e por categoria
- links para abrir relatório JSON/MD

Adicionar entrada no sidebar em Agents (ex.: `Evals`).

## Dataset
Dataset manual versionado (ground truth) com single-label por prompt:

- arquivo recomendado: `@storage/category-eval.dataset.json`
- shape mínimo:
  - `id`
  - `input`
  - `expectedCategory`

## Regras de Aprovação

- critério principal: `macroF1`
- threshold inicial: `0.80`
- AI review: não-bloqueante (diagnóstico e sugestões)

## Testes

### Unit

- cálculo de métricas (inclui macroF1/confusion matrix)
- validação de dataset
- parser de saída do classificador/reviewer
- transições de estado por etapa

### Contrato de adapter

- suite de conformidade para `PromptEvalAdapter`
- `PromptfooAdapter` deve passar 100%

### Integração

- criação de run em background
- persistência de runs/steps/artifacts
- broadcast de eventos WS
- geração de relatórios JSON/MD

### Web

- disparo de run
- atualização de progresso em tempo real
- render de histórico e detalhe

## Não-objetivos (v1)

- comparação lado a lado entre runs
- execução em CI
- múltiplos adapters ativos em produção (LangSmith fica preparado, não obrigatório)

## Critérios de Aceite

1. É possível disparar eval pela WebUI sem usar CLI.
2. O usuário vê progresso por etapa em tempo real.
3. Histórico de runs persiste após reinício do servidor.
4. Run falha quando `macroF1 < 0.80`.
5. AI review aparece no resultado, mas não bloqueia aprovação.
6. Relatórios JSON/MD ficam disponíveis para inspeção.

## Assunções

- execução local nesta fase,
- concorrência inicial da fila = 1,
- dataset manual versionado é fonte oficial de ground truth,
- classificação de categoria é single-label.
