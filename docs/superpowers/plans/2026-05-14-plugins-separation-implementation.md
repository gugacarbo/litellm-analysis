# Plugins Separation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract the `plugins` section from `@agents/agents.jsonc` into a separate `@agents/plugins.jsonc` file with its own Zod schema and JSON schema, while keeping the repository interface transparent to consumers.

**Architecture:** Two independent config files, each with its own Zod schema and JSON schema. The `AgentsRepository` reads/writes both files internally and merges them into the existing `DbConfig` type for backward compatibility. No changes needed in services or routes.

**Tech Stack:** TypeScript, Zod, Vitest

---

## Task 1: Create `pluginsConfigSchema` Zod schema

**Files:**
- Create: `repositories/agents-repository/src/schemas/plugins-config.ts`

- [ ] **Step 1: Create the new schema file**

```typescript
// repositories/agents-repository/src/schemas/plugins-config.ts
import { z } from "zod";
import { pluginRoutingSchema } from "./plugin-routing";

export const pluginsConfigSchema = z
  .object({
    $schema: z
      .string()
      .default("./plugins.schema.json")
      .meta({ title: "Schema", description: "JSON Schema reference" })
      .optional(),
    version: z
      .number()
      .default(2)
      .meta({ title: "Version", description: "Config version" }),
    plugins: z
      .record(z.string(), pluginRoutingSchema)
      .default({})
      .meta({ title: "Plugins", description: "Plugin configurations" }),
  })
  .strict();

export type PluginsConfig = z.infer<typeof pluginsConfigSchema>;
```

- [ ] **Step 2: Verify it compiles**

Run: `pnpm --filter @lite-llm/agents-repository typecheck`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add repositories/agents-repository/src/schemas/plugins-config.ts
git commit -m "feat(agents-repository): add pluginsConfigSchema for separate plugins config"
```

---

## Task 2: Remove `plugins` from `dbConfigSchema`, create merged `DbConfig` type

**Files:**
- Modify: `repositories/agents-repository/src/schemas/db-config.ts`
- Modify: `repositories/agents-repository/src/schemas/index.ts`

- [ ] **Step 1: Update `db-config.ts` — remove plugins field, rename to `agentsConfigSchema`, keep `DbConfig` as merged type**

Replace the entire content of `repositories/agents-repository/src/schemas/db-config.ts`:

```typescript
import { z } from "zod";
import { categoryEntrySchema } from "./category";
import { pluginRoutingSchema } from "./plugin-routing";
import { systemAgentSchema } from "./system-agent";

export const agentsConfigSchema = z
  .object({
    $schema: z
      .string()
      .default("./agents.schema.json")
      .meta({ title: "Schema", description: "JSON Schema reference" })
      .optional(),
    version: z
      .number()
      .default(1)
      .meta({ title: "Version", description: "Config version" }),
    agents: z
      .record(z.string(), systemAgentSchema)
      .default({})
      .meta({ title: "Agents", description: "System agents" }),
    categories: z
      .record(z.string(), categoryEntrySchema)
      .default({})
      .meta({ title: "Categories", description: "Agent categories" }),
    globalFallbackModel: z
      .string()
      .default("")
      .meta({
        title: "Global Fallback Model",
        description: "Default fallback model",
      })
      .optional(),
  })
  .strict();

export type AgentsConfig = z.infer<typeof agentsConfigSchema>;

// DbConfig is the merged type used by consumers — agents config + plugins
export type DbConfig = AgentsConfig & {
  plugins: Record<string, z.infer<typeof pluginRoutingSchema>>;
};
```

- [ ] **Step 2: Update `schemas/index.ts` — add new exports, keep `DbConfig` re-export**

Replace the relevant lines in `repositories/agents-repository/src/schemas/index.ts`:

```typescript
// Re-export all schemas and types

