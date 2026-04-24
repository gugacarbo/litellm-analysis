import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import type {
  AgentConfig,
  AgentConfigFile,
  CategoryConfig,
} from '@litellm/shared';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '../../../');
const CONFIG_DIR = path.join(PROJECT_ROOT, 'data');
const DB_FILE = path.join(CONFIG_DIR, 'db.json');
const LEGACY_CONFIG_FILE = path.join(CONFIG_DIR, 'oh-my-openagent.json');
const PROVIDERS_FILE = path.join(CONFIG_DIR, 'opencode.json');
const VSCODE_MODELS_FILE = path.join(CONFIG_DIR, 'vscode-oaicopilot.json');

// ── Database types ──

export interface DbModelSpec {
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

export interface DbAgentEntry {
  model: string;
  fallbackModels?: string[];
  description?: string;
  color?: string;
  disable?: boolean;
  variant?: string;
  category?: string;
  skills?: string[];
  temperature?: number;
  top_p?: number;
  prompt?: string;
  prompt_append?: string;
  tools?: Record<string, boolean>;
  mode?: 'subagent' | 'primary' | 'all';
  permission?: {
    edit?: 'ask' | 'allow' | 'deny';
    bash?: 'ask' | 'allow' | 'deny' | Record<string, 'ask' | 'allow' | 'deny'>;
    webfetch?: 'ask' | 'allow' | 'deny';
    doom_loop?: 'ask' | 'allow' | 'deny';
    external_directory?: 'ask' | 'allow' | 'deny';
  };
}

export interface DbCategoryEntry {
  model: string;
  fallbackModels?: string[];
  description?: string;
  variant?: string;
  temperature?: number;
  top_p?: number;
  maxTokens?: number;
  thinking?: {
    type: 'enabled' | 'disabled';
    budgetTokens?: number;
  };
  reasoningEffort?: 'low' | 'medium' | 'high' | 'xhigh';
  textVerbosity?: 'low' | 'medium' | 'high';
  tools?: Record<string, boolean>;
  prompt_append?: string;
  is_unstable_agent?: boolean;
}

export interface DbConfig {
  $schema?: string;
  version: number;
  litellm: {
    baseUrl: string;
    apiKey: string;
  };
  models: Record<string, DbModelSpec>;
  agents: Record<string, DbAgentEntry>;
  categories: Record<string, DbCategoryEntry>;
  globalFallbackModel?: string;
}

// ── Database read/write ──

async function ensureDir(): Promise<void> {
  await fs.promises.mkdir(CONFIG_DIR, { recursive: true });
}

export async function readDb(): Promise<DbConfig> {
  try {
    const content = await fs.promises.readFile(DB_FILE, 'utf-8');
    return JSON.parse(content) as DbConfig;
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return {
        version: 1,
        litellm: {
          baseUrl: 'http://localhost:4000/v1',
          apiKey: 'sk-123456789',
        },
        models: {},
        agents: {},
        categories: {},
      };
    }
    throw new Error(`Failed to read db file: ${(error as Error).message}`);
  }
}

export async function writeDb(config: DbConfig): Promise<void> {
  await ensureDir();
  const tmpPath = `${DB_FILE}.tmp`;
  await fs.promises.writeFile(
    tmpPath,
    JSON.stringify(config, null, 2),
    'utf-8',
  );
  await fs.promises.rename(tmpPath, DB_FILE);
}

// ── Output configs: AgentConfigFile (oh-my-openagent.json) ──

export async function readConfigFile(): Promise<AgentConfigFile> {
  const db = await readDb();
  return {
    agents: agentsToOutputConfigs(db.agents),
    categories: categoriesToOutputConfigs(db.categories),
    ...(db.globalFallbackModel ? { globalFallbackModel: db.globalFallbackModel } : {}),
  };
}

const MODEL_NAMES = ['gpt-5.5', 'gpt-5.4', 'gpt-5.3', 'gpt-5.2', 'gpt-5.1'] as const;

