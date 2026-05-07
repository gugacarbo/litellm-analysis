const CURRENT_VERSION = 1;
export class VsCodePlugin {
  id = "vscode";
  name = "VS Code OAICopilot";
  version = CURRENT_VERSION;
  outputFile = "vscode-oaicopilot.json";
  transformEntry() {
    // VSCode plugin only exports models, not agents/categories
    return {};
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
    return {
      "oaicopilot.commitLanguage": "Portuguese (Brazil)",
      "oaicopilot.baseUrl": "",
      "oaicopilot.delay": 0,
      "oaicopilot.readFileLines": 0,
      "oaicopilot.retry": {
        enabled: true,
        max_attempts: 3,
        interval_ms: 2000,
        status_codes: [],
      },
      "oaicopilot.models": [],
    };
  }
  buildOutput(config, _context) {
    const output = this.preprocess(config);
    const baseUrl = config.litellm.baseUrl.replace(/\/v1$/, "");
    for (const [key, spec] of Object.entries(config.models)) {
      const model = this.transformModel(key, spec);
      output["oaicopilot.models"].push({
        name: model.name,
        id: model.id,
        baseUrl,
        "request-options": {
          headers: {
            Authorization: "Bearer {env:LITELLM_API_KEY}",
          },
        },
        "model-settings": {
          "max-tokens": model.limit?.output,
        },
      });
    }
    return output;
  }
  getOutputFile() {
    return this.outputFile;
  }
}