export type {
  Cost,
  ModelSpec,
  ThinkingConfig,
} from "@lite-llm/models-repository/schemas";
export {
  costSchema,
  modelSpecSchema,
  thinkingSchema,
} from "@lite-llm/models-repository/schemas";
export type { AgentEntry } from "./agent";
export { agentEntrySchema } from "./agent";
export type { AgentExtraConfig } from "./agent-extra-config";
export { agentExtraConfigSchema } from "./agent-extra-config";
export type { CategoryEntry } from "./category";
export { categoryEntrySchema } from "./category";
export type { AgentsConfig } from "./db-config";
export { agentsConfigSchema } from "./db-config";
export type { DbConfig } from "./db-config";
export type { Permission } from "./permission";
export { permissionSchema } from "./permission";
export type { PluginsConfig } from "./plugins-config";
export { pluginsConfigSchema } from "./plugins-config";
export type {
  PluginRouting,
  PluginRoutingRule,
} from "./plugin-routing";
export {
  pluginRoutingRuleSchema,
  pluginRoutingSchema,
} from "./plugin-routing";
export type { SystemAgent } from "./system-agent";
export { systemAgentSchema } from "./system-agent";
```

Note: `DbConfig` is exported as a type-only export since it's now a computed type, not derived from a single schema.

- [ ] **Step 3: Verify it compiles**

Run: `pnpm --filter @lite-llm/agents-repository typecheck`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add repositories/agents-repository/src/schemas/db-config.ts repositories/agents-repository/src/schemas/index.ts
git commit -m "refactor(agents-repository): rename dbConfigSchema to agentsConfigSchema, remove plugins field, add merged DbConfig type"
```

---

## Task 3: Update `AgentsRepository` to read/write two files

**Files:**
- Modify: `repositories/agents-repository/src/repository.ts`
- Modify: `repositories/repository-utils/src/jsonc.ts` (add `mergeConfigContent` if needed)

- [ ] **Step 1: Update `AgentsRepository` to manage two files**

Replace the entire content of `repositories/agents-repository/src/repository.ts`:

