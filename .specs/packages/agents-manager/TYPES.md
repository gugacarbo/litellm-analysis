# @lite-llm/agents-manager — Sistema de Tipos

## Visão Geral

O pacote utiliza tipos para três propósitos:
1. **Configuração de Catálogo** — Definição de agentes e categorias
2. **Roteamento** — Mapeamento de agentes para plugins
3. **Output de Plugins** — Formatos específicos por plugin

## 1. Tipos de Catálogo

### `AgentVersion`

Versão específica de um agente (ex: gpt-5.5, gpt-5.4).

```typescript
interface AgentVersion {
  id: string;           // "gpt-5.5", "gpt-4", etc.
  displayName: string;  // "GPT 5.5", "GPT 4"
  capabilities?: string[];
  isDefault?: boolean;
}
```

### `SystemAgent`

Definição completa de um agente/categoria do sistema.

```typescript
interface SystemAgent {
  // Identificação
  id: string;           // "builder", "planner", "explorer"
  displayName: string;
  description: string;
  color: string;

  // Versionamento
  versions: AgentVersion[];
  defaultVersion: string;

  // Roteamento (quais plugins esse agente usa)
  enabledPlugins: string[];

  // Configuração específica do agente
  config: AgentConfig;
}

interface AgentConfig {
  // Modelo base
  model?: string;
  fallbackModels?: string[];

  // Comportamento
  mode?: "subagent" | "standalone" | "orchestrator";
  disable?: boolean;
  tools?: Record<string, unknown>;

  // Capacidades
  thinking?: boolean;
  reasoningEffort?: "low" | "medium" | "high";
  textVerbosity?: "low" | "medium" | "high";
  maxTokens?: number;

  // Permissões
  permission?: Permission;

  // Prompts
  prompt?: string;
  prompt_append?: string;

  // Outros
  temperature?: number;
  top_p?: number;
  skills?: string[];
  variant?: string;
  category?: string;
}

interface Permission {
  edit?: "ask" | "allow" | "deny";
  bash?: "ask" | "allow" | "deny" | Record<string, "ask" | "allow" | "deny">;
  webfetch?: "ask" | "allow" | "deny";
  doom_loop?: "ask" | "allow" | "deny";
  external_directory?: "ask" | "allow" | "deny";
}
```

### `AgentCatalog`

Catálogo completo de agentes e categorias.

```typescript
interface AgentCatalog {
  version: number;
  litellm: {
    baseUrl: string;
    apiKey: string;
  };
  models: Record<string, ModelSpec>;
  agents: Record<string, SystemAgent>;
  categories: Record<string, SystemAgent>;
  globalFallbackAgent?: string;
}
```

### `ModelSpec`

Especificação de modelo LiteLLM.

```typescript
interface ModelSpec {
  displayName: string;
  ownedBy?: string;
  family?: string;
  contextLength: number;
  maxOutput: number;
  cost?: {
    input?: number;
    output?: number;
  };
}
```

---

## 2. Tipos de Roteamento

### `PluginRoutingRule`

Regra de roteamento para um plugin específico.

```typescript
interface PluginRoutingRule {
  pluginId: string;
  enabled: boolean;

  // Estratégia de geração de IDs de modelo
  modelIdStrategy: ModelIdStrategy;

  // Limites default para este plugin (opcional, sobrescreve AgentConfig)
  limits?: {
    context?: number;
    output?: number;
  };

  // Transformações específicas deste plugin
  transform?: PluginTransform;
}

interface ModelIdStrategy {
  pattern: string;           // "{agentId}/{version}" | "{agentId}-{version}"
  versionSeparator?: string;  // "/" ou "-"
  versions?: string[];       // Versões disponíveis (se não vier do AgentConfig)
}

interface PluginTransform {
  // Campos a incluir (se vazio, incluir todos)
  includeFields?: string[];
  // Campos a excluir
  excludeFields?: string[];
  // Mapeamento de campos (origem → destino)
  fieldMap?: Record<string, string>;
}
```

