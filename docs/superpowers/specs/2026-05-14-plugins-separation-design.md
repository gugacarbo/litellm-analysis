# Design: Separate Plugins from agents.jsonc

**Date:** 2026-05-14
**Status:** Approved

## Context

Plugin configurations (opencode, openagent, vscode, litellm-alias) live inside `@agents/agents.jsonc` under the `plugins` key, alongside agent and category definitions. This coupling makes the config file large and conflates two distinct concerns: agent/category configuration vs. plugin routing configuration.

## Decision

Extract `plugins` from `agents.jsonc` into a new `@agents/plugins.jsonc` file with its own Zod schema and JSON schema. Each file is independently validated and versioned. The repository layer reads both files and merges them in memory, so consumers see a unified `DbConfig` — zero changes needed in services or routes.

## Approach

**Approach A: Two files, two schemas, one repository** — complete data separation with a single `AgentsRepository` that abstracts the two-file read/write.

## Design Details

### 1. File Structure

**Before:**
```
@agents/
├── agents.default.json
├── agents.jsonc          ← agents + categories + plugins
└── agents.schema.json    ← single schema
```

**After:**
```
@agents/
├── agents.default.json      ← unchanged
├── agents.jsonc             ← agents + categories + globalFallbackModel only
├── agents.schema.json       ← generated from agentsConfigSchema
├── plugins.default.json     ← NEW: default plugins config
├── plugins.jsonc            ← NEW: extracted plugins
└── plugins.schema.json      ← NEW: generated from pluginsConfigSchema
```

### 2. Zod Schemas

**`agentsConfigSchema`** (in `repositories/agents-repository/src/schemas/db-config.ts`, renamed/refactored):
```typescript
export const agentsConfigSchema = z.object({
  version: z.number().default(2),
  agents: z.record(z.string(), systemAgentSchema).default({}),
  categories: z.record(z.string(), categoryEntrySchema).default({}),
  globalFallbackModel: z.string().default(""),
});
```

**`pluginsConfigSchema`** (new file `repositories/agents-repository/src/schemas/plugins-config.ts`):
```typescript
export const pluginsConfigSchema = z.object({
  version: z.number().default(2),
  plugins: z.record(z.string(), pluginRoutingSchema).default({}),
});
```

**`DbConfig` type** remains as a merged type for consumers:
```typescript
export type DbConfig = z.infer<typeof agentsConfigSchema> & {
  plugins: z.infer<typeof pluginsConfigSchema>["plugins"];
};
```

**`dbConfigSchema`** (the combined Zod schema) is **removed** — it no longer generates a JSON schema because it doesn't represent a real file.

### 3. Repository Layer

`AgentsRepository` manages two files internally:

```typescript
export class AgentsRepository implements IAgentsRepository {
  private agentsStorage: FileStorage;
  private pluginsStorage: FileStorage;

  constructor(options: RepositoryOptions) {
    this.agentsStorage = new FileStorage(options.filePath);
    const pluginsPath = resolvePluginsPath(options.filePath);
    this.pluginsStorage = new FileStorage(pluginsPath);
  }

  async read(): Promise<DbConfig> {
    const [agentsContent, pluginsContent] = await Promise.all([
      this.agentsStorage.read(),
      this.pluginsStorage.read(),
    ]);
    const agentsConfig = agentsConfigSchema.parse(
      parseConfigContent(agentsContent, this.agentsStorage.filePath)
    );
    const pluginsConfig = pluginsConfigSchema.parse(
      parseConfigContent(pluginsContent, this.pluginsStorage.filePath)
    );
    return { ...agentsConfig, plugins: pluginsConfig.plugins };
  }

  async write(config: DbConfig): Promise<void> {
    const { plugins, ...agentsConfig } = config;
    // Read both files to preserve JSONC comments
    const [agentsContent, pluginsContent] = await Promise.all([
      this.agentsStorage.read(),
      this.pluginsStorage.read(),
    ]);
    const agentsJsonc = mergeConfigContent(
      agentsContent, agentsConfig, this.agentsStorage.filePath
    );
    const pluginsJsonc = mergeConfigContent(
      pluginsContent, { version: agentsConfig.version, plugins }, this.pluginsStorage.filePath
    );
    await Promise.all([
      this.agentsStorage.write(agentsJsonc),
      this.pluginsStorage.write(pluginsJsonc),
    ]);
  }
}
```

**Path resolution:**
```typescript
function resolvePluginsPath(agentsPath: string): string {
  const dir = path.dirname(agentsPath);
  return path.join(dir, "plugins.jsonc");
}
```

**No migration logic.** `plugins.jsonc` is created with current plugin data during implementation. `agents.jsonc` has the `plugins` field removed permanently. No runtime migration needed.

### 4. `createRepositoryClient()`

```typescript
export function createRepositoryClient(options = {}): IAgentsRepository {
  const filePath = resolveDbPathWithFallback(options.filePath ?? DEFAULT_DB_PATH);
  ensureConfigFileExists(filePath);
  ensurePluginsFileExists(resolvePluginsPath(filePath));  // NEW
  return createRepository({ filePath });
}
```

### 5. Services and Routes — No Changes

All consumers (`routing.service.ts`, `plugin-routing-routes.ts`, `PluginRegistry`) operate on the merged `DbConfig` type. The repository abstracts the two-file storage. Zero changes needed in:

| Layer | Change? |
|-------|---------|
| `routing.service.ts` | None |
| `plugin-routing-routes.ts` | None |
| `PluginRegistry` | None |
| `agents-manager` exports | None |

### 6. JSON Schema Generation

`generate-json-schema.ts` generates two files:

```typescript
const agentsJsonSchema = z.toJSONSchema(agentsConfigSchema);
const pluginsJsonSchema = z.toJSONSchema(pluginsConfigSchema);
writeFileSync(resolve(DIR, "../../../@agents/agents.schema.json"), ...);
writeFileSync(resolve(DIR, "../../../@agents/plugins.schema.json"), ...);
```

### 7. Validation Scripts

```bash
pnpm validate:agents   # ajv validate -s agents.schema.json -d agents.jsonc
pnpm validate:plugins   # ajv validate -s plugins.schema.json -d plugins.jsonc
```

### 8. File Change Checklist

| Action | File |
|--------|------|
| **Create** | `@agents/plugins.jsonc` |
| **Create** | `@agents/plugins.default.json` |
| **Create** | `@agents/plugins.schema.json` (generated) |
| **Create** | `repositories/agents-repository/src/schemas/plugins-config.ts` |
| **Modify** | `@agents/agents.jsonc` — remove `plugins` field |
| **Regenerate** | `@agents/agents.schema.json` (without plugins) |
| **Modify** | `repositories/agents-repository/src/schemas/db-config.ts` — extract `agentsConfigSchema`, remove `plugins` |
| **Modify** | `repositories/agents-repository/src/repository.ts` — two-file read/write |
| **Modify** | `repositories/agents-repository/src/index.ts` — export `pluginsConfigSchema` |
| **Modify** | `repositories/agents-repository/scripts/generate-json-schema.ts` — generate two schemas |
| **Modify** | `packages/agents-manager/src/repository/client.ts` — add `ensurePluginsFileExists()` |
| **Modify** | `repositories/agents-repository/package.json` — add `validate:plugins` script |

## Out of Scope

- No migration logic from old `agents.jsonc` format
- No changes to plugin business logic or routing
- No API endpoint changes
- No changes to consumer layers (services, routes)