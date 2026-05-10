# Spec: agents-manager — Correções e Refatoração

## Objetivo

Corrigir problemas arquiteturais, de tipagem e de qualidade no pacote `@lite-llm/agents-manager` e sua integração com `@lite-llm/agents-repository` e `@lite-llm/server-core`. Implementar o novo fluxo de plugins com agentes internos, configuração por plugin, e roteamento de agentes/categorias.

---

## Problemas Encontrados

### P1 — Instanciação por request (Singleton ausente)

**Onde:** `packages/server-core/src/routes/` e `packages/server-core/src/orchestration/`

**Problema:** `createAgentsManager()` é chamado dentro de **cada request handler** (13+ locais). Cada chamada cria um novo `AgentsRepository` (que abre e lê o arquivo JSONC do disco) + 5 Services + 1 PluginRegistry com plugins registrados. Em endpoints PUT/DELETE, é chamado **duas vezes** na mesma request (uma para o service, outra para o registry).

**Arquivos afetados:**
- `server-core/routes/agent-config/config-routes.ts` (4x createAgentsManager)
- `server-core/routes/agent-catalog-routes.ts` (5x)
- `server-core/routes/category-catalog-routes.ts` (5x)
- `server-core/routes/plugin-routing-routes.ts` (3x)
- `server-core/orchestration/artifact-service.ts` (1x)
- `server-core/orchestration/alias-service.ts` (1x)
- `server/runtime/app-runtime.ts` (1x — resultado não armazenado)

**Impacto:** I/O redundante de disco em toda request. Race condition potencial quando duas requests escrevem ao mesmo tempo (cada instanciação lê o arquivo independentemente → last-write-wins sem locking).

---

### P2 — Tipos duplicados entre agents-repository e agents-manager

**Onde:** `repositories/agents-repository/src/schema.ts` vs `packages/agents-manager/src/types/`

**Problema:** `SystemAgent`, `AgentVersion`, `AgentExtraConfig`, `PluginRoutingConfig`, `PluginRoutingRule` são definidos manualmente em `agents-manager/src/types/` E gerados via Zod em `agents-repository/src/schema.ts`. Podem divergir silenciosamente.

**Exemplo de divergência potencial:**
- `agents-repository/schema.ts` `systemAgentSchema` define `id` como `z.string().optional()`
- `agents-manager/types/system-agent.ts` define `id` como `string` (required)

---

### P3 — Type casting inseguro no RoutingService

**Onde:** `packages/agents-manager/src/services/routing.service.ts` linhas 28-33, 36-46

**Problema:** Casts `as unknown as PluginRoutingConfig` e `as Record<string, unknown>` para contornar incompatibilidade entre `DbConfig` (do repository) e `PluginRoutingConfig` (local). Se o schema mudar, a compilação continua mas runtime quebra.

```typescript
// routing.service.ts:28-33
async getConfig(): Promise<PluginRoutingConfig> {
  const config = (await this.repository.read()) as DbConfig;
  return (config.routing ?? { ... }) as unknown as PluginRoutingConfig;
}
```

---

### P4 — validateOnRead desabilitado

**Onde:** `packages/agents-manager/src/repository/client.ts` linha 25

**Problema:** `validateOnRead: false` no `createRepositoryClient`. Dados malformados no JSONC passam silenciosamente na leitura, causando erros imprevisíveis nos services.

---

### P5 — Plugin v2 exportOne com dados stub

**Onde:** `packages/agents-manager/src/plugins/registry.ts` linhas 69-84

**Problema:** Quando `buildOutputV2` existe, o registry monta `SystemAgent[]` com campos hardcoded:

```typescript
const agents = Object.values(config.agents).map((entry) => ({
  id: "",
  displayName: "",
  icon: "",
  description: entry.description ?? "",
  versions: [],
  model: entry.model,
  fallbackModels: entry.fallbackModels ?? [],
  enabledPlugins: [],
  config: {},
}));
```

E passa routing vazio: `{ version: 1, plugins: {} }`. O resultado é que `buildOutputV2` do OpenCodePlugin nunca recebe dados reais de systemAgents ou routing.

---

### P6 — OpenAgentPlugin com modelo hardcoded

**Onde:** `packages/agents-manager/src/plugins/external/openagent.plugin.ts` linha 48

**Problema:** `transformEntry` usa `gpt-5.5` fixo como modelo ao invés de usar `entry.model` ou resolver via context.

