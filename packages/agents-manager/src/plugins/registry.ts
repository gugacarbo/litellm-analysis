import * as fs from "node:fs/promises";
import * as path from "node:path";
import type { IAgentsRepository } from "@lite-llm/agents-repository/repository";
import type { IPlugin, IPluginRegistry, TransformContext } from "./plugin.js";
import type { ConfigField, InternalAgent } from "./plugin-types.js";

export interface PluginRegistryOptions {
  repository: IAgentsRepository;
  outputDir?: string;
  allPlugins: IPlugin[];
}

export class PluginRegistry implements IPluginRegistry {
  private readonly plugins = new Map<string, IPlugin>();
  private readonly allPlugins: IPlugin[];
  private readonly repository: IAgentsRepository;
  private readonly outputDir: string;

  constructor(options: PluginRegistryOptions) {
    this.repository = options.repository;
    this.outputDir = options.outputDir ?? "data";
    this.allPlugins = options.allPlugins;
  }

  register(plugin: IPlugin): void {
    if (this.plugins.has(plugin.id)) {
      throw new Error(`Plugin "${plugin.id}" is already registered`);
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

  loadFromConfig(routing: {
    version: number;
    plugins: Record<string, { enabled: boolean }>;
  }): void {
    this.plugins.clear();
    for (const plugin of this.allPlugins) {
      const pluginConfig = routing.plugins[plugin.id];
      if (pluginConfig?.enabled) {
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
    const routing = config.routing ?? { version: 1, plugins: {} };
    const ctx = this.buildContext(config);

    const agents = Object.entries(config.agents ?? {}).map(([id, agent]) => ({
      ...agent,
      id,
    }));
    const output = plugin.buildOutput(agents, routing, ctx);

    if (plugin.validate && !plugin.validate(output)) {
      throw new Error(`Plugin "${pluginId}" output validation failed`);
    }

    await this.writePluginOutput(plugin, output);
  }

  getInternalAgents(pluginId: string): InternalAgent[] {
    const plugin = this.allPlugins.find((p) => p.id === pluginId);
    return plugin?.getInternalAgents() ?? [];
  }

  getConfigSchema(pluginId: string): ConfigField[] {
    const plugin = this.allPlugins.find((p) => p.id === pluginId);
    return plugin?.getConfigSchema() ?? [];
  }

  private buildContext(config: {
    models: Record<string, unknown>;
    globalFallbackModel?: string;
    provider: Record<string, { name: string; baseUrl: string; apiKey: string }>;
  }): TransformContext {
    const selectedProvider =
      config.provider.litellm ?? Object.values(config.provider)[0];
    if (!selectedProvider) {
      throw new Error("At least one provider must be configured");
    }

    return {
      allModels: config.models as TransformContext["allModels"],
      globalFallbackModel: config.globalFallbackModel,
      litellmConfig: {
        baseUrl: selectedProvider.baseUrl,
        apiKey: selectedProvider.apiKey,
      },
    };
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
