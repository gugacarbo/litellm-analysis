import type {
  AgentEntry,
  CategoryEntry,
  DbConfig,
  ModelSpec,
} from "@lite-llm/agents-repository/repository";
import type { PluginRoutingConfig } from "../types/routing.js";
import type { AgentVersion, SystemAgent } from "../types/system-agent.js";

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
// New methods (transformAgent, buildOutputV2) are optional for backward compatibility.
// Existing plugins continue to work without implementing them.

export interface IPlugin {
  readonly id: string;
  readonly name: string;
  readonly version: number;
  readonly builtin?: boolean;

  // ── New Generic Methods (optional — v2 plugins implement these) ──

  transformAgent?(
    agent: SystemAgent,
    version: AgentVersion,
    ctx: TransformContext,
  ): PluginEntry;

  buildOutputV2?(
    agents: SystemAgent[],
    routing: PluginRoutingConfig,
    ctx: TransformContext,
  ): unknown;

  // ── Legacy Methods (all plugins implement these) ──

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
  listBuiltins(): IPlugin[];
  listExternal(): IPlugin[];
  exportAll(): Promise<void>;
  exportOne(pluginId: string): Promise<void>;
}