function agentsToOutputConfigs(
  agents: Record<string, DbAgentEntry>,
  globalFallbackModel?: string,
): Record<string, AgentConfig> {
  const result: Record<string, AgentConfig> = {};
  for (const [key, entry] of Object.entries(agents)) {
    if (Object.keys(entry).length === 0) continue;
    const output: AgentConfig = {};

    // Transform real model names to aliases: qwen3.5-plus → sisyphus/gpt-5.4
    if (entry.model) {
      output.model = `${key}/${MODEL_NAMES[0]}`;
    }
    const fallbackCount = Math.min(entry.fallbackModels?.length ?? 0, 3);
    const agentFallbacks = entry.fallbackModels?.slice(0, 3).map(
      (_, i) => `${key}/${MODEL_NAMES[i + 1]}`,
    ) ?? [];

    // Add global fallback as last slot (gpt-5.1) if available
    if (globalFallbackModel) {
      agentFallbacks.push(`${key}/${MODEL_NAMES[4]}`);
    }

    if (agentFallbacks.length > 0) {
      output.fallback_models = agentFallbacks;
    }
    if (entry.description) output.description = entry.description;
    if (entry.color) output.color = entry.color;
    if (entry.disable !== undefined) output.disable = entry.disable;
    if (entry.variant) output.variant = entry.variant;
    if (entry.category) output.category = entry.category;
    if (entry.skills?.length) output.skills = entry.skills;
    if (entry.temperature !== undefined) output.temperature = entry.temperature;
    if (entry.top_p !== undefined) output.top_p = entry.top_p;
    if (entry.prompt) output.prompt = entry.prompt;
    if (entry.prompt_append) output.prompt_append = entry.prompt_append;
    if (entry.tools) output.tools = entry.tools;
    if (entry.mode) output.mode = entry.mode;
    if (entry.permission) output.permission = entry.permission;
    result[key] = output;
  }
  return result;
}

function categoriesToOutputConfigs(
  categories: Record<string, DbCategoryEntry>,
  globalFallbackModel?: string,
): Record<string, CategoryConfig> {
  const result: Record<string, CategoryConfig> = {};
  for (const [key, entry] of Object.entries(categories)) {
    if (Object.keys(entry).length === 0) continue;
    const output: CategoryConfig = {};

    // Transform real model names to aliases: qwen3.5-plus → visual-engineering/gpt-5.4
    if (entry.model) {
      output.model = `${key}/${MODEL_NAMES[0]}`;
    }
    const fallbackCount = Math.min(entry.fallbackModels?.length ?? 0, 3);
    const categoryFallbacks = entry.fallbackModels?.slice(0, 3).map(
      (_, i) => `${key}/${MODEL_NAMES[i + 1]}`,
    ) ?? [];

    // Add global fallback as last slot (gpt-5.1) if available
    if (globalFallbackModel) {
      categoryFallbacks.push(`${key}/${MODEL_NAMES[4]}`);
    }

    if (categoryFallbacks.length > 0) {
      output.fallback_models = categoryFallbacks;
    }
    if (entry.description) output.description = entry.description;
    if (entry.variant) output.variant = entry.variant;
    if (entry.temperature !== undefined) output.temperature = entry.temperature;
    if (entry.top_p !== undefined) output.top_p = entry.top_p;
    if (entry.maxTokens) output.maxTokens = entry.maxTokens;
    if (entry.thinking) output.thinking = entry.thinking;
    if (entry.reasoningEffort) output.reasoningEffort = entry.reasoningEffort;
    if (entry.textVerbosity) output.textVerbosity = entry.textVerbosity;
    if (entry.tools) output.tools = entry.tools;
    if (entry.prompt_append) output.prompt_append = entry.prompt_append;
    if (entry.is_unstable_agent !== undefined)
      output.is_unstable_agent = entry.is_unstable_agent;
    result[key] = output;
  }
  return result;
}

function inputAgentToDb(raw: Partial<AgentConfig>): DbAgentEntry {
  const entry: DbAgentEntry = {} as DbAgentEntry;
  if (raw.model !== undefined) entry.model = raw.model;
  if (raw.fallback_models !== undefined)
    entry.fallbackModels = raw.fallback_models;
  if (raw.description !== undefined) entry.description = raw.description;
  if (raw.color !== undefined) entry.color = raw.color;
  if (raw.disable !== undefined) entry.disable = raw.disable;
  if (raw.variant !== undefined) entry.variant = raw.variant;
  if (raw.category !== undefined) entry.category = raw.category;
  if (raw.skills !== undefined) entry.skills = raw.skills;
  if (raw.temperature !== undefined) entry.temperature = raw.temperature;
  if (raw.top_p !== undefined) entry.top_p = raw.top_p;
  if (raw.prompt !== undefined) entry.prompt = raw.prompt;
  if (raw.prompt_append !== undefined) entry.prompt_append = raw.prompt_append;
  if (raw.tools !== undefined) entry.tools = raw.tools;
  if (raw.mode !== undefined) entry.mode = raw.mode;
  if (raw.permission !== undefined) entry.permission = raw.permission;
  return entry;
}

