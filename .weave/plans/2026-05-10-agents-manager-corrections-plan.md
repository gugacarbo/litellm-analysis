# agents-manager — Plano de Implementação

> **Para execução agentic:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) ou superpowers:executing-plans para executar este plano tarefa por tarefa. Steps usam checkbox (`- [ ]`) para rastreamento.

**Goal:** Refatorar o agents-manager para usar DI, nova interface IPlugin unificada com agentes internos e config schema, remover todo código legacy, implementar 3 novos endpoints e a página `/plugins/:pluginId` no frontend.

**Architecture:** 4 pacotes modificados em paralelo — `agents-repository` (schema), `agents-manager` (SDK), `server-core` (DI + endpoints), `web` (UI). O SDK deve estar pronto antes das routes, mas frontend pode ser feito em paralelo. Sem backward-compat, sem legacy.

**Tech Stack:** TypeScript strict, Zod schemas, Express.js routes, React 19 + shadcn/ui, Vitest, Biome 2.x, React Query, TanStack Router

**Spec completa:** `.weave/plans/agents-manager-corrections.md`

---

## Ordem de Execução

```
Fase 1 — Foundation (agents-repository + agents-manager SDK)
  Task 1-6: Schema, tipos, IPlugin, registry, services, plugins

Fase 2 — Server (server-core)
  Task 7-9: DI, endpoints, app-runtime

Fase 3 — Frontend (web) — pode começar após Task 4
  Task 10-13: API client, plugins page, plugin config page, integration

Fase 4 — Cleanup + Tests
  Task 14-15: Remoção de código morto, cobertura de testes
```

---

## Fase 1 — Foundation

### Task 1: Schema agents-repository — passthrough + novos campos

**Files:**
- Modify: `repositories/agents-repository/src/schema.ts`
- Test: `repositories/agents-repository/src/repository.test.ts`

- [ ] **Step 1: Adicionar `.passthrough()` ao `dbConfigSchema`**

No final do `dbConfigSchema` (após o `routing`), adicionar `.passthrough()`:

```typescript
export const dbConfigSchema = z.object({
  // ... campos existentes inalterados ...
}).passthrough();
```

Isso permite campos extras no JSONC sem quebrar validação.

- [ ] **Step 2: Atualizar `pluginRoutingSchema` com novos campos**

Substituir `pluginRoutingSchema` para incluir `config`, `agentMappings`, `categoryMappings`:

```typescript
export const pluginRoutingSchema = z.object({
  enabled: z.boolean(),
  outputFile: z.string(),
  config: z.record(z.string(), z.unknown()).optional(),
  agentMappings: z.record(z.string(), z.string()).optional(),
  categoryMappings: z.record(z.string(), z.boolean()).optional(),
  agents: z.record(z.string(), pluginRoutingRuleSchema),
});
```

- [ ] **Step 3: Rodar typecheck do agents-repository**

Run: `pnpm --filter @lite-llm/agents-repository typecheck`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add repositories/agents-repository/src/schema.ts
git commit -m "refactor(repository): add passthrough to dbConfigSchema, add config/agentMappings/categoryMappings to pluginRouting"
```

---

### Task 2: Remover tipos duplicados em agents-manager

**Files:**
- Delete: `packages/agents-manager/src/types/system-agent.ts`
- Delete: `packages/agents-manager/src/types/routing.ts`
- Modify: `packages/agents-manager/src/types/index.ts`
- Modify: `packages/agents-manager/src/index.ts`
- Modify: `packages/agents-manager/src/services/routing.service.ts`
- Modify: `packages/agents-manager/src/plugins/plugin.ts`
- Modify: `packages/agents-manager/src/config/defaults.ts`

- [ ] **Step 1: Reescrever `types/index.ts` para re-exportar de agents-repository**

```typescript
export type {
  AgentExtraConfig,
  AgentVersion,
  PluginRoutingConfig,
  PluginRoutingRule,
  SystemAgent,
} from "@lite-llm/agents-repository/schema";
```

- [ ] **Step 2: Deletar `types/system-agent.ts` e `types/routing.ts`**

```bash
rm packages/agents-manager/src/types/system-agent.ts
rm packages/agents-manager/src/types/routing.ts
```

- [ ] **Step 3: Atualizar imports em `services/routing.service.ts`**

Trocar `import type { PluginRoutingConfig } from "../types/routing.js"` por `import type { PluginRoutingConfig } from "@lite-llm/agents-repository/schema.js"`.

- [ ] **Step 4: Atualizar imports em `plugins/plugin.ts`**

Trocar imports de `../types/` para `@lite-llm/agents-repository/schema.js`.

- [ ] **Step 5: Atualizar imports em `config/defaults.ts`**

Trocar imports de `../types/` para `@lite-llm/agents-repository/schema.js`.

- [ ] **Step 6: Atualizar `index.ts` barrel — remover re-exports locais de tipos duplicados**

Remover do `index.ts` as linhas que re-exportam `AgentExtraConfig`, `AgentVersion`, `PluginRoutingConfig`, `PluginRoutingRule`, `SystemAgent` de `./types/index.js`. Manter re-export de `@lite-llm/agents-repository/schema`.

- [ ] **Step 7: Rodar typecheck do agents-manager**

Run: `pnpm --filter @lite-llm/agents-manager typecheck`
Expected: PASS (erros de import serão corrigidos nos steps anteriores)

- [ ] **Step 8: Commit**

```bash
git add packages/agents-manager/src/types/ packages/agents-manager/src/index.ts packages/agents-manager/src/services/ packages/agents-manager/src/plugins/ packages/agents-manager/src/config/
git commit -m "refactor(agents-manager): remove duplicate types, import from agents-repository"
```

---

### Task 3: Nova interface IPlugin + tipos de suporte

**Files:**
- Create: `packages/agents-manager/src/plugins/plugin-types.ts`
- Modify: `packages/agents-manager/src/plugins/plugin.ts`

- [ ] **Step 1: Criar `plugins/plugin-types.ts` com InternalAgent, ConfigField**

```typescript
export interface InternalAgent {
  id: string;
  displayName: string;
  description: string;
}