```typescript
result.model = `${ctx.entryKey}/gpt-5.5`;
```

---

### P7 — OpenCodePlugin.buildOutput ignora categories com entradas vazias

**Onde:** `packages/agents-manager/src/plugins/builtins/opencode.plugin.ts` linha 137

**Problema:** `if (Object.keys(entry).length === 0) continue;` pula categories que existem mas estão vazias. Categories válidas com apenas campos opcionais ausentes são tratadas como "vazias" incorretamente.

---

### P8 — DEFAULT_FILE_PATHS e getFilePaths() não utilizados

**Onde:** `packages/agents-manager/src/config/defaults.ts` linhas 9-25

**Problema:** `DEFAULT_FILE_PATHS` e `getFilePaths()` são exportados mas não consumidos por nenhum service, plugin ou consumer. Código morto.

---

### P9 — Cobertura de testes quase inexistente

**Onde:** `packages/agents-manager/src/`

**Problema:** Apenas 2 test files existem:
- `repository/client.test.ts` — 2 testes (fallback .json/.jsonc)
- `services/__tests__/routing.service.test.ts` — 3 testes (syncAliases)

**Sem testes para:**
- AgentService (6 métodos)
- CategoryService (6 métodos)
- ModelService (7 métodos)
- AgentCatalogService (6 métodos)
- PluginRegistry (8 métodos, incluindo exportOne com lógica v1/v2)
- OpenCodePlugin (buildOutput, buildOutputV2, transformAgent, transformModel)
- OpenAgentPlugin (buildOutput, transformEntry)
- VsCodePlugin (buildOutput, transformModel)

---

### P10 — setupAgentsManager no server não usa o retorno

**Onde:** `apps/server/src/runtime/app-runtime.ts` linhas 41-46

**Problema:** `setupAgentsManager()` chama `createAgentsManager()` mas descarta o resultado. A função não faz nada útil — o dbPath é passado mas o `DEFAULT_DB_PATH` (`@storage/agents.jsonc`) é diferente do path passado aqui (`@settings/agents.json`).

---

## Como os Plugins Funcionam (Estado Atual)

### Ciclo de vida

```
1. Registro
   createAgentsManager() → new PluginRegistry()
   registry.register(new OpenCodePlugin())  // único builtin

2. Consumo via server-core (por request)
   createAgentsManager()  // nova instância a cada chamada!
   → services.routing.toggleAgentPlugin(pluginId, agentId)
   → registry.exportAll()

3. Exportação (exportAll / exportOne)
   Para cada plugin registrado:
     a. repository.read() → DbConfig completo
     b. buildContext(config) → TransformContext (models, litellm, resolvedModels)
     c. Se plugin.buildOutputV2 existe:
        - Monta SystemAgent[] stub (vazio: id="", displayName="", versions=[])
        - Passa routing vazio {}
        - Chama plugin.buildOutputV2(stubAgents, {}, ctx)
     d. Senão (legacy):
        - Chama plugin.buildOutput(config, ctx)
     e. Se plugin.validate existe → valida output
     f. Escreve JSON em data/{outputFile} (atomic: write .tmp → rename)
```

### Interface IPlugin

```typescript
interface IPlugin {
  // Identidade
  id: string;
  name: string;
  version: number;
  builtin?: boolean;

  // V2 (opcional — apenas OpenCodePlugin implementa)
  transformAgent?(agent: SystemAgent, version: AgentVersion, ctx): PluginEntry;
  buildOutputV2?(agents: SystemAgent[], routing: PluginRoutingConfig, ctx): unknown;

  // Legacy (todos implementam)
  transformEntry(entry: AgentEntry | CategoryEntry, ctx): PluginEntry;
  transformModel(key: string, spec: ModelSpec): PluginModel | undefined;
  preprocess(config: DbConfig): unknown;
  buildOutput(config: DbConfig, ctx: TransformContext): unknown;
  getOutputFile(): string;
  validate?(output: unknown): boolean;
}
```

### Plugins implementados

| Plugin | ID | Tipo | Arquivo de saída | Usa v2? | validate? |
|--------|----|------|-------------------|---------|-----------|
| OpenCodePlugin | `opencode` | builtin | `opencode.json` | Sim | Não |
| OpenAgentPlugin | `openagent` | external | `oh-my-openagent.json` | Não | Não |
| VsCodePlugin | `vscode` | external | `vscode-oaicopilot.json` | Não | Não |

### OpenCodePlugin (builtin)