```typescript
import { existsSync, readFileSync } from "node:fs";
import * as path from "node:path";
import {
  normalizeConfig,
  parseConfigContent,
} from "@lite-llm/repository-utils/jsonc";
import {
  type AgentsConfig,
  type DbConfig,
  agentsConfigSchema,
} from "./schemas/db-config";
import { type PluginsConfig, pluginsConfigSchema } from "./schemas/plugins-config";
import { FileStorage, type IStorage } from "./storage";

// Re-export types for convenience
export type {
  AgentEntry,
  CategoryEntry,
  Cost,
  DbConfig,
  ModelSpec,
  Permission,
  ThinkingConfig,
} from "./schemas/index";

export type { AgentsConfig } from "./schemas/db-config";
export type { PluginsConfig } from "./schemas/plugins-config";

export interface RepositoryOptions {
  filePath: string;
  pluginsFilePath?: string;
  storage?: IStorage;
  validateOnRead?: boolean;
}

export interface IAgentsRepository {
  read(): Promise<DbConfig>;
  readSync(): DbConfig;
  write(config: DbConfig): Promise<void>;
  validate(config: unknown): config is DbConfig;
  exists(): Promise<boolean>;
  getPath(): string;
}

export class AgentsRepository implements IAgentsRepository {
  private readonly filePath: string;
  private readonly pluginsFilePath: string;
  private readonly storage: IStorage;
  private readonly validateOnRead: boolean;

  constructor(options: RepositoryOptions) {
    this.filePath = options.filePath;
    this.pluginsFilePath =
      options.pluginsFilePath ??
      resolvePluginsPath(options.filePath);
    this.storage = options.storage ?? new FileStorage();
    this.validateOnRead = options.validateOnRead ?? true;
  }

  async read(): Promise<DbConfig> {
    const [agentsContent, pluginsContent] = await Promise.all([
      this.storage.read(this.filePath),
      this.storage.read(this.pluginsFilePath),
    ]);

    const agentsParsed = normalizeConfig(
      parseConfigContent(agentsContent, this.filePath),
    );
    const pluginsParsed = normalizeConfig(
      parseConfigContent(pluginsContent, this.pluginsFilePath),
    );

    let agentsConfig: AgentsConfig;
    let pluginsConfig: PluginsConfig;

    if (this.validateOnRead) {
      const agentsResult = agentsConfigSchema.safeParse(agentsParsed);
      if (!agentsResult.success) {
        throw new Error(
          `Invalid agents config at ${this.filePath}: ${agentsResult.error.message}`,
        );
      }
      agentsConfig = agentsResult.data;

      const pluginsResult = pluginsConfigSchema.safeParse(pluginsParsed);
      if (!pluginsResult.success) {
        throw new Error(
          `Invalid plugins config at ${this.pluginsFilePath}: ${pluginsResult.error.message}`,
        );
      }
      pluginsConfig = pluginsResult.data;
    } else {
      agentsConfig = agentsParsed as AgentsConfig;
      pluginsConfig = pluginsParsed as PluginsConfig;
    }

    return { ...agentsConfig, plugins: pluginsConfig.plugins };
  }

  readSync(): DbConfig {
    const agentsContent = readFileSync(this.filePath, "utf-8");
    const pluginsContent = readFileSync(this.pluginsFilePath, "utf-8");

    const agentsParsed = normalizeConfig(
      parseConfigContent(agentsContent, this.filePath),
    );
    const pluginsParsed = normalizeConfig(
      parseConfigContent(pluginsContent, this.pluginsFilePath),
    );

    let agentsConfig: AgentsConfig;
    let pluginsConfig: PluginsConfig;

    if (this.validateOnRead) {
      const agentsResult = agentsConfigSchema.safeParse(agentsParsed);
      if (!agentsResult.success) {
        throw new Error(
          `Invalid agents config at ${this.filePath}: ${agentsResult.error.message}`,
        );
      }
      agentsConfig = agentsResult.data;

      const pluginsResult = pluginsConfigSchema.safeParse(pluginsParsed);
      if (!pluginsResult.success) {
        throw new Error(
          `Invalid plugins config at ${this.pluginsFilePath}: ${pluginsResult.error.message}`,
        );
      }
      pluginsConfig = pluginsResult.data;
    } else {
      agentsConfig = agentsParsed as AgentsConfig;
      pluginsConfig = pluginsParsed as PluginsConfig;
    }

    return { ...agentsConfig, plugins: pluginsConfig.plugins };
  }

  async write(config: DbConfig): Promise<void> {
    const { plugins, ...agentsConfig } = config;
    const pluginsConfig: PluginsConfig = {
      version: agentsConfig.version,
      plugins: plugins ?? {},
    };

    const agentsResult = agentsConfigSchema.safeParse(
      normalizeConfig(agentsConfig),
    );
    if (!agentsResult.success) {
      throw new Error(`Invalid agents config: ${agentsResult.error.message}`);
    }

    const pluginsResult = pluginsConfigSchema.safeParse(
      normalizeConfig(pluginsConfig),
    );
    if (!pluginsResult.success) {
      throw new Error(
        `Invalid plugins config: ${pluginsResult.error.message}`,
      );
    }

    await Promise.all([
      this.storage.write(
        this.filePath,
        JSON.stringify(agentsResult.data, null, 2),
      ),
      this.storage.write(
        this.pluginsFilePath,
        JSON.stringify(pluginsResult.data, null, 2),
      ),
    ]);
  }

  validate(config: unknown): config is DbConfig {
    if (typeof config !== "object" || config === null) return false;
    const { plugins, ...agentsPart } = config as Record<string, unknown>;
    const agentsResult = agentsConfigSchema.safeParse(agentsPart);
    const pluginsResult = pluginsConfigSchema.safeParse({ version: 2, plugins });
    return agentsResult.success && pluginsResult.success;
  }

  async exists(): Promise<boolean> {
    const [agentsExists, pluginsExists] = await Promise.all([
      this.storage.exists(this.filePath),
      this.storage.exists(this.pluginsFilePath),
    ]);
    return agentsExists && pluginsExists;
  }

  getPath(): string {
    return this.filePath;
  }
}

// ── Helpers ──

function resolvePluginsPath(agentsPath: string): string {
  const dir = path.dirname(agentsPath);
  const ext = path.extname(agentsPath).toLowerCase();
  const base = ext === ".jsonc" ? "plugins.jsonc" : "plugins.json";
  return path.join(dir, base);
}

// ── Factory ──

export function createRepository(
  options: RepositoryOptions,
): IAgentsRepository {
  return new AgentsRepository(options);
}
```

