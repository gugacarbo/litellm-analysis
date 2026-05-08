# Plano: Agents Manager Genérico + Plugin Routing UI

## Objetivo

Refatorar o `agents-manager` para ser genérico (não acoplado ao oh-my-openagent),
com apenas o plugin `opencode` como built-in. Os demais plugins (openagent, vscode)
passam a ser plugins adicionais registráveis. Adicionar camada de routing configurável
e uma tela no web para gerenciar o roteamento de agentes → plugins.

## Decisões de Arquitetura

1. **Apenas `opencode` é built-in** — `openagent` e `vscode` são plugins adicionais
2. **Agentes são genéricos** — removido acoplamento a `AGENT_VERSIONS` hard-coded
3. **Routing layer** — mapeia agentes do sistema para plugins habilitados
4. **Config-driven** — versões e limites por agente vêm da configuração
5. **UI de Plugin Routing** — tela nova no web para configurar quais agentes roteiam para quais plugins

## Estrutura de Dados Nova

### SystemAgent (agente interno do sistema)
```typescript
interface SystemAgent {
  id: string;                          // "builder", "planner", "explore"
  displayName: string;                 // "Builder", "Planner"
  icon: string;                        // "🔧", "📋"
  description: string;                 // descrição do agente
  versions: AgentVersion[];            // versões configuráveis
  model: string;                       // modelo primário
  fallbackModels: string[];            // modelos de fallback
  enabledPlugins: string[];            // plugins habilitados ["opencode", "openagent"]
  config: AgentExtraConfig;            // config extra (mode, tools, permissions, etc.)
}

interface AgentVersion {
  id: string;                          // "v1", "latest", "stable"
  displayName: string;                 // "Latest", "Stable"
  modelIdStrategy: "model-name" | "prefix-version";  // como gerar o ID
  limits: {
    context: number;                   // limite de contexto
    output: number;                    // limite de output
  };
  cost?: {
    input: number;
    output: number;
  };
}

interface AgentExtraConfig {
  mode?: "subagent" | "primary" | "all";
  tools?: Record<string, boolean>;
  permissions?: Record<string, unknown>;
  color?: string;
  disable?: boolean;
  variant?: string;
  category?: string;
  skills?: string[];
  temperature?: number;
  topP?: number;
  prompt?: string;
  promptAppend?: string;
}
```

### PluginRoutingConfig (mapeamento)
```typescript
interface PluginRoutingConfig {
  version: number;
  plugins: {
    [pluginId: string]: {
      enabled: boolean;
      outputFile: string;              // caminho de saída
      agents: {
        [agentId: string]: {
          enabled: boolean;            // se este agente roteia para este plugin
          versionOverrides?: Partial<Record<string, AgentVersion>>;  // override por versão
        };
      };
    };
  };
  globalFallbackModel?: string;
}
```

### IPlugin (interface refatorada)
```typescript
interface IPlugin {
  readonly id: string;
  readonly name: string;
  readonly version: number;
  readonly builtin: boolean;          // NOVO: marca se é built-in

  transformAgent(agent: SystemAgent, version: AgentVersion, ctx: TransformContext): PluginEntry;
  transformModel(key: string, spec: ModelSpec): PluginModel | undefined;
  preprocess(config: DbConfig): unknown;
  buildOutput(agents: SystemAgent[], routing: PluginRoutingConfig, ctx: TransformContext): unknown;
  getOutputFile(): string;
  validate?(output: unknown): boolean;
}
```

---

## Fases de Implementação

### FASE 1 — Core: Tipos e Serviços (packages/agents-manager)

- [x] 1.1 Criar tipos novos em `packages/agents-manager/src/types/`
  - `system-agent.ts` — SystemAgent, AgentVersion, AgentExtraConfig
  - `routing.ts` — PluginRoutingConfig, PluginRoutingRule
  - `plugin-v2.ts` — IPlugin (com builtin flag, transformAgent genérico)
  - Atualizar `index.ts` barrel exports

- [x] 1.2 Criar `packages/agents-manager/src/services/agent-catalog.service.ts`
  - `IAgentCatalogService` — gerencia catálogo de SystemAgents
  - CRUD: getAll, get, create, update, delete
  - Persistência no `agents.json` (campo novo `systemAgents`)
  - Agentes padrão: builder, planner, explorer, reviewer, writer, architect

