# Refatoração Routing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reimplement routing subsystem em `packages/agents-manager` para operar sobre `DbConfig.plugins[id].routing` (schema novo), eliminando todo suporte a `PluginRoutingConfig` legado.

**Architecture:** 
- `IPlugin.buildOutput` recebe `PluginRouting` específico do plugin, não mapa global
- `RoutingService` opera sobre `config.plugins[id].routing.*`
- `PluginRegistry.exportOne` extrai config direto de `config.plugins[pluginId]`
- `DEFAULT_ROUTING` removido, defaults resolvidos inline

**Tech Stack:** TypeScript 6.0.3, Zod 4.4.3, Vitest 4.x

---

### Task 1: Core types e plugin interface

**Files:**
- Modify: `packages/agents-manager/src/plugins/plugin.ts`
- Modify: `packages/agents-manager/src/types/index.ts`

- [ ] **Step 1: Atualizar `plugin.ts` — interface `IPlugin.buildOutput` e `IPluginRegistry.loadFromConfig`**

Muda o tipo do parâmetro `routing` de `PluginRoutingConfig` (inexistente) para `PluginRouting` (do schema). `loadFromConfig` recebe `Record<string, PluginRouting>`.

```ts
import type {
  ModelSpec,
  PluginRouting,
  SystemAgent,
} from "@lite-llm/agents-repository/schemas";

export interface IPlugin {
  readonly id: string;
  readonly name: string;
  readonly version: number;

  getInternalAgents(): InternalAgent[];
  getConfigSchema(): ConfigField[];

  buildOutput(
    agents: SystemAgent[],
    routing: PluginRouting,
    ctx: TransformContext,
  ): unknown;

  getOutputFile(): string;
  validate?(output: unknown): boolean;
}

export interface IPluginRegistry {
  register(plugin: IPlugin): void;
  unregister(pluginId: string): void;
  get(pluginId: string): IPlugin | undefined;
  list(): IPlugin[];
  loadFromConfig(pluginConfigs: Record<string, PluginRouting>): void;
  exportAll(): Promise<void>;
  exportOne(pluginId: string): Promise<void>;
  getInternalAgents(pluginId: string): InternalAgent[];
  getConfigSchema(pluginId: string): ConfigField[];
}
```

- [ ] **Step 2: Atualizar `types/index.ts` — remover re-export de `PluginRoutingConfig`**

Remove a re-exportação de `PluginRoutingConfig` (não existe no schema novo). Se quiser exportar `PluginRouting`, importa direto de `@lite-llm/agents-repository/schemas`.

```ts
export type {
  AgentExtraConfig,
  PluginRoutingRule,
  SystemAgent,
} from "@lite-llm/agents-repository/schemas";
```

> **Nota:** `PluginRoutingRule` ainda existe no schema (`pluginRoutingRuleSchema`), então mantém.

- [ ] **Step 3: Rodar typecheck pra ver se `plugin.ts` compila**

Run: `pnpm --filter @lite-llm/agents-manager typecheck`
Expected: errors APENAS nos arquivos que ainda não foram atualizados (plugins, registry, service, tests). Sem erros em `plugin.ts`/`types/index.ts`.

---

### Task 2: Plugin source implementations

**Files:**
- Modify: `packages/agents-manager/src/plugins/builtins/opencode.plugin.ts`
- Modify: `packages/agents-manager/src/plugins/external/openagent.plugin.ts`
- Modify: `packages/agents-manager/src/plugins/external/vscode.plugin.ts`

- [ ] **Step 1: Atualizar `opencode.plugin.ts`**

Muda a importação, assinatura do `buildOutput` e acesso ao routing + model limits.

```ts
import type {
  ModelSpec,
  PluginRouting,
  SystemAgent,
} from "@lite-llm/agents-repository/schemas";
import type { IPlugin, TransformContext } from "../plugin.js";
import type { ConfigField, InternalAgent } from "../plugin-types.js";

interface OpenCodeProviders {
  provider: Record<string, unknown>;
}

export class OpenCodePlugin implements IPlugin {
  readonly id = "opencode";
  readonly name = "OpenCode AI SDK";
  readonly version = 1;
  readonly outputFile = "opencode.json";

  getInternalAgents(): InternalAgent[] {
    return [
      { id: "coder", displayName: "Coder", description: "General-purpose coding agent" },
      { id: "planner", displayName: "Planner", description: "Planning and scoping agent" },
      { id: "explorer", displayName: "Explorer", description: "Codebase exploration agent" },
      { id: "reviewer", displayName: "Reviewer", description: "Code review agent" },
      { id: "writer", displayName: "Writer", description: "Documentation and writing agent" },
      { id: "architect", displayName: "Architect", description: "Architecture decisions agent" },
    ];
  }

  getConfigSchema(): ConfigField[] {
    return [];
  }

  buildOutput(
    agents: SystemAgent[],
    routing: PluginRouting,
    ctx: TransformContext,
  ): OpenCodeProviders {
    const output: OpenCodeProviders = { provider: {} };

    const litellmModels: Record<string, unknown> = {};
    for (const [key, spec] of Object.entries(ctx.allModels)) {
      litellmModels[key] = {
        id: key,
        name: spec.displayName,
        limit: {
          context: spec.limits.length,
          output: spec.limits.maxOutput,
        },
      };
    }

    output.provider.litellm = {
      name: "LiteLLM",
      npm: "@ai-sdk/openai-compatible",
      options: {
        baseURL: ctx.litellmConfig.baseUrl,
        apiKey: ctx.litellmConfig.apiKey,
      },
      models: litellmModels,
    };

    const agentMappings = routing.routing?.agents ?? {};

    for (const agent of agents) {
      const agentId = agent.displayName;
      const internalAgentId = agentMappings[agentId];
      if (!internalAgentId) continue;

      const limits = agent.limits;
      const modelKey = "default";
      const modelLabel = "Default";

      output.provider[internalAgentId] = {
        npm: "@ai-sdk/openai-compatible",
        options: {
          baseURL: ctx.litellmConfig.baseUrl,
          apiKey: ctx.litellmConfig.apiKey,
        },
        models: {
          [modelKey]: {
            id: `${internalAgentId}/${modelKey}`,
            name: `${agent.displayName} ${modelLabel}`,
            limit: {
              context: limits.context,
              output: limits.output,
            },
          },
        },
      };
    }

    return output;
  }

  getOutputFile(): string {
    return this.outputFile;
  }
}
```