- **buildOutput (legacy):** Cria provider `litellm` com todos os models + um provider por agent/category com seus models
- **buildOutputV2:** Recebe SystemAgent[] mas com dados stub → nunca funciona corretamente
- **transformAgent:** Monta estrutura de provider para um agent+version específico (usado pelo buildOutputV2)
- **transformEntry (legacy):** Retorna provider com npm + options + models (todos os models, não só os do entry)

### OpenAgentPlugin (external)

- **buildOutput:** Estrutura com `$schema`, `globalFallbackModel`, `git_master`, `agents`, `categories`
- **transformEntry:** Copia campos do entry, MAS hardcoda `model` como `{entryKey}/gpt-5.5`
- **transformModel:** Retorna `undefined` (não exporta models separadamente)
- **Não é registrado automaticamente** — precisa ser registrado manualmente no registry

### VsCodePlugin (external)

- **buildOutput:** Lista de models para o OAICopilot do VS Code
- **transformEntry:** Retorna `{}` vazio (só exporta models, não agents)
- **baseUrl** limpa `/v1` do litellm URL
- **Não é registrado automaticamente**

### Registro e Exportação

- Apenas `OpenCodePlugin` é registrado automaticamente (builtin)
- `OpenAgentPlugin` e `VsCodePlugin` são exportados no `index.ts` do agents-manager mas **nunca registrados** em lugar nenhum
- `artifact-service.syncGeneratedArtifacts()` chama `registry.exportAll()` — mas o registry só tem o OpenCodePlugin
- As routes de plugin-routing expõem `registry.list()` que só mostra o plugin builtin

---

## Decisões

### D1 — Injeção via RouteOptions (não singleton)

`createAgentsManager()` é chamado **uma vez** no `app-runtime.ts`. A instância é injetada via `RouteOptions` para todas as routes e passada para funções de orquestração.

**Impacto:** `RouteOptions` ganha campo `agentsManager`. Todas as 6 funções de rota em `server-core` param de chamar `createAgentsManager()` internamente. `alias-service` e `artifact-service` recebem o manager como parâmetro.

### D2 — Zod passthrough, validateOnRead default false

Mudar `dbConfigSchema` no agents-repository para usar `.passthrough()`. Isso permite campos extras no JSONC sem quebrar a validação. `validateOnRead` permanece `false` por padrão.

**Impacto:** Mudança no `repositories/agents-repository/src/schema.ts` — adicionar `.passthrough()` ao `dbConfigSchema`.

### D3 — Ativação de plugins via UI, persistido no agents.json

Cada plugin tem um switch na web UI (`/plugins`). O estado (enabled/disabled) é persistido no `agents.jsonc` em `routing.plugins.{id}.enabled`. O `PluginRegistry` lê essa config e registra apenas plugins habilitados.

### D4 — Completar v2, remover tudo legacy

Remover `transformEntry`, `transformModel`, `preprocess`, `buildOutput` (legacy) da interface `IPlugin`. Interface unificada `buildOutput(agents, routing, ctx)`. Migrar todos os plugins.

### D5 — Agentes internos por plugin

Cada plugin define seus próprios agentes internos (ex: OpenCode tem "coder", "planner", "explorer"). O usuário mapeia os `SystemAgent` do app para os agentes internos do plugin via UI.

**Schema por plugin:**
```typescript
interface PluginConfig {
  enabled: boolean;
  outputFile: string;
  config: Record<string, unknown>;  // opções específicas do plugin
  agentMappings: Record<string, string>;  // systemAgentId → internalAgentId
  categoryMappings: Record<string, boolean>;  // categoryId → enabled
}
```

**Onde vivem os agentes internos:** Cada plugin exporta `getInternalAgents(): InternalAgent[]` com as definições. O registry expõe isso via API para a UI montar a tela de mapeamento.

### D6 — Página de configuração por plugin (`/plugins/:pluginId`)

Cada plugin tem uma página individual com:
1. **Opções específicas do plugin** — credenciais, preferências, comportamentos (definidas pelo plugin via `getConfigSchema()`)
2. **Roteamento de agentes** — dropdowns/tabela mapeando SystemAgents → agentes internos do plugin
3. **Categorias** — checkboxes para habilitar/desabilitar quais categorias o plugin exporta

### D7 — Migração limpa, sem legacy

Sem backward-compat. Schema do routing.plugins.{id} é reconstruído com os novos campos (`config`, `agentMappings`, `categoryMappings`). Serviços não implementam fallbacks. Código legacy (v1 dos plugins, `transformEntry`, `preprocess`, `buildOutput` antigo) é removido, não deprecated.

