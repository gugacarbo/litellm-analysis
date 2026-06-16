import type { ModelSpec } from "@lite-llm/models-repository/schemas";
import type { InternalAgent } from "./plugins/plugin-types";
import type { CategoryEntry, PluginRouting, SystemAgent } from "./types";

export type PluginId =
  | "opencode"
  | "openagent"
  | "vscode"
  | "model-alias"
  | "weave";

export interface PluginRuntimeContext {
  allModels: Record<string, ModelSpec>;
  globalFallbackModel?: string;
  modelProxyConfig: { baseUrl: string; apiKey: string };
  allCategories?: Record<string, CategoryEntry>;
  modelNames?: readonly string[];
  ownedBy?: string;
}

export type PluginRoutingFor<TConfig extends Record<string, unknown>> = {
  enabled?: PluginRouting["enabled"];
  outputFile?: PluginRouting["outputFile"];
  routing?: PluginRouting["routing"];
  config?: TConfig;
};

export interface PluginManifest<TId extends string> {
  id: TId;
  displayName: string;
  version: number;
  output: { fileName: string };
  $schema: string;
  internalAgents?: InternalAgent[];
}

export interface PluginHandlers<
  TConfig extends Record<string, unknown>,
  TOutput,
> {
  build(input: {
    agents: SystemAgent[];
    routing: PluginRoutingFor<TConfig>;
    context: PluginRuntimeContext;
  }): TOutput;
  validate?(output: TOutput): boolean;
  afterExport?(output: TOutput): Promise<void>;
}

export interface PluginDefinition<
  TId extends string,
  TConfig extends Record<string, unknown>,
  TOutput,
> {
  manifest: PluginManifest<TId>;
  handlers: PluginHandlers<TConfig, TOutput>;
}

export interface CreatePluginOptions {
  aliasDbWriter?: {
    updateAliases(aliases: Record<string, string>): Promise<void>;
  };
}

export interface PluginExecutionPayload<
  TConfig extends Record<string, unknown>,
> {
  pluginId: string;
  agents: SystemAgent[];
  routing: PluginRoutingFor<TConfig>;
  context: PluginRuntimeContext;
  outputFile: string;
}