- [x] 1.3 Criar `packages/agents-manager/src/services/routing.service.ts`
  - `IRoutingService` — gerencia PluginRoutingConfig
  - CRUD: getRouting, updatePluginRouting, toggleAgentPlugin
  - Persistência no `agents.json` (campo novo `routing`)

- [x] 1.4 Refatorar `packages/agents-manager/src/plugins/plugin.ts`
  - Adicionar `builtin: boolean` na interface IPlugin
  - Adicionar `transformAgent(agent, version, ctx)` genérico
  - Adicionar `buildOutput(agents[], routing, ctx)` genérico
  - Manter backward compatibility com `transformEntry` e `buildOutput(config, ctx)`

- [x] 1.5 Refatorar `packages/agents-manager/src/plugins/builtins/opencode.plugin.ts`
  - Remover `AGENT_VERSIONS` hard-coded
  - Implementar `transformAgent(agent, version, ctx)` usando version config
  - Marcar `builtin: true`
  - `buildOutput` recebe lista de SystemAgents + routing

- [x] 1.6 Mover `openagent.plugin.ts` para `packages/agents-manager/src/plugins/external/`.plugin.ts` para `packages/agents-manager/src/plugins/external/`
  - Marcar `builtin: false`
  - Adaptar para nova interface
  - Remover `AGENT_VERSIONS` e usar version config

- [x] 1.7 Mover `vscode.plugin.ts` para `packages/agents-manager/src/plugins/external/`.plugin.ts` para `packages/agents-manager/src/plugins/external/`
  - Marcar `builtin: false`
  - Adaptar para nova interface

- [x] 1.8 Refatorar `packages/agents-manager/src/plugins/registry.ts`
  - `register()` continua igual
  - `exportAll()` usa nova interface buildOutput(agents[], routing, ctx)
  - `exportOne()` idem
  - `listBuiltins()` / `listExternal()` — novos métodos
  - `getRoutingConfig()` / `updateRoutingConfig()` — novos métodos

- [x] 1.9 Refatorar `packages/agents-manager/src/index.ts`
  - Exportar novos tipos e serviços
  - `createAgentsManager` cria AgentCatalogService e RoutingService
  - Builtins: apenas `OpenCodePlugin` registrado por padrão
  - External plugins: registrados explicitamente ou via config

- [x] 1.10 Atualizar `packages/agents-manager/src/config/defaults.ts`.ts`
  - Remover referências a openagent/vscode de DEFAULT_FILE_PATHS
  - Adicionar DEFAULT_SYSTEM_AGENTS (builder, planner, explorer, etc.)
  - Adicionar DEFAULT_ROUTING_CONFIG

**Arquivos:**
- `packages/agents-manager/src/types/system-agent.ts` (NOVO)
- `packages/agents-manager/src/types/routing.ts` (NOVO)
- `packages/agents-manager/src/types/plugin-v2.ts` (NOVO)
- `packages/agents-manager/src/types/index.ts` (NOVO)
- `packages/agents-manager/src/services/agent-catalog.service.ts` (NOVO)
- `packages/agents-manager/src/services/routing.service.ts` (NOVO)
- `packages/agents-manager/src/plugins/plugin.ts` (MODIFICAR)
- `packages/agents-manager/src/plugins/registry.ts` (MODIFICAR)
- `packages/agents-manager/src/plugins/builtins/opencode.plugin.ts` (MODIFICAR)
- `packages/agents-manager/src/plugins/external/openagent.plugin.ts` (NOVO - mover)
- `packages/agents-manager/src/plugins/external/vscode.plugin.ts` (NOVO - mover)
- `packages/agents-manager/src/plugins/builtins/index.ts` (MODIFICAR)
- `packages/agents-manager/src/plugins/external/index.ts` (NOVO)
- `packages/agents-manager/src/plugins/index.ts` (MODIFICAR)
- `packages/agents-manager/src/index.ts` (MODIFICAR)
- `packages/agents-manager/src/config/defaults.ts` (MODIFICAR)

### FASE 2 — API Contracts + Server Routes

- [x] 2.1 Criar tipos de API em `packages/api-contracts/src/agent-catalog.ts` em `packages/api-contracts/src/agent-catalog.ts`
  - `SystemAgentDTO`, `AgentVersionDTO`, `PluginRoutingDTO`
  - `PluginInfoDTO` (id, name, builtin, enabled)
  - `AgentCatalogResponse`, `RoutingConfigResponse`
  - Atualizar barrel exports

- [x] 2.2 Criar rotas em `packages/server-core/src/routes/agent-catalog-routes.ts`-routes.ts`
  - `GET /agent-catalog` — lista todos os SystemAgents
  - `GET /agent-catalog/:id` — detalha um agente
  - `POST /agent-catalog` — cria agente
  - `PUT /agent-catalog/:id` — atualiza agente
  - `DELETE /agent-catalog/:id` — remove agente

