import * as fs from "node:fs/promises";
import * as path from "node:path";
import type {
  DbConfig,
  IAgentsRepository,
} from "@lite-llm/agents-repository/repository";
import type { IPlugin, IPluginRegistry, TransformContext } from "./plugin.js";

export interface PluginRegistryOptions {
  repository: IAgentsRepository;
  outputDir?: string;
}

export class PluginRegistry implements IPluginRegistry {
  private readonly plugins: Map<string, IPlugin> = new Map();
  private readonly repository: IAgentsRepository;
  private readonly outputDir: string;

  constructor(options: PluginRegistryOptions) {
    this.repository = options.repository;
    this.outputDir = options.outputDir ?? "data";
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

  listBuiltins(): IPlugin[] {
    return this.list().filter((p) => p.builtin === true);
  }

  listExternal(): IPlugin[] {
    return this.list().filter((p) => p.builtin !== true);
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
    const context = this.buildContext(config);

    // Use v2 buildOutputV2 if available, otherwise fall back to legacy
    let output: unknown;
    if (plugin.buildOutputV2) {
      const agents = Object.values(config.agents).map((entry) => ({
        id: "",
        displayName: "",
        icon: "",
        description: entry.description ?? "",
        versions: [],
        model: entry.model,
        fallbackModels: entry.fallbackModels ?? [],
        enabledPlugins: [],
        config: {},
      }));
      output = plugin.buildOutputV2(
        agents,
        { version: 1, plugins: {} },
        context,
      );
    } else {
      output = plugin.buildOutput(config, context);
    }

    if (plugin.validate) {
      if (!plugin.validate(output)) {
        throw new Error(`Plugin "${pluginId}" output validation failed`);
      }
    }

    await this.writePluginOutput(plugin, output);
  }

  private buildContext(config: DbConfig): TransformContext {
    const resolvedModels = new Map<string, string>();

    for (const [key, entry] of Object.entries({
      ...config.agents,
      ...config.categories,
    })) {
      resolvedModels.set(key, entry.model);
      entry.fallbackModels?.forEach((m: string) => {
        resolvedModels.set(`${key}-fallback-${m}`, m);
      });
    }

    return {
      entryKey: "",
      entryType: "agent",
      allModels: config.models,
      globalFallbackModel: config.globalFallbackModel,
      litellmConfig: config.litellm,
      resolvedModels,
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