export interface ConfigField {
  key: string;
  type: "string" | "number" | "boolean" | "select" | "password";
  label: string;
  required?: boolean;
  default?: unknown;
  options?: { value: string; label: string }[];
  placeholder?: string;
  description?: string;
}
```

- [ ] **Step 2: Reescrever `plugins/plugin.ts` — nova IPlugin unificada**

```typescript
import type {
  ModelSpec,
  PluginRoutingConfig,
  SystemAgent,
} from "@lite-llm/agents-repository/schema";
import type { ConfigField, InternalAgent } from "./plugin-types.js";

export interface TransformContext {
  allModels: Record<string, ModelSpec>;
  globalFallbackModel?: string;
  litellmConfig: { baseUrl: string; apiKey: string };
}

export interface IPlugin {
  readonly id: string;
  readonly name: string;
  readonly version: number;

  getInternalAgents(): InternalAgent[];
  getConfigSchema(): ConfigField[];

  buildOutput(
    agents: SystemAgent[],
    routing: PluginRoutingConfig,
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
  loadFromConfig(routing: PluginRoutingConfig): void;
  exportAll(): Promise<void>;
  exportOne(pluginId: string): Promise<void>;
  getInternalAgents(pluginId: string): InternalAgent[];
  getConfigSchema(pluginId: string): ConfigField[];
}
```

Remover: `PluginModel`, `PluginEntry`, `builtin`, `transformAgent`, `transformEntry`, `transformModel`, `preprocess`, `buildOutputV2`, `buildOutput` (antigo).

- [ ] **Step 3: Rodar typecheck — esperado FAIL nos plugins e registry**

Run: `pnpm --filter @lite-llm/agents-manager typecheck`
Expected: FAIL (OpenCodePlugin, OpenAgentPlugin, VsCodePlugin, PluginRegistry ainda usam interface antiga)

- [ ] **Step 4: Commit**

```bash
git add packages/agents-manager/src/plugins/plugin.ts packages/agents-manager/src/plugins/plugin-types.ts
git commit -m "feat(agents-manager): new unified IPlugin interface with getInternalAgents + getConfigSchema"
```

---

### Task 4: PluginRegistry reescrito

**Files:**
- Modify: `packages/agents-manager/src/plugins/registry.ts`
- Create: `packages/agents-manager/src/plugins/__tests__/registry.test.ts`

- [ ] **Step 1: Escrever testes do registry**

Criar `plugins/__tests__/registry.test.ts`:

```typescript
import type { IPlugin } from "../plugin.js";
import type { InternalAgent } from "../plugin-types.js";
import { PluginRegistry } from "../registry.js";
import { describe, expect, it } from "vitest";

function createMockPlugin(overrides: Partial<IPlugin> = {}): IPlugin {
  return {
    id: "test-plugin",
    name: "Test Plugin",
    version: 1,
    getInternalAgents: () => [{ id: "agent1", displayName: "Agent 1", description: "" }],
    getConfigSchema: () => [],
    buildOutput: () => ({ output: true }),
    getOutputFile: () => "test.json",
    validate: (output) => typeof output === "object" && output !== null,
    ...overrides,
  };
}

describe("PluginRegistry", () => {
  describe("register / unregister / get / list", () => {
    it("registra e lista plugins", () => {
      const registry = new PluginRegistry({
        repository: null as never,
        outputDir: "/tmp",
        allPlugins: [],
      });
      const plugin = createMockPlugin();
      registry.register(plugin);
      expect(registry.list()).toHaveLength(1);
      expect(registry.get("test-plugin")).toBe(plugin);
    });

    it("lança erro ao registrar plugin duplicado", () => {
      const registry = new PluginRegistry({
        repository: null as never,
        outputDir: "/tmp",
        allPlugins: [],
      });
      registry.register(createMockPlugin());
      expect(() => registry.register(createMockPlugin())).toThrow(
        "already registered",
      );
    });

    it("unregister remove plugin", () => {
      const registry = new PluginRegistry({
        repository: null as never,
        outputDir: "/tmp",
        allPlugins: [],
      });
      registry.register(createMockPlugin());
      registry.unregister("test-plugin");
      expect(registry.list()).toHaveLength(0);
    });
  });

  describe("getInternalAgents / getConfigSchema", () => {
    it("delega para o plugin correto", () => {
      const registry = new PluginRegistry({
        repository: null as never,
        outputDir: "/tmp",
        allPlugins: [],
      });
      const plugin = createMockPlugin();
      registry.register(plugin);
      expect(registry.getInternalAgents("test-plugin")).toEqual([
        { id: "agent1", displayName: "Agent 1", description: "" },
      ]);
      expect(registry.getConfigSchema("test-plugin")).toEqual([]);
    });
  });

  describe("loadFromConfig", () => {
    it("registra plugins com enabled: true", () => {
      const registry = new PluginRegistry({
        repository: null as never,
        outputDir: "/tmp",
        allPlugins: [createMockPlugin({ id: "p1" }), createMockPlugin({ id: "p2" })],
      });
      registry.loadFromConfig({
        version: 1,
        plugins: {
          p1: { enabled: true, outputFile: "p1.json", agents: {} },
          p2: { enabled: false, outputFile: "p2.json", agents: {} },
        },
      });
      expect(registry.list()).toHaveLength(1);
      expect(registry.get("p1")?.id).toBe("p1");
    });
  });
});
```

- [ ] **Step 2: Rodar testes — esperado FAIL**

Run: `pnpm --filter @lite-llm/agents-manager test`
Expected: FAIL (PluginRegistry ainda usa interface antiga)

- [ ] **Step 3: Reescrever `registry.ts`**

```typescript
import * as fs from "node:fs/promises";
import * as path from "node:path";
import type {
  IAgentsRepository,
  PluginRoutingConfig,
  SystemAgent,
} from "@lite-llm/agents-repository/schema";
import type {
  ConfigField,
  InternalAgent,
  IPlugin,
  IPluginRegistry,
  TransformContext,
} from "./plugin.js";

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

