import * as fs from "node:fs/promises";
import * as path from "node:path";
import type { IModelsRepository } from "@lite-llm/models-repository/repository";
import { PluginExecutionError } from "./errors";
import { getPluginConfigJsonSchema } from "./plugin-config-schemas";
import type { ConfigField, InternalAgent } from "./plugins/plugin-types";
import type { PluginDefinition, PluginRuntimeContext } from "./sdk";
import type {
  AgentsRepositoryLike,
  DbConfig,
  PluginRouting,
  SystemAgent,
} from "./types";

export interface PluginConfigInput {
  enabled?: boolean;
  outputFile?: string;
  config?: Record<string, unknown>;
  routing?: {
    agents?: Record<string, string | string[]>;
    categories?: Record<string, boolean>;
  };
}

export interface PluginRegistryV2 {
  list(): PluginDefinition<string, Record<string, unknown>, unknown>[];
  listAll(): PluginDefinition<string, Record<string, unknown>, unknown>[];
  get(
    pluginId: string,
  ): PluginDefinition<string, Record<string, unknown>, unknown> | undefined;
  loadFromConfig(pluginConfigs: Record<string, PluginConfigInput>): void;
  exportAll(): Promise<void>;
  exportOne(pluginId: string): Promise<void>;
  getInternalAgents(pluginId: string): InternalAgent[];
  getConfigSchema(pluginId: string): ConfigField[];
  getJsonSchema(pluginId: string): Record<string, unknown> | null;
}

export interface CreatePluginRegistryOptions {
  repository: AgentsRepositoryLike;
  modelsRepository?: IModelsRepository;
  outputDir?: string;
  catalog: PluginDefinition<string, Record<string, unknown>, unknown>[];
}

class PluginRegistryV2Impl implements PluginRegistryV2 {
  private readonly enabledPlugins = new Map<
    string,
    PluginDefinition<string, Record<string, unknown>, unknown>
  >();
  private readonly allPlugins: PluginDefinition<
    string,
    Record<string, unknown>,
    unknown
  >[];
  private readonly repository: AgentsRepositoryLike;
  private readonly modelsRepository?: IModelsRepository;
  private readonly outputDir: string;

  constructor(options: CreatePluginRegistryOptions) {
    this.repository = options.repository;
    this.modelsRepository = options.modelsRepository;
    this.outputDir = options.outputDir ?? "data";
    this.allPlugins = options.catalog;

    for (const plugin of this.allPlugins) {
      this.enabledPlugins.set(plugin.manifest.id, plugin);
    }
  }

  get(
    pluginId: string,
  ): PluginDefinition<string, Record<string, unknown>, unknown> | undefined {
    return this.enabledPlugins.get(pluginId);
  }

  list(): PluginDefinition<string, Record<string, unknown>, unknown>[] {
    return Array.from(this.enabledPlugins.values());
  }

  listAll(): PluginDefinition<string, Record<string, unknown>, unknown>[] {
    return [...this.allPlugins];
  }

  loadFromConfig(pluginConfigs: Record<string, PluginConfigInput>): void {
    this.enabledPlugins.clear();

    for (const plugin of this.allPlugins) {
      const pluginConfig = pluginConfigs[plugin.manifest.id];
      if (pluginConfig?.enabled) {
        this.enabledPlugins.set(plugin.manifest.id, plugin);
      }
    }
  }

  async exportAll(): Promise<void> {
    for (const plugin of this.enabledPlugins.values()) {
      await this.exportOne(plugin.manifest.id);
    }
  }

  async exportOne(pluginId: string): Promise<void> {
    const plugin = this.enabledPlugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin "${pluginId}" not found`);
    }

    let config: DbConfig;
    let pluginConfig: PluginConfigInput;

    try {
      config = await this.repository.read();
      pluginConfig = config.plugins?.[pluginId] ?? {
        enabled: true,
        outputFile: plugin.manifest.output.fileName,
        config: {},
        routing: { agents: {}, categories: {} },
      };
    } catch (cause) {
      throw new PluginExecutionError({
        pluginId,
        stage: "loadPluginConfig",
        cause,
      });
    }

    if (pluginConfig.enabled === false) {
      return;
    }

    let context: PluginRuntimeContext;
    try {
      context = await this.buildContext(config);
    } catch (cause) {
      throw new PluginExecutionError({
        pluginId,
        stage: "buildContext",
        cause,
      });
    }

    const agents = Object.entries(config.agents ?? {}).map(([id, agent]) => ({
      ...agent,
      id,
    }));

    let output: unknown;
    try {
      output = plugin.handlers.build({
        agents: agents as SystemAgent[],
        routing: pluginConfig as PluginRouting,
        context,
      });
    } catch (cause) {
      throw new PluginExecutionError({
        pluginId,
        stage: "buildOutput",
        cause,
      });
    }

    if (plugin.handlers.validate) {
      try {
        if (!plugin.handlers.validate(output)) {
          throw new Error(
            `Plugin "${pluginId}" output validation returned false`,
          );
        }
      } catch (cause) {
        throw new PluginExecutionError({
          pluginId,
          stage: "validate",
          cause,
        });
      }
    }

    try {
      await this.writePluginOutput(pluginConfig.outputFile, output);
    } catch (cause) {
      throw new PluginExecutionError({
        pluginId,
        stage: "persist",
        cause,
      });
    }

    if (plugin.handlers.afterExport) {
      try {
        await plugin.handlers.afterExport(output);
      } catch (cause) {
        throw new PluginExecutionError({
          pluginId,
          stage: "afterExport",
          cause,
        });
      }
    }
  }

  getInternalAgents(pluginId: string): InternalAgent[] {
    const plugin = this.allPlugins.find((candidate) => {
      return candidate.manifest.id === pluginId;
    });

    return plugin?.manifest.internalAgents ?? [];
  }

  getConfigSchema(_pluginId: string): ConfigField[] {
    // V2 plugins expose JSON Schema instead of legacy ConfigField entries.
    return [];
  }

  getJsonSchema(pluginId: string): Record<string, unknown> | null {
    return getPluginConfigJsonSchema(pluginId);
  }

  private async buildContext(config: DbConfig): Promise<PluginRuntimeContext> {
    const context: PluginRuntimeContext = {
      allModels: {},
      globalFallbackModel: config.globalFallbackModel,
      litellmConfig: {
        baseUrl: "",
        apiKey: "",
      },
      allCategories: config.categories as PluginRuntimeContext["allCategories"],
    };

    if (!this.modelsRepository) {
      return context;
    }

    try {
      const modelsConfig = await this.modelsRepository.read();
      context.allModels = modelsConfig.models ?? {};

      const litellmProvider = modelsConfig.provider?.litellm;
      context.litellmConfig = {
        baseUrl: litellmProvider?.baseUrl ?? "",
        apiKey: litellmProvider?.apiKey ?? "",
      };
    } catch {
      // Keep empty context for missing models source.
    }

    return context;
  }

  private async writePluginOutput(
    outputPathFromConfig: string | undefined,
    output: unknown,
  ): Promise<void> {
    const outputFile = outputPathFromConfig ?? "plugin-output.json";
    const outputPath = this.resolveOutputPath(outputFile);
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

export function createPluginRegistry(
  options: CreatePluginRegistryOptions,
): PluginRegistryV2 {
  return new PluginRegistryV2Impl(options);
}
