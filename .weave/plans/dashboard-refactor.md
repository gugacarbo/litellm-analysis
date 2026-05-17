# Dashboard Refactor — Especificação Técnica

**Origem:** `docs/superpowers/specs/quero-que.md`
**Data:** 2026-05-16
**Status:** Aguardando revisão e respostas às perguntas abertas

---

## Visão Geral

Refatoração abrangente do dashboard LiteLLM Analytics, abrangendo 5 áreas:

| #   | Área                | Páginas/Rotas Afetadas               | Esforço Estimado |
| --- | ------------------- | ------------------------------------ | ---------------- |
| 1   | Requisitos Globais  | `App.tsx`, layout, sidebar, filtro   | Médio            |
| 2   | Model Stats         | `/model-stats`                       | Médio            |
| 3   | Logs (Chat Viewer)  | `/logs`, nova `/logs/:requestId`     | Grande           |
| 4   | Agents & Categories | `/agents`, nova `/agents/:agentId`   | Grande           |
| 5   | Models              | `/models`, nova `/models/:modelName` | Grande           |

---

## 1. Requisitos Globais

### 1.1 Contexto Global para o Filtro do Header

**Estado atual:** `FilterProvider` (React Context) já existe em `apps/web/src/contexts/filter-context.tsx` e envolve todas as `<Routes>` em `App.tsx`. Porém, **nenhuma página consome o contexto** — cada página usa seu próprio `useState("30d")`.

**O que precisa ser feito:**
1. `pages/dashboard.tsx` — substituir `useState<DashboardDateRangeKey>("30d")` por `useFilter()` do contexto
2. `pages/model-stats/use-model-stats-state.ts` — mesma substituição
3. `components/model-stats/model-stats-header.tsx` — passar valores do contexto como props ou importar diretamente
4. `components/ui/date-range-filter.tsx` — já existe, só precisa ser usado pelas páginas

**Arquivos a modificar:**
- `apps/web/src/pages/dashboard.tsx`
- `apps/web/src/pages/model-stats/use-model-stats-state.ts`
- `apps/web/src/components/model-stats/model-stats-header.tsx`

**Risco:** Baixo — contexto existe, só precisa ser conectado.

---

### 1.2 Persistência do Filtro Entre Páginas

**Estado atual:** Como nenhuma página usa o contexto, cada página reseta para `"30d"` no mount.

**Comportamento pós-migração (Requisito 1.1):**
- Navegação SPA: ✅ filtro persiste automaticamente (contexto sobrevive ao `<Routes>`)
- Full page reload: ❌ reseta para `"30d"` (contexto é só memória)
- URL shareable: ❌ sem integração com `useSearchParams`

**Opcional (opção B):** Sincronizar `FilterProvider` com URL search params (`?range=7d`) usando `useSearchParams()`.

**Arquivos a modificar (opção B):**
- `apps/web/src/contexts/filter-context.tsx`

**Risco:** Baixo.

---

### 1.3 Modo de Filtro "Personalizado"

**Estado atual:** Tipos e UI já existem parcialmente:
- `DashboardDateRangeKey` inclui `"custom"` ✅
- `TimeRangeValue { preset, from?, to? }` existe ✅
- Botão "Personalizado" renderiza em `date-range-filter.tsx` ✅
- `TimeRangePicker` (datetime-local inputs) existe como componente separado ✅

**GAP:** O contexto atual (`FilterContextValue`) só armazena `DashboardDateRangeKey` — não suporta `from`/`to` para ranges customizados. O `TimeRangePicker` não está integrado ao `DateRangeFilter`. O data-fetching layer não lida com `rangeDays === 0` (custom).

**O que precisa ser feito:**
1. **Estender o tipo do contexto:**
```ts
type FilterContextValue = {
  dateRange: DashboardDateRangeKey;
  setDateRange: (range: DashboardDateRangeKey) => void;
  customFrom?: Date;
  customTo?: Date;
  setCustomRange: (from: Date, to: Date) => void;
  rangeDays: number; // calculado das datas customizadas ou do preset
};
```

2. **Integrar `TimeRangePicker` ao `DateRangeFilter`** — substituir botão "Personalizado" simples por popover com date picker
3. **Propagar `customFrom`/`customTo` para os data-fetching hooks** — `use-dashboard-data.ts` e query hooks
4. **Possivelmente estender queries no backend** para aceitar `startDate`/`endDate` (em vez de só `days`)

**Arquivos a modificar:**
- `apps/web/src/pages/dashboard/dashboard-types.ts` — tipo `TimeRangeValue`
- `apps/web/src/contexts/filter-context.tsx` — estado `customFrom`/`customTo`
- `apps/web/src/components/ui/date-range-filter.tsx` — integrar TimeRangePicker
- `apps/web/src/hooks/use-dashboard-data.ts` — lidar com rangeDays=0
- `packages/analytics/src/queries/` — possível adição de `startDate`/`endDate`