- [x] 2.3 Criar rotas em `packages/server-core/src/routes/plugin-routing-routes.ts`-routes.ts`
  - `GET /plugin-routing` — retorna routing config completo
  - `PUT /plugin-routing` — atualiza routing config
  - `PATCH /plugin-routing/:pluginId/agents/:agentId` — toggle agente↔plugin
  - `GET /plugin-routing/plugins` — lista plugins disponíveis (builtin + external)

- [x] 2.4 Atualizar `packages/server-core/src/routes/index.ts`.ts`
  - Registrar novas rotas: `registerAgentCatalogRoutes`, `registerPluginRoutingRoutes`

- [x] 2.5 Atualizar `packages/server-core/src/routes/agent-definitions-routes.ts`-routes.ts`
  - Remover AGENT_METADATA e CATEGORY_METADATA hard-coded
  - Ler metadados do AgentCatalogService

- [x] 2.6 Atualizar `packages/server-core/src/orchestration/artifact-service.ts`.ts`
  - `syncGeneratedArtifacts()` usa novo registry com agents[] + routing
  - Chama `registry.exportAll()` que agora recebe SystemAgents + routing

**Arquivos:**
- `packages/api-contracts/src/agent-catalog.ts` (NOVO)
- `packages/api-contracts/src/index.ts` (MODIFICAR)
- `packages/server-core/src/routes/agent-catalog-routes.ts` (NOVO)
- `packages/server-core/src/routes/plugin-routing-routes.ts` (NOVO)
- `packages/server-core/src/routes/index.ts` (MODIFICAR)
- `packages/server-core/src/routes/agent-definitions-routes.ts` (MODIFICAR)
- `packages/server-core/src/orchestration/artifact-service.ts` (MODIFICAR)

### FASE 3 — Web: API Client + Query Hooks

- [x] 3.1 Criar API client em `apps/web/src/lib/api-client/agent-catalog.ts`
  - `getAgentCatalog()` — GET /agent-catalog
  - `getAgentCatalogItem(id)` — GET /agent-catalog/:id
  - `createAgentCatalogItem(data)` — POST /agent-catalog
  - `updateAgentCatalogItem(id, data)` — PUT /agent-catalog/:id
  - `deleteAgentCatalogItem(id)` — DELETE /agent-catalog/:id

- [x] 3.2 Criar API client em `apps/web/src/lib/api-client/plugin-routing.ts`
  - `getPluginRouting()` — GET /plugin-routing
  - `updatePluginRouting(config)` — PUT /plugin-routing
  - `toggleAgentPlugin(pluginId, agentId)` — PATCH /plugin-routing/:pluginId/agents/:agentId
  - `getAvailablePlugins()` — GET /plugin-routing/plugins

- [x] 3.3 Criar React Query hooks em `apps/web/src/hooks/use-agent-catalog.ts`
  - `useAgentCatalog()` — lista de agentes
  - `useAgentCatalogItem(id)` — agente específico
  - `useCreateAgent()` — mutation
  - `useUpdateAgent()` — mutation
  - `useDeleteAgent()` — mutation

- [x] 3.4 Criar React Query hooks em `apps/web/src/hooks/use-plugin-routing.ts`
  - `usePluginRouting()` — routing config
  - `useUpdatePluginRouting()` — mutation
  - `useToggleAgentPlugin()` — mutation
  - `useAvailablePlugins()` — lista de plugins

- [x] 3.5 Atualizar `apps/web/src/lib/query-keys.ts`
  - Adicionar: `agentCatalog`, `pluginRouting`, `availablePlugins`

