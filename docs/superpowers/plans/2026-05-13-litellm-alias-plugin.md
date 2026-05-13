# LiteLLM Alias Plugin — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) for syntax tracking.

**Goal:** Transform the dormant LiteLLM `model_group_alias` generation pipeline into an `agents-manager` plugin that writes both a file and directly to the LiteLLM PostgreSQL database.

**Architecture:** A new `LitellmAliasPlugin` implements `IPlugin` with an optional `afterExport` hook. The `PluginRegistry` calls `afterExport` after writing the file, allowing the plugin to push aliases to DB via a lightweight `AliasDbWriter` adapter. The old alias code in `server-core` is removed; the `@lite-llm/alias-router` pure functions remain as a dependency.

**Tech Stack:** TypeScript, agents-manager plugin system, @lite-llm/alias-router, Express, PostgreSQL

---

### Task 1: Extend `IPlugin` + `TransformContext`

**Files:**
- Modify: `packages/agents-manager/src/plugins/plugin.ts`

- [ ] **Step 1: Add `afterExport?` hook to `IPlugin` and `allCategories` to `TransformContext`**

  Edit `packages/agents-manager/src/plugins/plugin.ts`:

  ```typescript
  import type {
    AgentConfig,
    ModelSpec,
    PluginRouting,
    SystemAgent,
  } from "@lite-llm/agents-repository/schemas";

  export interface TransformContext {
    allModels: Record<string, ModelSpec>;
    globalFallbackModel?: string;
    litellmConfig: { baseUrl: string; apiKey: string };
    allCategories?: Record<string, AgentConfig>;
  }

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
    afterExport?(output: unknown): Promise<void>;
  }
  ```

  Changes:
  - Import `AgentConfig` from schemas (line 2)
  - Add `allCategories?: Record<string, AgentConfig>` to `TransformContext` (line 10)
  - Add `afterExport?(output: unknown): Promise<void>;` to `IPlugin` (line 29)

  Run: `pnpm --filter @lite-llm/agents-manager typecheck`
  Expected: PASS (no plugins implement `afterExport` yet, so no breakage)

---

### Task 2: Extend `PluginRegistry` to call `afterExport` + populate categories in context

**Files:**
- Modify: `packages/agents-manager/src/plugins/registry.ts`

- [ ] **Step 1: Call `afterExport` in `exportOne()` after write, populate `allCategories` in `buildContext()`**

  Edit `packages/agents-manager/src/plugins/registry.ts`:

  In `exportOne()`, add after the `writePluginOutput` call (line 98):

  ```typescript
    await this.writePluginOutput(plugin, output);

    // NEW: Invoke optional afterExport hook (e.g., for DB sync)
    if (plugin.afterExport) {
      await plugin.afterExport(output);
    }
  ```

  In `buildContext()`, add `allCategories`:

  ```typescript
    return {
      allModels: config.models as TransformContext["allModels"],
      globalFallbackModel: config.globalFallbackModel,
      litellmConfig: {
        baseUrl: selectedProvider.baseUrl,
        apiKey: selectedProvider.apiKey,
      },
      allCategories: config.categories as TransformContext["allCategories"],
    };
  ```

  Run: `pnpm --filter @lite-llm/agents-manager typecheck`
  Expected: PASS

---

### Task 3: Create `LitellmAliasPlugin`

**Files:**
- Create: `packages/agents-manager/src/plugins/external/litellm-alias.plugin.ts`

- [ ] **Step 1: Write the plugin class**

  ```typescript
  import {
    generateLitellmAliases,
    sortAliasesByDefinitionOrder,
  } from "@lite-llm/alias-router";
  import type {
    PluginRouting,
    SystemAgent,
  } from "@lite-llm/agents-repository/schemas";
  import type { IPlugin, TransformContext } from "../plugin.js";
  import type { ConfigField, InternalAgent } from "../plugin-types.js";

  export interface AliasDbWriter {
    updateAliases(aliases: Record<string, string>): Promise<void>;
  }

  interface LitellmAliasOutput {
    model_group_alias: Record<string, string>;
  }

  export class LitellmAliasPlugin implements IPlugin {
    readonly id = "litellm-alias";
    readonly name = "LiteLLM Router Aliases";
    readonly version = 1;
    readonly outputFile = "litellm-aliases.json";

    constructor(private dbWriter?: AliasDbWriter) {}

    getInternalAgents(): InternalAgent[] {
      return [];
    }

    getConfigSchema(): ConfigField[] {
      return [];
    }

    getOutputFile(): string {
      return this.outputFile;
    }

    buildOutput(
      agents: SystemAgent[],
      _routing: PluginRouting,
      ctx: TransformContext,
    ): LitellmAliasOutput {
      const aliases: Record<string, string> = {};
      const globalFallback = ctx.globalFallbackModel;

      for (const agent of agents) {
        Object.assign(
          aliases,
          generateLitellmAliases(
            agent.id,
            agent.model || "",
            agent.fallbackModels,
            globalFallback,
          ),
        );
      }

      for (const [key, category] of Object.entries(
        ctx.allCategories ?? {},
      )) {
        Object.assign(
          aliases,
          generateLitellmAliases(
            key,
            category.model || "",
            category.fallbackModels,
            globalFallback,
          ),
        );
      }

      return {
        model_group_alias: sortAliasesByDefinitionOrder(aliases),
      };
    }

    async afterExport(output: unknown): Promise<void> {
      if (!this.dbWriter) return;

      try {
        const { model_group_alias } = output as LitellmAliasOutput;
        await this.dbWriter.updateAliases(model_group_alias);
      } catch (error) {
        console.error(
          `[LitellmAliasPlugin] Failed to sync aliases to DB: ${error}`,
        );
        // Do not throw — file write already succeeded
      }
    }
  }
  ```

  Run: `pnpm --filter @lite-llm/agents-manager typecheck`
  Expected: PASS