### D8 — OpenAgentPlugin em produção

Registrado como plugin de primeira classe, igual ao OpenCode. Agentes internos definidos durante implementação.

---

## Visão-Alvo: Fluxo Completo

### Tela /agents

```
/agents (SystemAgent CRUD — já existe parcialmente como agent-routing)
├── Aba "Agents" — lista, create, edit, delete de SystemAgent
│   └── Cada agent: id, displayName, icon, description, versions[], model, fallbackModels, config
└── Aba "Categories" (nova) — lista, create, edit, delete de CategoryEntry
    └── Cada category: model, fallbackModels, description, thinking, reasoningEffort, etc.
```

### Tela /plugins (já existe parcialmente)

```
/plugins — lista de cards, um por plugin
├── PluginCard
│   ├── Nome do plugin + badge (Built-in/External)
│   ├── Switch enable/disable (persiste em routing.plugins.{id}.enabled)
│   ├── Contador: X agents / Y categorias
│   └── Botão "Configure" → /plugins/:pluginId
```

### Tela /plugins/:pluginId (nova — página de configuração por plugin)

```
/plugins/opencode
├── Seção 1: Plugin Options
│   └── Campos dinâmicos gerados a partir de plugin.getConfigSchema()
│       Ex: baseUrl, apiKey, timeout, preferências específicas
│
├── Seção 2: Agent Routing
│   └── Tabela/lista:
│       SystemAgent (esquerda) → dropdown → InternalAgent (direita)
│       ┌─────────────────────┬──────────────────────┐
│       │ builder (app agent) │ [▼ coder           ] │
│       │ planner             │ [▼ planner          ] │
│       │ explorer            │ [▼ explorer         ] │
│       │ reviewer            │ [▼ reviewer         ] │
│       │ architect           │ [▼ — none —         ] │
│       └─────────────────────┴──────────────────────┘
│       Internal agents do plugin: getInternalAgents()
│       → coder, planner, explorer, reviewer, writer
│
└── Seção 3: Category Export
    └── Checkboxes por categoria:
        ☑ Development    ☐ Writing    ☑ Architecture    ☐ Analysis
```

### Fluxo de dados

```
agents.jsonc
├── systemAgents: Record<string, SystemAgent>          ← CRUD via /agents
├── categories: Record<string, CategoryEntry>          ← CRUD via /agents (tab categories)
├── models: Record<string, ModelSpec>                  ← models do LiteLLM
├── litellm: { baseUrl, apiKey }                       ← credenciais LiteLLM
└── routing: PluginRoutingConfig
    └── plugins: {
          opencode: {
            enabled: true,
            outputFile: "opencode.json",
            config: { ... },           ← opções específicas do plugin
            agentMappings: {           ← SystemAgent → InternalAgent
              "builder": "coder",
              "planner": "planner",
              "explorer": "explorer"
            },
            categoryMappings: {        ← Category → enabled/disabled
              "development": true,
              "writing": false
            }
          },
          openagent: { enabled: false, ... },
          vscode: { enabled: true, ... }
        }
```

---

## Visão-Alvo: Nova Arquitetura de Plugins

### Nova Interface IPlugin

```typescript
interface InternalAgent {
  id: string;           // "coder", "planner", "explorer"
  displayName: string;  // "Coder", "Planner", "Explorer"
  description: string;  // "General-purpose coding agent"
}

interface ConfigField {
  key: string;
  type: "string" | "number" | "boolean" | "select" | "password";
  label: string;
  required?: boolean;
  default?: unknown;
  options?: { value: string; label: string }[];  // para type "select"
  placeholder?: string;
  description?: string;
}

interface IPlugin {
  readonly id: string;             // "opencode", "openagent", "vscode"
  readonly name: string;           // "OpenCode AI SDK"
  readonly version: number;

  // Agentes internos definidos pelo plugin
  getInternalAgents(): InternalAgent[];

  // Schema de configuração — gera o formulário dinâmico no UI
  getConfigSchema(): ConfigField[];

  // Gera o output completo do plugin para escrita em disco
  buildOutput(
    agents: SystemAgent[],           // todos os systemAgents do app
    routing: PluginRoutingConfig,    // routing config completo
    ctx: TransformContext,           // models + litellm config
  ): unknown;

  // Caminho do arquivo de saída (relativo ao outputDir)
  getOutputFile(): string;

  // Validação opcional do output gerado
  validate?(output: unknown): boolean;
}
```