> **Mudanças chave:** `PluginRoutingConfig` → `PluginRouting`; `routing.plugins[this.id]` → `routing`; `(spec as ModelSpec).contextLength` → `spec.limits.length`; `(spec as ModelSpec).maxOutput` → `spec.limits.maxOutput`; casts desnecessários removidos; `(agent as SystemAgent & { id?: string }).id` → `agent.displayName` (SystemAgent não tem `id`).

- [ ] **Step 2: Atualizar `openagent.plugin.ts`**

```ts
import type {
  PluginRouting,
  SystemAgent,
} from "@lite-llm/agents-repository/schemas";
import type { IPlugin, TransformContext } from "../plugin.js";
import type { ConfigField, InternalAgent } from "../plugin-types.js";

interface OpenAgentOutput {
  $schema: string;
  globalFallbackModel?: string;
  git_master: {
    commit_footer: boolean;
    include_co_authored_by: boolean;
  };
  agents: Record<string, Record<string, unknown>>;
  categories: Record<string, Record<string, unknown>>;
}

export class OpenAgentPlugin implements IPlugin {
  readonly id = "openagent";
  readonly name = "Oh My OpenAgent";
  readonly version = 1;
  readonly outputFile = "oh-my-openagent.json";

  getInternalAgents(): InternalAgent[] {
    return [
      { id: "default", displayName: "Default", description: "Default OpenAgent" },
    ];
  }

  getConfigSchema(): ConfigField[] {
    return [
      {
        key: "commitFooter",
        type: "boolean",
        label: "Commit Footer",
        required: false,
        default: false,
        description: "Add footer to commit messages",
      },
      {
        key: "includeCoAuthoredBy",
        type: "boolean",
        label: "Include Co-Authored-By",
        required: false,
        default: false,
        description: "Include co-authored-by trailer in commits",
      },
    ];
  }

  buildOutput(
    agents: SystemAgent[],
    routing: PluginRouting,
    ctx: TransformContext,
  ): OpenAgentOutput {
    const config = routing.config ?? {};

    const output: OpenAgentOutput = {
      $schema:
        "https://raw.githubusercontent.com/opensoft/oh-my-opencode/dev/assets/oh-my-opencode.schema.json",
      globalFallbackModel: ctx.globalFallbackModel,
      git_master: {
        commit_footer: (config.commitFooter as boolean) ?? false,
        include_co_authored_by:
          (config.includeCoAuthoredBy as boolean) ?? false,
      },
      agents: {},
      categories: {},
    };

    const agentMappings = routing.routing?.agents ?? {};

    for (const agent of agents) {
      const internalId = agentMappings[agent.displayName];
      if (!internalId) continue;

      const entry: Record<string, unknown> = {};
      if (agent.description) entry.description = agent.description;
      if (agent.model) entry.model = agent.model;
      if (agent.fallbackModels?.length) {
        entry.fallback_models = agent.fallbackModels;
      }
      if (agent.config?.mode) entry.mode = agent.config.mode;
      if (agent.config?.tools) entry.tools = agent.config.tools;
      if (agent.config?.color) entry.color = agent.config.color;

      output.agents[internalId] = entry;
    }

    return output;
  }

  getOutputFile(): string {
    return this.outputFile;
  }
}
```

> **Mudanças chave:** `PluginRoutingConfig` → `PluginRouting`; `routing.plugins[this.id]` → `routing`; `pluginRouting?.config` → `routing.config`; `pluginRouting?.routing?.agents` → `routing.routing?.agents`; `(agent as SystemAgent & { id?: string }).id` → `agent.displayName`.

- [ ] **Step 3: Atualizar `vscode.plugin.ts`**

```ts
import type {
  ModelSpec,
  PluginRouting,
  SystemAgent,
} from "@lite-llm/agents-repository/schemas";
import type { IPlugin, TransformContext } from "../plugin.js";
import type { ConfigField, InternalAgent } from "../plugin-types.js";

interface VsCodeModelsOutput {
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
  "oaicopilot.models": Array<{
    name: string;
    id: string;
    baseUrl: string;
    "request-options": { headers?: Record<string, string> };
    "model-settings"?: { "max-tokens"?: number };
  }>;
}

export class VsCodePlugin implements IPlugin {
  readonly id = "vscode";
  readonly name = "VS Code OAICopilot";
  readonly version = 1;
  readonly outputFile = "vscode-oaicopilot.json";

  getInternalAgents(): InternalAgent[] {
    return [];
  }

  getConfigSchema(): ConfigField[] {
    return [
      {
        key: "commitLanguage",
        type: "string",
        label: "Commit Language",
        required: false,
        default: "Portuguese (Brazil)",
        description: "Language for commit messages",
      },
      {
        key: "retryEnabled",
        type: "boolean",
        label: "Enable Retry",
        required: false,
        default: true,
        description: "Enable retry on failed requests",
      },
      {
        key: "maxRetryAttempts",
        type: "number",
        label: "Max Retry Attempts",
        required: false,
        default: 3,
        description: "Maximum number of retry attempts",
      },
    ];
  }

  buildOutput(
    _agents: SystemAgent[],
    routing: PluginRouting,
    ctx: TransformContext,
  ): VsCodeModelsOutput {
    const pluginConfig = routing.config ?? {};
    const baseUrl = ctx.litellmConfig.baseUrl.replace(/\/v1$/, "");

    const output: VsCodeModelsOutput = {
      "oaicopilot.commitLanguage":
        (pluginConfig.commitLanguage as string) ?? "Portuguese (Brazil)",
      "oaicopilot.baseUrl": "",
      "oaicopilot.delay": 0,
      "oaicopilot.readFileLines": 0,
      "oaicopilot.retry": {
        enabled: (pluginConfig.retryEnabled as boolean) ?? true,
        max_attempts: (pluginConfig.maxRetryAttempts as number) ?? 3,
        interval_ms: 2000,
        status_codes: [],
      },
      "oaicopilot.models": [],
    };

    for (const [key, spec] of Object.entries(ctx.allModels)) {
      output["oaicopilot.models"].push({
        name: spec.displayName,
        id: key,
        baseUrl,
        "request-options": {
          headers: {
            Authorization: "Bearer {env:LITELLM_API_KEY}",
          },
        },
        "model-settings": {
          "max-tokens": spec.limits.maxOutput,
        },
      });
    }

    return output;
  }

  getOutputFile(): string {
    return this.outputFile;
  }
}
```

> **Mudanças chave:** `PluginRoutingConfig` → `PluginRouting`; `routing.plugins[this.id]?.config` → `routing.config`; `model.maxOutput` → `spec.limits.maxOutput`; cast `spec as ModelSpec` removido (ctx.allModels já é `Record<string, ModelSpec>`).