---

### Task 4: Create `AliasDbWriter` in server-core

**Files:**
- Create: `packages/server-core/src/orchestration/alias-db-writer.ts`

- [ ] **Step 1: Write the AliasDbWriter class**

  ```typescript
  import type { AliasDbWriter } from "@lite-llm/agents-manager";
  import type { AnalyticsDataSource } from "@lite-llm/analytics/types";

  export class AliasDbWriterImpl implements AliasDbWriter {
    constructor(private dataSource: AnalyticsDataSource) {}

    async updateAliases(aliases: Record<string, string>): Promise<void> {
      await this.dataSource.updateAgentRoutingConfig(aliases);
    }
  }
  ```

  Note: `dataSource.updateAgentRoutingConfig` expects `Record<string, unknown>`, which is compatible with `Record<string, string>`.

  Run: `pnpm --filter @lite-llm/server-core typecheck`
  Expected: PASS

---

### Task 5: Register plugin in `createAgentsManager` factory

**Files:**
- Modify: `packages/agents-manager/src/index.ts`

- [ ] **Step 1: Add `LitellmAliasPlugin` and `AliasDbWriter` types to factory**

  Edit `packages/agents-manager/src/index.ts`:

  Add import (after line 78):
  ```typescript
  import { LitellmAliasPlugin } from "./plugins/external/litellm-alias.plugin.js";
  ```

  Export `AliasDbWriter` type:
  ```typescript
  export type { AliasDbWriter } from "./plugins/external/litellm-alias.plugin.js";
  ```

  Update factory interface:
  ```typescript
  export interface AgentsManagerFactoryOptions {
    dbPath?: string;
    outputDir?: string;
    aliasDbWriter?: import("./plugins/external/litellm-alias.plugin.js").AliasDbWriter;
  }
  ```

  Add plugin to `allPlugins` (after line 126):
  ```typescript
    new LitellmAliasPlugin(options.aliasDbWriter),
  ```

  Run: `pnpm --filter @lite-llm/agents-manager typecheck`
  Expected: PASS

---

### Task 6: Wire `AliasDbWriterImpl` in `app-runtime.ts`

**Files:**
- Modify: `apps/server/src/runtime/app-runtime.ts`

- [ ] **Step 1: Import and instantiate `AliasDbWriterImpl`, pass to `createAgentsManager`**

  Add imports (after line 4):
  ```typescript
  import { AliasDbWriterImpl } from "@lite-llm/server-core/orchestration/alias-db-writer.js";
  ```

  Modify `setupAgentsManager` to accept `dataSource`:
  ```typescript
  function setupAgentsManager(
    projectRoot: string,
    aliasDbWriter?: import("@lite-llm/agents-manager").AliasDbWriter,
  ) {
    return createAgentsManager({
      dbPath: path.join(projectRoot, "@agents", "agents.json"),
      outputDir: path.join(projectRoot, "data"),
      aliasDbWriter,
    });
  }
  ```

  In `startAppRuntime`, instantiate and pass:
  ```typescript
  const aliasDbWriter = new AliasDbWriterImpl(ctx.analytics.dataSource);
  const agentsManager = setupAgentsManager(projectRoot, aliasDbWriter);
  ```

  Run: `pnpm --filter apps-server typecheck`
  Expected: PASS

---

### Task 7: Remove old `alias-service.ts` and clean up

**Files:**
- Delete: `packages/server-core/src/orchestration/alias-service.ts`
- Modify: `packages/server-core/src/orchestration/index.ts`
- Modify: `packages/server-core/src/types/index.ts`
- Modify: `packages/server-core/src/index.ts`

