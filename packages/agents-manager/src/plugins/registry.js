import * as fs from "node:fs/promises";
import * as path from "node:path";
export class PluginRegistry {
  plugins = new Map();
  repository;
  outputDir;
  constructor(options) {
    this.repository = options.repository;
    this.outputDir = options.outputDir ?? "data";
  }
  register(plugin) {
    if (this.plugins.has(plugin.id)) {
      throw new Error(`Plugin "${plugin.id}" is already registered`);
    }
    this.plugins.set(plugin.id, plugin);
  }
  unregister(pluginId) {
    this.plugins.delete(pluginId);
  }
  get(pluginId) {
    return this.plugins.get(pluginId);
  }
  list() {
    return Array.from(this.plugins.values());
  }
  async exportAll() {
    for (const plugin of this.plugins.values()) {
      await this.exportOne(plugin.id);
    }
  }
  async exportOne(pluginId) {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin "${pluginId}" not found`);
    }
    const config = await this.repository.read();
    const context = this.buildContext(config);
    const output = plugin.buildOutput(config, context);
    if (plugin.validate) {
      if (!plugin.validate(output)) {
        throw new Error(`Plugin "${pluginId}" output validation failed`);
      }
    }
    await this.writePluginOutput(plugin, output);
  }
  buildContext(config) {
    const resolvedModels = new Map();
    // Resolve all model references
    for (const [key, entry] of Object.entries({
      ...config.agents,
      ...config.categories,
    })) {
      resolvedModels.set(key, entry.model);
      entry.fallbackModels?.forEach((m) => {
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
  async writePluginOutput(plugin, output) {
    const outputPath = this.resolveOutputPath(plugin.getOutputFile());
    const dir = path.dirname(outputPath);
    await fs.mkdir(dir, { recursive: true });
    const tmpPath = `${outputPath}.tmp`;
    await fs.writeFile(tmpPath, JSON.stringify(output, null, 2), "utf-8");
    await fs.rename(tmpPath, outputPath);
  }
  resolveOutputPath(relativePath) {
    if (path.isAbsolute(relativePath)) {
      return relativePath;
    }
    return path.join(this.outputDir, relativePath);
  }
}