**Risco:** Médio — mudança de tipo no contexto + possível propagação ao backend.

---

### 1.4 Sidebar com shadcn/ui

**Estado atual:** Sidebar hand-rolled (`components/layout/sidebar.tsx`): `<aside>` com `<Card>`, estado manual de expand/collapse, `navItems` hardcoded.

**shadcn/ui Sidebar:** Componente disponível no registry (`@shadcn/sidebar`), mas **não instalado**. Variáveis CSS (`--sidebar-*`) já existem em `globals.css`. `@radix-ui/react-collapsible` já instalado.

**O que precisa ser feito:**
1. Instalar: `npx shadcn add sidebar` → gera `components/ui/sidebar.tsx`
2. Reestruturar `App.tsx` para:
```tsx
<SidebarProvider>
  <AppSidebar />
  <SidebarInset>
    <main>...</main>
  </SidebarInset>
</SidebarProvider>
```
3. Reescrever `components/layout/sidebar.tsx` usando primitivos shadcn:
   - `<SidebarGroup>`, `<SidebarMenu>`, `<SidebarMenuItem>`
   - `<SidebarMenuButton asChild>` wrappeando `<NavLink>`
   - `<Collapsible>` para seções expansíveis (Monitoring, Agents)

**Arquivos a modificar:**
- **Novo:** `apps/web/src/components/ui/sidebar.tsx`
- `apps/web/src/components/layout/sidebar.tsx` — reescrita completa
- `apps/web/src/App.tsx` — wrap em `<SidebarProvider>`, reestruturar layout

**Risco:** Médio — mudança estrutural de layout que afeta todas as páginas.

---

## 2. Página `/model-stats`

### 2.1 Header

#### 2.1.1 Remover Seletor de Colunas

**Estado atual:** Dropdown "Columns" com checkboxes para 21 colunas em `model-stats-header.tsx` (linhas 66-85).

**Ação:** Remover o dropdown do header. O toggle de colunas (`visibleColumns`, `toggleColumn`) precisa sobreviver funcionalmente — deve ser movido para dentro do card da tabela (`model-stats-data-table.tsx`).

**Arquivos a modificar:**
- `apps/web/src/components/model-stats/model-stats-header.tsx` — remover linhas 66-85
- `apps/web/src/components/model-stats/model-stats-data-table.tsx` — adicionar toggle no CardHeader

**Risco:** Baixo.

#### 2.1.2 Migrar "Merge Models" para `/models`

**Estado atual:** Merge Models está no `/model-stats` como botão no header + painel com dois dropdowns (source/target) + diálogo de confirmação. A lógica chama `POST /models/merge` que executa `UPDATE "LiteLLM_SpendLogs" SET "model" = target WHERE "model" = source`.

**Ação:** Mover toda a UI e lógica de merge para o card "Configured Models" na página `/models`.

**Arquivos a modificar:**
- `apps/web/src/pages/models/use-models-page.ts` — integrar estado de merge
- `apps/web/src/components/models/models-table-card.tsx` — adicionar botão "Merge" no CardHeader
- `apps/web/src/pages/model-stats.tsx` — remover UI de merge
- `apps/web/src/pages/model-stats/use-model-stats-state.ts` — remover estado de merge
- `apps/web/src/pages/model-stats/use-model-stats-actions.ts` — remover handlers de merge
- **Extrair/adaptar:** `merge-model-logs-dialog.tsx` e `model-stats-merge-panel.tsx`

**Risco:** Médio — extração de lógica de estado entre páginas.

**Decisão (Q6, Q7):** Merge migra completamente para `/models`, removido de `/model-stats`. Sem request count no diálogo de confirmação da v1.

---

### 2.2 Cards de Métricas

Estado atual dos cards em `model-stats-summary-cards.tsx`:

| Card         | Estado Atual                     | Requisito                                                        | Ação                                                                                             |
| ------------ | -------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Total Spend  | `$X.XX`, subtitle: avg/req       | Manter                                                           | Nenhuma                                                                                          |
| Total Tokens | `nK`, subtitle: "n requests"     | subtitle: "n input tokens"                                       | Usar `totalPromptTokens` (já computado, não passado ao componente)                               |
| Requests     | `nK`, subtitle: "% success"      | Manter                                                           | Nenhuma                                                                                          |
| Success Rate | `n%`, subtitle: "n errors"       | **Remover**                                                      | Remover card                                                                                     |
| Avg Latency  | `nms/s`, subtitle: "n max tok/s" | **Inverter**: primary = "Avg Tokens/s", subtitle = "avg latency" | Usar `avg_tokens_per_second` (precisa de agregado global)                                        |
| Models       | `n`, subtitle: range             | **Remover**                                                      | Remover card                                                                                     |
| *(novo)*     | —                                | **Efficiency Score**: avg `$/1K tokens`                          | `avgCostPer1kTokens` já computado no derived. Subtítulo: modelo mais eficiente + menos eficiente |