**Arquivos:**
- `apps/web/src/lib/api-client/agent-catalog.ts` (NOVO)
- `apps/web/src/lib/api-client/plugin-routing.ts` (NOVO)
- `apps/web/src/hooks/use-agent-catalog.ts` (NOVO)
- `apps/web/src/hooks/use-plugin-routing.ts` (NOVO)
- `apps/web/src/lib/query-keys.ts` (MODIFICAR)

### FASE 4 — Web: Tela de Agent Catalog

- [x] 4.1 Criar página `apps/web/src/pages/agent-catalog.tsx`
  - Layout: grid de cards com agentes do sistema
  - Card mostra: nome, ícone, descrição, modelo primário, versões, plugins habilitados
  - Botão "Novo Agente" para criar
  - Cada card com botão "Editar" e "Excluir"

- [x] 4.2 Criar hook de página `apps/web/src/pages/agent-catalog/use-agent-catalog-page.ts`
  - State: agents list, loading, error
  - Actions: create, update, delete
  - Derived: sorted agents, grouped by category

- [x] 4.3 Criar componentes em `apps/web/src/components/agent-catalog/`
  - `agent-catalog-grid.tsx` — grid de cards
  - `agent-catalog-card.tsx` — card individual do agente
  - `agent-catalog-form.tsx` — formulário de criação/edição (dialog)
  - `agent-version-editor.tsx` — editor de versões do agente
  - `agent-catalog-types.ts` — tipos dos componentes

- [x] 4.4 Adicionar rota em `apps/web/src/App.tsx`
  - `/agent-catalog` → AgentCatalogPage

- [x] 4.5 Adicionar item no sidebar `apps/web/src/components/layout/sidebar.tsx`
  - "Agent Catalog" com ícone

**Arquivos:**
- `apps/web/src/pages/agent-catalog.tsx` (NOVO)
- `apps/web/src/pages/agent-catalog/use-agent-catalog-page.ts` (NOVO)
- `apps/web/src/components/agent-catalog/agent-catalog-grid.tsx` (NOVO)
- `apps/web/src/components/agent-catalog/agent-catalog-card.tsx` (NOVO)
- `apps/web/src/components/agent-catalog/agent-catalog-form.tsx` (NOVO)
- `apps/web/src/components/agent-catalog/agent-version-editor.tsx` (NOVO)
- `apps/web/src/components/agent-catalog/agent-catalog-types.ts` (NOVO)
- `apps/web/src/App.tsx` (MODIFICAR)
- `apps/web/src/components/layout/sidebar.tsx` (MODIFICAR)

### FASE 5 — Web: Tela de Plugin Routing

- [x] 5.1 Criar página `apps/web/src/pages/plugin-routing.tsx`
  - Layout: lista de plugins (cards) com toggle enable/disable
  - Dentro de cada plugin: grid de agentes com toggle on/off
  - Indicador visual: builtin badge vs external badge
  - Botão "Registrar Plugin" para adicionar plugins externos

- [x] 5.2 Criar hook de página `apps/web/src/pages/plugin-routing/use-plugin-routing-page.ts`
  - State: routing config, available plugins, loading, error
  - Actions: togglePlugin, toggleAgentPlugin, registerPlugin, unregisterPlugin
  - Derived: enabled plugins, disabled plugins, routing matrix

- [x] 5.3 Criar componentes em `apps/web/src/components/plugin-routing/`
  - `plugin-routing-grid.tsx` — grid de plugins
  - `plugin-card.tsx` — card de plugin com toggle e lista de agentes
  - `plugin-agent-toggle.tsx` — toggle individual agente↔plugin
  - `plugin-register-dialog.tsx` — dialog para registrar novo plugin
  - `routing-matrix.tsx` — visualização matrix agentes × plugins
  - `plugin-routing-types.ts` — tipos dos componentes

- [x] 5.4 Adicionar rota em `apps/web/src/App.tsx`
  - `/plugin-routing` → PluginRoutingPage

- [x] 5.5 Adicionar item no sidebar
  - "Plugin Routing" com ícone

