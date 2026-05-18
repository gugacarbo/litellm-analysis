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
  register(plugin: IPlugin | IPlugin<any>): void;
  unregister(pluginId: string): void;
  get(pluginId: string): IPlugin | IPlugin<any> | undefined;
  list(): Array<IPlugin | IPlugin<any>>;
  listAll(): Array<IPlugin | IPlugin<any>>;
  loadFromConfig(pluginConfigs: Record<string, PluginRouting>): void;
  exportAll(): Promise<void>;
  exportOne(pluginId: string): Promise<void>;
  getInternalAgents(pluginId: string): InternalAgent[];
  getConfigSchema(pluginId: string): ConfigField[];
}
