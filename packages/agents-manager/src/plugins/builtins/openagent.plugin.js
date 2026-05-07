const CURRENT_VERSION = 1;
export class OpenAgentPlugin {
  id = "openagent";
  name = "Oh My OpenAgent";
  version = CURRENT_VERSION;
  outputFile = "oh-my-openagent.json";
  transformEntry(entry, ctx) {
    const result = {};
    if ("color" in entry) {
      result.color = entry.color;
    }
    if ("disable" in entry) {
      result.disable = entry.disable;
    }
    if ("tools" in entry) {
      result.tools = entry.tools;
    }
    if ("mode" in entry) {
      result.mode = entry.mode;
    }
    // Model references use prefix/version format
    result.model = `${ctx.entryKey}/gpt-5.5`;
    if (entry.fallbackModels?.length) {
      result.fallback_models = entry.fallbackModels.map(
        (m) => `${ctx.entryKey}/${m}`,
      );
    }
    if (entry.description) {
      result.description = entry.description;
    }
    // Copy category-specific fields
    if ("thinking" in entry) {
      result.thinking = entry.thinking;
    }
    if ("reasoningEffort" in entry) {
      result.reasoningEffort = entry.reasoningEffort;
    }
    if ("textVerbosity" in entry) {
      result.textVerbosity = entry.textVerbosity;
    }
    if ("maxTokens" in entry) {
      result.maxTokens = entry.maxTokens;
    }
    return result;
  }
  transformModel() {
    // OpenAgent doesn't export models separately
    return undefined;
  }
  preprocess(config) {
    return {
      $schema:
        "https://raw.githubusercontent.com/opensoft/oh-my-opencode/dev/assets/oh-my-opencode.schema.json",
      globalFallbackModel: config.globalFallbackModel,
      git_master: {
        commit_footer: false,
        include_co_authored_by: false,
      },
      agents: {},
      categories: {},
    };
  }
  buildOutput(config, _context) {
    const output = this.preprocess(config);
    // Transform agents
    for (const [key, entry] of Object.entries(config.agents)) {
      output.agents[key] = this.transformEntry(entry, {
        entryKey: key,
        entryType: "agent",
        allModels: config.models,
        globalFallbackModel: config.globalFallbackModel,
        litellmConfig: config.litellm,
        resolvedModels: new Map(),
      });
    }
    // Transform categories
    for (const [key, entry] of Object.entries(config.categories)) {
      output.categories[key] = this.transformEntry(entry, {
        entryKey: key,
        entryType: "category",
        allModels: config.models,
        globalFallbackModel: config.globalFallbackModel,
        litellmConfig: config.litellm,
        resolvedModels: new Map(),
      });
    }
    return output;
  }
  getOutputFile() {
    return this.outputFile;
  }
}