**Arquivos:**
- `apps/web/src/pages/plugin-routing.tsx` (NOVO)
- `apps/web/src/pages/plugin-routing/use-plugin-routing-page.ts` (NOVO)
- `apps/web/src/components/plugin-routing/plugin-routing-grid.tsx` (NOVO)
- `apps/web/src/components/plugin-routing/plugin-card.tsx` (NOVO)
- `apps/web/src/components/plugin-routing/plugin-agent-toggle.tsx` (NOVO)
- `apps/web/src/components/plugin-routing/plugin-register-dialog.tsx` (NOVO)
- `apps/web/src/components/plugin-routing/routing-matrix.tsx` (NOVO)
- `apps/web/src/components/plugin-routing/plugin-routing-types.ts` (NOVO)
- `apps/web/src/App.tsx` (MODIFICAR)
- `apps/web/src/components/layout/sidebar.tsx` (MODIFICAR)

### FASE 6 — Migração e Backward Compatibility

- [x] 6.1 Criar migration layer em `packages/agents-manager/src/migration/`
  - `migrate-v1-to-v2.ts` — converte formato antigo (agents/categories flat) para novo (systemAgents + routing)
  - Preserva dados existentes
  - Gera routing config padrão baseado nos plugins atuais

- [x] 6.2 Atualizar `packages/agents-manager/src/repository/client.ts`
  - Na leitura: se formato v1, executa migration automática
  - Na escrita: sempre usa formato v2

- [x] 6.3 Atualizar página existente `agent-routing.tsx`
  - Adaptar para usar novos tipos (SystemAgent em vez de AgentDefinition)
  - Manter funcionalidade existente enquanto migra

- [x] 6.4 Atualizar `packages/api-contracts/src/agent-routing.ts`
  - Remover `AGENT_DEFINITIONS` e `CATEGORY_DEFINITIONS` hard-coded
  - Esses dados agora vêm do AgentCatalogService via API

- [x] 6.5 Atualizar `packages/server-core/src/routes/agent-definitions-routes.ts`
  - Remover `AGENT_METADATA` e `CATEGORY_METADATA` hard-coded
  - Ler metadados do AgentCatalogService

- [x] 6.6 Atualizar testes existentes
  - Adaptar mocks para novo formato
  - Adicionar testes para novos serviços

**Arquivos:**
- `packages/agents-manager/src/migration/migrate-v1-to-v2.ts` (NOVO)
- `packages/agents-manager/src/migration/index.ts` (NOVO)
- `packages/agents-manager/src/repository/client.ts` (MODIFICAR)
- `apps/web/src/pages/agent-routing.tsx` (MODIFICAR)
- `packages/api-contracts/src/agent-routing.ts` (MODIFICAR)
- `packages/server-core/src/routes/agent-definitions-routes.ts` (MODIFICAR)

### FASE 7 — Verificação Técnica

- [x] 7.1 Typecheck completo: `pnpm typecheck`
- [x] 7.2 Lint: `pnpm lint`
- [x] 7.3 Build: `pnpm build`
- [x] 7.4 Testes: `pnpm test`
- [x] 7.5 Smoke test manual: `pnpm dev`
  - Validar CRUD de agentes no catalog
  - Validar routing config
  - Validar geração de arquivos de output
  - Validar backward compatibility com dados existentes

---

## Agentes Padrão do Sistema

