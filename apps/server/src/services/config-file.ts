import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '../../../..');
const CONFIG_DIR = path.join(PROJECT_ROOT, 'data');
const CONFIG_FILE = path.join(CONFIG_DIR, 'agent-config.json');
const PROVIDERS_FILE = path.join(CONFIG_DIR, 'opencode-providers.json');
const VSODE_MODELS_FILE = path.join(CONFIG_DIR, 'vscode-models.json');

export interface AgentConfig {
  model?: string;
  fallback_models?: string[];
  variant?: string;
  category?: string;
  skills?: string[];
  temperature?: number;
  top_p?: number;
  prompt?: string;
  prompt_append?: string;
  tools?: Record<string, boolean>;
  disable?: boolean;
  description?: string;
  mode?: 'subagent' | 'primary' | 'all';
  color?: string;
  permission?: {
    edit?: 'ask' | 'allow' | 'deny';
    bash?: 'ask' | 'allow' | 'deny' | Record<string, 'ask' | 'allow' | 'deny'>;
    webfetch?: 'ask' | 'allow' | 'deny';
    doom_loop?: 'ask' | 'allow' | 'deny';
    external_directory?: 'ask' | 'allow' | 'deny';
  };
}

export interface CategoryConfig {
  model?: string;
  fallback_models?: string[];
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
  description?: string;
}

export interface AgentConfigFile {
  agents: Record<string, AgentConfig>;
  categories: Record<string, CategoryConfig>;
}

export interface ModelEntry {
  modelName: string;
  litellmParams: Record<string, unknown> | null;
}

async function ensureDir(): Promise<void> {
  await fs.promises.mkdir(CONFIG_DIR, { recursive: true });
}

export async function readConfigFile(): Promise<AgentConfigFile> {
  try {
    const content = await fs.promises.readFile(CONFIG_FILE, 'utf-8');
    const parsed = JSON.parse(content) as AgentConfigFile;
    return {
      agents: parsed.agents || {},
      categories: parsed.categories || {},
    };
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return { agents: {}, categories: {} };
    }
    throw new Error(`Failed to read config file: ${(error as Error).message}`);
  }
}

function isEmptyValue(value: unknown): boolean {
  if (value === '' || value === null || value === undefined) return true;
  if (Array.isArray(value) && value.length === 0) return true;
  if (
    typeof value === 'object' &&
    value !== null &&
    Object.keys(value).length === 0
  )
    return true;
  return false;
}

function stripEmptyValues<T extends Record<string, unknown>>(
  obj: T,
): Partial<T> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (isEmptyValue(value)) continue;
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      const stripped = stripEmptyValues(value as Record<string, unknown>);
      if (Object.keys(stripped).length > 0) {
        result[key] = stripped;
      }
    } else {
      result[key] = value;
    }
  }
  return result as Partial<T>;
}

function sanitizeConfig(config: AgentConfigFile): AgentConfigFile {
  const agents: Record<string, AgentConfig> = {};
  for (const [key, agent] of Object.entries(config.agents || {})) {
    if (Object.keys(agent).length === 0) continue;
    agents[key] = stripEmptyValues(
      agent as Record<string, unknown>,
    ) as AgentConfig;
  }
  const categories: Record<string, CategoryConfig> = {};
  for (const [key, category] of Object.entries(config.categories || {})) {
    if (Object.keys(category).length === 0) continue;
    categories[key] = stripEmptyValues(
      category as Record<string, unknown>,
    ) as CategoryConfig;
  }
  return { agents, categories };
}

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

function extractModelId(
  modelName: string,
  litellmParams: Record<string, unknown> | null,
): string {
  if (litellmParams?.model_name) {
    return String(litellmParams.model_name);
  }
  if (modelName.startsWith('litellm/')) {
    return modelName.slice(8);
  }
  return modelName;
}

