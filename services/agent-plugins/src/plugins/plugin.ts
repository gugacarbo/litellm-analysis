import type { ModelSpec } from "@lite-llm/models-repository/schemas";
import type { CategoryEntry, PluginRouting, SystemAgent } from "../types";
import type {
  ConfigField,
  InternalAgent,
  PluginConfigFor,
  PluginConfigMap,
} from "./plugin-types";

export interface TransformContext {
  allModels: Record<string, ModelSpec>;
  globalFallbackModel?: string;
  modelProxyConfig: { baseUrl: string; apiKey: string };
  allCategories?: Record<string, CategoryEntry>;
  /** Logical slot names for alias generation (e.g. gpt-5.5..gpt-5.1). Provided by the plugin's routing configuration. */
  modelNames?: readonly string[];
}

type TypedPluginRouting<TConfig> = Omit<PluginRouting, "config"> & {
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