**Dados disponíveis vs. necessários:**

| Métrica                            | Disponível?                                                                            | Onde                                                   |
| ---------------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `totalPromptTokens` (input tokens) | ✅ Computado em `use-model-stats-derived.ts:155`                                        | Só precisa ser passado ao componente                   |
| `avgCostPer1kTokens` (eficiência)  | ✅ Computado em `use-model-stats-derived.ts:179`                                        | Só precisa ser passado ao componente                   |
| `avg_tokens_per_second` (global)   | ⚠️ Por modelo, sem agregado global                                                      | Precisa de média ponderada por request_count           |
| Modelo mais/menos eficiente        | ⚠️ `computeInsights()` calcula por `input_cost + output_cost`, não por `cost_per_token` | Ajustar cálculo para usar `total_spend / total_tokens` |

**Arquivos a modificar:**
- `apps/web/src/components/model-stats/model-stats-summary-cards.tsx` — novos props, cards, layout
- `apps/web/src/pages/model-stats/use-model-stats-derived.ts` — novos agregados, ajuste de insights
- `apps/web/src/pages/model-stats/use-model-stats-page.ts` — passar novos valores
- `apps/web/src/pages/model-stats.tsx` — passar novos props

**Risco:** Baixo — só frontend, dados já existem no pipeline.

**Perguntas abertas:**
1. "Avg Tokens/s" deve usar `avg_tokens_per_second` (completion tokens/s) ou output tokens/s? Média simples ou ponderada?
2. Eficiência: usar `avgCostPer1kTokens` (total_spend / total_tokens * 1000) como definido, ou `avg_input_cost + avg_output_cost` como `computeInsights` atual?
3. Subtítulo do Efficiency Score: mostrar nomes dos modelos ("Best: gpt-4o-mini · Worst: claude-3-opus")?

---

## 3. Logs — Request Chat Viewer

### 3.1 Mudança Estrutural: Modal → Página Dedicada

**Estado atual:** `LogDetailDialog` (`components/logs/log-detail-dialog.tsx`) — modal `Dialog` com `sm:max-w-6xl`. Aberto via clique na linha da `LogsTable`. Usa dados do `SpendLog` já carregados na listagem (sem chamada separada).

**Ação:** Substituir por página dedicada em `/logs/:requestId`.

**O que precisa ser construído:**
1. Nova rota `/logs/:requestId` em `App.tsx`
2. Nova página: `apps/web/src/pages/logs/request-detail-page.tsx`
3. Nova função de API client: `getSpendLogById(requestId)` em `lib/api-client/spend.ts`
4. Nova query key: `["spend-log-detail", requestId]`
5. Substituir `onRowClick` na tabela por `<Link to={/logs/${requestId}}>`

**Backend:** `GET /spend/logs/:requestId` já existe — nenhuma mudança necessária.

**Arquivos a modificar:**
- `apps/web/src/App.tsx` — adicionar rota
- **Novo:** `apps/web/src/pages/logs/request-detail-page.tsx`
- **Novo:** `apps/web/src/pages/logs/use-request-detail-page.ts`
- `apps/web/src/pages/logs/spend-logs-tab.tsx` — remover ou adaptar `LogDetailDialog`
- `apps/web/src/components/logs/logs-table.tsx` — `onRowClick` → navegação
- `apps/web/src/lib/api-client/spend.ts` — `getSpendLogById()`
- `apps/web/src/lib/query-keys.ts` — query key

**Risco:** Médio.

**Pergunta aberta:** Clicar na linha deve navegar para a página de detalhes, ou manter um modal "quick peek" com link "View full details"?

---

### 3.2 Aba "Chat Details"

**Estado atual:** O diálogo atual mostra mensagens do campo `messages` (Array<{role, content}>) em seções colapsáveis com cores por papel (user=azul, assistant=verde, system=roxo). **Tool calls não são extraídas nem exibidas** — ficam enterradas no JSON viewer do campo `response`.

**Schema do banco (LiteLLM_SpendLogs):**
- `messages: Json?` — array de mensagens (default `{}`)
- `response: Json?` — resposta completa da API (contém `choices[0].message.tool_calls` em streaming/non-streaming)
- `proxy_server_request: Json?` — request original (pode conter tool definitions)
- `mcp_namespaced_tool_name: String?` — identificador de tool MCP