function buildLiteLLMProviderConfig(
  models: ModelEntry[],
): OpenCodeProviders['provider']['litellm'] {
  const liteLLMModels: Record<string, LiteLLMModelConfig> = {};

  for (const model of models) {
    const params = model.litellmParams || {};
    const modelId = extractModelId(model.modelName, params);

    const modelConfig: LiteLLMModelConfig = {
      id: modelId,
      name: capitalize(modelId),
    };

    if (params.context_window_size || params.max_tokens) {
      modelConfig.limit = {
        context: params.context_window_size
          ? Number(params.context_window_size)
          : undefined,
        output: params.max_tokens ? Number(params.max_tokens) : undefined,
      };
    }

    if (
      params.input_cost_per_token !== undefined ||
      params.output_cost_per_token !== undefined
    ) {
      const toRoundedMillion = (v: unknown) =>
        v ? Math.round(Number(v) * 1_000_000 * 100) / 100 : undefined;

      modelConfig.cost = {
        input: toRoundedMillion(params.input_cost_per_token),
        output: toRoundedMillion(params.output_cost_per_token),
        cache_read: toRoundedMillion(params.cache_read_cost_per_token),
      };
    }

    liteLLMModels[modelId] = modelConfig;
  }

  return {
    name: 'LiteLLM',
    npm: '@ai-sdk/openai-compatible',
    options: {
      baseURL: process.env.LITELLM_BASE_URL || 'http://localhost:4000/v1',
      apiKey: process.env.LITELLM_API_KEY || 'sk-123456789',
    },
    models: liteLLMModels,
  };
}

const MODEL_NAMES = ['gpt-5.4', 'gpt-5.3', 'gpt-5.2', 'gpt-5.1'] as const;
const MAX_FALLBACKS = 3;