function inputCategoryToDb(raw: Partial<CategoryConfig>): DbCategoryEntry {
  const entry: DbCategoryEntry = {} as DbCategoryEntry;
  if (raw.model !== undefined) entry.model = raw.model;
  if (raw.fallback_models !== undefined)
    entry.fallbackModels = raw.fallback_models;
  if (raw.description !== undefined) entry.description = raw.description;
  if (raw.variant !== undefined) entry.variant = raw.variant;
  if (raw.temperature !== undefined) entry.temperature = raw.temperature;
  if (raw.top_p !== undefined) entry.top_p = raw.top_p;
  if (raw.maxTokens !== undefined) entry.maxTokens = raw.maxTokens;
  if (raw.thinking !== undefined) entry.thinking = raw.thinking;
  if (raw.reasoningEffort !== undefined)
    entry.reasoningEffort = raw.reasoningEffort;
  if (raw.textVerbosity !== undefined) entry.textVerbosity = raw.textVerbosity;
  if (raw.tools !== undefined) entry.tools = raw.tools;
  if (raw.prompt_append !== undefined) entry.prompt_append = raw.prompt_append;
  if (raw.is_unstable_agent !== undefined)
    entry.is_unstable_agent = raw.is_unstable_agent;
  return entry;
}

// ── DB CRUD operations ──

export async function readAgentConfigs(): Promise<
  Record<string, DbAgentEntry>
> {
  const db = await readDb();
  return db.agents;
}

export async function readCategoryConfigs(): Promise<
  Record<string, DbCategoryEntry>
> {
  const db = await readDb();
  return db.categories;
}

export async function readModelSpecs(): Promise<Record<string, DbModelSpec>> {
  const db = await readDb();
  return db.models;
}

export async function updateAgentInDb(
  agentKey: string,
  config: Partial<AgentConfig>,
): Promise<void> {
  const db = await readDb();
  db.agents[agentKey] = {
    ...db.agents[agentKey],
    ...inputAgentToDb(config),
  };
  await writeDb(db);
}

export async function updateCategoryInDb(
  categoryKey: string,
  config: Partial<CategoryConfig>,
): Promise<void> {
  const db = await readDb();
  db.categories[categoryKey] = {
    ...db.categories[categoryKey],
    ...inputCategoryToDb(config),
  };
  await writeDb(db);
}

export async function deleteAgentFromDb(agentKey: string): Promise<void> {
  const db = await readDb();
  if (agentKey in db.agents) {
    delete db.agents[agentKey];
    await writeDb(db);
  }
}

export async function deleteCategoryFromDb(categoryKey: string): Promise<void> {
  const db = await readDb();
  if (categoryKey in db.categories) {
    delete db.categories[categoryKey];
    await writeDb(db);
  }
}

export async function writeFullConfig(config: AgentConfigFile): Promise<void> {
  const db = await readDb();
  db.agents = {};
  db.categories = {};

  for (const [key, raw] of Object.entries(config.agents || {}) as [
    string,
    AgentConfig,
  ][]) {
    if (Object.keys(raw).length === 0) continue;
    db.agents[key] = inputAgentToDb(raw);
  }

  for (const [key, raw] of Object.entries(config.categories || {}) as [
    string,
    CategoryConfig,
  ][]) {
    if (Object.keys(raw).length === 0) continue;
    db.categories[key] = inputCategoryToDb(raw);
  }

  await writeDb(db);
}

// ── Input adapters (from API input format to internal Db format) ──

export const updateAgentInConfig = updateAgentInDb;
export const updateCategoryInConfig = updateCategoryInDb;
export const deleteAgentFromConfig = deleteAgentFromDb;
export const deleteCategoryFromConfig = deleteCategoryFromDb;

// ── OpenCode providers (opencode.json) generation ──

interface LiteLLMModelConfig {
  id: string;
  name?: string;
  limit?: {
    output?: number;
    context?: number;
  };
  cost?: {
    input?: number;
    output?: number;
    cache_read?: number;
  };
}

interface OpenCodeProviderEntry {
  name?: string;
  npm: string;
  options?: {
    baseURL: string;
    apiKey: string;
  };
  models?: Record<string, LiteLLMModelConfig>;
}

interface OpenCodeProviders {
  provider: Record<string, OpenCodeProviderEntry>;
}

const MAX_FALLBACKS = 3;

