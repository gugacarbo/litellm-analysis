# Modo Limited — Visualização + Edição Não-Sensível

## TL;DR

> **Quick Summary**: Adicionar um terceiro modo de operação (`limited`) que permite visualizar todos os dados mas restringe operações de escrita, exceto edição de metadata não-sensível (model_name e litellm_params). Restrição implementada em ambos os níveis (UI + Backend) via env var `ACCESS_MODE`.
> 
> **Deliverables**:
> - Tipo `DataSourceMode` estendido com `'limited'`
> - Env var `ACCESS_MODE` com precedência sobre auto-detect
> - `LIMITED_CAPABILITIES` com flags de escrita desabilitadas
> - Endpoints de escrita implementados no backend (POST/PUT/DELETE /models)
> - Guards de 403 nos endpoints de escrita quando mode=limited
> - UI gates em ModelsPage e ModelStatsPage
> - Edit dialog adaptado para modo limited
> - Testes TDD cobrindo todas as camadas
> 
> **Estimated Effort**: Medium
> **Parallel Execution**: YES - 4 waves + FINAL
> **Critical Path**: Task 1 → Task 4 → Task 7 → Task 10 → Task 13 → Task 16 → FINAL

---

## Context

### Original Request
Adicionar um terceiro modo configurável que seja modo de somente visualização e de edição de campos não sensíveis.

### Interview Summary
**Key Discussions**:
- **Nome do modo**: `limited`
- **Nível de restrição**: UI + Backend (proteção real, não apenas UX)
- **Configuração**: Env var `ACCESS_MODE=full|api-only|limited` no server
- **Visualização**: tudo visível (nenhum campo oculto)
- **Escrita**: bloqueada, exceto edição de model_name e litellm_params
- **3 modos coexistem**: `full`, `api-only`, `limited`
- **Testes**: TDD obrigatório

**Research Findings**:
- Sistema atual usa `AnalyticsCapabilities` (19 flags) para feature gating
- `FeatureGate` component já existe para UI gating
- Endpoints de escrita NÃO existem no backend (só GET em api-server.ts)
- Funções de escrita existem em `db/queries.ts` (createModel, updateModel, etc.)
- Frontend já tem api-client functions para escrita (que atualmente retornam 404)
- Model name é disabled durante edição (models.tsx:273)

### Metis Review
**Identified Gaps** (addressed):
- **Mode naming**: Manter `'database'` internamente, mas `ACCESS_MODE=full` mapeia para database. `ACCESS_MODE=limited` é novo.
- **Write endpoints missing**: Precisam ser implementados no backend como parte do plano
- **ACCESS_MODE precedence**: ACCESS_MODE definido → usa ele. Não definido → auto-detect (comportamento atual)
- **Limited requires DB**: Se ACCESS_MODE=limited sem DB_HOST → fallback api-only + console.warn
- **Model renaming**: updateModel() precisa ser modificado para aceitar modelName nos updates (PostgreSQL suporta UPDATE em PK). Task 7 e 15 incluem essa modificação.
- **litellm_params scope**: Usuário disse "nome e params" — permite editar todo litellm_params JSON

---

## Work Objectives

### Core Objective
Implementar modo `limited` com restrição real de escrita em UI e Backend, permitindo apenas edição de model_name e litellm_params.

### Concrete Deliverables
- `DataSourceMode` estendido com `'limited'`
- `ACCESS_MODE` env var support em detectMode()
- `LIMITED_CAPABILITIES` object
- 5 novos endpoints de escrita no api-server.ts com guards
- UI gates em ModelsPage e ModelStatsPage
- Edit dialog adaptado para limited mode
- Testes TDD completos

### Definition of Done
- [ ] `ACCESS_MODE=limited` ativado → modo limited funciona
- [ ] Endpoints de escrita retornam 403 em limited mode
- [ ] UI esconde botões de criar/deletar/merge em limited mode
- [ ] Edit dialog permite editar model_name e litellm_params em limited mode
- [ ] Todos os testes TDD passam
- [ ] Modo full e api-existing continuam funcionando

### Must Have
- Restrição em UI + Backend (403 real)
- ACCESS_MODE env var com precedência sobre auto-detect
- 3 modos coexistem
- Edição de model_name e litellm_params permitida em limited
- Testes TDD

### Must NOT Have (Guardrails)
- Não adicionar autenticação/autorização (fora de escopo)
- Não ocultar campos sensíveis (visibilidade total)
- Não mudar comportamento dos modo full e api-only
- Não criar novo sistema de configuração (usar env var simples)

---

## Verification Strategy

> **ZERO HUMAN INTERVENTION** - ALL verification is agent-executed. No exceptions.

### Test Decision
- **Infrastructure exists**: NO (no test files, no test scripts in package.json)
- **Automated tests**: YES (TDD)
- **Framework**: vitest (lightweight, works well with Vite/React)
- **If TDD**: Each task follows RED (failing test) → GREEN (minimal impl) → REFACTOR
- **Task 0**: Setup vitest infrastructure (server + client)

### QA Policy
Every task MUST include agent-executed QA scenarios.
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **Frontend/UI**: Use Playwright (playwright skill) - Navigate, interact, assert DOM, screenshot
- **TUI/CLI**: Use interactive_bash (tmux) - Run command, send keystrokes, validate output
- **API/Backend**: Use Bash (curl) - Send requests, assert status + response fields
- **Library/Module**: Use Bash (bun/node REPL) - Import, call functions, compare output

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately - foundation + types):
├── Task 1: Extend DataSourceMode + AnalyticsCapabilities types [quick]
├── Task 2: Implement ACCESS_MODE env var support in detectMode() [quick]
├── Task 3: Create LIMITED_CAPABILITIES + update /mode endpoint [quick]
├── Task 4: Update frontend types (ServerMode, AnalyticsCapabilities) [quick]
└── Task 5: Add write-related capability flags [quick]

Wave 2 (After Wave 1 - backend write endpoints + guards):
├── Task 6: Implement POST /models endpoint (create) [quick]
├── Task 7: Implement PUT /models/:name endpoint (update) [quick]
├── Task 8: Implement DELETE /models/:name endpoint (delete) [quick]
├── Task 9: Implement POST /models/merge endpoint [quick]
├── Task 10: Implement DELETE /models/logs/:model endpoint [quick]
└── Task 11: Add limited mode guards (403) to write endpoints [quick]

Wave 3 (After Wave 2 - frontend UI gates):
├── Task 12: Update ServerModeProvider to handle 'limited' mode [quick]
├── Task 13: Add UI gates to ModelsPage (hide create/delete) [visual-engineering]
├── Task 14: Add UI gates to ModelStatsPage (hide merge/delete logs) [visual-engineering]
├── Task 15: Adapt edit dialog for limited mode (enable model_name) [visual-engineering]
└── Task 16: Update sidebar badge to show "Limited" mode [visual-engineering]

Wave 4 (After Wave 3 - TDD tests):
├── Task 17: Test detectMode() with ACCESS_MODE combinations [quick]
├── Task 18: Test limited mode capabilities [quick]
├── Task 19: Test write endpoints return 403 in limited mode [quick]
├── Task 20: Test edit endpoint works in limited mode [quick]
└── Task 21: Test UI gates render correctly [quick]

Wave FINAL (After ALL tasks — 4 parallel reviews, then user okay):
├── Task F1: Plan compliance audit (oracle)
├── Task F2: Code quality review (unspecified-high)
├── Task F3: Real manual QA (unspecified-high)
└── Task F4: Scope fidelity check (deep)
-> Present results -> Get explicit user okay