  loadFromConfig(routing: PluginRoutingConfig): void {
    this.plugins.clear();
    for (const plugin of this.allPlugins) {
      const pluginConfig = routing.plugins[plugin.id];
      if (pluginConfig?.enabled) {
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
    if (!plugin) throw new Error(`Plugin "${pluginId}" not found`);

    const config = await this.repository.read();
    const routing = config.routing ?? { version: 1, plugins: {} };
    const ctx = this.buildContext(config);

    const agents = Object.values(config.systemAgents ?? {});
    const output = plugin.buildOutput(agents, routing, ctx);

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

  private buildContext(config: { models: Record<string, unknown>; globalFallbackModel?: string; litellm: { baseUrl: string; apiKey: string } }): TransformContext {
    return {
      allModels: config.models as TransformContext["allModels"],
      globalFallbackModel: config.globalFallbackModel,
      litellmConfig: config.litellm,
    };
  }

  private async writePluginOutput(plugin: IPlugin, output: unknown): Promise<void> {
    const outputPath = this.resolveOutputPath(plugin.getOutputFile());
    const dir = path.dirname(outputPath);
    await fs.mkdir(dir, { recursive: true });
    const tmpPath = `${outputPath}.tmp`;
    await fs.writeFile(tmpPath, JSON.stringify(output, null, 2), "utf-8");
    await fs.rename(tmpPath, outputPath);
  }

  private resolveOutputPath(relativePath: string): string {
    if (path.isAbsolute(relativePath)) return relativePath;
    return path.join(this.outputDir, relativePath);
  }
}
```

- [ ] **Step 4: Rodar testes**

Run: `pnpm --filter @lite-llm/agents-manager test`
Expected: PASS (registry tests)

- [ ] **Step 5: Commit**

```bash
git add packages/agents-manager/src/plugins/registry.ts packages/agents-manager/src/plugins/__tests__/
git commit -m "feat(agents-manager): rewrite PluginRegistry with loadFromConfig + getInternalAgents + getConfigSchema"
```

---

### Task 5: RoutingService — remover casts inseguros

**Files:**
- Modify: `packages/agents-manager/src/services/routing.service.ts`
- Modify: `packages/agents-manager/src/services/__tests__/routing.service.test.ts`

- [ ] **Step 1: Reescrever RoutingService sem casts**

Os tipos agora vêm de agents-repository, então `DbConfig.routing` já é `PluginRoutingConfig | undefined`. Remover todos os `as unknown as` e `as DbConfig`:

```typescript
import type { IAgentsRepository } from "@lite-llm/agents-repository/repository";
import type { PluginRoutingConfig } from "@lite-llm/agents-repository/schema";

export interface RoutingServiceOptions {
  repository: IAgentsRepository;
}

export interface IRoutingService {
  getConfig(): Promise<PluginRoutingConfig>;
  saveConfig(config: PluginRoutingConfig): Promise<void>;
  getRoutingForAgent(agentId: string): Promise<string[]>;
  setRoutingForAgent(agentId: string, pluginIds: string[]): Promise<void>;
  toggleAgentPlugin(pluginId: string, agentId: string): Promise<boolean>;
  isPluginEnabled(pluginId: string, agentId: string): Promise<boolean>;
  getSyncAliases(): Promise<boolean>;
  setSyncAliases(enabled: boolean): Promise<void>;
  // Novos métodos
  getPluginConfig(pluginId: string): Promise<Record<string, unknown>>;
  savePluginConfig(pluginId: string, config: Record<string, unknown>): Promise<void>;
  getAgentMappings(pluginId: string): Promise<Record<string, string>>;
  saveAgentMappings(pluginId: string, mappings: Record<string, string>): Promise<void>;
  getCategoryMappings(pluginId: string): Promise<Record<string, boolean>>;
  toggleCategoryMapping(pluginId: string, categoryId: string): Promise<boolean>;
}
```

Implementar sem casts — ler `config.routing` e usar `PluginRoutingConfig` diretamente. Os novos métodos `getPluginConfig`, `savePluginConfig`, `getAgentMappings`, `saveAgentMappings`, `getCategoryMappings`, `toggleCategoryMapping` leem/escrevem em `routing.plugins.{id}.config`, `.agentMappings`, `.categoryMappings`.

- [ ] **Step 2: Adicionar testes para os novos métodos**

No `routing.service.test.ts`, adicionar testes para:
- `getPluginConfig` — retorna config do plugin ou `{}`
- `savePluginConfig` — persiste config
- `getAgentMappings` — retorna mapeamentos ou `{}`
- `saveAgentMappings` — persiste mapeamentos
- `getCategoryMappings` — retorna categorias ou `{}`
- `toggleCategoryMapping` — toggle true/false

- [ ] **Step 3: Rodar testes**

Run: `pnpm --filter @lite-llm/agents-manager test`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add packages/agents-manager/src/services/
git commit -m "refactor(agents-manager): remove unsafe casts from RoutingService, add config/mappings methods"
```

---

### Task 6: Reescrever os 3 plugins + atualizar factory

**Files:**
- Modify: `packages/agents-manager/src/plugins/builtins/opencode.plugin.ts`
- Modify: `packages/agents-manager/src/plugins/external/openagent.plugin.ts`
- Modify: `packages/agents-manager/src/plugins/external/vscode.plugin.ts`
- Modify: `packages/agents-manager/src/index.ts`
- Modify: `packages/agents-manager/src/config/defaults.ts`

- [ ] **Step 1: Reescrever OpenCodePlugin**

Implementar nova interface: `getInternalAgents()` retorna 6 agentes (coder, planner, explorer, reviewer, writer, architect), `getConfigSchema()` retorna campos (ex: `outputFormat`), `buildOutput()` usa `SystemAgent[]` + `agentMappings` para gerar providers. Remover todos os métodos legacy.

- [ ] **Step 2: Reescrever OpenAgentPlugin**

Implementar nova interface: `getInternalAgents()` retorna agentes do OpenAgent, `getConfigSchema()` retorna campos (ex: `commitFooter`, `includeCoAuthoredBy`), `buildOutput()` usa `agent.model` real (não hardcoded `gpt-5.5`), usa `categoryMappings` para filtrar categorias exportadas.

- [ ] **Step 3: Reescrever VsCodePlugin**

Implementar nova interface: `getInternalAgents()` retorna `[]` (vazio — só models), `getConfigSchema()` retorna campos (ex: `commitLanguage`, `retryEnabled`), `buildOutput()` usa models do `TransformContext`.

- [ ] **Step 4: Atualizar `createAgentsManager` factory**

Remover `registerBuiltins` option. Passar `allPlugins` para PluginRegistry:

```typescript
export function createAgentsManager(options: AgentsManagerFactoryOptions = {}) {
  const repository = createRepositoryClient({ filePath: options.dbPath });

  const services = {
    agents: new AgentService({ repository }),
    catalog: new AgentCatalogService({ repository }),
    categories: new CategoryService({ repository }),
    models: new ModelService({ repository }),
    routing: new RoutingService({ repository }),
  };

  const allPlugins = [
    new OpenCodePlugin(),
    new OpenAgentPlugin(),
    new VsCodePlugin(),
  ];

  const registry = new PluginRegistry({
    repository,
    outputDir: options.outputDir,
    allPlugins,
  });

  return { repository, services, registry };
}
```

- [ ] **Step 5: Remover código morto de `config/defaults.ts`**

Deletar `DEFAULT_FILE_PATHS`, `FilePaths`, `getFilePaths()`. Manter `DEFAULT_DB_PATH` e `DEFAULT_SYSTEM_AGENTS`.

- [ ] **Step 6: Atualizar `index.ts` — remover exports de tipos legacy**

Remover exports de `PluginRoutingConfig`, `PluginRoutingRule` de `./types/index.js` (agora vêm de agents-repository). Remover `DEFAULT_FILE_PATHS`, `getFilePaths`, `FilePaths`.

- [ ] **Step 7: Rodar typecheck + testes**

Run: `pnpm --filter @lite-llm/agents-manager typecheck && pnpm --filter @lite-llm/agents-manager test`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add packages/agents-manager/src/
git commit -m "feat(agents-manager): rewrite all 3 plugins for new IPlugin interface, remove legacy code"
```

---

## Fase 2 — Server

### Task 7: DI via RouteOptions no server-core

**Files:**
- Modify: `packages/server-core/src/types/index.ts`
- Modify: `packages/server-core/src/routes/index.ts`
- Modify: `packages/server-core/src/routes/agent-catalog-routes.ts`
- Modify: `packages/server-core/src/routes/category-catalog-routes.ts`
- Modify: `packages/server-core/src/routes/agent-config/config-routes.ts`
- Modify: `packages/server-core/src/routes/plugin-routing-routes.ts`
- Modify: `packages/server-core/src/orchestration/artifact-service.ts`
- Modify: `packages/server-core/src/orchestration/alias-service.ts`

- [ ] **Step 1: Adicionar `agentsManager` ao `RouteOptions`**

Em `server-core/src/types/index.ts`:

```typescript
import type { AgentsManagerFactoryOptions } from "@lite-llm/agents-manager";

export interface RouteOptions {
  dataSource: AnalyticsDataSource;
  orchestration: OrchestrationServices;
  agentsManager?: ReturnType<typeof import("@lite-llm/agents-manager").createAgentsManager>;
}
```

- [ ] **Step 2: Atualizar todas as 6 funções de rota**

Em cada arquivo de rota, trocar `createAgentsManager()` interno por `opts.agentsManager`:

```typescript
// Antes:
const { services } = createAgentsManager();

// Depois:
const { services } = opts.agentsManager ?? createAgentsManager();
```

Aplicar em: `config-routes.ts`, `agent-catalog-routes.ts`, `category-catalog-routes.ts`, `plugin-routing-routes.ts`.

- [ ] **Step 3: Atualizar `artifact-service.ts` e `alias-service.ts`**

Receber `agentsManager` como parâmetro em vez de criar internamente:

```typescript
export async function syncGeneratedArtifacts(
  dataSource: AnalyticsDataSource,
  agentsManager: ReturnType<typeof import("@lite-llm/agents-manager").createAgentsManager>,
): Promise<void> {
  const { repository, registry } = agentsManager;
  // ...
}
```

- [ ] **Step 4: Rodar typecheck do server-core**

Run: `pnpm --filter @lite-llm/server-core typecheck`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/server-core/src/
git commit -m "refactor(server-core): inject agentsManager via RouteOptions, stop creating per-request instances"
```

---

### Task 8: Novos endpoints de plugin config

**Files:**
- Modify: `packages/server-core/src/routes/plugin-routing-routes.ts`
- Create: `packages/server-core/src/routes/__tests__/plugin-config-routes.test.ts`

- [ ] **Step 1: Adicionar `GET /plugin-routing/:pluginId/config`**

Retorna: config atual + configSchema + internalAgents do plugin:

```typescript
app.get("/plugin-routing/:pluginId/config", async (req, res) => {
  const { services, registry } = opts.agentsManager;
  const { pluginId } = req.params;
  const [config, agentMappings, categoryMappings, schema, internalAgents] = await Promise.all([
    services.routing.getPluginConfig(pluginId),
    services.routing.getAgentMappings(pluginId),
    services.routing.getCategoryMappings(pluginId),
    Promise.resolve(registry.getConfigSchema(pluginId)),
    Promise.resolve(registry.getInternalAgents(pluginId)),
  ]);
  res.json({ config, agentMappings, categoryMappings, schema, internalAgents });
});
```

- [ ] **Step 2: Adicionar `PUT /plugin-routing/:pluginId/config`**

```typescript
app.put("/plugin-routing/:pluginId/config", async (req, res) => {
  const { services } = opts.agentsManager;
  const { pluginId } = req.params;
  const { config, agentMappings, categoryMappings } = req.body;
  if (config !== undefined) await services.routing.savePluginConfig(pluginId, config);
  if (agentMappings !== undefined) await services.routing.saveAgentMappings(pluginId, agentMappings);
  if (categoryMappings !== undefined) await services.routing.saveCategoryMappings(pluginId, categoryMappings);
  res.json({ success: true });
});
```

- [ ] **Step 3: Adicionar `PATCH /plugin-routing/:pluginId/categories/:categoryId`**

```typescript
app.patch("/plugin-routing/:pluginId/categories/:categoryId", async (req, res) => {
  const { services } = opts.agentsManager;
  const { pluginId, categoryId } = req.params;
  const enabled = await services.routing.toggleCategoryMapping(pluginId, categoryId);
  res.json({ categoryId, enabled });
});
```

- [ ] **Step 4: Atualizar `GET /plugin-routing/plugins` para retornar internalAgents + configSchema**

```typescript
app.get("/plugin-routing/plugins", async (_req, res) => {
  const { services, registry } = opts.agentsManager;
  const routing = await services.routing.getConfig();

  const plugins = registry.list().map((p) => {
    const routingPlugin = routing.plugins[p.id];
    return {
      id: p.id,
      name: p.name,
      enabled: routingPlugin?.enabled ?? false,
      outputFile: routingPlugin?.outputFile ?? p.getOutputFile(),
      internalAgents: registry.getInternalAgents(p.id),
      configSchema: registry.getConfigSchema(p.id),
      agentCount: Object.keys(routingPlugin?.agents ?? {}).length,
      enabledAgentCount: Object.values(routingPlugin?.agents ?? {}).filter((a) => a.enabled).length,
    };
  });

  res.json(plugins);
});
```

- [ ] **Step 5: Escrever testes de integração para os 3 novos endpoints**

Testar: GET retorna config+vazio, PUT persiste config, PATCH toggle categoria.

- [ ] **Step 6: Rodar testes**

Run: `pnpm --filter @lite-llm/server-core test`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add packages/server-core/src/routes/
git commit -m "feat(server-core): add GET/PUT plugin config + PATCH category toggle endpoints"
```

---

### Task 9: Corrigir app-runtime — setupAgentsManager

**Files:**
- Modify: `apps/server/src/runtime/app-runtime.ts`

- [ ] **Step 1: Usar retorno de createAgentsManager e injetar nas opções**

```typescript
import { createAgentsManager } from "@lite-llm/agents-manager";

function startAppRuntime(): AppRuntime {
  const projectRoot = getProjectRoot();
  const agentsManager = createAgentsManager({
    dbPath: path.join(projectRoot, "@storage", "agents.jsonc"),
    outputDir: path.join(projectRoot, "data"),
  });

  const ctx = createAppContext();
  const orchestration = createOrchestrationServices(ctx.analytics.dataSource);

  const app = createApiServer(
    { dataSource: ctx.analytics.dataSource, orchestration, agentsManager },
    ctx,
  );
  // ...
}
```

Remover a função `setupAgentsManager` separada. Corrigir dbPath para `@storage/agents.jsonc`.

- [ ] **Step 2: Rodar typecheck do server**

Run: `pnpm --filter server typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add apps/server/src/runtime/app-runtime.ts
git commit -m "fix(server): inject agentsManager in app-runtime, fix dbPath to @storage/agents.jsonc"
```

---

## Fase 3 — Frontend

### Task 10: API client + tipos para plugins

**Files:**
- Modify: `packages/api-contracts/src/agent-catalog.ts`
- Modify: `apps/web/src/lib/api-client/plugin-routing.ts`
- Modify: `apps/web/src/lib/query-keys.ts`

- [ ] **Step 1: Atualizar tipos no api-contracts**

```typescript
// agent-catalog.ts
export interface InternalAgent {
  id: string;
  displayName: string;
  description: string;
}

export interface ConfigField {
  key: string;
  type: "string" | "number" | "boolean" | "select" | "password";
  label: string;
  required?: boolean;
  default?: unknown;
  options?: { value: string; label: string }[];
  placeholder?: string;
  description?: string;
}

export interface PluginInfo {
  id: string;
  name: string;
  enabled: boolean;
  outputFile: string;
  internalAgents: InternalAgent[];
  configSchema: ConfigField[];
  agentCount: number;
  enabledAgentCount: number;
}

export interface PluginConfigResponse {
  config: Record<string, unknown>;
  agentMappings: Record<string, string>;
  categoryMappings: Record<string, boolean>;
  schema: ConfigField[];
  internalAgents: InternalAgent[];
}
```

- [ ] **Step 2: Adicionar funções no api-client**

```typescript
// plugin-routing.ts
export async function getPluginConfig(pluginId: string): Promise<PluginConfigResponse> {
  return fetchApi(`/plugin-routing/${pluginId}/config`);
}

export async function savePluginConfig(
  pluginId: string,
  data: { config?: Record<string, unknown>; agentMappings?: Record<string, string>; categoryMappings?: Record<string, boolean> },
): Promise<{ success: boolean }> {
  return fetchApi(`/plugin-routing/${pluginId}/config`, { method: "PUT", body: JSON.stringify(data) });
}

export async function toggleCategoryExport(
  pluginId: string,
  categoryId: string,
): Promise<{ categoryId: string; enabled: boolean }> {
  return fetchApi(`/plugin-routing/${pluginId}/categories/${categoryId}`, { method: "PATCH" });
}

export async function savePluginRouting(
  config: PluginRoutingConfig,
): Promise<{ success: boolean }> {
  return fetchApi("/plugin-routing", { method: "PUT", body: JSON.stringify(config) });
}
```

- [ ] **Step 3: Adicionar query keys**

```typescript
// query-keys.ts — pluginRouting
pluginConfig: (pluginId: string) => [...pluginRouting.all, "config", pluginId] as const,
```

- [ ] **Step 4: Commit**

```bash
git add packages/api-contracts/ apps/web/src/lib/
git commit -m "feat(web): add plugin config API client + types"
```

---

### Task 11: Hooks para plugin config

**Files:**
- Modify: `apps/web/src/hooks/use-plugin-routing.ts`
- Create: `apps/web/src/hooks/use-plugin-config.ts`

- [ ] **Step 1: Criar `use-plugin-config.ts`**

```typescript
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getPluginConfig, savePluginConfig, toggleCategoryExport } from "@/lib/api-client/plugin-routing";
import { queryKeys } from "@/lib/query-keys";

export function usePluginConfig(pluginId: string) {
  return useQuery({
    queryKey: queryKeys.pluginRouting.pluginConfig(pluginId),
    queryFn: () => getPluginConfig(pluginId),
    enabled: !!pluginId,
  });
}

export function useSavePluginConfig(pluginId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof savePluginConfig>[1]) =>
      savePluginConfig(pluginId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.pluginRouting.pluginConfig(pluginId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.pluginRouting.plugins });
    },
  });
}