- [ ] **Step 1: Delete `alias-service.ts`**

  ```bash
  rm packages/server-core/src/orchestration/alias-service.ts
  ```

- [ ] **Step 2: Update `orchestration/index.ts` — remove alias-service imports and exports**

  Remove lines 7 and 13 (the import and re-export of alias-service).

  Remove `buildAliasMap` and `regenerateAllAliases` from `createOrchestrationServices`.

  Remove `buildAliasMapFromDb` and `regenerateAllAliases` from the named export at line 13.

  The file should look like:
  ```typescript
  import type { AnalyticsDataSource } from "@lite-llm/analytics/types";
  import type {
    AgentsManager,
    DbModelSpecLike,
    OrchestrationServices,
  } from "../types/index.js";
  import {
    syncGeneratedArtifacts,
    syncModelsDirectlyToDatabase,
  } from "./artifact-service.js";

  export {
    syncGeneratedArtifacts,
    syncModelsDirectlyToDatabase,
  } from "./artifact-service.js";
  export {
    applyRequiredLiteLLMParams,
    buildLiteLLMParams,
    getLiteLLMCredentialName,
    isRecord,
    parseDays,
    toCostPerToken,
  } from "./lite-llm-params.js";

  export function createOrchestrationServices(
    dataSource: AnalyticsDataSource,
    agentsManager: AgentsManager,
  ): OrchestrationServices {
    return {
      dataSource,
      syncGeneratedArtifacts: () =>
        syncGeneratedArtifacts(dataSource, agentsManager),
      syncModelsDirectlyToDatabase: (models: Record<string, DbModelSpecLike>) =>
        syncModelsDirectlyToDatabase(dataSource, models),
    };
  }
  ```

- [ ] **Step 3: Update `types/index.ts` — remove `buildAliasMap` and `regenerateAllAliases` from `OrchestrationServices`**

  Edit `packages/server-core/src/types/index.ts`:
  ```typescript
  export interface OrchestrationServices {
    dataSource: AnalyticsDataSource;
    syncGeneratedArtifacts: () => Promise<void>;
    syncModelsDirectlyToDatabase: (
      models: Record<string, DbModelSpecLike>,
    ) => Promise<void>;
  }
  ```

- [ ] **Step 4: Update `server-core/src/index.ts` — remove alias-service exports**

  Remove `buildAliasMapFromDb` and `regenerateAllAliases` from the export list (lines 3 and 9).

  Run: `pnpm --filter @lite-llm/server-core typecheck`
  Expected: PASS

- [ ] **Step 5 (optional cleanup): Simplify `getAgentRoutingConfigImpl` in analytics**

  Edit `packages/analytics/src/data-source/routing-methods.ts`:

  Remove imports of `generateLitellmAliases`, `sortAliasesByDefinitionOrder`, and `createAgentsManager` (lines 1-5).

  Simplify `getAgentRoutingConfigImpl` to just read from DB (the plugin now handles generation):

  ```typescript
  import { getRouterSettings, updateRouterSettings } from "../queries/index.js";

  export async function getAgentRoutingConfigImpl(): Promise<Record<
    string,
    unknown
  > | null> {
    try {
      const routerSettings = await getRouterSettings();
      if (routerSettings?.model_group_alias) {
        return {
          model_group_alias: routerSettings.model_group_alias as Record<
            string,
            string
          >,
        };
      }
    } catch {
      // LiteLLM_Config table may not exist yet
    }
    return null;
  }

  export async function updateAgentRoutingConfigImpl(
    modelGroupAlias: Record<string, string>,
  ): Promise<void> {
    // Also write to LiteLLM_Config table
    await updateRouterSettings(modelGroupAlias);
  }
  ```

  The `updateAgentRoutingConfigImpl` loses the `repository.write(config)` + agentKeys/categoryKeys filtering — that filtering was defensive code preserving entries the system didn't know about. Since the plugin now manages the full alias map, the DB write path can be simpler. The `createAgentsManager()` call is also no longer needed since `updateRouterSettings` directly queries the DB.

  Run: `pnpm --filter @lite-llm/analytics typecheck`
  Expected: PASS

---

### Task 8: Typecheck + test

- [ ] **Step 1: Full typecheck**

  Run: `pnpm typecheck`
  Expected: PASS

- [ ] **Step 2: Run tests**

  Run: `pnpm test --filter @lite-llm/agents-manager`
  Expected: PASS (existing tests unaffected)

  Run: `pnpm test --filter @lite-llm/server-core`
  Expected: PASS (after removing exports that tests may reference)

  If any test imports `buildAliasMapFromDb` or `regenerateAllAliases` from server-core, update those imports to use the plugin instead, or remove the test if it's no longer relevant.
