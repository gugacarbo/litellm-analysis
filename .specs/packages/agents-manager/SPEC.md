# @lite-llm/agents-manager — Especificação

## Visão Geral

Sistema de gerenciamento de agentes de IA com arquitetura em camadas e roteamento flexível para múltiplos plugins/outputs. Projetado para ser genérico e não acoplado a um consumidor específico.

## Responsabilidades do Pacote

1. **Catálogo de Agentes** — CRUD de agentes e categorias com versionamento configurável
2. **Roteamento de Plugins** — Mapeamento explícito de agentes para plugins
3. **Transformação de Formato** — Conversão de formato interno para formatos de output
4. **Geração de Configurações** — Geração de arquivos para consumidores (OpenCode, VS Code, OpenAgent)

## Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                         API Pública                              │
│  (createAgentsManager, services, registry, routing)              │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                      Services Layer                              │
│  agent.service.ts    — CRUD de SystemAgent                      │
│  category.service.ts  — CRUD de Category                         │
│  model.service.ts     — CRUD de ModelSpec                       │
│  routing.service.ts   — Roteamento agent→plugins                 │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                     Repository Layer                             │
│  client.ts  — Leitura/escrita de @storage/agents.json          │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                      Plugin Layer                                │
│  registry.ts    — Registro e execução de plugins                 │
│  builtins/      — Plugins padrão (opencode, openagent, vscode)   │
└─────────────────────────────────────────────────────────────────┘
```

## Fluxo de Dados

```
┌─────────────────────────────────────────────────────────────────┐
│  @storage/agents.json                                           │
│  { catalog: AgentCatalog, routing: AgentRoutingConfig }          │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌───────────────────────────────────────────────────────────────────┐
│  IAgentsRepository                                                 │
│  - Lê arquivo JSON                                                 │
│  - Detecta formato legado vs novo                                 │
│  - Aplica migration se necessário                                  │
└───────────────────────────────┬───────────────────────────────────┘
                                │
          ┌─────────────────────┼─────────────────────┐
          ▼                     ▼                     ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  AgentService   │  │ CategoryService │  │  ModelService   │
│  (SystemAgent)  │  │  (SystemAgent)  │  │  (ModelSpec)    │
└────────┬────────┘  └────────┬────────┘  └────────┬────────┘
         │                    │                    │
         └─────────────────────┼────────────────────┘
                               ▼
                 ┌─────────────────────────┐
                 │   RoutingService        │
                 │ (PluginRoutingConfig)   │
                 └───────────┬─────────────┘
                             │
                             ▼
                 ┌─────────────────────────┐
                 │    PluginRegistry       │
                 │  (dispatch por plugin)  │
                 └───────────┬─────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ OpenCodePlugin  │ │OpenAgentPlugin  │ │  VsCodePlugin   │
│ (data/opencode) │ │(data/oh-my-...) │ │(data/vscode-...)│
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

## Conceitos Principais

### 1. AgentCatalog

Catálogo de agentes e categorias do sistema.

```typescript
interface AgentCatalog {
  version: number;
  litellm: { baseUrl: string; apiKey: string };
  models: Record<string, ModelSpec>;
  agents: Record<string, SystemAgent>;
  categories: Record<string, SystemAgent>;
  globalFallbackAgent?: string;
}
```

### 2. SystemAgent

Definição de um agente/categoria.

```typescript
interface SystemAgent {
  id: string;           // "builder", "planner"
  displayName: string;
  description: string;
  color: string;
  versions: AgentVersion[];
  defaultVersion: string;
  enabledPlugins: string[];
  config: AgentConfig;
}
```

### 3. AgentRoutingConfig

Mapeamento de agentes para plugins.

```typescript
interface AgentRoutingConfig {
  version: number;
  globalFallbackAgent: string;
  rules: Record<string, PluginRoutingRule[]>;
}

interface PluginRoutingRule {
  pluginId: string;
  enabled: boolean;
  modelIdStrategy: {
    pattern: string;     // "{agentId}/{version}"
    versions: string[];  // ["gpt-5.5", "gpt-5.4", ...]
  };
  limits?: { context?: number; output?: number };
}
```

### 4. Plugin Interface

```typescript
interface IPlugin {
  readonly id: string;
  readonly name: string;

  generateVersions(agent: SystemAgent, rule: PluginRoutingRule): GeneratedVersion[];
  transformAgent(agent: SystemAgent, version: GeneratedVersion, context: TransformContext): PluginEntry;
  buildOutput(catalog: AgentCatalog, routing: AgentRoutingConfig): unknown;
  getOutputFile(): string;
}
```

## Padrão de Uso

```typescript
import { createAgentsManager } from "@lite-llm/agents-manager";

// Criar instância
const { services, registry, routing } = createAgentsManager({
  dbPath: "@storage/agents.json",
  outputDir: "data",
  registerBuiltins: true,
});

// CRUD de agentes
await services.agents.upsert("builder", {
  id: "builder",
  displayName: "Builder",
  description: "Agente de implementação",
  color: "#555555",
  versions: [],
  defaultVersion: "",
  enabledPlugins: ["opencode", "openagent"],
  config: { mode: "subagent" }
});

// Configurar roteamento
await routing.setRoutingForAgent("builder", [
  {
    pluginId: "opencode",
    enabled: true,
    modelIdStrategy: {
      pattern: "{agentId}/{version}",
      versions: ["gpt-5.5", "gpt-5.4", "gpt-5.3"]
    },
    limits: { context: 200000, output: 32768 }
  }
]);

// Exportar
await registry.exportAll();
```

## Plugins Builtin

| Plugin          | ID          | Output                        | Pattern               |
| --------------- | ----------- | ----------------------------- | --------------------- |
| OpenCodePlugin  | `opencode`  | `data/opencode.json`          | `{agentId}/{version}` |
| OpenAgentPlugin | `openagent` | `data/oh-my-openagent.json`   | `{agentId}/{version}` |
| VsCodePlugin    | `vscode`    | `data/vscode-oaicopilot.json` | `{agentId}-{version}` |

## Arquivos

| Arquivo      | Caminho Padrão                | Propósito                      |
| ------------ | ----------------------------- | ------------------------------ |
| Configuração | `@storage/agents.json`        | Fonte da verdade               |
| OpenCode     | `data/opencode.json`          | AI SDK providers               |
| OpenAgent    | `data/oh-my-openagent.json`   | Configuração Oh My OpenAgent   |
| VS Code      | `data/vscode-oaicopilot.json` | Models para VS Code OAICopilot |

## Dependências

- `@lite-llm/agents-repository` — Persistência de arquivo
- `@litellm/shared` — Tipos comuns e schemas Zod

## Build & Test

```bash
pnpm --filter @lite-llm/agents-manager build
pnpm --filter @lite-llm/agents-manager test
pnpm --filter @lite-llm/agents-manager typecheck
```

## Notas

- Extensões `.js` em imports (ESM/verbatimModuleSyntax)
- Escrita atômica com padrão `.tmp` + `rename()`
- Migration layer para formato legado
- Plugin-agnostic (core não conhece detalhes dos plugins)