- [ ] **Step 2: Verify it compiles**

Run: `pnpm --filter @lite-llm/agents-repository typecheck`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add repositories/agents-repository/src/repository.ts
git commit -m "refactor(agents-repository): update repository to read/write agents and plugins from separate files"
```

---

## Task 4: Update `createRepositoryClient` to ensure both files exist

**Files:**
- Modify: `packages/agents-manager/src/repository/client.ts`

- [ ] **Step 1: Add plugins file path resolution and ensure it exists**

Update `packages/agents-manager/src/repository/client.ts` to handle the new `pluginsFilePath` option:

```typescript
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import * as path from "node:path";
import * as process from "node:process";
import {
  createRepository,
  type IAgentsRepository,
  type RepositoryOptions,
} from "@lite-llm/agents-repository/repository";
import { DEFAULT_DB_PATH } from "../config/defaults";

export interface RepositoryClientOptions {
  filePath?: string;
  pluginsFilePath?: string;
}

const DEFAULT_PLUGINS_PATH = "@agents/plugins.json";

export function createRepositoryClient(
  options: RepositoryClientOptions = {},
): IAgentsRepository {
  const filePath = options.filePath ?? DEFAULT_DB_PATH;
  const pluginsFilePath = options.pluginsFilePath ?? DEFAULT_PLUGINS_PATH;

  // Resolve special paths like @agents/agents.json, with json/jsonc fallback.
  const resolvedPath = resolveDbPathWithFallback(filePath);
  const resolvedPluginsPath = resolveDbPathWithFallback(pluginsFilePath);

  ensureConfigFileExists(resolvedPath);
  ensurePluginsFileExists(resolvedPluginsPath);

  const repoOptions: RepositoryOptions = {
    filePath: resolvedPath,
    pluginsFilePath: resolvedPluginsPath,
    validateOnRead: false,
  };
  return createRepository(repoOptions);
}

function ensureConfigFileExists(targetPath: string): void {
  if (existsSync(targetPath)) return;

  const ext = path.extname(targetPath).toLowerCase();
  const defaultPath =
    ext === ".jsonc"
      ? targetPath.replace(/\.jsonc$/i, ".default.json")
      : targetPath.replace(/\.json$/i, ".default.json");

  if (!existsSync(defaultPath)) return;

  mkdirSync(path.dirname(targetPath), { recursive: true });
  copyFileSync(defaultPath, targetPath);
}

function ensurePluginsFileExists(targetPath: string): void {
  if (existsSync(targetPath)) return;

  const ext = path.extname(targetPath).toLowerCase();
  const defaultPath =
    ext === ".jsonc"
      ? targetPath.replace(/\.jsonc$/i, ".default.json")
      : targetPath.replace(/\.json$/i, ".default.json");

  if (existsSync(defaultPath)) {
    mkdirSync(path.dirname(targetPath), { recursive: true });
    copyFileSync(defaultPath, targetPath);
    return;
  }

  // No default file — create minimal plugins config
  mkdirSync(path.dirname(targetPath), { recursive: true });
  const minimalPlugins = {
    $schema:
      ext === ".jsonc" ? "./plugins.schema.json" : "./plugins.schema.json",
    version: 2,
    plugins: {},
  };
  writeFileSync(targetPath, JSON.stringify(minimalPlugins, null, 2), "utf-8");
}