export function useToggleCategoryExport(pluginId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (categoryId: string) => toggleCategoryExport(pluginId, categoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.pluginRouting.pluginConfig(pluginId),
      });
    },
  });
}
```

- [ ] **Step 2: Adicionar `useTogglePlugin` ao `use-plugin-routing.ts`**

```typescript
export function useTogglePlugin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ pluginId, enabled }: { pluginId: string; enabled: boolean }) => {
      const current = await getPluginRouting();
      const config = current.config;
      if (!config.plugins[pluginId]) {
        config.plugins[pluginId] = { enabled: true, outputFile: "", agents: {} };
      }
      config.plugins[pluginId].enabled = enabled;
      return savePluginRouting(config);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pluginRouting.all });
    },
  });
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/hooks/
git commit -m "feat(web): add usePluginConfig, useSavePluginConfig, useTogglePlugin hooks"
```

---

### Task 12: Página `/plugins/:pluginId`

**Files:**
- Create: `apps/web/src/pages/plugin-config.tsx`
- Create: `apps/web/src/pages/plugin-config/use-plugin-config-page.ts`
- Create: `apps/web/src/components/plugin-routing/plugin-config-form.tsx`
- Create: `apps/web/src/components/plugin-routing/agent-mapping-table.tsx`
- Create: `apps/web/src/components/plugin-routing/category-export-list.tsx`
- Modify: `apps/web/src/App.tsx`

- [ ] **Step 1: Registrar rota em App.tsx**

```tsx
import { PluginConfigPage } from "./pages/plugin-config";

