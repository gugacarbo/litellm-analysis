import type {
  AgentEntry,
  CategoryEntry,
  DbConfig,
  ModelSpec,
} from "@lite-llm/settings-repository/repository";

// ── Types ──

export interface TransformContext {
  entryKey: string;
  entryType: "agent" | "category";
  allModels: Record<string, ModelSpec>;
  globalFallbackModel?: string;
  litellmConfig: { baseUrl: string; apiKey: string };
  resolvedModels: Map<string, string>;
}

export interface PluginModel {
  id: string;
  name: string;
  limit?: { context?: number; output?: number };
  cost?: { input?: number; output?: number };
}

export interface PluginEntry {
  [key: string]: unknown;
}

// ── Plugin Interface ──

export interface IPlugin {
  readonly id: string;
  readonly name: string;
  readonly version: number;

  transformEntry(
    entry: AgentEntry | CategoryEntry,
    context: TransformContext,
  ): PluginEntry;

  transformModel(key: string, spec: ModelSpec): PluginModel | undefined;

  preprocess(config: DbConfig): unknown;

  buildOutput(config: DbConfig, context: TransformContext): unknown;

  getOutputFile(): string;

  validate?(output: unknown): boolean;
}

// ── Plugin Registry Interface ──

export interface IPluginRegistry {
  register(plugin: IPlugin): void;
  unregister(pluginId: string): void;
  get(pluginId: string): IPlugin | undefined;
  list(): IPlugin[];
  exportAll(): Promise<void>;
  exportOne(pluginId: string): Promise<void>;
}