function resolveDbPathWithFallback(dbPath: string): string {
  const resolvedPath = resolveDbPath(dbPath);
  const ext = path.extname(resolvedPath).toLowerCase();

  if (ext === ".json") {
    const jsoncPath = `${resolvedPath}c`;
    if (!existsSync(resolvedPath) && existsSync(jsoncPath)) {
      return jsoncPath;
    }
  }

  if (ext === ".jsonc") {
    const jsonPath = resolvedPath.slice(0, -1);
    if (!existsSync(resolvedPath) && existsSync(jsonPath)) {
      return jsonPath;
    }
  }

  return resolvedPath;
}

function resolveDbPath(dbPath: string): string {
  // Handle special @agents/ and @db/ paths -- resolve relative to monorepo root
  if (dbPath.startsWith("@agents/") || dbPath.startsWith("@db/")) {
    const monorepoRoot = findMonorepoRoot();
    return path.join(monorepoRoot, dbPath);
  }

  // Handle absolute paths
  if (path.isAbsolute(dbPath)) {
    return dbPath;
  }

  // Handle relative paths -- resolve from current working directory
  return path.resolve(process.cwd(), dbPath);
}

function findMonorepoRoot(): string {
  // Walk up from current directory to find pnpm-workspace.yaml
  // (monorepo root marker). If not found, fall back to findProjectRoot.
  let dir = process.cwd();
  const root = path.parse(dir).root;

  while (dir !== root) {
    const workspacePath = path.join(dir, "pnpm-workspace.yaml");
    if (existsSync(workspacePath)) {
      return dir;
    }

    dir = path.dirname(dir);
  }

  // Fallback: find closest package.json
  return findProjectRoot();
}

function findProjectRoot(): string {
  let dir = process.cwd();
  const root = path.parse(dir).root;

  while (dir !== root) {
    const pkgPath = path.join(dir, "package.json");
    if (existsSync(pkgPath)) {
      return dir;
    }

    dir = path.dirname(dir);
  }

  return process.cwd();
}
```

- [ ] **Step 2: Verify it compiles**

Run: `pnpm --filter @lite-llm/agents-manager typecheck`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add packages/agents-manager/src/repository/client.ts
git commit -m "feat(agents-manager): update createRepositoryClient to manage both agents and plugins config files"
```

---

## Task 5: Create `@agents/plugins.jsonc` and `@agents/plugins.default.json`

**Files:**
- Create: `@agents/plugins.jsonc`
- Create: `@agents/plugins.default.json`

- [ ] **Step 1: Create `@agents/plugins.jsonc` with the current plugin data extracted from `agents.jsonc`**

```jsonc
{
  "$schema": "./plugins.schema.json",
  "version": 2,
  "plugins": {
    "opencode": {
      "enabled": false,
      "outputFile": "opencode.json",
      "config": {
        "enabled": true,
        "outputFile": "opencode.json",
        "config": {
          "enabled": true,
          "outputFile": "opencode.json",
          "config": {},
          "routing": {
            "agents": {},
            "categories": {}
          }
        },
        "routing": {
          "agents": {
            "coder": "loom"
          },
          "categories": {}
        }
      },
      "routing": {
        "agents": {
          "coder": "loom",
          "planner": "planner",
          "explorer": "explorer",
          "reviewer": "reviewer",
          "writer": "thread",
          "architect": "warp"
        },
        "categories": {}
      }
    },
    "openagent": {
      "enabled": false,
      "outputFile": "oh-my-openagent.json",
      "config": {},
      "routing": {
        "agents": {},
        "categories": {}
      }
    },
    "vscode": {
      "enabled": false,
      "outputFile": "vscode-oaicopilot.json",
      "config": {},
      "routing": {
        "agents": {},
        "categories": {}
      }
    },
    "litellm-alias": {
      "enabled": false,
      "outputFile": "",
      "config": {},
      "routing": {
        "agents": {
          "coder": "loom",
          "planner": "planner",
          "explorer": "explorer",
          "reviewer": "reviewer",
          "writer": "thread",
          "architect": "warp"
        },
        "categories": {}
      }
    }
  }
}
```

