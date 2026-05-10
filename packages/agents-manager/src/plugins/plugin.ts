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