**GAPs críticos:**
- Tipo `SpendLog.messages` é `Array<{role, content}>` — não inclui campos de tool (`tool_calls`, `tool_call_id`, `name`, `function_call`)
- Mensagens podem estar vazias (default `{}` — objeto, não array)
- Tool calls precisam ser extraídas do JSON de `response`
- Tool results podem estar em `response` ou em mensagens subsequentes (depende do provider)

**O que precisa ser construído:**
1. **Sistema de tabs** na página de detalhes (mínimo: "Chat Details" + "Metrics & Cost")
2. **Parser de mensagens completo** que combina:
   - `messages` array (user, system, assistant)
   - `response.choices[0].message.tool_calls` (assistant tool calls)
   - `response.choices[0].message` (tool results, provider-dependent)
3. **Visualização de chat estático** com:
   - Mensagens por papel: user, assistant, system, tool
   - Tool calls: nome + argumentos em formato estruturado
   - Tool results: output formatado
4. **Ampliar o tipo `SpendLog.messages`** para incluir campos tool-related

**Arquivos a modificar:**
- `apps/web/src/pages/logs/request-detail-page.tsx` — estrutura de tabs
- **Novo:** componente de visualização de chat (messages renderer)
- **Novo:** parser de tool calls do `response` JSON
- `apps/web/src/types/connection.ts` ou API contracts — ampliar tipo de mensagens
- `packages/api-contracts/src/analytics.ts` — possível extensão do tipo `SpendLog`

**Risco:** Alto — formato de tool calls imprevisível entre providers e versões do LiteLLM.

**Perguntas abertas críticas (precisam de exploração de dados reais):**
1. Como o LiteLLM armazena tool calls? Formato `response.choices[0].message.tool_calls` (OpenAI standard)?
2. `messages` sempre contém a conversa completa ou só parcial? `proxy_server_request.messages` é mais confiável?
3. Onde os resultados das tools são armazenados? `response`, `metadata`, ou mensagens subsequentes?
4. `mcp_namespaced_tool_name` existe na DB mas não no tipo `SpendLog` atual — é relevante?

---

### 3.3 Aba "Metrics & Cost"

**Estado atual:** O diálogo atual mostra métricas inline (5 `MetricCard`s + barra de tokens manual com divs). Sem separação em tab dedicada, sem Recharts.

**Métricas disponíveis por request:** `spend`, `total_tokens`, `prompt_tokens`, `completion_tokens`, `start_time`, `end_time`, `time_to_first_token_ms`, `request_duration_ms`.

**O que precisa ser construído:**
1. **Conteúdo da tab "Metrics & Cost"** extraindo do diálogo atual
2. **Gráfico Recharts BarChart** para distribuição de tokens (`[{name: "Input", tokens: prompt_tokens}, {name: "Output", tokens: completion_tokens}]`)
3. **Tabela-resumo** com todas as métricas em formato linha-valor
4. **Gráfico de linha de evolução de custo:** Para uma única request, N/A. Pode ser placeholder ou condicional (ex.: se houver múltiplas requests relacionadas)

**Nota:** Recharts já é dependência do projeto — sem nova instalação.

**Arquivos a modificar:**
- `apps/web/src/pages/logs/request-detail-page.tsx` — conteúdo da tab métricas
- Extrair metric cards e token breakdown do `log-detail-dialog.tsx`

**Risco:** Baixo.

---

## 4. Agents

### 4.1 Aba Agents

#### 4.1.1 Página Dedicada de Configuração (substituir Dialog)

**Estado atual:** `AgentConfigEditor` é um `Dialog` modal (shadcn) com campos limitados (name, description, icon, color, mode). Sem modelo, fallback, tools, skills, ou opções avançadas.

**Ação:** Criar página dedicada em `/agents/:displayName` e substituir o dialog.

**Arquivos a modificar:**
- `apps/web/src/App.tsx` — adicionar rota `/agents/:displayName`
- **Novo:** `apps/web/src/pages/agent-config.tsx`
- `apps/web/src/pages/agents.tsx` — remover dialog inline, adicionar navegação "Edit"
- `apps/web/src/components/agent-config-editor.tsx` — conteúdo migra para a página

**Decisão (Q8):** Implementar campo `id` (slug/uuid) nos agents. URL: `/agents/:id`. Isso requer adicionar `id` ao schema `SystemAgent`. Migração: gerar slugs a partir dos `displayName` existentes.

#### 4.1.2 Botão "Add Agent"

**Estado atual:** Não existe botão "Add". Backend tem `POST /agent-catalog` mas o frontend API client não expõe `createSystemAgent`.