```typescript
const DEFAULT_SYSTEM_AGENTS: SystemAgent[] = [
  {
    id: "builder",
    displayName: "Builder",
    icon: "🔧",
    description: "Agente padrão — execução geral de tarefas e construção",
    versions: [
      { id: "latest", displayName: "Latest", modelIdStrategy: "model-name", limits: { context: 200000, output: 32768 } },
      { id: "stable", displayName: "Stable", modelIdStrategy: "model-name", limits: { context: 200000, output: 32768 } },
    ],
    model: "",
    fallbackModels: [],
    enabledPlugins: ["opencode"],
    config: { mode: "all" },
  },
  {
    id: "planner",
    displayName: "Planner",
    icon: "📋",
    description: "Modo planejamento — sem ferramentas de edição",
    versions: [
      { id: "latest", displayName: "Latest", modelIdStrategy: "model-name", limits: { context: 200000, output: 32768 } },
    ],
    model: "",
    fallbackModels: [],
    enabledPlugins: ["opencode"],
    config: { mode: "subagent" },
  },
  {
    id: "explorer",
    displayName: "Explorer",
    icon: "🔍",
    description: "Explorador — navega e mapeia a base de código",
    versions: [
      { id: "latest", displayName: "Latest", modelIdStrategy: "model-name", limits: { context: 200000, output: 32768 } },
    ],
    model: "",
    fallbackModels: [],
    enabledPlugins: ["opencode"],
    config: { mode: "subagent" },
  },
  {
    id: "reviewer",
    displayName: "Reviewer",
    icon: "✅",
    description: "Revisor — auditoria de qualidade e consistência",
    versions: [
      { id: "latest", displayName: "Latest", modelIdStrategy: "model-name", limits: { context: 200000, output: 32768 } },
    ],
    model: "",
    fallbackModels: [],
    enabledPlugins: ["opencode"],
    config: { mode: "subagent" },
  },
  {
    id: "architect",
    displayName: "Architect",
    icon: "🏛️",
    description: "Arquiteto — decisões de arquitetura e design",
    versions: [
      { id: "latest", displayName: "Latest", modelIdStrategy: "model-name", limits: { context: 200000, output: 32768 } },
    ],
    model: "",
    fallbackModels: [],
    enabledPlugins: ["opencode"],
    config: { mode: "subagent" },
  },
  {
    id: "writer",
    displayName: "Writer",
    icon: "✍️",
    description: "Escritor — documentação, textos e prosa técnica",
    versions: [
      { id: "latest", displayName: "Latest", modelIdStrategy: "model-name", limits: { context: 200000, output: 32768 } },
    ],
    model: "",
    fallbackModels: [],
    enabledPlugins: ["opencode"],
  },
];
```

## Routing Padrão

```typescript
const DEFAULT_ROUTING: PluginRoutingConfig = {
  version: 1,
  plugins: {
    opencode: {
      enabled: true,
      outputFile: "opencode.json",
      agents: {},  // todos os agentes habilitados por padrão (builtin)
    },
    openagent: {
      enabled: false,
      outputFile: "oh-my-openagent.json",
      agents: {},
    },
    vscode: {
      enabled: false,
      outputFile: "vscode-oaicopilot.json",
      agents: {},
    },
  },
};
```

## Critérios de Aceite

1. Apenas `opencode` é built-in; `openagent` e `vscode` são plugins registráveis
2. `AGENT_VERSIONS` hard-coded removido — versões vêm da config do agente
3. `AGENT_METADATA` e `CATEGORY_METADATA` hard-coded removidos — dados vêm do catalog
4. `AGENT_DEFINITIONS` e `CATEGORY_DEFINITIONS` hard-coded removidos — dados vêm da API
5. Tela "Agent Catalog" funcional com CRUD de agentes
6. Tela "Plugin Routing" funcional com toggle agente↔plugin
7. Dados existentes migram automaticamente (v1 → v2)
8. `typecheck`, `lint`, `build`, `test` passando
9. Arquivos de output continuam sendo gerados corretamente
10. Página existente "agent-routing" funciona com novos tipos

## Riscos e Mitigações

1. **Risco**: Migração de dados v1→v2 pode perder configs customizadas
   - Mitigação: migration automática preserva todos os dados; backup antes de escrever
2. **Risco**: Quebrar página agent-routing existente
   - Mitigação: tipos novos são superset dos antigos; backward compat layer
3. **Risco**: Plugins externos não registrados = arquivos de output não gerados
   - Mitigação: migration registra plugins atuais automaticamente; UI mostra aviso
4. **Risco**: Performance com muitos agentes × plugins
   - Mitigação: routing config é pequeno (< 100 entradas); React Query cache

## Estimativa

| Fase | Esforço | Descrição |
|------|---------|-----------|
| 1 | 3 dias | Core: tipos, serviços, refatoração de plugins |
| 2 | 1.5 dias | API contracts + server routes |
| 3 | 1 dia | Web: API client + hooks |
| 4 | 2 dias | Web: tela Agent Catalog |
| 5 | 2 dias | Web: tela Plugin Routing |
| 6 | 1.5 dias | Migração + backward compatibility |
| 7 | 1 dia | Verificação técnica |
| **Total** | **~12 dias** | Execução completa |