// Dentro do Router:
<Route path="/plugins/:pluginId" element={<PluginConfigPage />} />
```

- [ ] **Step 2: Criar `plugin-config.tsx` (page component)**

PageLayout com 3 seções: Plugin Options (PluginConfigForm), Agent Routing (AgentMappingTable), Category Export (CategoryExportList). Botão "Save" que chama `useSavePluginConfig`.

- [ ] **Step 3: Criar `use-plugin-config-page.ts` (page hook)**

Compõe `usePluginConfig`, `useAvailablePlugins` (para lista de SystemAgents), `useSavePluginConfig`, `useToggleCategoryExport`.

- [ ] **Step 4: Criar `plugin-config-form.tsx`**

Renderiza formulário dinâmico baseado em `configSchema` — para cada `ConfigField`, renderiza input apropriado (string → Input, boolean → Switch, select → Select, password → Input type=password, number → Input type=number).

- [ ] **Step 5: Criar `agent-mapping-table.tsx`**

Tabela: coluna esquerda = SystemAgents do app, coluna direita = dropdown com internalAgents do plugin. Atualiza `agentMappings` state.

- [ ] **Step 6: Criar `category-export-list.tsx`**

Lista de categories com Switch para cada uma. Atualiza `categoryMappings` via `useToggleCategoryExport`.

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/pages/plugin-config/ apps/web/src/components/plugin-routing/ apps/web/src/App.tsx
git commit -m "feat(web): add /plugins/:pluginId page with config form, agent mapping, category toggles"
```

