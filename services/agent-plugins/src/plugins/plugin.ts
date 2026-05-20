import type {
  CategoryEntry,
  PluginRouting,
  SystemAgent,
} from "@lite-llm/agents-repository/schemas";
import type { ModelSpec } from "@lite-llm/models-repository/schemas";
import type {
  ConfigField,
  InternalAgent,
  PluginConfigFor,
  PluginConfigMap,
} from "./plugin-types";

export interface TransformContext {
  allModels: Record<string, ModelSpec>;
  globalFallbackModel?: string;
  litellmConfig: { baseUrl: string; apiKey: string };
  allCategories?: Record<string, CategoryEntry>;
  /** Logical slot names for alias generation (e.g. gpt-5.5..gpt-5.1). Provided by the plugin's routing configuration. */
  modelNames?: readonly string[];
}

export type TypedPluginRouting<TConfig> = Omit<PluginRouting, "config"> & {
  config?: TConfig;
};

export interface IPlugin<
  TId extends keyof PluginConfigMap = keyof PluginConfigMap,
> {
  readonly id: TId;
  readonly name: string;
  readonly version: number;

  getInternalAgents(): InternalAgent[];
  getConfigSchema(): ConfigField[];

  buildOutput(
    agents: SystemAgent[],
    routing: TypedPluginRouting<PluginConfigFor<TId>>,
    ctx: TransformContext,
  ): unknown;

  getOutputFile(): string;
  validate?(output: unknown): boolean;
  afterExport?(output: unknown): Promise<void>;
}

export interface IPluginRegistry {
  register(plugin: IPlugin): void;
  unregister(pluginId: string): void;
  get(pluginId: string): IPlugin | undefined;
  list(): IPlugin[];
  listAll(): IPlugin[];
  loadFromConfig(pluginConfigs: Record<string, PluginRouting>): void;
  exportAll(): Promise<void>;
  exportOne(pluginId: string): Promise<void>;
  getInternalAgents(pluginId: string): InternalAgent[];
  getConfigSchema(pluginId: string): ConfigField[];
}

/**
 * Normalize agent routing mappings from string|string[] to string[].
 * Converts single strings and empty strings to arrays. Useful for plugins
 * that need to process 1→N routing (one system agent → multiple plugin agents).
 */
export function normalizeAgentMappings(
  mappings: Record<string, string | string[]>,
): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const [key, value] of Object.entries(mappings)) {
    if (Array.isArray(value)) {
      result[key] = value.filter(Boolean);
    } else if (value) {
      result[key] = [value];
    } else {
      result[key] = [];
    }
  }
  return result;
}
