import type {
  DbConfig,
  ModelSpec,
} from "@lite-llm/agents-repository/repository";
import type { IPlugin, PluginModel, TransformContext } from "../plugin";

const CURRENT_VERSION = 1;

export interface VsCodeModelsOutput {
  "oaicopilot.commitLanguage": string;
  "oaicopilot.baseUrl": string;
  "oaicopilot.delay": number;
  "oaicopilot.readFileLines": number;
  "oaicopilot.retry": {
    enabled: boolean;
    max_attempts: number;
    interval_ms: number;
    status_codes: number[];
  };
  "oaicopilot.models": VsCodeModel[];
}

export interface VsCodeModel {
  name: string;
  id: string;
  baseUrl: string;
  "request-options": {
    headers?: Record<string, string>;
  };
  "model-settings"?: {
    "max-tokens"?: number;
    temperature?: number;
    "stop-sequences"?: string[];
  };
}

export class VsCodePlugin implements IPlugin {
  readonly id = "vscode";
  readonly name = "VS Code OAICopilot";
  readonly version = CURRENT_VERSION;
  readonly builtin = false;
  readonly outputFile = "vscode-oaicopilot.json";

  transformEntry(): Record<string, unknown> {
    // VSCode plugin only exports models, not agents/categories
    return {};
  }

  transformModel(key: string, spec: ModelSpec): PluginModel {
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

  preprocess(_config: DbConfig): VsCodeModelsOutput {
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

  buildOutput(
    config: DbConfig,
    _context: TransformContext,
  ): VsCodeModelsOutput {
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

  getOutputFile(): string {
    return this.outputFile;
  }
}