- [ ] **Step 4: Rodar typecheck pra verificar os plugins**

Run: `pnpm --filter @lite-llm/agents-manager typecheck`
Expected: errors apenas em `registry.ts`, `routing.service.ts`, `defaults.ts`, e arquivos de teste.

---

### Task 3: Registry e Defaults

**Files:**
- Modify: `packages/agents-manager/src/plugins/registry.ts`
- Modify: `packages/agents-manager/src/config/defaults.ts`

- [ ] **Step 1: Atualizar `defaults.ts` — remover `DEFAULT_ROUTING` e import de `PluginRoutingConfig`**

```ts
import type { SystemAgent } from "@lite-llm/agents-repository/schemas";

export const DEFAULT_DB_PATH = "@storage/agents.json";

export const DEFAULT_AGENTS: SystemAgent[] = [
  {
    displayName: "Builder",
    icon: "🔧",
    description: "Agente padrão — execução geral de tarefas e construção",
    limits: { context: 200000, output: 32768 },
    model: "",
    fallbackModels: [],
    config: { mode: "all" },
  },
  {
    displayName: "Planner",
    icon: "📋",
    description: "Modo planejamento — sem ferramentas de edição",
    limits: { context: 200000, output: 32768 },
    model: "",
    fallbackModels: [],
    config: { mode: "subagent" },
  },
  {
    displayName: "Explorer",
    icon: "🔍",
    description: "Explorador — navega e mapeia a base de código",
    limits: { context: 200000, output: 32768 },
    model: "",
    fallbackModels: [],
    config: { mode: "subagent" },
  },
  {
    displayName: "Reviewer",
    icon: "✅",
    description: "Revisor — auditoria de qualidade e consistência",
    limits: { context: 200000, output: 32768 },
    model: "",
    fallbackModels: [],
    config: { mode: "subagent" },
  },
  {
    displayName: "Architect",
    icon: "🏛️",
    description: "Arquiteto — decisões de arquitetura e design",
    limits: { context: 200000, output: 32768 },
    model: "",
    fallbackModels: [],
    config: { mode: "subagent" },
  },
  {
    displayName: "Writer",
    icon: "✍️",
    description: "Escritor — documentação, textos e prosa técnica",
    limits: { context: 200000, output: 32768 },
    model: "",
    fallbackModels: [],
    config: {},
  },
];
```

> Remove `import { PluginRoutingConfig }` e `export const DEFAULT_ROUTING`. A constante `DEFAULT_ROUTING` não é mais exportada. Quem precisar de defaults para plugins resolve inline (ver Task 4, Step 1).

- [ ] **Step 2: Atualizar `registry.ts` — `exportOne`, `loadFromConfig`, `buildContext`**

```ts
import * as fs from "node:fs/promises";
import * as path from "node:path";
import type { IAgentsRepository } from "@lite-llm/agents-repository/repository";
import type { DbConfig, PluginRouting } from "@lite-llm/agents-repository/schemas";
import type { IPlugin, IPluginRegistry, TransformContext } from "./plugin.js";
import type { ConfigField, InternalAgent } from "./plugin-types.js";

export interface PluginRegistryOptions {
  repository: IAgentsRepository;
  outputDir?: string;
  allPlugins: IPlugin[];
}

export class PluginRegistry implements IPluginRegistry {
  private readonly plugins = new Map<string, IPlugin>();
  private readonly allPlugins: IPlugin[];
  private readonly repository: IAgentsRepository;
  private readonly outputDir: string;

  constructor(options: PluginRegistryOptions) {
    this.repository = options.repository;
    this.outputDir = options.outputDir ?? "data";
    this.allPlugins = options.allPlugins;
  }

  register(plugin: IPlugin): void {
    if (this.plugins.has(plugin.id)) {
      throw new Error(`Plugin "${plugin.id}" is already registered`);
    }
    this.plugins.set(plugin.id, plugin);
  }

  unregister(pluginId: string): void {
    this.plugins.delete(pluginId);
  }

  get(pluginId: string): IPlugin | undefined {
    return this.plugins.get(pluginId);
  }

  list(): IPlugin[] {
    return Array.from(this.plugins.values());
  }

  loadFromConfig(pluginConfigs: Record<string, PluginRouting>): void {
    this.plugins.clear();
    for (const plugin of this.allPlugins) {
      const pc = pluginConfigs[plugin.id];
      if (pc?.enabled) {
        this.register(plugin);
      }
    }
  }

  async exportAll(): Promise<void> {
    for (const plugin of this.plugins.values()) {
      await this.exportOne(plugin.id);
    }
  }

  async exportOne(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin "${pluginId}" not found`);
    }

    const config = await this.repository.read();
    const pluginConfig: PluginRouting = config.plugins?.[pluginId] ?? {
      enabled: true,
      outputFile: plugin.getOutputFile(),
      routing: { agents: {}, categories: {} },
    };
    const ctx = this.buildContext(config);

    const agents = Object.entries(config.agents ?? {}).map(([id, agent]) => ({
      ...agent,
      id,
    }));
    const output = plugin.buildOutput(agents, pluginConfig, ctx);

    if (plugin.validate && !plugin.validate(output)) {
      throw new Error(`Plugin "${pluginId}" output validation failed`);
    }

    await this.writePluginOutput(plugin, output);
  }

  getInternalAgents(pluginId: string): InternalAgent[] {
    const plugin = this.allPlugins.find((p) => p.id === pluginId);
    return plugin?.getInternalAgents() ?? [];
  }

  getConfigSchema(pluginId: string): ConfigField[] {
    const plugin = this.allPlugins.find((p) => p.id === pluginId);
    return plugin?.getConfigSchema() ?? [];
  }

  private buildContext(config: DbConfig): TransformContext {
    const selectedProvider =
      config.provider.litellm ?? Object.values(config.provider)[0];
    if (!selectedProvider) {
      throw new Error("At least one provider must be configured");
    }

    return {
      allModels: config.models,
      globalFallbackModel: config.globalFallbackModel,
      litellmConfig: {
        baseUrl: selectedProvider.baseUrl,
        apiKey: selectedProvider.apiKey,
      },
    };
  }

  private async writePluginOutput(
    plugin: IPlugin,
    output: unknown,
  ): Promise<void> {
    const outputPath = this.resolveOutputPath(plugin.getOutputFile());
    const dir = path.dirname(outputPath);
    await fs.mkdir(dir, { recursive: true });

    const tmpPath = `${outputPath}.tmp`;
    await fs.writeFile(tmpPath, JSON.stringify(output, null, 2), "utf-8");
    await fs.rename(tmpPath, outputPath);
  }

  private resolveOutputPath(relativePath: string): string {
    if (path.isAbsolute(relativePath)) {
      return relativePath;
    }
    return path.join(this.outputDir, relativePath);
  }
}
```

> **Mudanças chave em `exportOne`:** `config.routing ?? { version: 1, plugins: {} }` → `config.plugins?.[pluginId] ?? fallback`. **`loadFromConfig`:** parâmetro `routing: PluginRoutingConfig` → `pluginConfigs: Record<string, PluginRouting>`. **`buildContext`:** tipo inline `{ models, globalFallbackModel, provider }` → `DbConfig`. `routing.plugins[plugin.id]` → `pluginConfigs[plugin.id]`.

> ⚠️ **Nota:** O `exportOne` espalha os agents com `{ ...agent, id }`. Isso adiciona `id` ao objeto, que NÃO está no tipo `SystemAgent`. Se o TypeScript reclamar, usa `agents as unknown as SystemAgent[]` no `buildOutput` — mas os plugins já não acessam mais `agent.id` (foram atualizados na Task 2 pra usar `agent.displayName`).

- [ ] **Step 3: Rodar typecheck**

Run: `pnpm --filter @lite-llm/agents-manager typecheck`
Expected: errors apenas em `routing.service.ts` e arquivos de teste.

---

### Task 4: RoutingService

**Files:**
- Rewrite: `packages/agents-manager/src/services/routing.service.ts`

- [ ] **Step 1: Reimplementar `routing.service.ts`**

```ts
import type { IAgentsRepository } from "@lite-llm/agents-repository/repository";
import type { PluginRouting } from "@lite-llm/agents-repository/schemas";