**O que precisa ser feito:**
1. Adicionar botão "Add Agent" no `AgentRoutingAgentsTab`
2. Adicionar `createSystemAgent()` no API client ou usar `upsertSystemAgent` com fluxo de criação
3. Navegar para a nova página de configuração (ou abrir form simplificado) após criar

**Arquivos a modificar:**
- `apps/web/src/pages/agents.tsx` — botão Add
- `apps/web/src/components/agent-routing/agent-routing-agents-tab.tsx`
- `apps/web/src/lib/api-client/agent-catalog.ts` — `createSystemAgent()`
- `apps/web/src/pages/agents/use-agent-routing-actions.ts` — `handleCreateAgent`

#### 4.1.3 Confirmação de Exclusão com Alert Dialog

**Estado atual:** Botão delete no `EntityFocusCard` dispara `onDelete()` diretamente — sem confirmação. `AlertDialog` já está instalado (`components/ui/alert-dialog.tsx`), só não é usado.

**O que precisa ser feito:**
- Integrar `AlertDialog` ao botão de delete no `EntityFocusCard`

**Arquivos a modificar:**
- `apps/web/src/components/agent-routing/entity-focus-card.tsx`

**Risco:** Baixo.

#### 4.1.4 Seletor Rápido de Modelo Primário no Card

**Estado atual:** `EntityFocusCard` mostra: ícone, nome, descrição, badge de context limit, badge de mode. **Nenhuma informação de modelo.**

**O que precisa ser feito:**
- Adicionar badge/seletor inline de modelo no card
- Popular com lista de modelos de `GET /models`

**Arquivos a modificar:**
- `apps/web/src/components/agent-routing/entity-focus-card.tsx`
- `apps/web/src/pages/agents/use-agent-routing-derived.ts` — expor `agent.model`

**Decisão (Q4.1.4):** Usar `GET /models/with-config` — inclui status de sincronização, útil para o seletor.

#### 4.1.5 Seção de Modelo Primário e Fallback

**Estado atual:** `SystemAgent` tem campos `model: string` e `fallbackModels: string[]`, mas **nenhum é renderizado** no `AgentConfigEditor`.

**O que precisa ser feito:**
- Adicionar seletor de modelo (searchable `<Select>` ou combobox)
- Adicionar multi-select para fallback models
- Ambos na nova página de configuração

**Arquivos a modificar:**
- `apps/web/src/pages/agent-config.tsx` — seção de modelos
- `apps/web/src/components/agent-config-editor.tsx` — ou migrar para sub-componentes

**Backend:** `GET /models` já existe — sem dependências novas.

#### 4.1.6 Tools, Skills e Opções Adicionais

**Estado atual:** `AgentExtraConfig` define 10+ campos (`tools`, `skills`, `permissions`, `prompt`, `promptAppend`, `temperature`, `topP`, `category`, etc.). Nenhum é renderizado no editor atual (só `color` e `mode`).

**O que precisa ser feito:**
- Expandir massivamente o formulário de configuração
- Organizar em seções/tabs: "General", "Model", "Tools & Skills", "Advanced"
- `tools: Record<string, boolean>` → UI de toggle para cada tool
- `skills: string[]` → multi-select ou lista editável
- `temperature`, `topP` → sliders/inputs numéricos
- `prompt`, `promptAppend` → textareas
- `category` → seletor de categoria existente

**Arquivos a modificar:**
- `apps/web/src/components/agent-config-editor.tsx` — expansão massiva
- **Novos:** sub-componentes (`model-section.tsx`, `tools-section.tsx`, `advanced-section.tsx`)

**Decisão (Q10):** Freeform: campo de texto para nomes de skills (tag input com autocomplete) + toggle booleano para tools (nome + switch). Sem endpoint externo — o usuário conhece os nomes. Se houver endpoint depois, migrar.

---

### 4.2 Aba Categories

**Estado atual:** `AgentRoutingCategoriesTab` é **read-only** — grid de cards mostrando nome e descrição. Sem create/edit/delete.

**Backend:** CRUD completo já existe:
- `GET /category-catalog` ✅
- `POST /category-catalog` ✅
- `PUT /category-catalog/:key` ✅
- `DELETE /category-catalog/:key` ✅
- `CategoryService` com todas as operações ✅

**Frontend API client:** `getCategoryCatalog`, `upsertCategory`, `deleteCategory` já existem ✅

**O que precisa ser feito:**
- Criar editor de categoria (similar ao agent-config-editor)
- Adicionar botões Create/Edit/Delete nos cards de categoria
- `CategoryEntry` tem 17 campos — decidir quais são editáveis

**Arquivos a modificar:**
- **Novo:** `apps/web/src/components/category-config-editor/`
- `apps/web/src/components/agent-routing/agent-routing-categories-tab.tsx` — tornar interativo
- `apps/web/src/pages/agents/use-agent-routing-actions.ts` — CRUD mutations
- `apps/web/src/pages/agents.tsx` — wire mutations