- [ ] **Step 2: Create `@agents/plugins.default.json` with minimal defaults**

```json
{
  "$schema": "./plugins.schema.json",
  "version": 2,
  "plugins": {
    "opencode": {
      "enabled": true,
      "outputFile": "opencode.json",
      "routing": {
        "agents": {},
        "categories": {}
      }
    }
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add @agents/plugins.jsonc @agents/plugins.default.json
git commit -m "feat: add plugins.jsonc and plugins.default.json config files"
```

---

## Task 6: Remove `plugins` from `@agents/agents.jsonc` and `@agents/agents.default.json`

**Files:**
- Modify: `@agents/agents.jsonc`
- Modify: `@agents/agents.default.json`

- [ ] **Step 1: Edit `@agents/agents.jsonc` — remove the `plugins` section and the trailing comma before it**

In `@agents/agents.jsonc`, remove lines 444-515 (the entire `"plugins": { ... }` block) and the trailing comma after `"globalFallbackModel": "MiniMax-M2.7-highspeed",` (change to no trailing comma or remove comma).

The file should end with:

```jsonc
{
  "$schema": "./agents.schema.json",
  "version": 2,
  "agents": { ... },
  "categories": { ... },
  "globalFallbackModel": "MiniMax-M2.7-highspeed"
}
```

- [ ] **Step 2: Edit `@agents/agents.default.json` — remove the `plugins` section**

Remove the `"plugins": { ... }` block at the end. The file should end with:

```json
{
  "$schema": "./agents.schema.json",
  "version": 2,
  "globalFallbackModel": "",
  "provider": { ... },
  "models": { ... },
  "agents": { ... },
  "categories": { ... }
}
```

- [ ] **Step 3: Commit**

```bash
git add @agents/agents.jsonc @agents/agents.default.json
git commit -m "refactor: remove plugins section from agents config files"
```

---

## Task 7: Update JSON schema generation script to produce two schemas

**Files:**
- Modify: `repositories/agents-repository/scripts/generate-json-schema.ts`

- [ ] **Step 1: Update the script to generate both `agents.schema.json` and `plugins.schema.json`**

Replace the entire content of `repositories/agents-repository/scripts/generate-json-schema.ts`:

```typescript
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { z } from "zod";
import { agentsConfigSchema } from "../src/schemas/db-config.ts";
import { pluginsConfigSchema } from "../src/schemas/plugins-config.ts";

function generateSchema(
  schema: z.ZodType,
  outputPath: string,
): void {
  const jsonSchema = z.toJSONSchema(schema);

  // Downgrade $schema URI to draft-07 for AJV compatibility
  if (jsonSchema.$schema) {
    jsonSchema.$schema = "http://json-schema.org/draft-07/schema#";
  }

  const output = `${JSON.stringify(jsonSchema, null, 2)}
`;

  writeFileSync(outputPath, output, "utf-8");
  console.log("Written:", outputPath);
}

// Generate agents schema (without plugins)
const agentsSchemaPath = resolve(
  import.meta.dirname,
  "../../../@agents/agents.schema.json",
);
generateSchema(agentsConfigSchema, agentsSchemaPath);

// Generate plugins schema
const pluginsSchemaPath = resolve(
  import.meta.dirname,
  "../../../@agents/plugins.schema.json",
);
generateSchema(pluginsConfigSchema, pluginsSchemaPath);
```