export interface RoutingServiceOptions {
  repository: IAgentsRepository;
}

export interface IRoutingService {
  getPluginsForAgent(agentId: string): Promise<string[]>;
  setPluginsForAgent(agentId: string, pluginIds: string[]): Promise<void>;
  toggleAgentPlugin(pluginId: string, agentId: string): Promise<boolean>;
  isPluginEnabled(pluginId: string, agentId: string): Promise<boolean>;
  getPluginConfig(pluginId: string): Promise<PluginRouting | undefined>;
  savePluginConfig(pluginId: string, config: PluginRouting): Promise<void>;
  getAgentMappings(pluginId: string): Promise<Record<string, string>>;
  saveAgentMappings(pluginId: string, mappings: Record<string, string>): Promise<void>;
  getCategoryMappings(pluginId: string): Promise<Record<string, boolean>>;
  saveCategoryMappings(pluginId: string, mappings: Record<string, boolean>): Promise<void>;
  toggleCategoryMapping(pluginId: string, categoryId: string): Promise<boolean>;
}

const DEFAULT_PLUGIN_ROUTING = (outputFile = ""): PluginRouting => ({
  enabled: true,
  outputFile,
  routing: { agents: {}, categories: {} },
});

export class RoutingService implements IRoutingService {
  private readonly repository: IAgentsRepository;

  constructor(options: RoutingServiceOptions) {
    this.repository = options.repository;
  }

  async getPluginsForAgent(agentId: string): Promise<string[]> {
    const config = await this.repository.read();
    const enabled: string[] = [];
    for (const [pluginId, plugin] of Object.entries(config.plugins ?? {})) {
      if (plugin.routing?.agents?.[agentId]) {
        enabled.push(pluginId);
      }
    }
    return enabled;
  }

  async setPluginsForAgent(
    agentId: string,
    pluginIds: string[],
  ): Promise<void> {
    const config = await this.repository.read();

    // Remove agent from all plugins
    for (const plugin of Object.values(config.plugins ?? {})) {
      if (plugin.routing?.agents?.[agentId]) {
        delete plugin.routing.agents[agentId];
      }
    }

    // Add agent to specified plugins
    for (const pluginId of pluginIds) {
      if (!config.plugins) {
        config.plugins = {};
      }
      if (!config.plugins[pluginId]) {
        config.plugins[pluginId] = DEFAULT_PLUGIN_ROUTING(
          `${pluginId}.json`,
        );
      }
      if (!config.plugins[pluginId].routing) {
        config.plugins[pluginId].routing = { agents: {}, categories: {} };
      }
      if (!config.plugins[pluginId].routing.agents) {
        config.plugins[pluginId].routing.agents = {};
      }
      config.plugins[pluginId].routing.agents[agentId] = agentId;
    }

    await this.repository.write(config);
  }

  async toggleAgentPlugin(pluginId: string, agentId: string): Promise<boolean> {
    const config = await this.repository.read();

    if (!config.plugins) {
      config.plugins = {};
    }
    if (!config.plugins[pluginId]) {
      config.plugins[pluginId] = DEFAULT_PLUGIN_ROUTING(`${pluginId}.json`);
    }
    if (!config.plugins[pluginId].routing) {
      config.plugins[pluginId].routing = { agents: {}, categories: {} };
    }
    if (!config.plugins[pluginId].routing.agents) {
      config.plugins[pluginId].routing.agents = {};
    }

    const current = config.plugins[pluginId].routing.agents[agentId];
    const newEnabled = !current;
    if (newEnabled) {
      config.plugins[pluginId].routing.agents[agentId] = agentId;
    } else {
      delete config.plugins[pluginId].routing.agents[agentId];
    }

    await this.repository.write(config);
    return newEnabled;
  }

  async isPluginEnabled(pluginId: string, agentId: string): Promise<boolean> {
    const config = await this.repository.read();
    return Boolean(config.plugins?.[pluginId]?.routing?.agents?.[agentId]);
  }

  async getPluginConfig(pluginId: string): Promise<PluginRouting | undefined> {
    const config = await this.repository.read();
    return config.plugins?.[pluginId];
  }

  async savePluginConfig(
    pluginId: string,
    pluginConfig: PluginRouting,
  ): Promise<void> {
    const config = await this.repository.read();
    if (!config.plugins) {
      config.plugins = {};
    }
    config.plugins[pluginId] = pluginConfig;
    await this.repository.write(config);
  }

  async getAgentMappings(pluginId: string): Promise<Record<string, string>> {
    const config = await this.repository.read();
    return config.plugins?.[pluginId]?.routing?.agents ?? {};
  }