**Decisão (Q9):** Seção "General" com campos essenciais (`model`, `fallbackModels`, `limits`, `description`, `icon`, `cost`, `temperature`, `topP`, `tools`) + seção "Advanced" colapsável com o resto (`thinking`, `reasoningEffort`, `textVerbosity`, `isUnstableAgent`, `promptAppend`, `config`).

---

### Cross-Cutting: Duplicate Routes (Q11 — Resolvido)

**Investigação concluída:** Duas rotas competem por `/agent-catalog`:

| Método | Caminho | `agent-catalog-routes.ts` | `config-routes.ts` (ativo) |
|--------|---------|--------------------------|---------------------------|
| GET | `/agent-catalog` | ✅ `{ key, displayName, ... }` | ✅ sem `key` ❌ |
| GET | `/agent-catalog/:id` | ✅ retorna objeto direto | ✅ `{ agent }` sem `key` |
| POST | `/agent-catalog` | ✅ + `syncGeneratedArtifacts()` | ❌ não existe |
| PUT | `/agent-catalog/:id` | ✅ | ✅ sobrescreve |
| DELETE | `/agent-catalog/:id` | ✅ sem sync | ✅ + `exportAll()` |

**Handler efetivo:** `config-routes.ts` (registrado por último no Express, sobrescreve GET/PUT/DELETE). POST só existe em `agent-catalog-routes.ts`.

**Decisão (Q11):** Consolidar em `agent-catalog-routes.ts` e descartar `config-routes.ts` + wrapper `agent-config-routes.ts`.
- `syncGeneratedArtifacts()` é estritamente superior a `exportAll()` (faz sync de modelos no DB + export)
- Formato de resposta de `agent-catalog-routes.ts` inclui `key`, compatível com `AgentCatalogEntry`
- Correções necessárias ao consolidar:
  - Adicionar `syncGeneratedArtifacts()` no handler DELETE
  - Corrigir `GET /agent-catalog/:id` para responder `{ key, agent }` (contrato `AgentCatalogDetailResponse`)
  - Remover `registerAgentConfigRoutes` de `routes/index.ts`

### Cross-Cutting: Type Inconsistencies
- `AgentCatalogEntry.config` (API contract) é inline vs `SystemAgent.config` (repo) é `AgentExtraConfig`
- `topP` (camelCase) em alguns lugares, `top_p` (snake_case) em outros
- `enabledPlugins` existe no `AgentCatalogEntry` mas não no schema do repositório

---

## 5. Página `/models`

### 5.1 Página Dedicada de Configuração (substituir Dialog)

**Estado atual:** `ModelFormDialog` — dialog único com todos os campos misturados (name, enabled, apiBase, credential, costs, limits, extra params). Sem separação visual, sem deep-linking.

**Ação:** Criar página dedicada em `/models/:modelName` com duas seções claras.

**Campos Globais vs. Específicos:**

| Categoria      | Campo              | Origem              | Editável Hoje?                    |
| -------------- | ------------------ | ------------------- | --------------------------------- |
| **Global**     | `modelName`        | Config key          | Sim (imutável no edit)            |
| **Global**     | `displayName`      | ModelSpec           | **Não**                           |
| **Global**     | `family`           | ModelSpec           | **Não**                           |
| **Global**     | `enabled`          | ModelSpec + DB      | Sim                               |
| **Global**     | `limits.length`    | ModelSpec (context) | Parcial (como contextWindowSize)  |
| **Global**     | `limits.maxOutput` | ModelSpec           | Parcial (como maxTokens)          |
| **Global**     | `cost.input`       | ModelSpec ($/Mi)    | Parcial (como inputCostPerToken)  |
| **Global**     | `cost.output`      | ModelSpec ($/Mi)    | Parcial (como outputCostPerToken) |
| **Global**     | `thinking.levels`  | ModelSpec           | **Não**                           |
| **Específico** | `api_base`         | DB litellmParams    | Sim                               |
| **Específico** | `credential`       | DB litellmParams    | Sim                               |
| **Específico** | Extra params       | DB litellmParams    | Sim                               |

**Complexidade:** Dual-storage model — campos globais em `@models/models.jsonc` (ModelSpec) e campos específicos em `LiteLLM_ProxyModelTable` (litellmParams). Precisa de sincronização cuidadosa.

**Unidades de custo diferentes:**
- Config: `$X.XX/Mi` (por milhão de tokens)
- DB: `$X.XX` (por token)
- Conversão necessária no formulário