### `AgentRoutingConfig`

Configuração completa de roteamento.

```typescript
interface AgentRoutingConfig {
  version: number;
  globalFallbackAgent: string;

  // Mapeamento agentId → regras de plugin
  rules: Record<string, PluginRoutingRule[]>;
}
```

### `GeneratedVersion`

Versão gerada por um plugin para um agente.

```typescript
interface GeneratedVersion {
  id: string;           // ID completo (ex: "builder/gpt-5.5")
  displayName: string;
  capabilities?: string[];
  isDefault?: boolean;
  limits?: {
    context?: number;
    output?: number;
  };
}
```

---

## 3. Tipos de Plugin

### `IPlugin`

Interface para plugins de transformação.

```typescript
interface IPlugin {
  readonly id: string;
  readonly name: string;
  readonly version: number;

  // Capacidades do plugin
  readonly supportsAgents: boolean;
  readonly supportsCategories: boolean;
  readonly supportsModels: boolean;

  // Geração de versões (baseado na configuração)
  generateVersions(
    agent: SystemAgent,
    rule: PluginRoutingRule
  ): GeneratedVersion[];

  // Transformação
  transformAgent(
    agent: SystemAgent,
    version: GeneratedVersion,
    context: TransformContext
  ): PluginEntry;

  transformCategory(
    category: SystemAgent,
    version: GeneratedVersion,
    context: TransformContext
  ): PluginEntry;

  // Build de output
  buildOutput(
    catalog: AgentCatalog,
    routing: AgentRoutingConfig
  ): unknown;

  getOutputFile(): string;

  // Validação (opcional)
  validate?(output: unknown): boolean;
}

interface PluginEntry {
  [key: string]: unknown;
}

interface TransformContext {
  entryKey: string;
  entryType: "agent" | "category";
  allModels: Record<string, ModelSpec>;
  globalFallbackAgent?: string;
  litellmConfig: { baseUrl: string; apiKey: string };
  resolvedModels: Map<string, string>;
}
```

### `IPluginRegistry`

Registro e execução de plugins.

```typescript
interface IPluginRegistry {
  register(plugin: IPlugin): void;
  unregister(pluginId: string): void;
  get(pluginId: string): IPlugin | undefined;
  list(): IPlugin[];

  exportAll(): Promise<void>;
  exportOne(pluginId: string): Promise<void>;
}
```

---

## 4. Tipos de Output (por Plugin)

### OpenCodePlugin Output

```typescript
interface OpenCodeProvidersOutput {
  provider: {
    litellm: {
      name: string;
      npm: "@ai-sdk/openai-compatible";
      options: {
        baseURL: string;
        apiKey: string;
      };
      models: Record<string, PluginModel>;
    };
    [agentId: string]: {
      npm: "@ai-sdk/openai-compatible";
      options: {
        baseURL: string;
        apiKey: string;
      };
      models: Record<string, PluginModel>;
    };
  };
}

interface PluginModel {
  id: string;
  name: string;
  limit?: {
    context?: number;
    output?: number;
  };
  cost?: {
    input?: number;
    output?: number;
  };
}
```

### OpenAgentPlugin Output

```typescript
interface OpenAgentConfigOutput {
  $schema: string;
  globalFallbackModel?: string;
  git_master: {
    commit_footer: boolean;
    include_co_authored_by: boolean;
  };
  agents: Record<string, OpenAgentEntry>;
  categories: Record<string, OpenAgentEntry>;
}

interface OpenAgentEntry {
  model?: string;
  fallback_models?: string[];
  description?: string;
  color?: string;
  disable?: boolean;
  tools?: Record<string, unknown>;
  mode?: string;
  thinking?: unknown;
  reasoningEffort?: string;
  textVerbosity?: string;
  maxTokens?: number;
}
```

### VsCodePlugin Output