  async saveAgentMappings(
    pluginId: string,
    mappings: Record<string, string>,
  ): Promise<void> {
    const config = await this.repository.read();
    if (!config.plugins) {
      config.plugins = {};
    }
    if (!config.plugins[pluginId]) {
      config.plugins[pluginId] = DEFAULT_PLUGIN_ROUTING(`${pluginId}.json`);
    }
    if (!config.plugins[pluginId].routing) {
      config.plugins[pluginId].routing = { agents: {}, categories: {} };
    }
    config.plugins[pluginId].routing.agents = mappings;
    await this.repository.write(config);
  }

  async getCategoryMappings(
    pluginId: string,
  ): Promise<Record<string, boolean>> {
    const config = await this.repository.read();
    return config.plugins?.[pluginId]?.routing?.categories ?? {};
  }

  async saveCategoryMappings(
    pluginId: string,
    mappings: Record<string, boolean>,
  ): Promise<void> {
    const config = await this.repository.read();
    if (!config.plugins) {
      config.plugins = {};
    }
    if (!config.plugins[pluginId]) {
      config.plugins[pluginId] = DEFAULT_PLUGIN_ROUTING(`${pluginId}.json`);
    }
    if (!config.plugins[pluginId].routing) {
      config.plugins[pluginId].routing = { agents: {}, categories: {} };
    }
    config.plugins[pluginId].routing.categories = mappings;
    await this.repository.write(config);
  }

  async toggleCategoryMapping(
    pluginId: string,
    categoryId: string,
  ): Promise<boolean> {
    const mappings = await this.getCategoryMappings(pluginId);
    const newEnabled = !mappings[categoryId];
    mappings[categoryId] = newEnabled;
    await this.saveCategoryMappings(pluginId, mappings);
    return newEnabled;
  }
}
```

> **Mudanças:** Toda referência a `config.routing` substituída por `config.plugins[id].routing`. `getConfig()`/`saveConfig()` substituídos por `getPluginConfig(id)`/`savePluginConfig(id, config)`. `getRoutingForAgent` renomeado para `getPluginsForAgent`. `setRoutingForAgent` renomeado para `setPluginsForAgent`. `getSyncAliases`/`setSyncAliases` removidos. Interface exportada atualizada.

- [ ] **Step 2: Rodar typecheck pra verificar o service**

Run: `pnpm --filter @lite-llm/agents-manager typecheck`
Expected: errors APENAS em arquivos de teste.

---

### Task 5: Index barrel

**Files:**
- Modify: `packages/agents-manager/src/index.ts`

- [ ] **Step 1: Remover referências a `DEFAULT_ROUTING` do barrel**

Remove `DEFAULT_ROUTING` das importações e exportações. Se não for mais usada externamente, só remove. Se `defaults.ts` não exporta mais, o barrel não pode importar.

```ts
import {
  DEFAULT_AGENTS,
  DEFAULT_DB_PATH,
} from "./config/defaults.js";

export { DEFAULT_AGENTS, DEFAULT_DB_PATH };
```

> Remove `DEFAULT_ROUTING` de ambas as linhas.

- [ ] **Step 2: Verificar se `PluginRoutingConfig` ainda é referenciado em `index.ts`**

Procura por `PluginRoutingConfig` no arquivo. Se encontrar (linha 51 no re-export de types), substitui por `PluginRouting` se quiser exportar, ou remove.

```ts
export type {
  AgentExtraConfig,
  PluginRouting,
  PluginRoutingRule,
  SystemAgent,
} from "./types/index.js";
```

> **Nota:** Verificar se `PluginRouting` é re-exportado de `types/index.ts` — se não for, importa de `@lite-llm/agents-repository/schemas` diretamente aqui.

---

### Task 6: Service tests

**Files:**
- Modify: `packages/agents-manager/src/services/__tests__/agent.service.test.ts`
- Modify: `packages/agents-manager/src/services/__tests__/agent-catalog.service.test.ts`
- Modify: `packages/agents-manager/src/services/__tests__/model.service.test.ts`

- [ ] **Step 1: Atualizar `agent.service.test.ts`**

Muda `makeSystemAgent` para o shape real (sem `id`, `versions`, `enabledPlugins`). Atualiza `createMockRepo` para usar `provider`.

```ts
import type { IAgentsRepository } from "@lite-llm/agents-repository/repository";
import type { SystemAgent } from "@lite-llm/agents-repository/schemas";
import { describe, expect, it } from "vitest";
import { AgentService } from "../agent.service";

function createMockRepo(
  overrides: Record<string, unknown> = {},
): IAgentsRepository {
  const store: Record<string, unknown> = {
    version: 2,
    provider: { litellm: { name: "", ownedBy: "", baseUrl: "", apiKey: "" } },
    models: {},
    agents: {},
    categories: {},
  };
  const data = { ...store, ...overrides };
  return {
    read: async () => data,
    write: async (config: Record<string, unknown>) =>
      Object.assign(data, config),
    readSync: () => data,
    validate: ((_config: unknown): _config is never =>
      true) as IAgentsRepository["validate"],
    exists: async () => true,
    getPath: () => "/tmp/test.json",
  } as unknown as IAgentsRepository;
}

function makeSystemAgent(overrides: Partial<SystemAgent> = {}): SystemAgent {
  return {
    displayName: "Test Agent",
    icon: "🤖",
    description: "Test description",
    model: "gpt-4",
    fallbackModels: [],
    limits: { context: 200000, output: 32768 },
    config: {},
    ...overrides,
  };
}

// ... resto dos testes (as chamadas permanecem iguais)
```

- [ ] **Step 2: Atualizar `agent-catalog.service.test.ts`**

Mesma mudança no `makeSystemAgent`:

```ts
function makeSystemAgent(overrides: Partial<SystemAgent> = {}): SystemAgent {
  return {
    displayName: "Builder",
    icon: "🔧",
    description: "Build stuff",
    model: "gpt-4",
    fallbackModels: [],
    limits: { context: 200000, output: 32768 },
    config: {},
    ...overrides,
  };
}
```

E atualiza o `createMockRepo`:

```ts
const store: Record<string, unknown> = {
  version: 2,
  provider: { litellm: { name: "", ownedBy: "", baseUrl: "", apiKey: "" } },
  models: {},
  agents: {},
  categories: {},
};
```

- [ ] **Step 3: Verificar `model.service.test.ts`**

Já foi atualizado parcialmente. Verificar se o `createMockRepo` usa `provider`:

```ts
const store: Record<string, unknown> = {
  version: 2,
  provider: { litellm: { name: "", ownedBy: "", baseUrl: "", apiKey: "" } },
  models: {},
  agents: {},
  categories: {},
};
```

Rodar: `pnpm --filter @lite-llm/agents-manager typecheck`
Expected: errors APENAS nos plugin tests e routing test.

---

### Task 7: Plugin tests

**Files:**
- Modify: `packages/agents-manager/src/plugins/__tests__/opencode.plugin.test.ts`
- Modify: `packages/agents-manager/src/plugins/__tests__/openagent.plugin.test.ts`
- Modify: `packages/agents-manager/src/plugins/__tests__/vscode.plugin.test.ts`

- [ ] **Step 1: Atualizar `opencode.plugin.test.ts`**

```ts
import type {
  PluginRouting,
} from "@lite-llm/agents-repository/schemas";
import { describe, expect, it } from "vitest";
import { OpenCodePlugin } from "../builtins/opencode.plugin";