**O que precisa ser construído:**
1. Nova rota `/models/:modelName` em `App.tsx`
2. Nova página: `apps/web/src/pages/model-config.tsx`
3. Novo hook: `use-model-config-page.ts`
4. Novo componente: `model-config-form.tsx` com duas seções
5. Possível endpoint `GET /models/:name` para detalhes completos
6. Expandir `PUT /models/:name` para aceitar campos globais

**Arquivos a modificar:**
- `apps/web/src/App.tsx` — adicionar rota
- **Novo:** `apps/web/src/pages/model-config.tsx`
- **Novo:** `apps/web/src/pages/model-config/use-model-config-page.ts`
- **Novo:** `apps/web/src/components/models/model-config-form.tsx`
- `apps/web/src/components/models/models-table-card.tsx` — edit pencil → Link
- `apps/web/src/components/models/model-form-dialog.tsx` — remover modo edit (só create)
- `packages/server-core/src/routes/model-routes.ts` — expandir PUT, adicionar GET single
- `apps/web/src/lib/api-client/models.ts` — `getModelConfig()`

**Risco:** Médio-Alto — complexidade do dual-storage.

---

## Quadro de Decisões

Todas as perguntas abertas foram resolvidas. Decisões integradas nas seções relevantes acima.

### Bloqueantes

| # | Pergunta | Decisão |
|---|----------|---------|
| 1 | Formato de tool calls no banco | **A:** Explorar dados reais primeiro (`SELECT response FROM "LiteLLM_SpendLogs" LIMIT 5`), depois implementar parser baseado no formato real |
| 2 | Localização de tool results | **A:** Mesma abordagem — explorar dados reais, casado com Q1 |
| 3 | Completude de `messages` | **A:** Priorizar `messages` (se array), fallback → `proxy_server_request.messages`, fallback → "No messages" |
| 4 | Dual-storage sync: config vs DB | **A:** Config é source of truth para campos globais. Salvar no config, sincronizar config → DB |
| 5 | Unidades de custo no formulário | **A:** Usar `$/Mi` (padrão da indústria), converter para `$/token` ao salvar no DB |

### Importantes

| # | Pergunta | Decisão |
|---|----------|---------|
| 6 | Merge Models: onde? | **A:** Migrar completamente para `/models`. Remover de `/model-stats` |
| 7 | Merge Models: request count? | **A:** Não mostrar count na v1. Diálogo: "Merge all logs from X into Y?" |
| 8 | Agents: URL scheme | **B:** Adicionar campo `id` (slug/uuid) aos agents. Usar `/agents/:id` |
| 9 | Categories: campos editáveis | **B:** Essenciais + seção Advanced colapsável |
| 10 | Agents: fonte tools/skills | **C:** Freeform (tag input + toggle booleano), sem endpoint externo |
| 11 | Duplicate routes `/agent-catalog` | Consolidar em `agent-catalog-routes.ts`. Remover `config-routes.ts` |
| 12 | Models: `displayName` e `family` | **A:** Ambos editáveis na seção Global |
| 13 | Models: `thinking.levels` | **A:** Editável como multi-select/tag input |
| 14 | Models: Add Model dialog | **A:** Manter dialog de criação rápida, redirecionar para página de config após criar |

### Menores

| # | Pergunta | Decisão |
|---|----------|---------|
| 15 | Filtro global: URL sync? | **A:** Não sincronizar agora. SPA cobre 95% dos casos |
| 16 | Filtro custom: date params | **B:** Adicionar `startDate`/`endDate` aos endpoints de analytics |
| 17 | Logs: clique → navegar? | **A:** Navegação direta para `/logs/:requestId`, sem modal intermediário |
| 18 | Avg Tokens/s: média? | **B:** Média ponderada por `request_count` |
| 19 | Eficiência: fórmula? | **A:** `avgCostPer1kTokens = (total_spend / total_tokens) * 1000` |
| 20 | Column selector: onde? | **A:** Ícone de engrenagem no CardHeader da tabela |

---

## Plano de Implementação em Fases

### Fase 1: Baixo Risco, Fundação (1-3 dias)

1. [x] **Global: Conectar FilterContext às páginas** (Requisitos 1.1, 1.2)
2. [x] **Model Stats: Cards de métricas** (Requisitos 2.2)
   - Eficiência usar `(total_spend / total_tokens) * 1000` (Q19)
   - Avg Tokens/s usar média ponderada por request_count (Q18)
3. [x] **Model Stats: Remover seletor de colunas do header, realocar no CardHeader da tabela** (Requisitos 2.1.1, Q20)
4. [ ] **Agents: AlertDialog para confirmação de exclusão** (Requisito 4.1.3)
5. [ ] **Agents: Consolidar duplicate routes** (Q11)
   - Consolidar em `agent-catalog-routes.ts`, remover `config-routes.ts` e `agent-config-routes.ts`
   - Adicionar `syncGeneratedArtifacts()` no handler DELETE
   - Corrigir `GET /agent-catalog/:id` para responder `{ key, agent }`