function capitalize(str: string): string {
  return str
    .split(/[_-]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function buildLiteLLMProviderConfig(
  models: Record<string, DbModelSpec>,
  litellmConfig: DbConfig['litellm'],
): OpenCodeProviders['provider']['litellm'] {
  const liteLLMModels: Record<string, LiteLLMModelConfig> = {};

  for (const [modelId, spec] of Object.entries(models)) {
    const modelConfig: LiteLLMModelConfig = {
      id: modelId,
      name: spec.displayName || capitalize(modelId),
    };

    modelConfig.limit = {
      context: spec.contextLength,
      output: spec.maxOutput,
    };

    if (spec.cost?.input !== undefined || spec.cost?.output !== undefined) {
      modelConfig.cost = {
        input: spec.cost.input,
        output: spec.cost.output,
      };
    }

    liteLLMModels[modelId] = modelConfig;
  }

  return {
    name: 'LiteLLM',
    npm: '@ai-sdk/openai-compatible',
    options: {
      baseURL: litellmConfig.baseUrl,
      apiKey: litellmConfig.apiKey,
    },
    models: liteLLMModels,
  };
}

function buildAgentModels(
  providerKey: string,
  fallbackCount: number,
): Record<string, LiteLLMModelConfig> {
  const models: Record<string, LiteLLMModelConfig> = {};
  const totalSlots = 1 + Math.min(fallbackCount, MAX_FALLBACKS);

  for (let i = 0; i < totalSlots; i++) {
    const modelName = MODEL_NAMES[i];
    const displayName =
      i === 0 ? capitalize(providerKey) : `${capitalize(providerKey)} ${i + 1}`;
    models[modelName] = {
      id: `${providerKey}/${modelName}`,
      name: displayName,
      limit: {
        output: 32768,
        context: 200000,
      },
    };
  }

  return models;
}

/**
 * Generate opencode.json from db.json.
 * If `dbModels` from the database are provided, they are merged/override
 * the static model specs in db.json.
 */
export async function writeProvidersFile(
  _config?: AgentConfigFile,
  dbModels?: Array<{
    modelName: string;
    litellmParams: Record<string, unknown> | null;
  }>,
): Promise<void> {
  const db = await readDb();
  const providers: OpenCodeProviders = { provider: {} };

  // Build litellm provider from db.json models, optionally enriched by DB
  const mergedModels: Record<string, DbModelSpec> = { ...db.models };

  if (dbModels && dbModels.length > 0) {
    for (const m of dbModels) {
      const params = m.litellmParams || {};
      let modelId = m.modelName;
      if (modelId.startsWith('litellm/')) {
        modelId = modelId.slice(8);
      }
      if (params.model_name) {
        modelId = String(params.model_name);
      }

      mergedModels[modelId] = {
        displayName: mergedModels[modelId]?.displayName || capitalize(modelId),
        ownedBy: mergedModels[modelId]?.ownedBy || 'atplus',
        family: mergedModels[modelId]?.family,
        contextLength: params.context_window_size
          ? Number(params.context_window_size)
          : (mergedModels[modelId]?.contextLength ?? 200000),
        maxOutput: params.max_tokens
          ? Number(params.max_tokens)
          : (mergedModels[modelId]?.maxOutput ?? 32768),
        cost: {
          input: params.input_cost_per_token
            ? Math.round(
                Number(params.input_cost_per_token) * 1_000_000 * 100,
              ) / 100
            : mergedModels[modelId]?.cost?.input,
          output: params.output_cost_per_token
            ? Math.round(
                Number(params.output_cost_per_token) * 1_000_000 * 100,
              ) / 100
            : mergedModels[modelId]?.cost?.output,
        },
      };
    }
  }

  providers.provider.litellm = buildLiteLLMProviderConfig(
    mergedModels,
    db.litellm,
  );

  // Agent providers
  for (const [key, agent] of Object.entries(db.agents)) {
    if (Object.keys(agent).length === 0) continue;

    const fallbackCount = (agent.fallbackModels || []).filter((f) =>
      f?.startsWith(`${key}/`),
    ).length;

    providers.provider[key] = {
      npm: '@ai-sdk/openai-compatible',
      options: {
        baseURL: db.litellm.baseUrl,
        apiKey: db.litellm.apiKey,
      },
      models: buildAgentModels(key, fallbackCount),
    };
  }

  // Category providers
  for (const [key, category] of Object.entries(db.categories)) {
    if (Object.keys(category).length === 0) continue;

    const fallbackCount = (category.fallbackModels || []).filter((f) =>
      f?.startsWith(`${key}/`),
    ).length;

    providers.provider[key] = {
      npm: '@ai-sdk/openai-compatible',
      options: {
        baseURL: db.litellm.baseUrl,
        apiKey: db.litellm.apiKey,
      },
      models: buildAgentModels(key, fallbackCount),
    };
  }

  await fs.promises.writeFile(
    PROVIDERS_FILE,
    JSON.stringify(providers, null, 2),
    'utf-8',
  );
}

// ── VSCode models (vscode-oaicopilot.json) generation ──

interface VscodeModelEntry {
  id: string;
  owned_by: string;
  displayName: string;
  baseUrl: string;
  apiMode: string;
  context_length: number;
  limit: {
    output: number;
  };
  family?: string;
}

function humanize(str: string): string {
  return str
    .split(/[-_.]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function buildVscodeModelsArray(
  models: Record<string, DbModelSpec>,
  litellmConfig: DbConfig['litellm'],
): VscodeModelEntry[] {
  const result: VscodeModelEntry[] = [];
  const baseUrl = litellmConfig.baseUrl.replace(/\/v1$/, '');

  for (const [modelId, spec] of Object.entries(models)) {
    const entry: VscodeModelEntry = {
      id: modelId,
      owned_by: spec.ownedBy ?? 'atplus',
      displayName: spec.displayName ?? humanize(modelId),
      baseUrl,
      apiMode: 'openai',
      context_length: spec.contextLength,
      limit: {
        output: spec.maxOutput,
      },
      ...(spec.family ? { family: spec.family } : {}),
    };

    result.push(entry);
  }

  return result;
}

/**
 * Generate vscode-oaicopilot.json from db.json.
 * If `dbModels` from the database are provided, they are merged/override
 * the static model specs in db.json.
 */
export async function writeVscodeModelsFile(
  dbModels?: Array<{
    modelName: string;
    litellmParams: Record<string, unknown> | null;
  }>,
): Promise<void> {
  const db = await readDb();
  const mergedModels: Record<string, DbModelSpec> = { ...db.models };

  if (dbModels && dbModels.length > 0) {
    for (const m of dbModels) {
      const params = m.litellmParams || {};
      let modelId = m.modelName;
      if (modelId.startsWith('litellm/')) {
        modelId = modelId.slice(8);
      }
      if (params.model_name) {
        modelId = String(params.model_name);
      }

      mergedModels[modelId] = {
        displayName: mergedModels[modelId]?.displayName || humanize(modelId),
        ownedBy: mergedModels[modelId]?.ownedBy || 'atplus',
        family: mergedModels[modelId]?.family,
        contextLength: params.context_window_size
          ? Number(params.context_window_size)
          : (mergedModels[modelId]?.contextLength ?? 200000),
        maxOutput: params.max_tokens
          ? Number(params.max_tokens)
          : (mergedModels[modelId]?.maxOutput ?? 32768),
      };
    }
  }

  const vscodeModels = buildVscodeModelsArray(mergedModels, db.litellm);

  const output: Record<string, unknown> = {
    'oaicopilot.commitLanguage': 'Portuguese (Brazil)',
    'oaicopilot.baseUrl': '',
    'oaicopilot.delay': 0,
    'oaicopilot.readFileLines': 0,
    'oaicopilot.retry': {
      enabled: true,
      max_attempts: 3,
      interval_ms: 2000,
      status_codes: [],
    },
    'oaicopilot.models': vscodeModels,
  };

  await fs.promises.writeFile(
    VSCODE_MODELS_FILE,
    JSON.stringify(output, null, 2),
    'utf-8',
  );
}

// ── oh-my-openagent.json output generation ──

async function writeOutputConfigFile(config: AgentConfigFile): Promise<void> {
  await ensureDir();
  const tmpPath = `${LEGACY_CONFIG_FILE}.tmp`;
  await fs.promises.writeFile(
    tmpPath,
    JSON.stringify(config, null, 2),
    'utf-8',
  );
  await fs.promises.rename(tmpPath, LEGACY_CONFIG_FILE);
}

/**
 * Generate oh-my-openagent.json from db.json.
 * Called after any db.json mutation to keep consumers in sync.
 */
export async function syncOutputConfigFile(): Promise<void> {
  const db = await readDb();
  const legacy = {
    $schema: 'https://raw.githubusercontent.com/opensoft/oh-my-opencode/dev/assets/oh-my-opencode.schema.json',
    ...(db.globalFallbackModel ? { globalFallbackModel: db.globalFallbackModel } : {}),
    agents: agentsToOutputConfigs(db.agents, db.globalFallbackModel),
    categories: categoriesToOutputConfigs(db.categories, db.globalFallbackModel),
  };
  await writeOutputConfigFile(legacy);
}