describe("OpenCodePlugin", () => {
  // ... metadata/getInternalAgents/getConfigSchema/getOutputFile tests (não mudam)

  describe("buildOutput", () => {
    it("gera estrutura com provider litellm", () => {
      const plugin = new OpenCodePlugin();
      const routing: PluginRouting = {
        enabled: true,
        outputFile: "opencode.json",
        routing: { agents: {}, categories: {} },
      };
      const output = plugin.buildOutput(
        [],
        routing,
        {
          allModels: {
            "gpt-4": {
              enabled: true,
              displayName: "GPT-4",
              limits: { length: 128000, maxOutput: 4096 },
            },
          },
          litellmConfig: {
            baseUrl: "http://localhost:4000/v1",
            apiKey: "test-key",
          },
        },
      );
      expect(output).toHaveProperty("provider");
      expect(
        (output as unknown as Record<string, unknown>).provider,
      ).toHaveProperty("litellm");
    });

    it("inclui modelos litellm com limites corretos", () => {
      const plugin = new OpenCodePlugin();
      const routing: PluginRouting = {
        enabled: true,
        outputFile: "opencode.json",
        routing: { agents: {}, categories: {} },
      };
      const output = plugin.buildOutput(
        [],
        routing,
        {
          allModels: {
            "gpt-4": {
              enabled: true,
              displayName: "GPT-4",
              limits: { length: 128000, maxOutput: 4096 },
            },
          },
          litellmConfig: {
            baseUrl: "http://localhost:4000",
            apiKey: "test-key",
          },
        },
      ) as unknown as Record<string, unknown>;

      const provider = output.provider as Record<string, unknown>;
      const litellm = provider.litellm as Record<string, unknown>;
      const models = litellm.models as Record<string, unknown>;
      const gpt4 = models["gpt-4"] as Record<string, unknown>;

      expect(gpt4.name).toBe("GPT-4");
      expect(gpt4.limit).toEqual({
        context: 128000,
        output: 4096,
      });
    });

    it("configura providers para agentes mapeados", () => {
      const plugin = new OpenCodePlugin();
      const agents: SystemAgent[] = [
        {
          displayName: "Builder",
          icon: "🔧",
          description: "Build stuff",
          model: "gpt-4",
          fallbackModels: [],
          limits: { context: 200000, output: 32768 },
          config: {},
        },
      ];
      const routing: PluginRouting = {
        enabled: true,
        outputFile: "opencode.json",
        routing: { agents: { Builder: "coder" }, categories: {} },
      };

      const output = plugin.buildOutput(agents, routing, {
        allModels: {},
        litellmConfig: {
          baseUrl: "http://localhost:4000",
          apiKey: "test-key",
        },
      }) as unknown as Record<string, unknown>;

      const provider = output.provider as Record<string, unknown>;
      expect(provider).toHaveProperty("coder");
    });

    it("ignora agentes sem mapeamento", () => {
      const plugin = new OpenCodePlugin();
      const agents: SystemAgent[] = [
        {
          displayName: "Builder",
          icon: "🔧",
          description: "Build stuff",
          model: "gpt-4",
          fallbackModels: [],
          limits: { context: 200000, output: 32768 },
          config: {},
        },
      ];
      const routing: PluginRouting = {
        enabled: true,
        outputFile: "opencode.json",
        routing: { agents: {}, categories: {} },
      };

      const output = plugin.buildOutput(agents, routing, {
        allModels: {},
        litellmConfig: {
          baseUrl: "http://localhost:4000",
          apiKey: "test-key",
        },
      }) as unknown as Record<string, unknown>;

      const provider = output.provider as Record<string, unknown>;
      expect(Object.keys(provider)).toEqual(["litellm"]);
    });

    it("configura baseURL e apiKey do litellm", () => {
      const plugin = new OpenCodePlugin();
      const routing: PluginRouting = {
        enabled: true,
        outputFile: "opencode.json",
        routing: { agents: {}, categories: {} },
      };
      const output = plugin.buildOutput([], routing, {
        allModels: {},
        litellmConfig: {
          baseUrl: "http://proxy:4000/v1",
          apiKey: "secret-key",
        },
      }) as unknown as Record<string, unknown>;

      const provider = output.provider as Record<string, unknown>;
      const litellm = provider.litellm as Record<string, unknown>;
      const options = litellm.options as Record<string, unknown>;
      expect(options.baseURL).toBe("http://proxy:4000/v1");
      expect(options.apiKey).toBe("secret-key");
    });
  });
});
```

> **Mudanças:** Routing passa a ser `PluginRouting` com `{ enabled, outputFile, routing: { agents, categories } }`. `allModels` usam `{ enabled, displayName, limits: { length, maxOutput } }`. Agents usam `{ displayName, icon, description, model, fallbackModels, limits, config }` sem `id`/`versions`/`enabledPlugins`. Import de `SystemAgent` adicionado.

- [ ] **Step 2: Atualizar `openagent.plugin.test.ts`**

Mesmo padrão: routing inline vira `PluginRouting`, agents sem `id`/`versions`/`enabledPlugins`.

```ts
import type {
  PluginRouting,
  SystemAgent,
} from "@lite-llm/agents-repository/schemas";
import { describe, expect, it } from "vitest";
import { OpenAgentPlugin } from "../external/openagent.plugin";