---

### Task 13: Atualizar `/plugins` — toggle funcional + botão Configure

**Files:**
- Modify: `apps/web/src/components/plugin-routing/plugin-card.tsx`
- Modify: `apps/web/src/components/plugin-routing/plugin-routing-grid.tsx`
- Modify: `apps/web/src/pages/plugins.tsx`
- Modify: `apps/web/src/pages/plugin-routing/use-plugin-routing-page.ts`

- [ ] **Step 1: Conectar toggle real no PluginCard**

No `use-plugin-routing-page.ts`, trocar `handleTogglePlugin` placeholder por `useTogglePlugin`:

```typescript
const togglePlugin = useTogglePlugin();

const handleTogglePlugin = useCallback(
  (pluginId: string) => {
    const plugin = plugins.find((p) => p.id === pluginId);
    if (plugin) togglePlugin.mutate({ pluginId, enabled: !plugin.enabled });
  },
  [plugins, togglePlugin],
);
```

- [ ] **Step 2: Adicionar botão "Configure" no PluginCard**

Abaixo do switch e dos agent toggles, adicionar botão que navega para `/plugins/${plugin.id}`:

```tsx
import { useNavigate } from "@tanstack/react-router";

// Dentro do PluginCard:
const navigate = useNavigate();
<Button variant="outline" size="sm" onClick={() => navigate({ to: "/plugins/$pluginId", params: { pluginId: plugin.id } })}>
  Configure
</Button>
```