### Fase 2: Médio Risco, Reestruturação (3-5 dias)

6. [ ] **Global: Sidebar shadcn/ui** (Requisito 1.4)
7. [ ] **Global: Modo "Personalizado" no filtro** (Requisito 1.3)
   - Propagar `startDate`/`endDate` aos endpoints de analytics (Q16)
   - Sem URL sync na v1 (Q15)
8. [ ] **Models: Página dedicada de config** (Requisitos 5.1, Q4, Q5, Q12, Q13)
   - Campos globais: `displayName` e `family` editáveis (Q12)
   - `thinking.levels` editável como multi-select (Q13)
   - Unidade: `$/Mi` no form, converter para `$/token` ao salvar no DB (Q5)
   - Sync: config é source of truth; push config → DB no save (Q4)
   - Manter dialog de criação rápida, redirecionar para página após criar (Q14)
9. [ ] **Models: Migrar Merge Models** (Requisitos 2.1.2, 5.3, Q6, Q7)
   - Remover completamente de `/model-stats`
   - Sem request count no diálogo de confirmação

### Fase 3: Alto Risco, Novas Features (5-8 dias)

9. [ ] **Logs: Explorar dados reais** (Q1-Q3, pré-requisito)
   - `SELECT response, messages, proxy_server_request FROM "LiteLLM_SpendLogs" WHERE response IS NOT NULL LIMIT 5`
   - Mapear formato de tool calls, tool results, completude de messages
   - Ajustar design do parser baseado nos dados reais
10. [ ] **Logs: Página dedicada + Chat Details tab** (Requisitos 3.1, 3.2)
    - Navegação direta `/logs/:requestId`, sem modal intermediário (Q17)
    - Parser de mensagens: priorizar `messages`, fallback `proxy_server_request.messages` (Q3)
11. [ ] **Logs: Metrics & Cost tab** (Requisito 3.3)
12. [ ] **Agents: Adicionar campo `id` ao schema** (Q8)
    - Gerar slugs para agents existentes a partir de `displayName`
    - Nova rota: `/agents/:id`
13. [ ] **Agents: Página dedicada + Add/Edit** (Requisitos 4.1.1, 4.1.2, 4.1.4, 4.1.5)
    - Model selector usa `GET /models/with-config`
14. [ ] **Agents: Tools, skills, opções avançadas** (Requisito 4.1.6)
    - Tools: toggle booleano (nome + switch); Skills: tag input freeform (Q10)
15. [ ] **Agents: Categories CRUD** (Requisito 4.2)
    - Seção General + seção Advanced colapsável (Q9)

### Fase 4: Polish & Bug Fixes (1-2 dias)

16. [ ] **Agents: Normalizar type inconsistencies**
   - `topP` vs `top_p` — padronizar camelCase
   - `AgentCatalogEntry.config` inline vs `SystemAgent.config` aninhado
   - Campo `enabledPlugins` — verificar se é legacy ou necessário
17. [ ] **Testes integrados e revisão**

---

## Estimativa Total de Esforço

| Fase                    | Dias           | Risco |
| ----------------------- | -------------- | ----- |
| Fase 1 (Fundação)       | 1-3            | Baixo |
| Fase 2 (Reestruturação) | 3-5            | Médio |
| Fase 3 (Novas Features) | 5-8            | Alto  |
| Fase 4 (Polish)         | 1-2            | Baixo |
| **Total**               | **10-18 dias** |       |

---

## Notas Técnicas Adicionais

### Stack e Dependências
- React 19 + Vite 7 + TypeScript (verbatimModuleSyntax, erasableSyntaxOnly)
- shadcn/ui (Tailwind 4, Radix primitives)
- Recharts (já instalado)
- TanStack Table (para data tables)
- TanStack Query (React Query v5 — data fetching)
- react-router-dom v7 (roteamento)
- Biome 2.x (format/lint)

### Convenções do Projeto
- Double quotes, 2-space indent, 80-char line width
- `import type` para type-only imports (verbatimModuleSyntax)
- Page-level architecture: hooks/types/utils em subdiretórios, JSX no root .tsx
- API client modular em `lib/api-client/`
- Backend queries via Prisma raw SQL (`$queryRawUnsafe`)

### Arquivos que NÃO devem ser modificados
- `biome.json` — regras de lint/format
- `@storage/output/` — artefatos gerados (read-only)
- `@models/models.jsonc`, `@agents/agents.jsonc` — source of truth (edit via managers)
- Schemas Zod gerados — não editar manualmente