### Novo TransformContext

```typescript
interface TransformContext {
  allModels: Record<string, ModelSpec>;
  globalFallbackModel?: string;
  litellmConfig: { baseUrl: string; apiKey: string };
}
```

### PluginRegistry expandido

```typescript
interface IPluginRegistry {
  // Registro de plugins
  register(plugin: IPlugin): void;
  unregister(pluginId: string): void;
  get(pluginId: string): IPlugin | undefined;
  list(): IPlugin[];

  // Ativação por config
  loadFromConfig(routing: PluginRoutingConfig): void;

  // Exportação
  exportAll(): Promise<void>;
  exportOne(pluginId: string): Promise<void>;

  // Acesso a agentes internos (para UI)
  getInternalAgents(pluginId: string): InternalAgent[];

  // Acesso a schema de config (para UI)
  getConfigSchema(pluginId: string): ConfigField[];
}
```

### Novo Ciclo de Vida

```
1. Criação (uma vez, em app-runtime.ts)
   const manager = createAgentsManager({ dbPath, outputDir });
   // NÃO registra plugins automaticamente — registry.loadFromConfig() faz isso

2. Injeção
   const opts: RouteOptions = { dataSource, orchestration, agentsManager: manager };
   registerAllRoutes(app, opts);

3. UI: Listar plugins
   GET /plugin-routing/plugins
   → registry.list() → [OpenCodePlugin, OpenAgentPlugin, VsCodePlugin]
   → routing.plugins → enabled/disabled status
   → Retorna PluginInfo[] com enabled, internalAgents, configSchema

4. UI: Ativar/desativar plugin
   PUT /plugin-routing
   → services.routing.saveConfig({ plugins: { opencode: { enabled: true } } })
   → registry.loadFromConfig(routing)  // registra plugins enabled
   → registry.exportAll()              // exporta só os enabled

5. UI: Configurar plugin
   GET /plugin-routing/:pluginId/config
   → retorna config atual + getConfigSchema() + getInternalAgents()
   PUT /plugin-routing/:pluginId/config
   → atualiza routing.plugins.{id}.config, agentMappings, categoryMappings

6. UI: Alternar categoria no plugin
   PATCH /plugin-routing/:pluginId/categories/:categoryId
   → toggle routing.plugins.{id}.categoryMappings[categoryId]

7. Exportação (só plugins enabled)
   registry.loadFromConfig(routingConfig)
   registry.exportAll()
   → Para cada plugin habilitado:
       plugin.buildOutput(systemAgents, routing, ctx)
       → validate (se existir)
       → escreve data/{outputFile}
```

### Plugins — agentes internos

| Plugin | Agentes Internos |
|--------|-----------------|
| OpenCodePlugin | 6 agentes: coder, planner, explorer, reviewer, writer, architect |
| OpenAgentPlugin | A definir durante implementação (vai para produção como 1ª classe) |
| VsCodePlugin | Nenhum — cada plugin tem sua especificidade |

### API Endpoints (novos/alterados)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/plugin-routing/plugins` | Lista plugins + status enabled + internal agents + config schema |
| PUT | `/plugin-routing` | Atualiza routing config completo |
| GET | `/plugin-routing/:pluginId/config` | Config atual + schema + internal agents de um plugin |
| PUT | `/plugin-routing/:pluginId/config` | Atualiza config, agentMappings, categoryMappings |
| PATCH | `/plugin-routing/:pluginId/categories/:categoryId` | Toggle category export |
| PATCH | `/plugin-routing/:pluginId/agents/:agentId` | Toggle agent routing (existente) |

### Responsabilidade de cada Plugin (v2)

| Plugin | Agentes internos | Output | Notas |
|--------|-----------------|--------|-------|
| OpenCodePlugin | 6 agentes (coder, planner, explorer, reviewer, writer, architect) | `{ provider: { litellm, agent1, agent2... } }` | Usa agentMappings para decidir quais SystemAgents virar providers |
| OpenAgentPlugin | A definir | `{ $schema, agents: {...}, categories: {...} }` | Usa agent.model real + categoryMappings. Será registrado em produção como o OpenCode
| VsCodePlugin | Nenhum (só models) | `{ oaicopilot: { models: [...] } }` | Usa models do ctx; ignora agents |

---

## Assunções

