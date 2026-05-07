const CURRENT_VERSION = 1;
const LITELLM_API_KEY_REF = "{env:LITELLM_API_KEY}";
const AGENT_VERSIONS = ["gpt-5.5", "gpt-5.4", "gpt-5.3", "gpt-5.2", "gpt-5.1"];
export class OpenCodePlugin {
  id = "opencode";
  name = "OpenCode AI SDK";
  version = CURRENT_VERSION;
  outputFile = "opencode.json";
  transformEntry(_entry, ctx) {
    return {
      npm: "@ai-sdk/openai-compatible",
      options: {
        baseURL: ctx.litellmConfig.baseUrl,
        apiKey: LITELLM_API_KEY_REF,
      },
      models: this.buildAgentModels(ctx.entryKey),
    };
  }
  transformModel(key, spec) {
    return {
      id: key,
      name: spec.displayName,
      limit: {
        context: spec.contextLength,
        output: spec.maxOutput,
      },
      cost: spec.cost,
    };
  }
  preprocess(_config) {
    return { provider: {} };
  }
  buildOutput(config, _context) {
    const output = { provider: {} };
    // Build litellm provider with all models
    output.provider.litellm = this.buildLitellmProvider(config);
    // Add agent providers
    for (const [key, entry] of Object.entries(config.agents)) {
      if (Object.keys(entry).length === 0) continue;
      output.provider[key] = this.transformEntry(entry, {
        entryKey: key,
        entryType: "agent",
        allModels: config.models,
        globalFallbackModel: config.globalFallbackModel,
        litellmConfig: config.litellm,
        resolvedModels: new Map(),
      });
    }
    // Add category providers
    for (const [key, entry] of Object.entries(config.categories)) {
      if (Object.keys(entry).length === 0) continue;
      output.provider[key] = this.transformEntry(entry, {
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
  buildLitellmProvider(config) {
    const models = {};
    for (const [key, spec] of Object.entries(config.models)) {
      const model = this.transformModel(key, spec);
      models[key] = model;
    }
    return {
      name: "LiteLLM",
      npm: "@ai-sdk/openai-compatible",
      options: {
        baseURL: config.litellm.baseUrl,
        apiKey: config.litellm.apiKey,
      },
      models,
    };
  }
  buildAgentModels(prefix) {
    const models = {};
    AGENT_VERSIONS.forEach((version, index) => {
      models[version] = {
        id: `${prefix}/${version}`,
        name: `${prefix.charAt(0).toUpperCase() + prefix.slice(1)} ${index + 1}`,
        limit: {
          output: 32768,
          context: 200000,
        },
      };
    });
    return models;
  }
}
