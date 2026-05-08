# @lite-llm/agents-manager — Arquitetura

## Visão Geral

Sistema de gerenciamento de agentes de IA com arquitetura em camadas, permitindo roteamento flexível de agentes para múltiplos plugins/outputs.

## Arquitetura em Camadas

```
┌─────────────────────────────────────────────────────────────┐
│                    UI Layer                                  │
│  (Agent Catalog Screen + Plugin Routing Config)            │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                   System Agents Layer                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  Builder    │  │  Planner    │  │  Explorer   │  ...   │
│  │  AgentDef   │  │  AgentDef   │  │  AgentDef   │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                   Routing Layer                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  AgentRoute: "builder" → [opencode, openagent]     │   │
│  │  AgentRoute: "planner" → [opencode]                 │   │
│  │  AgentRoute: "explorer" → [opencode, vscode]       │   │
│  └─────────────────────────────────────────────────────┘   │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                   Plugin Layer                               │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐  │
│  │ OpenCodePlugin│  │OpenAgentPlugin│  │ VsCodePlugin  │  │
│  └───────────────┘  └───────────────┘  └───────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Componentes

### 1. Repository Layer (`repository/`)

Responsável pela persistência do arquivo de configuração.

```
repository/
├── client.ts         # Factory de IAgentsRepository
└── (depende de @lite-llm/agents-repository)
```

**Interface:** `IAgentsRepository`
```typescript
interface IAgentsRepository {
  read(): Promise<AgentCatalog>;
  write(config: AgentCatalog): Promise<void>;
}
```

### 2. Services Layer (`services/`)

CRUD para entidades de domínio.

```
services/
├── agent.service.ts     # CRUD de SystemAgent
├── category.service.ts   # CRUD de Category (subtipo de Agent)
└── model.service.ts     # CRUD de ModelSpec
```

**Interfaces:**
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

### 3. Routing Layer (`routing/`)

Mapeamento de agentes para plugins.

```
routing/
├── routing.service.ts   # Lógica de roteamento
└── types.ts            # Tipos de roteamento
```

**Interface:** `IRoutingService`
```typescript
interface IRoutingService {
  getRoutingForAgent(agentId: string): PluginRoutingRule[];
  setRoutingForAgent(agentId: string, rules: PluginRoutingRule[]): Promise<void>;
  getEnabledPlugins(agentId: string): string[];
  getPluginConfig(pluginId: string): PluginRoutingRule | undefined;
}
```

### 4. Plugin Layer (`plugins/`)

Transformações e geração de outputs.

```
plugins/
├── plugin.ts           # Interface IPlugin
├── registry.ts        # PluginRegistry
└── builtins/
    ├── opencode.plugin.ts
    ├── openagent.plugin.ts
    └── vscode.plugin.ts
```

**Interface:** `IPlugin`
```typescript
interface IPlugin {
  readonly id: string;
  readonly name: string;
  readonly version: number;

  // Capabilities
  readonly supportsAgents: boolean;
  readonly supportsCategories: boolean;
  readonly supportsModels: boolean;

  // Version generation (config-driven)
  generateVersions(agent: SystemAgent, rule: PluginRoutingRule): GeneratedVersion[];

  // Transform
  transformAgent(agent: SystemAgent, version: GeneratedVersion, context: TransformContext): PluginEntry;
  transformCategory(category: SystemAgent, version: GeneratedVersion, context: TransformContext): PluginEntry;

  // Output
  buildOutput(catalog: AgentCatalog, routing: AgentRoutingConfig): unknown;
  getOutputFile(): string;

  // Validation (optional)
  validate?(output: unknown): boolean;
}
```

## Fluxo de Dados

```
┌─────────────────────────────────────────────────────────────────┐
│  @settings/agents.json                                           │
│  (AgentCatalog + AgentRoutingConfig)                             │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌───────────────────────────────────────────────────────────────────┐
│  IAgentsRepository                                                 │
│  (read/write do arquivo de configuração)                          │
└───────────────────────────────┬───────────────────────────────────┘
                                │
          ┌─────────────────────┼─────────────────────┐
          ▼                     ▼                     ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  AgentService   │  │ CategoryService │  │  ModelService   │
