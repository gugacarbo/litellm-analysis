import type {
  ModelSpec,
  PluginRoutingConfig,
  SystemAgent,
} from "@lite-llm/agents-repository/schema";
import type { IPlugin, TransformContext } from "../plugin.js";
import type { ConfigField, InternalAgent } from "../plugin-types.js";

interface VsCodeModelsOutput {
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
  "oaicopilot.models": Array<{
    name: string;
    id: string;
    baseUrl: string;
    "request-options": { headers?: Record<string, string> };
    "model-settings"?: { "max-tokens"?: number };
  }>;
}

export class VsCodePlugin implements IPlugin {
  readonly id = "vscode";
  readonly name = "VS Code OAICopilot";
  readonly version = 1;
  readonly outputFile = "vscode-oaicopilot.json";

  getInternalAgents(): InternalAgent[] {
    return [];
  }

  getConfigSchema(): ConfigField[] {
    return [
      {
        key: "commitLanguage",
        type: "string",
        label: "Commit Language",
        required: false,
        default: "Portuguese (Brazil)",
        description: "Language for commit messages",
      },
      {
        key: "retryEnabled",
        type: "boolean",
        label: "Enable Retry",
        required: false,
        default: true,
        description: "Enable retry on failed requests",
      },
      {
        key: "maxRetryAttempts",
        type: "number",
        label: "Max Retry Attempts",
        required: false,
        default: 3,
        description: "Maximum number of retry attempts",
      },
    ];
  }

  buildOutput(
    _agents: SystemAgent[],
    routing: PluginRoutingConfig,
    ctx: TransformContext,
  ): VsCodeModelsOutput {
    const pluginConfig = (
      routing.plugins[this.id]?.config ?? {}
    ) as Record<string, unknown>;
    const baseUrl = ctx.litellmConfig.baseUrl.replace(/\/v1$/, "");

    const output: VsCodeModelsOutput = {
      "oaicopilot.commitLanguage":
        (pluginConfig.commitLanguage as string) ?? "Portuguese (Brazil)",
      "oaicopilot.baseUrl": "",
      "oaicopilot.delay": 0,
      "oaicopilot.readFileLines": 0,
      "oaicopilot.retry": {
        enabled: (pluginConfig.retryEnabled as boolean) ?? true,
        max_attempts: (pluginConfig.maxRetryAttempts as number) ?? 3,
        interval_ms: 2000,
        status_codes: [],
      },
      "oaicopilot.models": [],
    };

    for (const [key, spec] of Object.entries(ctx.allModels)) {
      const model = spec as ModelSpec;
      output["oaicopilot.models"].push({
        name: model.displayName,
        id: key,
        baseUrl,
        "request-options": {
          headers: {
            Authorization: "Bearer {env:LITELLM_API_KEY}",
          },
        },
        "model-settings": {
          "max-tokens": model.maxOutput,
        },
      });
    }

    return output;
  }

  getOutputFile(): string {
    return this.outputFile;
  }
}