- [ ] **Step 3: Atualizar PluginRoutingGrid para passar props necessárias**

Remover `agentNames` e `enabledAgentIds` props (agora cada plugin gerencia internamente). Simplificar interface.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/plugin-routing/ apps/web/src/pages/
git commit -m "feat(web): functional plugin toggle + Configure button linking to /plugins/:pluginId"
```

---

## Fase 4 — Cleanup + Tests

### Task 14: Limpeza final — remover código morto

**Files:**
- Modify: `packages/agents-manager/src/index.ts`
- Modify: `packages/agents-manager/src/config/defaults.ts`
- Modify: `packages/agents-manager/src/plugins/builtins/opencode.plugin.ts` (remover builtin export se existir)

- [ ] **Step 1: Verificar exports não utilizados no index.ts**

Garantir que: `DEFAULT_FILE_PATHS`, `FilePaths`, `getFilePaths`, `builtin`, tipos legacy não são mais exportados.

- [ ] **Step 2: Remover `plugins/builtins/index.ts` se existir e não for usado**

- [ ] **Step 3: Remover `OpenCodePlugin` do export de `builtin` (conceito removido)**

- [ ] **Step 4: Commit**

```bash
git add packages/agents-manager/src/
git commit -m "chore(agents-manager): remove dead code, unused exports, builtin concept"
```

---

### Task 15: Testes de cobertura — services + plugins

**Files:**
- Create: `packages/agents-manager/src/services/__tests__/agent.service.test.ts`
- Create: `packages/agents-manager/src/services/__tests__/category.service.test.ts`
- Create: `packages/agents-manager/src/services/__tests__/model.service.test.ts`
- Create: `packages/agents-manager/src/services/__tests__/agent-catalog.service.test.ts`
- Create: `packages/agents-manager/src/plugins/__tests__/opencode.plugin.test.ts`
- Create: `packages/agents-manager/src/plugins/__tests__/openagent.plugin.test.ts`
- Create: `packages/agents-manager/src/plugins/__tests__/vscode.plugin.test.ts`

- [ ] **Step 1: Escrever testes do AgentService**

Testar: `getAll`, `get` (found/not found), `create` (success + duplicate), `update` (success + not found), `upsert`, `delete` (success + not found).

- [ ] **Step 2: Escrever testes do CategoryService**

Mesmo padrão do AgentService.

- [ ] **Step 3: Escrever testes do ModelService**

Mesmo padrão + `resolveModelName` (custom alias, direct model, not found).

- [ ] **Step 4: Escrever testes do AgentCatalogService**

Mesmo padrão + `readWithSystemAgents` (systemAgents undefined → inicializa {}).

- [ ] **Step 5: Escrever testes do OpenCodePlugin**

Testar: `getInternalAgents` retorna 6, `getConfigSchema` retorna fields, `buildOutput` com agents + routing gera estrutura correta, `validate`.

- [ ] **Step 6: Escrever testes do OpenAgentPlugin**

Testar: `getInternalAgents`, `buildOutput` com model real (não hardcoded), `categoryMappings` filtra categorias.

- [ ] **Step 7: Escrever testes do VsCodePlugin**

Testar: `getInternalAgents` retorna vazio, `buildOutput` gera lista de models.

- [ ] **Step 8: Rodar todos os testes + coverage**

Run: `pnpm --filter @lite-llm/agents-manager test -- --coverage`
Expected: PASS, coverage > 80%

- [ ] **Step 9: Commit**

```bash
git add packages/agents-manager/src/
git commit -m "test(agents-manager): add comprehensive tests for all services and plugins"
```

---

## Self-Review

### Cobertura da spec

| Requisito da spec | Task |
|---|---|
| P1 — Instanciação por request | Task 7 (DI) + Task 9 (app-runtime) |
| P2 — Tipos duplicados | Task 2 |
| P3 — Casts inseguros | Task 5 |
| P4 — validateOnRead false | Task 1 (passthrough resolve) |
| P5 — buildOutputV2 stub | Task 4 (registry reescrito) |
| P6 — OpenAgent hardcoded | Task 6 (plugin reescrito) |
| P7 — Categories skip | Task 6 (plugin reescrito) |
| P8 — Código morto | Task 6 (defaults) + Task 14 (cleanup) |
| P9 — Cobertura de testes | Task 15 |
| P10 — setupAgentsManager | Task 9 |
| D1 — DI via RouteOptions | Task 7 |
| D2 — Zod passthrough | Task 1 |
| D3 — Ativação via UI | Task 13 (toggle) |
| D4 — Remover legacy | Task 3 + Task 6 |
| D5 — Agentes internos | Task 3 (tipos) + Task 6 (plugins) |
| D6 — Página config | Task 12 |
| D7 — Migração limpa | Task 1 (schema) — sem fallbacks |
| D8 — OpenAgent em produção | Task 6 |

### Scan de placeholders

Nenhum TBD, TODO, "implementar depois", "similar ao Task N" encontrado.

### Consistência de tipos

`IPlugin`, `InternalAgent`, `ConfigField`, `TransformContext` definidos em Task 3, usados consistentemente em Tasks 4, 6, 10, 11, 12.