└────────┬────────┘  └────────┬────────┘  └────────┬────────┘
         │                    │                    │
         └─────────────────────┼────────────────────┘
                               ▼
                 ┌─────────────────────────┐
                 │   RoutingService        │
                 │ (mapeia agentes→plugins)│
                 └───────────┬─────────────┘
                             │
                             ▼
                 ┌─────────────────────────┐
                 │    PluginRegistry       │
                 │  (dispatch para plugins)│
                 └───────────┬─────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ OpenCodePlugin  │ │OpenAgentPlugin  │ │  VsCodePlugin   │
│ (data/opencode) │ │(data/oh-my-...) │ │(data/vscode-...)│
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

## Geração de Versões (Plugin-Driven)

Antes (hard-coded):
```typescript
const AGENT_VERSIONS = ["gpt-5.5", "gpt-5.4", "gpt-5.3", "gpt-5.2", "gpt-5.1"];
```

Depois (config-driven):
```typescript
// Em AgentRoutingConfig, cada plugin define sua estratégia de versões:
{
  "rules": {
    "builder": [
      {
        "pluginId": "opencode",
        "modelIdStrategy": {
          "pattern": "{agentId}/{version}",
          "versions": ["gpt-5.5", "gpt-5.4", "gpt-5.3", "gpt-5.2", "gpt-5.1"]
        },
        "limits": {
          "context": 200000,
          "output": 32768
        }
      }
    ]
  }
}
```

O plugin usa esses dados para gerar versões:
```typescript
generateVersions(agent: SystemAgent, rule: PluginRoutingRule): GeneratedVersion[] {
  return rule.modelIdStrategy.versions.map(version => ({
    id: rule.modelIdStrategy.pattern
      .replace("{agentId}", agent.id)
      .replace("{version}", version),
    displayName: `${agent.displayName} ${version}`,
    isDefault: version === rule.modelIdStrategy.versions[0]
  }));
}
```

## Padrão de Uso

```typescript
import { createAgentsManager } from "@lite-llm/agents-manager";

// Criar instância
const manager = createAgentsManager({
  dbPath: "@settings/agents.json",
  outputDir: "data",
  registerBuiltins: true,
});

// CRUD de agentes
await manager.services.agents.upsert("builder", {
  id: "builder",
  displayName: "Builder",
  description: "Agente de implementação de código",
  color: "#555555",
  versions: [
    { id: "gpt-5.5", displayName: "GPT 5.5", isDefault: true },
    { id: "gpt-5.4", displayName: "GPT 5.4" }
  ],
  enabledPlugins: ["opencode", "openagent"],
  config: { mode: "subagent" }
});

// Configurar roteamento
await manager.routing.setRoutingForAgent("builder", [
  { pluginId: "opencode", enabled: true, modelIdStrategy: { pattern: "{agentId}/{version}", versions: [...] } },
  { pluginId: "openagent", enabled: true }
]);

// Exportar todos os plugins
await manager.registry.exportAll();

// Exportar plugin específico
await manager.registry.exportOne("opencode");
```

## Extensibilidade

Para adicionar novo plugin:

1. Implementar `IPlugin`
2. Registrar no registry:

```typescript
manager.registry.register(new MyCustomPlugin());

// Exportar
await manager.registry.exportOne("my-custom");
```

## Notas

- **Plugin-agnostic**: O core não conhece detalhes dos plugins
- **Versionamento flexível**: Cada plugin pode ter estratégias diferentes
- **Roteamento explícito**: Agentes declaram quais plugins usam
- **Backward compatibility**: Migration layer para formato antigo