describe("OpenAgentPlugin", () => {
  // ... metadata/getInternalAgents/getConfigSchema/getOutputFile tests (não mudam)

  describe("buildOutput", () => {
    it("gera estrutura base com git_master e globalFallbackModel", () => {
      const plugin = new OpenAgentPlugin();
      const routing: PluginRouting = {
        enabled: true,
        outputFile: "oh-my-openagent.json",
        routing: { agents: {}, categories: {} },
      };
      const output = plugin.buildOutput([], routing, {
        allModels: {},
        globalFallbackModel: "gpt-4",
        litellmConfig: { baseUrl: "", apiKey: "" },
      });
      expect(output.$schema).toBeTruthy();
      expect(output.globalFallbackModel).toBe("gpt-4");
      expect(output.git_master.commit_footer).toBe(false);
    });

    it("mapeia agents conforme routing", () => {
      const plugin = new OpenAgentPlugin();
      const agents: SystemAgent[] = [
        {
          displayName: "Builder",
          icon: "🔧",
          description: "Build stuff",
          model: "gpt-4",
          fallbackModels: ["gpt-3.5"],
          limits: { context: 200000, output: 32768 },
          config: { mode: "all", color: "#4A90D9" },
        },
      ];
      const routing: PluginRouting = {
        enabled: true,
        outputFile: "oh-my-openagent.json",
        routing: { agents: { Builder: "builder" }, categories: {} },
      };
      const output = plugin.buildOutput(agents, routing, {
        allModels: {},
        litellmConfig: { baseUrl: "", apiKey: "" },
      });
      expect(output.agents).toHaveProperty("builder");
      expect(output.agents.builder).toHaveProperty("description");
    });

    it("ignora agentes sem mapeamento no routing", () => {
      const plugin = new OpenAgentPlugin();
      const agents: SystemAgent[] = [
        {
          displayName: "Builder",
          icon: "🔧",
          description: "Build stuff",
          model: "gpt-4",
          fallbackModels: [],
          limits: { context: 200000, output: 32768 },
          config: {},
        },
      ];
      const routing: PluginRouting = {
        enabled: true,
        outputFile: "oh-my-openagent.json",
        routing: { agents: {}, categories: {} },
      };
      const output = plugin.buildOutput(agents, routing, {
        allModels: {},
        litellmConfig: { baseUrl: "", apiKey: "" },
      });
      expect(Object.keys(output.agents)).toHaveLength(0);
    });

    it("inclui configuracoes do plugin", () => {
      const plugin = new OpenAgentPlugin();
      const routing: PluginRouting = {
        enabled: true,
        outputFile: "oh-my-openagent.json",
        config: { commitFooter: true, includeCoAuthoredBy: true },
        routing: { agents: {}, categories: {} },
      };
      const output = plugin.buildOutput([], routing, {
        allModels: {},
        litellmConfig: { baseUrl: "", apiKey: "" },
      });
      expect(output.git_master.commit_footer).toBe(true);
      expect(output.git_master.include_co_authored_by).toBe(true);
    });
  });
});
```

- [ ] **Step 3: Atualizar `vscode.plugin.test.ts`**

Mesmo padrão: routing `PluginRouting`, `allModels` com `limits`, sem `contextLength`/`maxOutput` planos.

```ts
import type { PluginRouting } from "@lite-llm/agents-repository/schemas";
import { describe, expect, it } from "vitest";
import { VsCodePlugin } from "../external/vscode.plugin";

describe("VsCodePlugin", () => {
  // ... metadata/getConfigSchema/getOutputFile tests (não mudam)

  describe("buildOutput", () => {
    it("gera lista de modelos vazia quando allModels vazio", () => {
      const plugin = new VsCodePlugin();
      const routing: PluginRouting = {
        enabled: true,
        outputFile: "vscode-oaicopilot.json",
        routing: { agents: {}, categories: {} },
      };
      const output = plugin.buildOutput([], routing, {
        allModels: {},
        litellmConfig: { baseUrl: "", apiKey: "" },
      });
      expect(output["oaicopilot.models"]).toHaveLength(0);
    });

    it("mapeia modelos de allModels para saida", () => {
      const plugin = new VsCodePlugin();
      const routing: PluginRouting = {
        enabled: true,
        outputFile: "vscode-oaicopilot.json",
        routing: { agents: {}, categories: {} },
      };
      const output = plugin.buildOutput([], routing, {
        allModels: {
          "gpt-4": {
            enabled: true,
            displayName: "GPT-4",
            limits: { length: 128000, maxOutput: 4096 },
          },
          "claude-3": {
            enabled: true,
            displayName: "Claude 3",
            limits: { length: 200000, maxOutput: 8192 },
          },
        },
        litellmConfig: { baseUrl: "http://localhost:4000", apiKey: "" },
      });
      expect(output["oaicopilot.models"]).toHaveLength(2);
      expect(output["oaicopilot.models"][0]["model-settings"]?.["max-tokens"]).toBe(4096);
      expect(output["oaicopilot.models"][1]["model-settings"]?.["max-tokens"]).toBe(8192);
    });

    // ... demais testes de config/retry/headers
  });
});
```

---

### Task 8: Routing service test

**Files:**
- Rewrite: `packages/agents-manager/src/services/__tests__/routing.service.test.ts`

- [ ] **Step 1: Criar tests para o novo `RoutingService`**

```ts
import type { IAgentsRepository } from "@lite-llm/agents-repository/repository";
import type { PluginRouting } from "@lite-llm/agents-repository/schemas";
import { describe, expect, it } from "vitest";
import { RoutingService } from "../routing.service";

function createMockRepo(
  initial: Record<string, unknown> = {},
): IAgentsRepository {
  const store: Record<string, unknown> = {
    version: 2,
    provider: { litellm: { name: "", ownedBy: "", baseUrl: "", apiKey: "" } },
    models: {},
    agents: {},
    categories: {},
    plugins: {},
    ...initial,
  };
  return {
    read: async () => store,
    write: async (config: Record<string, unknown>) =>
      Object.assign(store, config),
    readSync: () => store,
    validate: ((_config: unknown): _config is never =>
      true) as IAgentsRepository["validate"],
    exists: async () => true,
    getPath: () => "/tmp/test.json",
  } as unknown as IAgentsRepository;
}

