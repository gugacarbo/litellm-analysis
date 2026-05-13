# LiteLLM Alias Plugin — Design Spec

**Date:** 2026-05-13
**Status:** Draft

## Summary

Consolidate the dormant LiteLLM `model_group_alias` generation pipeline into a proper plugin within the `@lite-llm/agents-manager` plugin system. The plugin generates alias maps (file + DB write) and replaces the scattered code across `server-core` and `analytics`.

---

## Architecture

```
syncGeneratedArtifacts()
    │
    ├── syncModelsDirectlyToDatabase()          [unchanged]
    │
    └── registry.exportAll()
            │
            ├── OpenCodePlugin.buildOutput()    [unchanged]
            ├── OpenAgentPlugin.buildOutput()   [unchanged]
            ├── VsCodePlugin.buildOutput()      [unchanged]
            │
            └── LitellmAliasPlugin
                    ├── buildOutput()
                    │   └── generateLitellmAliases() + sortAliasesByDefinitionOrder()
                    │       → data/litellm-aliases.json
                    │
                    └── afterExport()
                        └── AliasDbWriter.updateAliases()
                            └── dataSource.updateAgentRoutingConfig()
                                → LiteLLM_Config (PostgreSQL)
```

---

## 1. New File: `LitellmAliasPlugin`

**Location:** `packages/agents-manager/src/plugins/external/litellm-alias.plugin.ts`

```typescript
interface AliasDbWriter {
  updateAliases(aliases: Record<string, string>): Promise<void>;
}

class LitellmAliasPlugin implements IPlugin {
  readonly id = "litellm-alias";
  readonly name = "LiteLLM Router Aliases";
  readonly version = 1;
  readonly outputFile = "litellm-aliases.json";

  constructor(private dbWriter?: AliasDbWriter) {}

  getInternalAgents()       → [] (no agent slots)
  getConfigSchema()         → [] (no custom config)

  buildOutput(agents, routing, ctx) → {
    model_group_alias: Record<string, string>
  }

  afterExport?(output) → this.dbWriter.updateAliases(output.model_group_alias)
}
```

- `afterExport` is called by `PluginRegistry.exportOne()` **after** the atomic file write
- If no `dbWriter` is provided, `afterExport` is a no-op (pure file-only mode)
- The plugin is **active by default** (no toggle needed — aliases should always be generated)

---

## 2. Interface Extension: `IPlugin`

**File:** `packages/agents-manager/src/plugins/plugin.ts`

```typescript
export interface IPlugin {
  // ... existing fields unchanged
  afterExport?(output: unknown): Promise<void>;  // NEW — optional hook
}
```

No default implementation needed. All existing plugins are unaffected.

---

## 3. Registry Change: `PluginRegistry.exportOne()`

**File:** `packages/agents-manager/src/plugins/registry.ts`

After `writePluginOutput()` succeeds, add:

```typescript
if (plugin.afterExport) {
  await plugin.afterExport(output);
}
```

No changes to `exportAll()` — it iterates registered plugins as before.

---

## 4. Context Extension: `TransformContext`

**File:** `packages/agents-manager/src/plugins/plugin.ts`

```typescript
export interface TransformContext {
  allModels: Record<string, ModelSpec>;
  globalFallbackModel?: string;
  litellmConfig: { baseUrl: string; apiKey: string };
  allCategories?: Record<string, AgentConfig>;  // NEW
}
```

**File:** `packages/agents-manager/src/plugins/registry.ts` — `buildContext()`:

```typescript
return {
  allModels: config.models,
  globalFallbackModel: config.globalFallbackModel,
  litellmConfig: { ... },
  allCategories: config.categories,  // NEW
};
```

---

## 5. New File: `AliasDbWriter`

**Location:** `packages/server-core/src/orchestration/alias-db-writer.ts`

```typescript
class AliasDbWriter implements AliasDbWriter {
  constructor(private dataSource: AnalyticsDataSource) {}

  async updateAliases(aliases: Record<string, string>): Promise<void> {
    await this.dataSource.updateAgentRoutingConfig(aliases);
  }
}
```

---

## 6. Registration

**File:** `packages/server-core/src/runtime/app-runtime.ts` (where `AgentsManager` is created):

```typescript
const aliasDbWriter = new AliasDbWriter(dataSource);
const agentsManager = createAgentsManager({
  repository,
  outputDir: "data",
  aliasDbWriter,
});
```

**File:** `packages/agents-manager/src/index.ts` — `createAgentsManager()` receives optional `aliasDbWriter`:

```typescript
function createAgentsManager(options: { ..., aliasDbWriter?: AliasDbWriter }) {
  const allPlugins = [
    ...existingPlugins,
    new LitellmAliasPlugin(options.aliasDbWriter),
  ];
}
```

---

## 7. Code Removals

| File | What | Reason |
|------|------|--------|
| `server-core/src/orchestration/alias-service.ts` | **Entire file** | Logic moved to plugin |
| `server-core/src/orchestration/index.ts` | `AliasService` export | No longer needed |
| `server-core/src/types/index.ts` | `AliasService` in `OrchestrationServices` | Interface removed |
| `analytics/src/data-source/routing-methods.ts` | `updateAgentRoutingConfigImpl` stays; `getAgentRoutingConfigImpl` simplified | Generation moves to plugin; DB write stays |
| `analytics/src/queries/router-queries.ts` | Unchanged | Still needed for DB I/O |

---

## 8. Edge Cases & Safeguards

- **Plugin disabled in config?** `exportOne()` won't be called, so aliases won't regenerate. Manual sync can still be triggered via `POST /models/sync-from-config`.
- **DB unavailable?** `afterExport` catches errors gracefully (wrap in try/catch, log, do not fail the file write).
- **Empty agents/categories?** `buildOutput()` returns `{}`, writePluginOutput writes empty JSON, DB write is a no-op.
- **AliasDbWriter not provided?** Plugin runs in file-only mode. Useful for dev/testing without a DB.

---

## 9. Testing

- **Plugin unit test:** `LitellmAliasPlugin.buildOutput()` with mock agents/categories → verify alias map shape and sort order
- **Registry test:** `exportOne()` with a mock plugin that has `afterExport` → verify hook is called after file write
- **DbWriter test:** `AliasDbWriter.updateAliases()` with mock `dataSource` → verify `updateAgentRoutingConfig` is called with correct data
- **Regression test:** Existing plugins (OpenCode, OpenAgent, VsCode) continue to work without `afterExport`