```typescript
interface VsCodeConfigOutput {
  "oaicopilot.commitLanguage": string;
  "oaicopilot.baseUrl": string;
  "oaicopilot.delay": number;
  "oaicopilot.readFileLines": number;
  "oaicopilot.retry": {
    enabled: boolean;
    max_attempts: number;
    interval_ms: number;
    status_codes: number[];
  };
  "oaicopilot.models": VsCodeModel[];
}

interface VsCodeModel {
  name: string;
  id: string;
  baseUrl: string;
  "request-options": {
    headers?: Record<string, string>;
  };
  "model-settings"?: {
    "max-tokens"?: number;
    temperature?: number;
    "stop-sequences"?: string[];
  };
}
```

---

## 5. Tipos de Arquivo de Configuração

### Arquivo Único (`@settings/agents.json`)

```typescript
interface AgentsConfigFile {
  // Catálogo (agentes, categorias, modelos)
  catalog: {
    version: number;
    litellm: {
      baseUrl: string;
      apiKey: string;
    };
    models: Record<string, ModelSpec>;
    agents: Record<string, SystemAgent>;
    categories: Record<string, SystemAgent>;
    globalFallbackAgent?: string;
  };

  // Roteamento (quais plugins cada agente usa)
  routing: AgentRoutingConfig;
}
```

---

## 6. Interfaces de Serviço

### `IAgentService`

```typescript
interface IAgentService {
  getAll(): Promise<Record<string, SystemAgent>>;
  get(key: string): Promise<SystemAgent | undefined>;
  create(key: string, agent: SystemAgent): Promise<void>;
  update(key: string, agent: Partial<SystemAgent>): Promise<void>;
  upsert(key: string, agent: SystemAgent): Promise<void>;
  delete(key: string): Promise<void>;
}
```

### `IRoutingService`

```typescript
interface IRoutingService {
  getConfig(): Promise<AgentRoutingConfig>;
  saveConfig(config: AgentRoutingConfig): Promise<void>;

  getRoutingForAgent(agentId: string): PluginRoutingRule[];
  setRoutingForAgent(agentId: string, rules: PluginRoutingRule[]): Promise<void>;

  getEnabledPlugins(agentId: string): string[];
  isPluginEnabledForAgent(agentId: string, pluginId: string): boolean;

  getPluginConfig(pluginId: string): PluginRoutingRule | undefined;
}
```

---

## 7. Conversão de Tipos Legados

### DbAgentEntry (formato antigo) → SystemAgent (novo)

```typescript
function migrateAgentEntry(entry: DbAgentEntry): Partial<SystemAgent> {
  return {
    description: entry.description,
    color: entry.color,
    config: {
      model: entry.model,
      fallbackModels: entry.fallbackModels,
      disable: entry.disable,
      mode: entry.mode as "subagent" | "standalone" | "orchestrator",
      tools: entry.tools,
      permission: entry.permission,
      temperature: entry.temperature,
      top_p: entry.top_p,
      prompt: entry.prompt,
      prompt_append: entry.prompt_append,
    },
    // VERSIONS virão de PluginRoutingRule, não do agente
    enabledPlugins: [], // Configurado no routing
    versions: [],       // Configurado no routing
    defaultVersion: "", // Configurado no routing
  };
}
```

---

## 8. Matriz de Propriedades

| Propriedade | SystemAgent | AgentConfig | PluginRoutingRule | Observação |
|-------------|-------------|-------------|-------------------|------------|
| id | ✅ | ❌ | ❌ | Chave no Record |
| displayName | ✅ | ❌ | ❌ | Nome para UI |
| description | ✅ | ❌ | ❌ | Descrição |
| color | ✅ | ❌ | ❌ | Cor UI |
| model | ❌ | ✅ | ❌ | Em config |
| fallbackModels | ❌ | ✅ | ❌ | Em config |
| versions | ✅ | ❌ | ❌ | Gerenciado por plugin |
| enabledPlugins | ✅ | ❌ | ❌ | Quais plugins |
| modelIdStrategy | ❌ | ❌ | ✅ | Padrão de ID |
| limits | ❌ | ❌ | ✅ | context/output |
| transform | ❌ | ❌ | ✅ | Campos a incluir/excluir |
