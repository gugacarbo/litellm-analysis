import * as fs from "node:fs/promises";
import * as path from "node:path";
import type { IModelsRepository } from "@lite-llm/models-repository";
import { getPluginConfigJsonSchema } from "../plugin-config-schemas";
import type { AgentsRepositoryLike, DbConfig, SystemAgent } from "../types";
import type { IPlugin, IPluginRegistry, TransformContext } from "./plugin";
import type { ConfigField, InternalAgent } from "./plugin-types";

/** Flexible plugin config used for loading from repository (all fields optional). */
export interface PluginConfigInput {
  enabled?: boolean;
  outputFile?: string;
  config?: Record<string, unknown>;
  routing?: {
    agents?: Record<string, string | string[]>;
    categories?: Record<string, boolean>;
  };
}

export interface PluginRegistryOptions {
  repository: AgentsRepositoryLike;
  modelsRepository?: IModelsRepository;
  outputDir?: string;
  allPlugins: IPlugin[];
}

export class PluginRegistry implements IPluginRegistry {
  private readonly plugins = new Map<string, IPlugin>();
  private readonly allPlugins: IPlugin[];
  private readonly repository: AgentsRepositoryLike;
  private readonly modelsRepository?: IModelsRepository;
  private readonly outputDir: string;

  constructor(options: PluginRegistryOptions) {
    this.repository = options.repository;
    this.modelsRepository = options.modelsRepository;
    this.outputDir = options.outputDir ?? "data";
    this.allPlugins = options.allPlugins;
    // Register all plugins by default so list() returns them
    for (const plugin of this.allPlugins) {
      this.register(plugin);
    }
  }

  register(plugin: IPlugin): void {
    // Allow re-registration to support auto-registration in constructor
    if (this.plugins.has(plugin.id)) {
      return;
    }
    this.plugins.set(plugin.id, plugin);
  }

  unregister(pluginId: string): void {
    this.plugins.delete(pluginId);
  }

  get(pluginId: string): IPlugin | undefined {
    return this.plugins.get(pluginId);
  }

  list(): IPlugin[] {
    return Array.from(this.plugins.values());
  }

  listAll(): IPlugin[] {
    return [...this.allPlugins];
  }

  loadFromConfig(pluginConfigs: Record<string, PluginConfigInput>): void {
    this.plugins.clear();
    for (const plugin of this.allPlugins) {
      const pc = pluginConfigs[plugin.id];
      if (pc?.enabled) {
        this.register(plugin);
      }
    }
  }

  async exportAll(): Promise<void> {
    for (const plugin of this.plugins.values()) {
      await this.exportOne(plugin.id);
    }
  }

  async exportOne(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin "${pluginId}" not found`);
    }

    const config = await this.repository.read();
    const pluginConfig: PluginConfigInput = config.plugins?.[pluginId] ?? {
      enabled: true,
      outputFile: plugin.getOutputFile(),
      config: {},
      routing: { agents: {}, categories: {} },
    };

    if (pluginConfig.enabled === false) {
      return;
    }

    const ctx = await this.buildContext(config);

    const agents = Object.entries(config.agents ?? {}).map(([id, agent]) => ({
      ...agent,
      id,
    }));
    const output = plugin.buildOutput(
      agents as unknown as SystemAgent[],
      pluginConfig as unknown as Parameters<typeof plugin.buildOutput>[1],
      ctx,
    );

    if (plugin.validate && !plugin.validate(output)) {
      throw new Error(`Plugin "${pluginId}" output validation failed`);
    }

    await this.writePluginOutput(plugin, output);

    if (plugin.afterExport) {
      await plugin.afterExport(output);
    }
  }

  getInternalAgents(pluginId: string): InternalAgent[] {
    const plugin = this.allPlugins.find((p) => p.id === pluginId);
    return plugin?.getInternalAgents() ?? [];
  }

  getConfigSchema(pluginId: string): ConfigField[] {
    const plugin = this.allPlugins.find((p) => p.id === pluginId);
    return plugin?.getConfigSchema() ?? [];
  }

  getJsonSchema(pluginId: string): Record<string, unknown> | null {
    return getPluginConfigJsonSchema(pluginId);
  }

  private async buildContext(config: DbConfig): Promise<TransformContext> {
    const context: TransformContext = {
      allModels: {},
      globalFallbackModel: config.globalFallbackModel,
      modelProxyConfig: {
        baseUrl: "",
        apiKey: "",
      },
      allCategories: config.categories as TransformContext["allCategories"],
    };

    if (!this.modelsRepository) {
      return context;
    }

    try {
      const modelsConfig = await this.modelsRepository.read();
      context.allModels = modelsConfig.models ?? {};

      const modelProxyProvider = modelsConfig.provider?.["local-proxy"];
      context.modelProxyConfig = {
        baseUrl: modelProxyProvider?.baseUrl ?? "",
        apiKey: "",
      };
    } catch {
      // Keep default empty models/provider context when models config isn't available.
    }

    return context;
  }

  private async writePluginOutput(
    plugin: IPlugin,
    output: unknown,
  ): Promise<void> {
    const outputPath = this.resolveOutputPath(plugin.getOutputFile());
    const dir = path.dirname(outputPath);
    await fs.mkdir(dir, { recursive: true });

    const tmpPath = `${outputPath}.tmp`;
    await fs.writeFile(tmpPath, JSON.stringify(output, null, 2), "utf-8");
    await fs.rename(tmpPath, outputPath);
  }

  private resolveOutputPath(relativePath: string): string {
    if (path.isAbsolute(relativePath)) {
      return relativePath;
    }
    return path.join(this.outputDir, relativePath);
  }
}