1. O agents-manager, agents-repository e server-core podem ser modificados; as routes podem mudar internamente mas os endpoints HTTP existentes permanecem compatíveis (novos endpoints serão adicionados)
2. `@lite-llm/agents-repository` pode ser modificado (schema passthrough, novos campos em PluginConfig)
3. O frontend (`/plugins`) já existe parcialmente (PluginCard com enable/disable + agent routing) e será expandido com a página de configuração individual (`/plugins/:pluginId`)
4. O db real é `@storage/agents.jsonc` (corrigir o `@settings/agents.json` que está sendo passado em `app-runtime.ts`)
5. `systemAgents` e `categories` no DbConfig são os dados de entrada para os plugins
6. Agentes internos de cada plugin são definidos no código do plugin (`getInternalAgents()`) e não no JSONC — apenas o mapeamento (SystemAgent → InternalAgent) é persistido
7. A tela `/agents` já existe como `agent-routing` e será mantida; a aba de categorias será adicionada dentro dela

## Critérios de Sucesso

### Backend (SDK — agents-manager + agents-repository)

- [ ] `createAgentsManager()` é instanciado uma vez em `app-runtime.ts` e injetado via `RouteOptions`
- [ ] Tipos duplicados eliminados — agents-manager importa tipos de agents-repository
- [ ] Zero `as unknown as` casts no RoutingService
- [ ] `dbConfigSchema` usa `.passthrough()` para forward-compat
- [ ] Interface `IPlugin` unificada: `buildOutput(agents, routing, ctx)` + `getOutputFile()` + `getInternalAgents()` + `getConfigSchema()`
- [ ] Métodos legacy removidos: `transformEntry`, `transformModel`, `preprocess`, `buildOutput` (antigo), `transformAgent`, `buildOutputV2`
- [ ] `PluginRegistry.exportOne()` passa `SystemAgent[]` reais e routing config real
- [ ] Todos os 3 plugins implementam a nova interface
- [ ] `loadFromConfig(routing)` registra plugins com `enabled: true`
- [ ] `PluginConfig` no schema suporta: `enabled`, `outputFile`, `config`, `agentMappings`, `categoryMappings`
- [ ] Cobertura de testes > 80% em services, plugin registry e plugins

### API (server-core)

- [ ] Novos endpoints: `GET|PUT /plugin-routing/:pluginId/config`, `PATCH /plugin-routing/:pluginId/categories/:categoryId`
- [ ] `GET /plugin-routing/plugins` retorna internal agents + config schema por plugin
- [ ] Rotas usam `agentsManager` injetado via `RouteOptions` (não criam novas instâncias)

### Frontend (web)

- [ ] `/plugins` — toggle enable/disable funcional (não mais console.warn placeholder)
- [ ] `/plugins/:pluginId` — página de configuração individual com:
  - [ ] Formulário dinâmico de opções (gerado por `getConfigSchema()`)
  - [ ] Tabela de mapeamento SystemAgent → InternalAgent
  - [ ] Checkboxes de categorias para export
- [ ] Toggle de plugin chama `PUT /plugin-routing` e persiste no JSONC

### Geral

- [ ] Código morto (`DEFAULT_FILE_PATHS`, `getFilePaths`) removido
- [ ] `setupAgentsManager` corrigido (dbPath correto: `@storage/agents.jsonc`)
- [ ] Nenhum `as any` adicionado

## Boundaries

- **Sempre:** Rodar `pnpm typecheck` e `pnpm test` nos packages afetados antes de cada commit
- **Perguntar antes:** Mudar a interface `IPlugin` (afeta todos os plugins), mudar schema Zod de forma breaking, adicionar dependências
- **Nunca:** Adicionar `as any`, quebrar compatibilidade com `agents.jsonc` existente, remover campos do schema em uso

## Questões Abertas

~~1. Agentes internos do OpenAgentPlugin: prioridade?~~ → **D7: OpenAgentPlugin vai para produção como plugin de primeira classe (igual OpenCode). Agentes internos a definir durante implementação.**

~~2. VsCodePlugin sem agentes?~~ → **Confirmado: VsCodePlugin não tem agentes internos. Cada plugin tem sua especificidade.**

~~3. Ordem de implementação?~~ → **Paralelo: backend (SDK + server-core) e frontend (web) implementados simultaneamente.**

~~4. Migração do JSONC?~~ → **Migração limpa: sem fallbacks, sem suporte a legacy. Schema novo, código novo, sem backward-compat com formato antigo do routing.plugins.**