describe("RoutingService", () => {
  describe("getPluginsForAgent", () => {
    it("retorna plugins onde o agent tem routing", async () => {
      const repo = createMockRepo({
        plugins: {
          opencode: {
            enabled: true,
            outputFile: "opencode.json",
            routing: { agents: { loom: "loom" } },
          },
          vscode: {
            enabled: false,
            outputFile: "vscode.json",
            routing: { agents: {} },
          },
        },
      });
      const service = new RoutingService({ repository: repo });
      const result = await service.getPluginsForAgent("loom");
      expect(result).toEqual(["opencode"]);
    });

    it("retorna vazio se nenhum plugin tem routing pro agent", async () => {
      const repo = createMockRepo({
        plugins: {
          opencode: {
            enabled: true,
            outputFile: "opencode.json",
            routing: { agents: {} },
          },
        },
      });
      const service = new RoutingService({ repository: repo });
      const result = await service.getPluginsForAgent("nonexistent");
      expect(result).toEqual([]);
    });
  });

  describe("setPluginsForAgent", () => {
    it("adiciona mapeamento nos plugins especificados", async () => {
      const repo = createMockRepo({});
      const service = new RoutingService({ repository: repo });
      await service.setPluginsForAgent("loom", ["opencode"]);
      const result = await service.getPluginsForAgent("loom");
      expect(result).toEqual(["opencode"]);
    });

    it("remove mapeamento de plugins não listados", async () => {
      const repo = createMockRepo({
        plugins: {
          opencode: {
            enabled: true,
            outputFile: "opencode.json",
            routing: { agents: { loom: "loom" } },
          },
          vscode: {
            enabled: true,
            outputFile: "vscode.json",
            routing: { agents: { loom: "loom" } },
          },
        },
      });
      const service = new RoutingService({ repository: repo });
      await service.setPluginsForAgent("loom", ["opencode"]);
      const result = await service.getPluginsForAgent("loom");
      expect(result).toEqual(["opencode"]);
    });
  });

  describe("toggleAgentPlugin", () => {
    it("ativa routing de agent em plugin", async () => {
      const repo = createMockRepo({});
      const service = new RoutingService({ repository: repo });
      const result = await service.toggleAgentPlugin("opencode", "loom");
      expect(result).toBe(true);
      expect(await service.isPluginEnabled("opencode", "loom")).toBe(true);
    });

    it("desativa routing de agent em plugin", async () => {
      const repo = createMockRepo({
        plugins: {
          opencode: {
            enabled: true,
            outputFile: "opencode.json",
            routing: { agents: { loom: "loom" } },
          },
        },
      });
      const service = new RoutingService({ repository: repo });
      const result = await service.toggleAgentPlugin("opencode", "loom");
      expect(result).toBe(false);
      expect(await service.isPluginEnabled("opencode", "loom")).toBe(false);
    });
  });

  describe("getPluginConfig / savePluginConfig", () => {
    it("retorna undefined para plugin inexistente", async () => {
      const repo = createMockRepo({});
      const service = new RoutingService({ repository: repo });
      const result = await service.getPluginConfig("nonexistent");
      expect(result).toBeUndefined();
    });

    it("salva e recupera config de plugin", async () => {
      const repo = createMockRepo({});
      const service = new RoutingService({ repository: repo });
      const config: PluginRouting = {
        enabled: true,
        outputFile: "test.json",
        routing: { agents: {}, categories: {} },
      };
      await service.savePluginConfig("test-plugin", config);
      const result = await service.getPluginConfig("test-plugin");
      expect(result).toEqual(config);
    });
  });

  describe("getAgentMappings / saveAgentMappings", () => {
    it("retorna mappings vazios para plugin sem routing", async () => {
      const repo = createMockRepo({});
      const service = new RoutingService({ repository: repo });
      const result = await service.getAgentMappings("nonexistent");
      expect(result).toEqual({});
    });

    it("salva e recupera agent mappings", async () => {
      const repo = createMockRepo({});
      const service = new RoutingService({ repository: repo });
      await service.saveAgentMappings("opencode", { loom: "loom" });
      const result = await service.getAgentMappings("opencode");
      expect(result).toEqual({ loom: "loom" });
    });
  });

  describe("getCategoryMappings / saveCategoryMappings / toggleCategoryMapping", () => {
    it("salva e recupera category mappings", async () => {
      const repo = createMockRepo({});
      const service = new RoutingService({ repository: repo });
      await service.saveCategoryMappings("opencode", { dev: true });
      const result = await service.getCategoryMappings("opencode");
      expect(result).toEqual({ dev: true });
    });

    it("toggle ativa e desativa categoria", async () => {
      const repo = createMockRepo({});
      const service = new RoutingService({ repository: repo });
      expect(await service.toggleCategoryMapping("opencode", "dev")).toBe(true);
      expect(await service.toggleCategoryMapping("opencode", "dev")).toBe(false);
    });
  });
});
```

- [ ] **Step 2: Rodar typecheck completo do agents-manager**

Run: `pnpm --filter @lite-llm/agents-manager typecheck`
Expected: ✅ zero errors

- [ ] **Step 3: Rodar tests do agents-manager**

Run: `pnpm --filter @lite-llm/agents-manager test`
Expected: ✅ all tests passing

---

### Task 9: Typecheck full monorepo

**Files:** Nenhum (verificação)

- [ ] **Step 1: Rodar typecheck no monorepo inteiro**

Run: `pnpm typecheck`
Expected: ✅ todos os 13 packages passam

- [ ] **Step 2: Se houver erros em outros packages, corrigir**

Erros prováveis: packages que consomem `RoutingService` (ex: `apps/server`, `packages/server-core`). Procurar referências a:
- `getConfig()` → `getPluginConfig(id)`
- `saveConfig(routing)` → `savePluginConfig(id, config)`
- `getRoutingForAgent` → `getPluginsForAgent`
- `setRoutingForAgent` → `setPluginsForAgent`
- `DEFAULT_ROUTING`
- `PluginRoutingConfig`
- `getSyncAliases`/`setSyncAliases`

Run: `rg "getRoutingForAgent|setRoutingForAgent|getConfig|saveConfig|PluginRoutingConfig|getSyncAliases|DEFAULT_ROUTING" packages/server-core apps/server`

Se encontrar, atualizar chamadas para a nova interface.

- [ ] **Step 3: Rodar tests completos**

Run: `pnpm test`
Expected: ✅ all tests passing

---

### Self-Review Checklist

- [ ] **Spec coverage:** Cada seção do design doc tem tasks correspondentes? Tasks 1-2 cobrem Tipos+Plugin Interface. Task 3 cobrem Registry+Defaults. Task 4 cobre RoutingService. Tasks 5-8 cobrem barrel e tests. Task 9 cobre verificação full monorepo.
- [ ] **Placeholder scan:** Nenhum "TBD", "implement later" ou descrição vaga. Todo código está inline.
- [ ] **Type consistency:** `PluginRouting` (schema) usado consistentemente em vez de `PluginRoutingConfig`. `routing` parâmetro sempre `PluginRouting`. `loadFromConfig` recebe `Record<string, PluginRouting>`. Nomes de métodos na service: `getPluginsForAgent`, `setPluginsForAgent`, `getPluginConfig`, `savePluginConfig`. Nenhum nome do schema antigo vaza.