function buildAgentModels(
  providerKey: string,
  fallbackCount: number,
): Record<string, LiteLLMModelConfig> {
  const models: Record<string, LiteLLMModelConfig> = {};
  const totalSlots = 1 + Math.min(fallbackCount, MAX_FALLBACKS);

  for (let i = 0; i < totalSlots; i++) {
    const modelName = MODEL_NAMES[i];
    const displayName =
      i === 0
        ? `${capitalize(providerKey)} Model`
        : `${capitalize(providerKey)} Model ${i + 1}`;
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

function capitalize(str: string): string {
  return str
    .split(/[_-]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export async function writeProvidersFile(
  config: AgentConfigFile,
  models?: ModelEntry[],
): Promise<void> {
  const providers: OpenCodeProviders = { provider: {} };

  if (models && models.length > 0) {
    providers.provider.litellm = buildLiteLLMProviderConfig(models);
  }

  for (const [key, agent] of Object.entries(config.agents || {})) {
    if (Object.keys(agent).length === 0) continue;

    const fallbackCount = (agent.fallback_models || []).filter((f) =>
      f?.startsWith(`${key}/`),
    ).length;

    providers.provider[key] = {
      npm: '@ai-sdk/openai-compatible',
      options: {
        baseURL: process.env.LITELLM_BASE_URL || 'http://localhost:4000/v1',
        apiKey: process.env.LITELLM_API_KEY || 'sk-123456789',
      },
      models: buildAgentModels(key, fallbackCount),
    };
  }

  for (const [key, category] of Object.entries(config.categories || {})) {
    if (Object.keys(category).length === 0) continue;

    const fallbackCount = (category.fallback_models || []).filter((f) =>
      f?.startsWith(`${key}/`),
    ).length;

    providers.provider[key] = {
      npm: '@ai-sdk/openai-compatible',
      options: {
        baseURL: process.env.LITELLM_BASE_URL || 'http://localhost:4000/v1',
        apiKey: process.env.LITELLM_API_KEY || 'sk-123456789',
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

// ── vscode-models.json ──

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

/**
 * Known model specs — context_length and max_output from upstream providers.
 * Falls back to these when litellmParams has no context_window_size / max_tokens.
 */
const MODEL_SPECS: Record<
  string,
  { context_length: number; output: number; family?: string; displayName?: string; owned_by?: string }
> = {
  'minimax-m2.7-highspeed': { context_length: 204000, output: 32768, displayName: 'MiniMax M2.7' },
  'qwen3-coder-plus':       { context_length: 800000, output: 32768, displayName: 'Qwen 3 Coder+' },
  'qwen3.5-plus':           { context_length: 800000, output: 32768, displayName: 'Qwen 3.5+' },
  'kimi-k2.5':              { context_length: 260000, output: 32768, displayName: 'Kimi K2.5' },
  'glm-5':                  { context_length: 80000,  output: 32768, family: 'z.ai', displayName: 'GLM 5' },
  'glm-5-turbo':            { context_length: 200000, output: 32768, family: 'z.ai', displayName: 'GLM 5 Turbo' },
  'glm-5.1':                { context_length: 200000, output: 32768, family: 'z.ai', displayName: 'GLM 5.1' },
};

function humanize(str: string): string {
  return str
    .split(/[-_.]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function buildVscodeModelsArray(
  models: ModelEntry[],
  config: AgentConfigFile,
): VscodeModelEntry[] {
  const result: VscodeModelEntry[] = [];
  const baseUrl = process.env.LITELLM_BASE_URL || 'http://localhost:4000';

  // Database models (litellm provider models)
  for (const model of models) {
    const params = model.litellmParams || {};
    const modelId = extractModelId(model.modelName, params);
    const spec = MODEL_SPECS[modelId];

    const entry: VscodeModelEntry = {
      id: modelId,
      owned_by: spec?.owned_by ?? 'atplus',
      displayName: spec?.displayName ?? humanize(modelId),
      baseUrl,
      apiMode: 'openai',
      context_length: params.context_window_size
        ? Number(params.context_window_size)
        : (spec?.context_length ?? 200000),
      limit: {
        output: params.max_tokens
          ? Number(params.max_tokens)
          : (spec?.output ?? 32768),
      },
      ...(spec?.family ? { family: spec.family } : {}),
    };

    result.push(entry);
  }

  // Agent models
  for (const [key, agent] of Object.entries(config.agents || {})) {
    if (Object.keys(agent).length === 0) continue;

    const fallbackCount = (agent.fallback_models || []).filter((f) =>
      f?.startsWith(`${key}/`),
    ).length;
    const totalSlots = 1 + Math.min(fallbackCount, MAX_FALLBACKS);

    for (let i = 0; i < totalSlots; i++) {
      const modelName = MODEL_NAMES[i];
      result.push({
        id: `${key}/${modelName}`,
        owned_by: 'atplus',
        displayName: `${humanize(key)} Model${i > 0 ? ` ${i + 1}` : ''}`,
        baseUrl,
        apiMode: 'openai',
        context_length: 200000,
        limit: { output: 32768 },
      });
    }
  }

  // Category models
  for (const [key, category] of Object.entries(config.categories || {})) {
    if (Object.keys(category).length === 0) continue;

    const fallbackCount = (category.fallback_models || []).filter((f) =>
      f?.startsWith(`${key}/`),
    ).length;
    const totalSlots = 1 + Math.min(fallbackCount, MAX_FALLBACKS);

    for (let i = 0; i < totalSlots; i++) {
      const modelName = MODEL_NAMES[i];
      result.push({
        id: `${key}/${modelName}`,
        owned_by: 'atplus',
        displayName: `${humanize(key)} Model${i > 0 ? ` ${i + 1}` : ''}`,
        baseUrl,
        apiMode: 'openai',
        context_length: 200000,
        limit: { output: 32768 },
      });
    }
  }

  return result;
}

export async function writeVscodeModelsFile(
  config: AgentConfigFile,
  models?: ModelEntry[],
): Promise<void> {
  const modelsList = models || [];
  const vscodeModels = buildVscodeModelsArray(modelsList, config);

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
    VSODE_MODELS_FILE,
    JSON.stringify(output, null, 2),
    'utf-8',
  );
}

async function writeConfigFile(config: AgentConfigFile): Promise<void> {
  const sanitized = sanitizeConfig(config);
  await ensureDir();
  const tmpPath = `${CONFIG_FILE}.tmp`;
  await fs.promises.writeFile(
    tmpPath,
    JSON.stringify(sanitized, null, 2),
    'utf-8',
  );
  await fs.promises.rename(tmpPath, CONFIG_FILE);
}

export async function updateAgentInConfig(
  agentKey: string,
  config: Partial<AgentConfig>,
): Promise<void> {
  const fullConfig = await readConfigFile();
  fullConfig.agents = fullConfig.agents || {};
  fullConfig.agents[agentKey] = { ...fullConfig.agents[agentKey], ...config };
  await writeConfigFile(fullConfig);
}

export async function updateCategoryInConfig(
  categoryKey: string,
  config: Partial<CategoryConfig>,
): Promise<void> {
  const fullConfig = await readConfigFile();
  fullConfig.categories = fullConfig.categories || {};
  fullConfig.categories[categoryKey] = {
    ...fullConfig.categories[categoryKey],
    ...config,
  };
  await writeConfigFile(fullConfig);
}

export async function writeFullConfig(config: AgentConfigFile): Promise<void> {
  await writeConfigFile({
    agents: config.agents || {},
    categories: config.categories || {},
  });
}

export async function deleteAgentFromConfig(agentKey: string): Promise<void> {
  const fullConfig = await readConfigFile();
  if (fullConfig.agents && agentKey in fullConfig.agents) {
    delete fullConfig.agents[agentKey];
    await writeConfigFile(fullConfig);
  }
}

export async function deleteCategoryFromConfig(
  categoryKey: string,
): Promise<void> {
  const fullConfig = await readConfigFile();
  if (fullConfig.categories && categoryKey in fullConfig.categories) {
    delete fullConfig.categories[categoryKey];
    await writeConfigFile(fullConfig);
  }
}