Critical Path: Task 1 → Task 4 → Task 7 → Task 10 → Task 13 → Task 16 → FINAL
Parallel Speedup: ~65% faster than sequential
Max Concurrent: 6 (Wave 2)
```

### Agent Dispatch Summary

- **Wave 1**: 5 tasks → `quick`
- **Wave 2**: 6 tasks → `quick` (T6-T10), `quick` (T11)
- **Wave 3**: 5 tasks → `quick` (T12), `visual-engineering` (T13-T16)
- **Wave 4**: 5 tasks → `quick`
- **FINAL**: 4 tasks → F1 `oracle`, F2 `unspecified-high`, F3 `unspecified-high`, F4 `deep`

---

## TODOs

- [x] 0. Setup vitest test infrastructure (server + client) [COMPLETED]

  **What to do**:
  - Instalar vitest como dev dependency no root e nos apps (server, web)
  - Criar vitest.config.ts no root e em cada app
  - Adicionar script "test" em package.json de cada app
  - Criar 1 teste dummy em server e 1 em web para verificar setup
  - Configurar coverage (opcional)

  **Must NOT do**:
  - Não configurar outros frameworks de teste (jest, bun test)
  - Não adicionar dependências desnecessárias (happy-dom para server, etc.)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Configuração padrão de vitest
  - **Skills**: N/A
  - **Skills Evaluated but Omitted**: N/A

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 0 (bloqueia Wave 4)
  - **Blocks**: Tasks 17-21 (precisam de infraestrutura de teste)
  - **Blocked By**: None

  **References**:
  - `package.json` - Root package (monorepo)
  - `apps/server/package.json` - Server package
  - `apps/web/package.json` - Web package (já usa Vite, vitest integra naturalmente)
  - vitest docs: https://vitest.dev/guide/

  **Acceptance Criteria**:
  - [x] vitest instalado como dev dependency
  - [x] Scripts "test" funcionais em server e web
  - [x] 1 teste dummy em server passa
  - [x] 1 teste dummy em web passa
  - [x] pnpm test roda todos os testes

  **QA Scenarios**:
  ```
  Scenario: Test infrastructure setup funciona
    Tool: Bash (pnpm test)
    Preconditions: vitest configurado
    Steps:
      1. Executar: cd apps/server && pnpm test
      2. Verificar que teste dummy passa
      3. Executar: cd apps/web && pnpm test
      4. Verificar que teste dummy passa
    Expected Result: 2 testes passando (1 server + 1 web)
    Failure Indicators: Erro de configuração ou testes falhando
    Evidence: .sisyphus/evidence/task-0-test-setup.log
  ```

  **Commit**: YES (Wave 0)
  - Message: `chore: setup vitest test infrastructure`
  - Files: `package.json`, `apps/server/package.json`, `apps/web/package.json`, `vitest.config.ts`, `apps/server/vitest.config.ts`, `apps/web/vitest.config.ts`

- [x] 1. Estender DataSourceMode + AnalyticsCapabilities types

  **What to do**:
  - Em `apps/server/src/data-source/types.ts`: adicionar `'limited'` ao union `DataSourceMode`
  - Em `apps/web/src/types/analytics.ts`: adicionar `'limited'` ao union `ServerMode`
  - Verificar que `AnalyticsCapabilities` interface está consistente entre server e client
  - Adicionar novas capabilities para write operations: `createModel`, `updateModel`, `deleteModel`, `mergeModels`, `deleteModelLogs`

  **Must NOT do**:
  - Não mudar comportamento existente de 'database' e 'api-only'
  - Não renomear 'database' para 'full' (manter compatibilidade)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Task de tipo simples — adicionar valor a union type e adicionar campos a interface
  - **Skills**: N/A
  - **Skills Evaluated but Omitted**: N/A

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 2, 3, 4, 5)
  - **Blocks**: Task 2, 3, 4 (dependem dos tipos estendidos)
  - **Blocked By**: None (can start immediately)

  **References**:
  - `apps/server/src/data-source/types.ts:207` - DataSourceMode union type atual
  - `apps/web/src/types/analytics.ts:1` - ServerMode mirror no client
  - `apps/server/src/data-source/types.ts:185-226` - AnalyticsCapabilities interface
  - `apps/server/src/data-source/database.ts:45-65` - DATABASE_CAPABILITIES (19 flags, todas true)
  - `apps/server/src/data-source/api.ts:25-45` - API_CAPABILITIES (15 true, 4 false)

  **Acceptance Criteria**:
  - [ ] `DataSourceMode` inclui `'limited'`
  - [ ] `ServerMode` inclui `'limited'`
  - [ ] `AnalyticsCapabilities` inclui 5 novas flags de write
  - [ ] `pnpm typecheck` passa sem erros

  **QA Scenarios**:
  ```
  Scenario: Type check passa com 'limited' mode adicionado
    Tool: Bash (tsc)
    Preconditions: Codebase no estado atual
    Steps:
      1. Executar `cd /home/gustavo/Apps/lite-llm-analytics && pnpm typecheck`
      2. Verificar que não há erros de tipo relacionados a DataSourceMode ou ServerMode
    Expected Result: typecheck passa com exit code 0
    Failure Indicators: Erros de tipo "Type 'limited' is not assignable to type 'DataSourceMode'"
    Evidence: .sisyphus/evidence/task-1-typecheck.log
  ```

  **Commit**: YES (groups with Wave 1)
  - Message: `feat(types): extend DataSourceMode with limited and add write capabilities`
  - Files: `apps/server/src/data-source/types.ts`, `apps/web/src/types/analytics.ts`

- [x] 2. Implementar ACCESS_MODE env var em detectMode()

  **What to do**:
  - Em `apps/server/src/data-source/index.ts`: modificar `detectMode()` para verificar `ACCESS_MODE` primeiro
  - Se `ACCESS_MODE` estiver definido: usar o valor ('full', 'api-only', 'limited')
  - Se `ACCESS_MODE` não estiver definido: manter comportamento atual (auto-detect por DB_HOST)
  - Se `ACCESS_MODE=limited` mas `DB_HOST` não está definido: fallback para 'api-only' + `console.warn`
  - Se `ACCESS_MODE=full` mas `DB_HOST` não está definido: manter comportamento atual (fallback database, vai falhar na conexão)

  **Must NOT do**:
  - Não remover auto-detect (manter compatibilidade retroativa)
  - Não validar ACCESS_MODE contra valores inválidos (deixar falhar naturalmente)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Lógica condicional simples com fallback
  - **Skills**: N/A
  - **Skills Evaluated but Omitted**: N/A

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 3, 4, 5)
  - **Blocks**: Task 3 (precisa do detectMode atualizado)
  - **Blocked By**: None (can start immediately, não depende de Task 1)

  **References**:
  - `apps/server/src/data-source/index.ts:5-16` - detectMode() atual (ver como funciona auto-detect)
  - `apps/server/src/data-source/types.ts:207` - DataSourceMode type (precisa estar estendido com 'limited')
  - `apps/server/.env.example` - Variáveis de ambiente existentes (DB_HOST, etc.)

  **Acceptance Criteria**:
  - [ ] ACCESS_MODE=full → retorna 'database'
  - [ ] ACCESS_MODE=api-only → retorna 'api-only'
  - [ ] ACCESS_MODE=limited + DB_HOST=set → retorna 'database' (limited precisa de DB)
  - [ ] ACCESS_MODE=limited + DB_HOST=undefined → retorna 'api-only' + console.warn
  - [ ] ACCESS_MODE=undefined + DB_HOST=set → retorna 'database' (comportamento atual)
  - [ ] ACCESS_MODE=undefined + DB_HOST=undefined + LITELLM_API_URL set → retorna 'api-only' (comportamento atual)

  **QA Scenarios**:
  ```
  Scenario: ACCESS_MODE=limited com DB_HOST retorna database mode
    Tool: Bash (node REPL)
    Preconditions: node disponível
    Steps:
      1. Executar: cd apps/server && ACCESS_MODE=limited DB_HOST=localhost node -e "import('./src/data-source/index.js').then(m => console.log(m.detectMode()))"
      2. Verificar output: deve ser 'database'
    Expected Result: 'database'
    Failure Indicators: Output diferente de 'database'
    Evidence: .sisyphus/evidence/task-2-limited-with-db.log

  Scenario: ACCESS_MODE=limited sem DB_HOST retorna api-only com warning
    Tool: Bash (node REPL)
    Preconditions: node disponível
    Steps:
      1. Executar: cd apps/server && ACCESS_MODE=limited node -e "import('./src/data-source/index.js').then(m => console.log(m.detectMode()))" 2>&1
      2. Verificar output: deve ser 'api-only' e conter warning
    Expected Result: 'api-only' + console.warn sobre limited mode sem DB
    Failure Indicators: Output não é 'api-only' ou não há warning
    Evidence: .sisyphus/evidence/task-2-limited-no-db.log
  ```

  **Commit**: YES (groups with Wave 1)
  - Message: `feat(mode): add ACCESS_MODE env var support with precedence over auto-detect`
  - Files: `apps/server/src/data-source/index.ts`

- [x] 3. Criar LIMITED_CAPABILITIES + atualizar /mode endpoint

  **What to do**:
  - Em `apps/server/src/data-source/database.ts` ou novo arquivo: criar `LIMITED_CAPABILITIES` object
  - LIMITED_CAPABILITIES = todas true EXCETO: createModel=false, deleteModel=false, mergeModels=false, deleteModelLogs=false
  - updateModel=true (permitido em limited mode)
  - Em `apps/server/src/data-source/index.ts`: em `createDataSource()`, aplicar LIMITED_CAPABILITIES quando mode='limited'
  - Em `apps/server/src/api-server.ts`: atualizar GET /mode para retornar mode correto (usar dataSource.mode ou inferir de capabilities)
  - Em `apps/server/src/data-source/interface.ts`: adicionar `mode` property ao AnalyticsDataSource interface

  **Must NOT do**:
  - Não desabilitar updateModel (edição é permitida em limited)
  - Não desabilitar capabilities de leitura (todas true)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Criar object literal de capabilities + atualizar factory function
  - **Skills**: N/A
  - **Skills Evaluated but Omitted**: N/A

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2, 4, 5)
  - **Blocks**: Task 11 (precisa das capabilities definidas)
  - **Blocked By**: Task 1 (precisa dos types estendidos)

  **References**:
  - `apps/server/src/data-source/database.ts:45-65` - DATABASE_CAPABILITIES (copiar estrutura)
  - `apps/server/src/data-source/api.ts:25-45` - API_CAPABILITIES (referência de capabilities parciais)
  - `apps/server/src/data-source/index.ts:18-49` - createDataSource() factory (precisa aplicar capabilities baseado no mode)
  - `apps/server/src/api-server.ts:8-14` - GET /mode endpoint (atual: infere mode de capabilities.errorLogs)
  - `apps/server/src/data-source/interface.ts` - AnalyticsDataSource interface (adicionar mode property)

  **Acceptance Criteria**:
  - [ ] LIMITED_CAPABILITIES criado com createModel=false, deleteModel=false, mergeModels=false, deleteModelLogs=false, updateModel=true
  - [ ] createDataSource() aplica LIMITED_CAPABILITIES quando mode='limited'
  - [ ] GET /mode retorna { mode: 'limited', capabilities: LIMITED_CAPABILITIES }
  - [ ] AnalyticsDataSource interface tem `mode` property

  **QA Scenarios**:
  ```
  Scenario: GET /mode retorna limited mode com capabilities corretas
    Tool: Bash (curl)
    Preconditions: Server rodando com ACCESS_MODE=limited DB_HOST=localhost
    Steps:
      1. curl -s http://localhost:3000/mode | jq .
      2. Verificar mode === 'limited'
      3. Verificar capabilities.createModel === false
      4. Verificar capabilities.updateModel === true
      5. Verificar capabilities.deleteModel === false
    Expected Result: mode='limited', createModel=false, updateModel=true, deleteModel=false
    Failure Indicators: mode diferente de 'limited' ou capabilities incorretas
    Evidence: .sisyphus/evidence/task-3-mode-endpoint.json
  ```

  **Evidence to Capture**:
  - [ ] task-3-mode-endpoint.json

  **Commit**: YES (groups with Wave 1)
  - Message: `feat(mode): add LIMITED_CAPABILITIES and update /mode endpoint`
  - Files: `apps/server/src/data-source/database.ts` (ou novo arquivo), `apps/server/src/data-source/index.ts`, `apps/server/src/api-server.ts`, `apps/server/src/data-source/interface.ts`

- [x] 4. Atualizar frontend types (ServerMode, AnalyticsCapabilities)

  **What to do**:
  - Em `apps/web/src/types/analytics.ts`: garantir que ServerMode inclui 'limited'
  - Em `apps/web/src/types/analytics.ts`: garantir que AnalyticsCapabilities inclui as 5 novas flags de write
  - Verificar consistência com server types

  **Must NOT do**:
  - Não mudar estrutura existente, apenas adicionar campos

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Mirror dos types do server no client
  - **Skills**: N/A
  - **Skills Evaluated but Omitted**: N/A

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2, 3, 5)
  - **Blocks**: Task 12 (precisa dos types atualizados)
  - **Blocked By**: Task 1 (precisa dos types do server definidos primeiro)

  **References**:
  - `apps/web/src/types/analytics.ts:1-34` - ServerMode e AnalyticsCapabilities no client
  - `apps/server/src/data-source/types.ts:185-226` - Types do server (fonte da verdade)

  **Acceptance Criteria**:
  - [ ] ServerMode inclui 'limited'
  - [ ] AnalyticsCapabilities inclui createModel, updateModel, deleteModel, mergeModels, deleteModelLogs
  - [ ] pnpm typecheck passa

  **QA Scenarios**:
  ```
  Scenario: Type check passa no frontend
    Tool: Bash (tsc)
    Preconditions: Codebase no estado atual
    Steps:
      1. Executar: cd apps/web && npx tsc --noEmit
      2. Verificar que não há erros de tipo
    Expected Result: tsc passa sem erros
    Failure Indicators: Erros de tipo relacionados a ServerMode ou AnalyticsCapabilities
    Evidence: .sisyphus/evidence/task-4-typecheck.log
  ```

  **Commit**: YES (groups with Wave 1)
  - Message: `feat(types): update frontend types for limited mode`
  - Files: `apps/web/src/types/analytics.ts`

- [x] 5. Adicionar capability flags de write ao DATABASE_CAPABILITIES e API_CAPABILITIES

  **What to do**:
  - Em `apps/server/src/data-source/database.ts`: adicionar createModel=true, updateModel=true, deleteModel=true, mergeModels=true, deleteModelLogs=true ao DATABASE_CAPABILITIES
  - Em `apps/server/src/data-source/api.ts`: adicionar createModel=false, updateModel=false, deleteModel=false, mergeModels=false, deleteModelLogs=false ao API_CAPABILITIES (API mode não tem escrita)
  - Garantir que todas as capabilities têm 19 + 5 = 24 flags

  **Must NOT do**:
  - Não mudar capabilities existentes (apenas adicionar as novas)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Adicionar campos a objects existentes
  - **Skills**: N/A
  - **Skills Evaluated but Omitted**: N/A

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2, 3, 4)
  - **Blocks**: Task 3 (precisa das capabilities definidas)
  - **Blocked By**: Task 1 (precisa dos types estendidos)

  **References**:
  - `apps/server/src/data-source/database.ts:45-65` - DATABASE_CAPABILITIES
  - `apps/server/src/data-source/api.ts:25-45` - API_CAPABILITIES

  **Acceptance Criteria**:
  - [ ] DATABASE_CAPABILITIES tem 24 flags (19 originais + 5 write), todas true
  - [ ] API_CAPABILITIES tem 24 flags, write flags são false
  - [ ] pnpm typecheck passa

  **QA Scenarios**:
  ```
  Scenario: DATABASE_CAPABILITIES tem todas write flags true
    Tool: Bash (node REPL)
    Preconditions: Codebase compilado
    Steps:
      1. Executar: cd apps/server && node -e "import('./src/data-source/database.js').then(m => console.log(JSON.stringify(m.DATABASE_CAPABILITIES)))" | jq '.createModel, .updateModel, .deleteModel, .mergeModels, .deleteModelLogs'
      2. Verificar que todos são true
    Expected Result: true, true, true, true, true
    Failure Indicators: Algum valor é false ou undefined
    Evidence: .sisyphus/evidence/task-5-db-caps.json
  ```

  **Commit**: YES (groups with Wave 1)
  - Message: `feat(capabilities): add write capability flags to DATABASE and API capabilities`
  - Files: `apps/server/src/data-source/database.ts`, `apps/server/src/data-source/api.ts`

- [x] 6. Implementar POST /models endpoint (create)

  **What to do**:
  - Em `apps/server/src/api-server.ts`: adicionar `app.post('/models', ...)` endpoint
  - Importar `createModel` de `./db/queries.js`
  - Validar request body (modelName obrigatório, litellmParams opcional)
  - Chamar `createModel()` com os dados
  - Retornar `{ success: true }` ou erro 500

  **Must NOT do**:
  - Não adicionar guard de limited mode aqui (será feito em Task 11)
  - Não validar litellm_params (deixar JSON livre)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Endpoint Express simples seguindo padrão existente
  - **Skills**: N/A
  - **Skills Evaluated but Omitted**: N/A

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 7, 8, 9, 10, 11)
  - **Blocks**: Task 11 (guard precisa do endpoint existindo)
  - **Blocked By**: None (endpoint independente)

  **References**:
  - `apps/server/src/api-server.ts:184-191` - GET /models endpoint (seguir padrão)
  - `apps/server/src/db/queries.ts:385-391` - createModel function (ver signature)
  - `apps/web/src/lib/api-client.ts:238-243` - createModel client function (ver request format)

  **Acceptance Criteria**:
  - [ ] POST /models cria novo modelo no banco
  - [ ] Retorna 200 com `{ success: true }`
  - [ ] Retorna 400 se modelName ausente
  - [ ] Retorna 500 em erro de banco

  **QA Scenarios**:
  ```
  Scenario: POST /models cria modelo com sucesso
    Tool: Bash (curl)
    Preconditions: DB rodando, ACCESS_MODE=full
    Steps:
      1. curl -X POST http://localhost:3000/models -H 'Content-Type: application/json' -d '{"modelName":"test-model","litellmParams":{"api_base":"https://api.test.com"}}'
      2. Verificar status 200 e body { success: true }
      3. curl -s http://localhost:3000/models | jq '.[].modelName' | grep test-model
    Expected Result: Modelo criado e listado
    Failure Indicators: Status 500 ou modelo não listado
    Evidence: .sisyphus/evidence/task-6-create-model.json

  Scenario: POST /models sem modelName retorna 400
    Tool: Bash (curl)
    Preconditions: DB rodando
    Steps:
      1. curl -X POST http://localhost:3000/models -H 'Content-Type: application/json' -d '{"litellmParams":{}}' -w '%{http_code}'
      2. Verificar status 400
    Expected Result: 400 Bad Request
    Failure Indicators: Status 200 ou 500
    Evidence: .sisyphus/evidence/task-6-no-modelname.json
  ```

  **Evidence to Capture**:
  - [ ] task-6-create-model.json
  - [ ] task-6-no-modelname.json

  **Commit**: YES (groups with Wave 2)
  - Message: `feat(api): add POST /models endpoint for model creation`
  - Files: `apps/server/src/api-server.ts`

- [x] 7. Implementar PUT /models/:name endpoint (update)

  **What to do**:
  - Em `apps/server/src/db/queries.ts`: modificar `updateModel()` para aceitar `modelName` nos updates (opcional)
    - Signature: `updateModel(modelName: string, updates: { litellmParams?: Record<string, unknown>; modelName?: string })`
    - PostgreSQL suporta UPDATE em PK columns
  - Em `apps/server/src/api-server.ts`: adicionar `app.put('/models/:name', ...)` endpoint
  - Extrair `name` de params e `litellmParams` + `modelName` de body
  - Chamar `updateModel(name, { litellmParams, modelName })`
  - Retornar `{ success: true }` ou erro

  **Must NOT do**:
  - Não adicionar guard de limited mode aqui (Task 11)
  - Não validar litellm_params

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Endpoint Express simples
  - **Skills**: N/A
  - **Skills Evaluated but Omitted**: N/A

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 6, 8, 9, 10, 11)
  - **Blocks**: Task 11
  - **Blocked By**: None

  **References**:
  - `apps/server/src/db/queries.ts:392-401` - updateModel function
  - `apps/web/src/lib/api-client.ts:245-253` - updateModel client function
  - `apps/server/src/api-server.ts` - padrão de endpoints GET

  **Acceptance Criteria**:
  - [ ] PUT /models/:name atualiza litellmParams do modelo
  - [ ] Retorna 200 com { success: true }
  - [ ] Retorna 404 se modelo não existe
  - [ ] Retorna 500 em erro

  **QA Scenarios**:
  ```
  Scenario: PUT /models/:name atualiza modelo existente
    Tool: Bash (curl)
    Preconditions: Modelo 'test-model' existe no banco
    Steps:
      1. curl -X PUT http://localhost:3000/models/test-model -H 'Content-Type: application/json' -d '{"litellmParams":{"api_base":"https://updated.com"}}'
      2. Verificar status 200
      3. curl -s http://localhost:3000/models | jq '.[] | select(.modelName=="test-model") | .litellmParams.api_base'
      4. Verificar valor 'https://updated.com'
    Expected Result: litellmParams atualizado
    Failure Indicators: Valor não atualizado ou status diferente de 200
    Evidence: .sisyphus/evidence/task-7-update-model.json
  ```

  **Commit**: YES (groups with Wave 2)
  - Message: `feat(api): add PUT /models/:name endpoint for model updates`
  - Files: `apps/server/src/api-server.ts`

- [x] 8. Implementar DELETE /models/:name endpoint (delete)

  **What to do**:
  - Em `apps/server/src/api-server.ts`: adicionar `app.delete('/models/:name', ...)` endpoint
  - Importar `deleteModel` de `./db/queries.js`
  - Extrair `name` de params
  - Chamar `deleteModel(name)`
  - Retornar `{ success: true }` ou erro

  **Must NOT do**:
  - Não adicionar guard de limited mode aqui (Task 11)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Endpoint Express simples
  - **Skills**: N/A
  - **Skills Evaluated but Omitted**: N/A

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 6, 7, 9, 10, 11)
  - **Blocks**: Task 11
  - **Blocked By**: None

  **References**:
  - `apps/server/src/db/queries.ts:402-407` - deleteModel function
  - `apps/web/src/lib/api-client.ts:255-261` - deleteModel client function

  **Acceptance Criteria**:
  - [ ] DELETE /models/:name remove modelo do banco
  - [ ] Retorna 200 com { success: true }
  - [ ] Retorna 404 se modelo não existe
  - [ ] Modelo não aparece mais em GET /models

  **QA Scenarios**:
  ```
  Scenario: DELETE /models/:name remove modelo
    Tool: Bash (curl)
    Preconditions: Modelo 'test-model' existe
    Steps:
      1. curl -X DELETE http://localhost:3000/models/test-model
      2. Verificar status 200
      3. curl -s http://localhost:3000/models | jq '.[].modelName' | grep test-model
      4. Verificar que não retorna nada (modelo removido)
    Expected Result: Modelo removido do banco
    Failure Indicators: Modelo ainda aparece em GET /models
    Evidence: .sisyphus/evidence/task-8-delete-model.json
  ```

  **Commit**: YES (groups with Wave 2)
  - Message: `feat(api): add DELETE /models/:name endpoint`
  - Files: `apps/server/src/api-server.ts`

- [x] 9. Implementar POST /models/merge endpoint

  **What to do**:
  - Em `apps/server/src/api-server.ts`: adicionar `app.post('/models/merge', ...)` endpoint
  - Importar `mergeModels` de `./db/queries.js`
  - Extrair `sourceModel` e `targetModel` de body
  - Validar que ambos estão presentes
  - Chamar `mergeModels(sourceModel, targetModel)`
  - Retornar `{ success: true }` ou erro

  **Must NOT do**:
  - Não adicionar guard de limited mode aqui (Task 11)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Endpoint Express simples
  - **Skills**: N/A
  - **Skills Evaluated but Omitted**: N/A

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 6, 7, 8, 10, 11)
  - **Blocks**: Task 11
  - **Blocked By**: None

  **References**:
  - `apps/server/src/db/queries.ts:408-414` - mergeModels function
  - `apps/web/src/lib/api-client.ts:273-281` - mergeModels client function

  **Acceptance Criteria**:
  - [ ] POST /models/merge consolida logs de sourceModel para targetModel
  - [ ] Retorna 200 com { success: true }
  - [ ] Retorna 400 se sourceModel ou targetModel ausente

  **QA Scenarios**:
  ```
  Scenario: POST /models/merge consolida logs
    Tool: Bash (curl)
    Preconditions: Modelos 'source-model' e 'target-model' existem com logs
    Steps:
      1. curl -X POST http://localhost:3000/models/merge -H 'Content-Type: application/json' -d '{"sourceModel":"source-model","targetModel":"target-model"}'
      2. Verificar status 200
    Expected Result: Logs consolidados
    Failure Indicators: Status 500 ou 400
    Evidence: .sisyphus/evidence/task-9-merge-models.json
  ```

  **Commit**: YES (groups with Wave 2)
  - Message: `feat(api): add POST /models/merge endpoint`
  - Files: `apps/server/src/api-server.ts`

- [x] 10. Implementar DELETE /models/logs/:model endpoint

  **What to do**:
  - Em `apps/server/src/api-server.ts`: adicionar `app.delete('/models/logs/:model', ...)` endpoint
  - Importar `deleteModelLogs` de `./db/queries.js`
  - Extrair `model` de params
  - Chamar `deleteModelLogs(model)`
  - Retornar `{ success: true }` ou erro

  **Must NOT do**:
  - Não adicionar guard de limited mode aqui (Task 11)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Endpoint Express simples
  - **Skills**: N/A
  - **Skills Evaluated but Omitted**: N/A

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 6, 7, 8, 9, 11)
  - **Blocks**: Task 11
  - **Blocked By**: None

  **References**:
  - `apps/server/src/db/queries.ts:415-420` - deleteModelLogs function
  - `apps/web/src/lib/api-client.ts:263-269` - deleteModelLogs client function

  **Acceptance Criteria**:
  - [ ] DELETE /models/logs/:model remove logs do modelo
  - [ ] Retorna 200 com { success: true }
  - [ ] Retorna 404 se modelo não existe

  **QA Scenarios**:
  ```
  Scenario: DELETE /models/logs/:model remove logs
    Tool: Bash (curl)
    Preconditions: Modelo 'test-model' existe com logs
    Steps:
      1. curl -X DELETE http://localhost:3000/models/logs/test-model
      2. Verificar status 200
    Expected Result: Logs removidos
    Failure Indicators: Status 500
    Evidence: .sisyphus/evidence/task-10-delete-logs.json
  ```

  **Commit**: YES (groups with Wave 2)
  - Message: `feat(api): add DELETE /models/logs/:model endpoint`
  - Files: `apps/server/src/api-server.ts`

- [x] 11. Adicionar guards de limited mode nos endpoints de escrita

  **What to do**:
  - Em `apps/server/src/api-server.ts`: adicionar middleware ou guards inline nos endpoints POST/PUT/DELETE
  - Verificar `dataSource.capabilities.createModel`, `dataSource.capabilities.updateModel`, etc.
  - Se capability for false: retornar 403 com mensagem "Operation not allowed in limited mode"
  - Guards específicos:
    - POST /models → check capabilities.createModel
    - PUT /models/:name → check capabilities.updateModel
    - DELETE /models/:name → check capabilities.deleteModel
    - POST /models/merge → check capabilities.mergeModels
    - DELETE /models/logs/:model → check capabilities.deleteModelLogs

  **Must NOT do**:
  - Não usar 501 (usar 403 Forbidden — é restrição de modo, não feature indisponível)
  - Não redirecionar ou esconder endpoint (retornar 403 real)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Adicionar verificações condicionais em endpoints existentes
  - **Skills**: N/A
  - **Skills Evaluated but Omitted**: N/A

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 6, 7, 8, 9, 10)
  - **Blocks**: Task 13, 14 (precisam dos guards funcionando)
  - **Blocked By**: Tasks 6-10 (precisam dos endpoints existindo)

  **References**:
  - `apps/server/src/api-server.ts:75-80` - Guard de errorLogs (seguir padrão similar mas com 403)
  - `apps/server/src/data-source/types.ts` - AnalyticsCapabilities interface
  - `apps/web/src/lib/api-client.ts` - FeatureUnavailableError handling (ver como client lida com erros)

  **Acceptance Criteria**:
  - [ ] POST /models retorna 403 quando capabilities.createModel=false
  - [ ] PUT /models/:name retorna 403 quando capabilities.updateModel=false (full mode: 200)
  - [ ] DELETE /models/:name retorna 403 quando capabilities.deleteModel=false
  - [ ] POST /models/merge retorna 403 quando capabilities.mergeModels=false
  - [ ] DELETE /models/logs/:model retorna 403 quando capabilities.deleteModelLogs=false
  - [ ] Em full mode, todos endpoints retornam 200

  **QA Scenarios**:
  ```
  Scenario: POST /models retorna 403 em limited mode
    Tool: Bash (curl)
    Preconditions: Server rodando com ACCESS_MODE=limited
    Steps:
      1. curl -X POST http://localhost:3000/models -H 'Content-Type: application/json' -d '{"modelName":"test"}' -w '%{http_code}'
      2. Verificar status 403
      3. Verificar body contém "limited mode"
    Expected Result: 403 Forbidden
    Failure Indicators: Status 200 (guard não funcionando) ou 500
    Evidence: .sisyphus/evidence/task-11-create-403.json

  Scenario: PUT /models/:name retorna 200 em limited mode (edição permitida)
    Tool: Bash (curl)
    Preconditions: Server rodando com ACCESS_MODE=limited, modelo 'test-model' existe
    Steps:
      1. curl -X PUT http://localhost:3000/models/test-model -H 'Content-Type: application/json' -d '{"litellmParams":{"api_base":"https://test.com"}}' -w '%{http_code}'
      2. Verificar status 200
    Expected Result: 200 OK (updateModel=true em limited)
    Failure Indicators: Status 403 (guard bloqueando edição permitida)
    Evidence: .sisyphus/evidence/task-11-update-200.json
  ```

  **Evidence to Capture**:
  - [ ] task-11-create-403.json
  - [ ] task-11-update-200.json

  **Commit**: YES (groups with Wave 2)
  - Message: `feat(guards): add limited mode 403 guards to write endpoints`
  - Files: `apps/server/src/api-server.ts`

- [x] 12. Atualizar ServerModeProvider para lidar com 'limited' mode

  **What to do**:
  - Em `apps/web/src/hooks/use-server-mode.tsx`: verificar que o provider lida corretamente com mode='limited'
  - fetchServerMode() já retorna { mode, capabilities } — verificar que 'limited' é tratado
  - Se mode='limited', capabilities devem refletir LIMITED_CAPABILITIES
  - Adicionar badge 'Limited' no sidebar (verde/amarelo?)

  **Must NOT do**:
  - Não mudar lógica existente de fallback (api-only default)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Verificar/ajustar React Context para novo modo
  - **Skills**: N/A
  - **Skills Evaluated but Omitted**: N/A

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 13, 14, 15, 16)
  - **Blocks**: Task 13, 14, 15 (precisam do provider atualizado)
  - **Blocked By**: Task 4 (precisa dos types atualizados)

  **References**:
  - `apps/web/src/hooks/use-server-mode.tsx` - ServerModeProvider e useServerMode hook
  - `apps/web/src/lib/server-mode.ts` - fetchServerMode()
  - `apps/web/src/components/layout/sidebar.tsx:10,16,27-28` - Badge de modo atual

  **Acceptance Criteria**:
  - [ ] ServerModeProvider trata mode='limited' corretamente
  - [ ] useServerMode() retorna { mode: 'limited', capabilities: LIMITED_CAPABILITIES }
  - [ ] Sidebar mostra badge 'Limited' com cor diferente

  **QA Scenarios**:
  ```
  Scenario: ServerModeProvider carrega limited mode corretamente
    Tool: Playwright
    Preconditions: Server rodando com ACCESS_MODE=limited
    Steps:
      1. Navegar para http://localhost:5173
      2. Aguardar carregamento do app
      3. Verificar que sidebar mostra badge 'Limited'
      4. Verificar que Errors link está visível (errorLogs=true em limited)
    Expected Result: Badge 'Limited' visível na sidebar
    Failure Indicators: Badge mostra 'Full Access' ou 'API Mode'
    Evidence: .sisyphus/evidence/task-12-limited-badge.png
  ```

  **Commit**: YES (groups with Wave 3)
  - Message: `feat(ui): update ServerModeProvider for limited mode`
  - Files: `apps/web/src/hooks/use-server-mode.tsx`, `apps/web/src/components/layout/sidebar.tsx`

- [x] 13. Adicionar UI gates ao ModelsPage (esconder create/delete)

  **What to do**:
  - Em `apps/web/src/pages/models.tsx`:
  - Esconder botão "Add Model" quando capabilities.createModel=false
  - Esconder botão de delete em cada row quando capabilities.deleteModel=false
  - Usar `useServerMode()` hook para obter capabilities
  - Ou usar `<FeatureGate capability="createModel">` wrapper

  **Must NOT do**:
  - Não esconder botão de editar (updateModel=true em limited)
  - Não mudar comportamento do edit dialog aqui (Task 15)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Modificar UI components, conditionally render buttons based on capabilities
  - **Skills**: N/A
  - **Skills Evaluated but Omitted**: N/A

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 12, 14, 15, 16)
  - **Blocks**: Task 16 (sidebar precisa do mode funcionando)
  - **Blocked By**: Task 12 (precisa do provider atualizado)

  **References**:
  - `apps/web/src/pages/models.tsx` - ModelsPage com CRUD completo
  - `apps/web/src/components/feature-gate.tsx` - FeatureGate component
  - `apps/web/src/hooks/use-server-mode.tsx` - useServerMode hook
  - `apps/web/src/components/layout/sidebar.tsx:27-28` - Pattern de condicional baseado em capabilities

  **Acceptance Criteria**:
  - [ ] Botão "Add Model" escondido quando createModel=false
  - [ ] Botões de delete escondidos quando deleteModel=false
  - [ ] Botão de editar visível em todos os modos (updateModel=true)
  - [ ] Em full mode, todos botões visíveis

  **QA Scenarios**:
  ```
  Scenario: ModelsPage em limited mode esconde create/delete mas mostra edit
    Tool: Playwright
    Preconditions: Server rodando com ACCESS_MODE=limited
    Steps:
      1. Navegar para http://localhost:5173/models
      2. Verificar que botão "Add Model" NÃO está visível
      3. Verificar que botões de delete NÃO estão visíveis em cada row
      4. Verificar que botões de editar ESTÃO visíveis em cada row
    Expected Result: Só edição visível
    Failure Indicators: Create ou delete visíveis, ou edit escondido
    Evidence: .sisyphus/evidence/task-13-limited-models.png

  Scenario: ModelsPage em full mode mostra todos botões
    Tool: Playwright
    Preconditions: Server rodando com ACCESS_MODE=full
    Steps:
      1. Navegar para http://localhost:5173/models
      2. Verificar que botão "Add Model" está visível
      3. Verificar que botões de delete estão visíveis
      4. Verificar que botões de editar estão visíveis
    Expected Result: Todos botões visíveis
    Failure Indicators: Algum botão escondido
    Evidence: .sisyphus/evidence/task-13-full-models.png
  ```

  **Evidence to Capture**:
  - [ ] task-13-limited-models.png
  - [ ] task-13-full-models.png

  **Commit**: YES (groups with Wave 3)
  - Message: `feat(ui): add capability gates to ModelsPage create/delete buttons`
  - Files: `apps/web/src/pages/models.tsx`

- [x] 14. Adicionar UI gates ao ModelStatsPage (esconder merge/delete logs)

  **What to do**:
  - Em `apps/web/src/pages/model-stats.tsx`:
  - Esconder seção/box de "Merge Models" quando capabilities.mergeModels=false
  - Esconder botões de "Delete Logs" em cada row quando capabilities.deleteModelLogs=false
  - Usar `useServerMode()` ou `<FeatureGate>`

  **Must NOT do**:
  - Não esconder a tabela de estatísticas (read-only, sempre visível)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Modificar UI components, conditionally render sections
  - **Skills**: N/A
  - **Skills Evaluated but Omitted**: N/A

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 12, 13, 15, 16)
  - **Blocks**: None
  - **Blocked By**: Task 12 (precisa do provider atualizado)

  **References**:
  - `apps/web/src/pages/model-stats.tsx` - ModelStatsPage com merge/delete
  - `apps/web/src/components/feature-gate.tsx` - FeatureGate component
  - `apps/web/src/pages/errors.tsx:65` - Pattern de FeatureGate wrapping entire section

  **Acceptance Criteria**:
  - [ ] Merge Models section escondida quando mergeModels=false
  - [ ] Delete Logs buttons escondidos quando deleteModelLogs=false
  - [ ] Tabela de estatísticas sempre visível
  - [ ] Em full mode, todas ações visíveis

  **QA Scenarios**:
  ```
  Scenario: ModelStatsPage em limited mode esconde merge/delete
    Tool: Playwright
    Preconditions: Server rodando com ACCESS_MODE=limited
    Steps:
      1. Navegar para http://localhost:5173/model-stats
      2. Verificar que seção de Merge Models NÃO está visível
      3. Verificar que botões de Delete Logs NÃO estão visíveis
      4. Verificar que tabela de estatísticas ESTÁ visível
    Expected Result: Só tabela visível, ações escondidas
    Failure Indicators: Merge ou delete visíveis
    Evidence: .sisyphus/evidence/task-14-limited-stats.png
  ```

  **Commit**: YES (groups with Wave 3)
  - Message: `feat(ui): add capability gates to ModelStatsPage merge/delete actions`
  - Files: `apps/web/src/pages/model-stats.tsx`

- [x] 15. Adaptar edit dialog para limited mode (habilitar model_name)

  **What to do**:
  - Em `apps/web/src/pages/models.tsx`:
  - No edit dialog, verificar se mode='limited'
  - Se limited: habilitar campo model_name (remover disabled)
  - Se full: manter comportamento atual (model_name disabled durante edição)
  - litellmParams sempre editável em ambos modos
  - Validar que submit funciona com model_name editado
  - Enviar modelName no body da request PUT quando mode=limited e nome mudou

  **Must NOT do**:
  - Não permitir editar model_name em full mode (manter comportamento atual)
  - Não mudar validação de litellmParams

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Modificar form dialog, conditionally enable/disable fields
  - **Skills**: N/A
  - **Skills Evaluated but Omitted**: N/A

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 12, 13, 14, 16)
  - **Blocks**: None
  - **Blocked By**: Task 12 (precisa do provider atualizado)

  **References**:
  - `apps/web/src/pages/models.tsx:273` - model_name disabled={!!editingModel} (atual)
  - `apps/web/src/pages/models.tsx:246-378` - Edit dialog form
  - `apps/web/src/hooks/use-server-mode.tsx` - useServerMode hook para obter mode

  **Acceptance Criteria**:
  - [ ] Em limited mode: campo model_name é editável no dialog
  - [ ] Em full mode: campo model_name é disabled (comportamento atual)
  - [ ] litellmParams editável em ambos modos
  - [ ] Submit funciona com model_name editado em limited mode

  **QA Scenarios**:
  ```
  Scenario: Edit dialog em limited mode permite editar model_name
    Tool: Playwright
    Preconditions: Server rodando com ACCESS_MODE=limited, modelo 'test-model' existe
    Steps:
      1. Navegar para http://localhost:5173/models
      2. Clicar botão de editar em 'test-model'
      3. Verificar que campo 'Model Name' está habilitado (não disabled)
      4. Digitar 'renamed-model' no campo
      5. Preencher litellmParams
      6. Clicar Submit
      7. Verificar que modelo foi renomeado (GET /models mostra 'renamed-model')
    Expected Result: Modelo renomeado com sucesso
    Failure Indicators: Campo disabled ou rename falhou
    Evidence: .sisyphus/evidence/task-15-rename.png
  ```

  **Commit**: YES (groups with Wave 3)
  - Message: `feat(ui): enable model_name editing in limited mode`
  - Files: `apps/web/src/pages/models.tsx`

- [x] 16. Atualizar sidebar badge para mostrar "Limited" mode

  **What to do**:
  - Em `apps/web/src/components/layout/sidebar.tsx`:
  - Adicionar caso para mode='limited' no switch/conditional do badge
  - Cor: amarelo/laranja (entre verde 'Full Access' e amarelo 'API Mode')
  - Texto: "Limited"

  **Must NOT do**:
  - Não mudar cores existentes de Full Access e API Mode

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Adicionar novo caso a conditional rendering de badge
  - **Skills**: N/A
  - **Skills Evaluated but Omitted**: N/A

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 12, 13, 14, 15)
  - **Blocks**: None
  - **Blocked By**: Task 12 (precisa do provider atualizado)

  **References**:
  - `apps/web/src/components/layout/sidebar.tsx:10,16` - Badge de modo atual
  - `apps/web/src/hooks/use-server-mode.tsx` - mode value

  **Acceptance Criteria**:
  - [ ] Badge mostra "Limited" quando mode='limited'
  - [ ] Badge mostra "Full Access" quando mode='database'
  - [ ] Badge mostra "API Mode" quando mode='api-only'

  **QA Scenarios**:
  ```
  Scenario: Sidebar mostra badge 'Limited' em limited mode
    Tool: Playwright
    Preconditions: Server rodando com ACCESS_MODE=limited
    Steps:
      1. Navegar para http://localhost:5173
      2. Verificar badge na sidebar
      3. Verificar texto 'Limited'
      4. Verificar cor do badge (amarelo/laranja)
    Expected Result: Badge 'Limited' visível
    Failure Indicators: Badge mostra outro texto
    Evidence: .sisyphus/evidence/task-16-badge.png
  ```

  **Commit**: YES (groups with Wave 3)
  - Message: `feat(ui): add Limited mode badge to sidebar`
  - Files: `apps/web/src/components/layout/sidebar.tsx`

- [x] 17. Testar detectMode() com combinações de ACCESS_MODE

  **What to do** (TDD - RED-GREEN-REFACTOR):
  - RED: Criar arquivo de teste para detectMode()
  - Testes:
    - ACCESS_MODE=full → 'database'
    - ACCESS_MODE=api-only → 'api-only'
    - ACCESS_MODE=limited + DB_HOST → 'database'
    - ACCESS_MODE=limited sem DB_HOST → 'api-only' + warning
    - ACCESS_MODE=undefined + DB_HOST → 'database'
    - ACCESS_MODE=undefined sem DB_HOST + LITELLM_API_URL → 'api-only'
  - GREEN: Implementar detectMode() para passar nos testes
  - REFACTOR: Limpar código

  **Must NOT do**:
  - Não testar comportamento existente que já funciona (focar no novo)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Testes unitários simples de função pura
  - **Skills**: N/A
  - **Skills Evaluated but Omitted**: N/A

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with Tasks 18, 19, 20, 21)
  - **Blocks**: None
  - **Blocked By**: Task 2 (precisa do detectMode implementado)

  **References**:
  - `apps/server/src/data-source/index.ts` - detectMode() function
  - Verificar se há testes existentes para seguir padrão

  **Acceptance Criteria**:
  - [ ] 6 testes passando (todas combinações de ACCESS_MODE)
  - [ ] Coverage de detectMode() = 100%

  **QA Scenarios**:
  ```
  Scenario: DetectMode tests passam
    Tool: Bash (test runner)
    Preconditions: Test file criado
    Steps:
      1. Executar comando de teste para detectMode
      2. Verificar que todos 6 testes passam
    Expected Result: 6/6 passing
    Failure Indicators: Algum teste falhando
    Evidence: .sisyphus/evidence/task-17-test-results.log
  ```

  **Commit**: YES (groups with Wave 4)
  - Message: `test(mode): add TDD tests for detectMode with ACCESS_MODE`
  - Files: `apps/server/src/data-source/__tests__/detectMode.test.ts` (ou similar)

- [x] 18. Testar LIMITED_CAPABILITIES

  **What to do** (TDD):
  - RED: Criar teste para LIMITED_CAPABILITIES
  - Testes:
    - createModel === false
    - updateModel === true
    - deleteModel === false
    - mergeModels === false
    - deleteModelLogs === false
    - Todas capabilities de leitura === true
  - GREEN: Criar LIMITED_CAPABILITIES para passar nos testes
  - REFACTOR: Verificar consistência

  **Must NOT do**:
  - Não testar DATABASE_CAPABILITIES ou API_CAPABILITIES (existem)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Testes de assertion simples
  - **Skills**: N/A
  - **Skills Evaluated but Omitted**: N/A

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with Tasks 17, 19, 20, 21)
  - **Blocks**: None
  - **Blocked By**: Task 3 (precisa de LIMITED_CAPABILITIES implementado)

  **References**:
  - `apps/server/src/data-source/database.ts` - DATABASE_CAPABILITIES
  - `apps/server/src/data-source/api.ts` - API_CAPABILITIES

  **Acceptance Criteria**:
  - [ ] 6 testes passando
  - [ ] write capabilities corretas
  - [ ] read capabilities todas true

  **QA Scenarios**:
  ```
  Scenario: LIMITED_CAPABILITIES tests passam
    Tool: Bash (test runner)
    Steps:
      1. Executar teste para LIMITED_CAPABILITIES
      2. Verificar 6/6 passing
    Expected Result: Todos passando
    Evidence: .sisyphus/evidence/task-18-test-results.log
  ```

  **Commit**: YES (groups with Wave 4)
  - Message: `test(capabilities): add TDD tests for LIMITED_CAPABILITIES`
  - Files: `apps/server/src/data-source/__tests__/capabilities.test.ts`

- [x] 19. Testar endpoints de escrita retornam 403 em limited mode

  **What to do** (TDD):
  - RED: Criar testes de integração para endpoints de escrita
  - Testes:
    - POST /models → 403 em limited, 200 em full
    - DELETE /models/:name → 403 em limited, 200 em full
    - POST /models/merge → 403 em limited, 200 em full
    - DELETE /models/logs/:model → 403 em limited, 200 em full
  - GREEN: Implementar guards para passar nos testes
  - REFACTOR: Verificar mensagens de erro

  **Must NOT do**:
  - Não testar PUT /models/:name (updateModel=true em limited, testa em Task 20)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Testes de integração com mock de dataSource
  - **Skills**: N/A
  - **Skills Evaluated but Omitted**: N/A

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with Tasks 17, 18, 20, 21)
  - **Blocks**: None
  - **Blocked By**: Task 11 (precisa dos guards implementados)

  **References**:
  - `apps/server/src/api-server.ts` - Endpoints de escrita
  - Verificar se há testes de integração existentes

  **Acceptance Criteria**:
  - [ ] 8 testes passando (4 endpoints × 2 modos)
  - [ ] 403 com mensagem "limited mode"
  - [ ] 200 em full mode

  **QA Scenarios**:
  ```
  Scenario: Write endpoints return 403 in limited mode
    Tool: Bash (test runner)
    Steps:
      1. Executar testes de integração
      2. Verificar 8/8 passing
    Expected Result: Todos passando
    Evidence: .sisyphus/evidence/task-19-test-results.log
  ```

  **Commit**: YES (groups with Wave 4)
  - Message: `test(api): add TDD tests for write endpoint guards in limited mode`
  - Files: `apps/server/src/api-server/__tests__/write-guards.test.ts`

- [x] 20. Testar PUT /models/:name funciona em limited mode

  **What to do** (TDD):
  - RED: Criar teste para update em limited mode
  - Testes:
    - PUT /models/:name → 200 em limited (updateModel=true)
    - PUT /models/:name → 200 em full
    - PUT /models/:name → 403 em api-only (updateModel=false)
  - GREEN: Verificar que guard permite update em limited
  - REFACTOR: Verificar response body

  **Must NOT do**:
  - Não testar outros endpoints (já testados em Task 19)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Teste de integração específico
  - **Skills**: N/A
  - **Skills Evaluated but Omitted**: N/A

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with Tasks 17, 18, 19, 21)
  - **Blocks**: None
  - **Blocked By**: Task 11 (precisa dos guards)

  **References**:
  - `apps/server/src/api-server.ts` - PUT /models/:name endpoint
  - `apps/server/src/data-source/types.ts` - LIMITED_CAPABILITIES

  **Acceptance Criteria**:
  - [ ] 3 testes passando (limited=200, full=200, api-only=403)

  **QA Scenarios**:
  ```
  Scenario: Update endpoint works in limited mode
    Tool: Bash (test runner)
    Steps:
      1. Executar teste de update
      2. Verificar 3/3 passing
    Expected Result: Todos passando
    Evidence: .sisyphus/evidence/task-20-test-results.log
  ```

  **Commit**: YES (groups with Wave 4)
  - Message: `test(api): add TDD test for update endpoint in limited mode`
  - Files: `apps/server/src/api-server/__tests__/update-limited.test.ts`

- [x] 21. Testar UI gates renderizam corretamente

  **What to do** (TDD):
  - RED: Criar testes de componente para UI gates
  - Testes:
    - ModelsPage: create button escondido em limited
    - ModelsPage: delete buttons escondidos em limited
    - ModelsPage: edit button visível em limited
    - ModelStatsPage: merge section escondida em limited
    - ModelStatsPage: delete logs buttons escondidos em limited
  - GREEN: Implementar gates para passar nos testes
  - REFACTOR: Verificar acessibilidade

  **Must NOT do**:
  - Não testar comportamento de full mode (já funciona)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Testes de componente React (render + assert)
  - **Skills**: N/A
  - **Skills Evaluated but Omitted**: N/A

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with Tasks 17, 18, 19, 20)
  - **Blocks**: None
  - **Blocked By**: Tasks 13, 14 (precisam dos gates implementados)

  **References**:
  - `apps/web/src/pages/models.tsx` - ModelsPage
  - `apps/web/src/pages/model-stats.tsx` - ModelStatsPage
  - `apps/web/src/components/feature-gate.tsx` - FeatureGate

  **Acceptance Criteria**:
  - [ ] 5 testes passando
  - [ ] UI gates funcionam corretamente

  **QA Scenarios**:
  ```
  Scenario: UI gate tests passam
    Tool: Bash (test runner)
    Steps:
      1. Executar testes de componente
      2. Verificar 5/5 passing
    Expected Result: Todos passando
    Evidence: .sisyphus/evidence/task-21-test-results.log
  ```

  **Commit**: YES (groups with Wave 4)
  - Message: `test(ui): add TDD tests for UI gates in limited mode`
  - Files: `apps/web/src/pages/__tests__/models-gates.test.tsx`, `apps/web/src/pages/__tests__/model-stats-gates.test.tsx`

---

## Final Verification Wave

> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.

- [ ] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists. For each "Must NOT Have": search codebase for forbidden patterns. Check evidence files exist.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [ ] F2. **Code Quality Review** — `unspecified-high`
  Run `tsc --noEmit` + linter + test suite. Review all changed files for anti-patterns.
  Output: `Build [PASS/FAIL] | Lint [PASS/FAIL] | Tests [N pass/N fail] | VERDICT`

- [ ] F3. **Real Manual QA** — `unspecified-high`
  Execute EVERY QA scenario from EVERY task. Test cross-task integration. Save to `.sisyphus/evidence/final-qa/`.
  Output: `Scenarios [N/N pass] | Integration [N/N] | VERDICT`

- [ ] F4. **Scope Fidelity Check** — `deep`
  Verify 1:1 — everything in spec was built, nothing beyond spec was built. Check "Must NOT do" compliance.
  Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | VERDICT`

---

## Commit Strategy

- Group by wave — one commit per wave
- Messages: `feat(mode): add limited mode support`

---

## Success Criteria

### Verification Commands
```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Tests (if infrastructure exists)
pnpm test

# Dev mode test
pnpm dev
# Then set ACCESS_MODE=limited and verify behavior
```

### Final Checklist
- [ ] All "Must Have" present
- [ ] All "Must NOT Have" absent
- [ ] All tests pass
- [ ] ACCESS_MODE=limited works correctly
- [ ] Full and api-only modes still work