Note: The `model.enabled` optional fix block is specific to the old combined schema. Since `agentsConfigSchema` no longer includes models (that's a different config), this fix is no longer needed. If models are still part of `agentsConfigSchema`, re-add the fix block — check the schema output and add back if needed.

- [ ] **Step 2: Run the script to generate both schemas**

Run: `pnpm --filter @lite-llm/agents-repository generate:schema`
Expected: Two files written — `@agents/agents.schema.json` and `@agents/plugins.schema.json`

- [ ] **Step 3: Verify the generated schemas**

Check that `@agents/agents.schema.json` no longer has a `plugins` property, and `@agents/plugins.schema.json` has the `plugins` property.

- [ ] **Step 4: Commit**

```bash
git add repositories/agents-repository/scripts/generate-json-schema.ts @agents/agents.schema.json @agents/plugins.schema.json
git commit -m "feat(agents-repository): generate separate agents and plugins JSON schemas"
```

---

## Task 8: Add validation scripts for both config files

**Files:**
- Modify: `repositories/agents-repository/package.json`

- [ ] **Step 1: Add `validate:plugins` script**

In `repositories/agents-repository/package.json`, add to the `scripts` section:

```json
{
  "scripts": {
    "typecheck": "tsc --noEmit",
    "build": "tsc",
    "test": "vitest run",
    "validate:agents": "ajv validate -s ../../@agents/agents.schema.json -d ../../@agents/agents.jsonc",
    "validate:plugins": "ajv validate -s ../../@agents/plugins.schema.json -d ../../@agents/plugins.jsonc"
  }
}
```

Note: If `validate:agents` already exists, keep it as-is. Only add `validate:plugins`.

- [ ] **Step 2: Run both validations**

Run: `pnpm --filter @lite-llm/agents-repository validate:agents && pnpm --filter @lite-llm/agents-repository validate:plugins`
Expected: Both pass without errors

- [ ] **Step 3: Commit**

```bash
git add repositories/agents-repository/package.json
git commit -m "feat(agents-repository): add validate:plugins script for separate plugins schema"
```

---

## Task 9: Update existing tests for the new two-file repository

**Files:**
- Modify: Existing test files in `repositories/agents-repository/src/__tests__/`

- [ ] **Step 1: Find and review existing tests**

Run: `find repositories/agents-repository -name "*.test.ts" -o -name "*.spec.ts"`

- [ ] **Step 2: Update tests to provide a plugins file path**

Any test that creates an `AgentsRepository` or calls `createRepositoryClient` must now account for the second file. The key change: `RepositoryOptions` now accepts `pluginsFilePath`, and if not provided, it's derived from `filePath` by replacing the filename with `plugins.jsonc`.

For tests using `MemoryStorage`, ensure both agents and plugins content is available. If tests mock the repository interface, they likely don't need changes since the `DbConfig` type is unchanged.

- [ ] **Step 3: Run tests**

Run: `pnpm --filter @lite-llm/agents-repository test`
Expected: All tests pass

- [ ] **Step 4: Commit**

```bash
git add -u
git commit -m "test(agents-repository): update tests for two-file repository"
```

---

## Task 10: Full typecheck and integration validation

**Files:**
- No new files — validation only

- [ ] **Step 1: Run full typecheck across the monorepo**

Run: `pnpm typecheck`
Expected: No errors

- [ ] **Step 2: Run all tests**

Run: `pnpm test`
Expected: All tests pass (allow `passWithNoTests` for packages without tests)

- [ ] **Step 3: Run lint**

Run: `pnpm lint`
Expected: No new errors

- [ ] **Step 4: Verify `pnpm dev` starts correctly**

Run: `pnpm dev` (start and check server starts, then stop)
Expected: Server starts without errors

- [ ] **Step 5: Final commit if any fixes were needed**

```bash
git add -u
git commit -m "fix: address typecheck/test/lint issues from plugins separation"
```