import type {
  PluginRouting,
  SystemAgent,
} from "@lite-llm/agents-repository/schemas";
import type { IPlugin, TransformContext } from "../plugin";
import type { ConfigField, InternalAgent } from "../plugin-types";
import { vsCodeSchema } from "./schemas/generated/vscode.zod";
import type { VsCodeConfig } from "./schemas/generated/vscode-config";

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

export class VsCodePlugin implements IPlugin<"vscode"> {
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
    routing: PluginRouting,
    ctx: TransformContext,
  ): VsCodeModelsOutput {
    const pluginConfig: VsCodeConfig = (routing.config ?? {}) as VsCodeConfig;
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
      output["oaicopilot.models"].push({
        name: spec.displayName,
        id: key,
        baseUrl,
        "request-options": {
          headers: {
            Authorization: "Bearer {env:LITELLM_API_KEY}",
          },
        },
        "model-settings": {
          "max-tokens": spec.limits.maxOutput,
        },
      });
    }

    return output;
  }

  getOutputFile(): string {
    return this.outputFile;
  }

  validate(output: unknown): boolean {
    const result = vsCodeSchema.safeParse(output);
    if (!result.success) {
      console.error("[VsCodePlugin] Validation failed:", result.error.issues);
    }
    return result.success;
  }
}
