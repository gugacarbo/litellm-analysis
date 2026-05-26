import type {
  PluginRouting,
  SystemAgent,
  VsCodePluginConfig,
} from "@lite-llm/agents-repository/schemas";
import {
  VSCODE_COMMIT_LANGUAGE_DEFAULT,
  VSCODE_MAX_RETRY_ATTEMPTS_DEFAULT,
  VSCODE_RETRY_ENABLED_DEFAULT,
  VSCODE_SCHEMA_URL_DEFAULT,
  vsCodePluginConfigSchema,
} from "@lite-llm/agents-repository/schemas";
import type { PluginDefinition, PluginManifest } from "../../sdk";
import { vscodeSchema } from "./plugin.schema";

interface VsCodeModelsOutput {
  $schema: string;
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

export const vsCodeManifest: PluginManifest<
  "vscode",
  VsCodePluginConfig,
  VsCodeModelsOutput
> = {
  id: "vscode",
  displayName: "VS Code OAICopilot",
  version: 2,
  output: { fileName: "vscode-oaicopilot.json" },
  capabilities: {
    usesAgents: false,
    usesCategories: false,
    usesModels: true,
  },
  internalAgents: [],
  configSchema: [
    {
      key: "commitLanguage",
      type: "string",
      label: "Commit Language",
      required: false,
      default: VSCODE_COMMIT_LANGUAGE_DEFAULT,
      description: "Language for commit messages",
    },
    {
      key: "retryEnabled",
      type: "boolean",
      label: "Enable Retry",
      required: false,
      default: VSCODE_RETRY_ENABLED_DEFAULT,
      description: "Enable retry on failed requests",
    },
    {
      key: "maxRetryAttempts",
      type: "number",
      label: "Max Retry Attempts",
      required: false,
      default: VSCODE_MAX_RETRY_ATTEMPTS_DEFAULT,
      description: "Maximum number of retry attempts",
    },
  ],
  configZodSchema: vsCodePluginConfigSchema,
};

export function createVsCodePlugin(): PluginDefinition<
  "vscode",
  VsCodePluginConfig,
  VsCodeModelsOutput
> {
  return {
    manifest: vsCodeManifest,
    handlers: {
      build(input): VsCodeModelsOutput {
        const _agents: SystemAgent[] = input.agents;
        void _agents;

        const pluginConfig: VsCodePluginConfig = input.routing.config ?? {};
        const schemaUrl = pluginConfig.$schema ?? VSCODE_SCHEMA_URL_DEFAULT;
        const baseUrl = input.context.litellmConfig.baseUrl.replace(
          /\/v1$/,
          "",
        );

        const output: VsCodeModelsOutput = {
          $schema: schemaUrl,
          "oaicopilot.commitLanguage":
            pluginConfig.commitLanguage ?? VSCODE_COMMIT_LANGUAGE_DEFAULT,
          "oaicopilot.baseUrl": "",
          "oaicopilot.delay": 0,
          "oaicopilot.readFileLines": 0,
          "oaicopilot.retry": {
            enabled: pluginConfig.retryEnabled ?? VSCODE_RETRY_ENABLED_DEFAULT,
            max_attempts:
              pluginConfig.maxRetryAttempts ??
              VSCODE_MAX_RETRY_ATTEMPTS_DEFAULT,
            interval_ms: 2000,
            status_codes: [],
          },
          "oaicopilot.models": [],
        };

        for (const [key, spec] of Object.entries(input.context.allModels)) {
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
      },
      validate(output): boolean {
        const result = vscodeSchema.safeParse(output);
        if (!result.success) {
          console.error(
            "[VsCodePlugin] Validation failed:",
            result.error.issues,
          );
        }
        return result.success;
      },
    },
  };
}

export class VsCodePlugin {
  readonly id = vsCodeManifest.id;
  readonly name = vsCodeManifest.displayName;
  readonly version = 1;

  getInternalAgents() {
    return vsCodeManifest.internalAgents;
  }

  getConfigSchema() {
    return vsCodeManifest.configSchema;
  }

  buildOutput(
    agents: SystemAgent[],
    routing: PluginRouting,
    context: Parameters<
      ReturnType<typeof createVsCodePlugin>["handlers"]["build"]
    >[0]["context"],
  ) {
    return createVsCodePlugin().handlers.build({ agents, routing, context });
  }

  validate(output: unknown): boolean {
    return (
      createVsCodePlugin().handlers.validate?.(output as VsCodeModelsOutput) ??
      true
    );
  }

  getOutputFile(): string {
    return vsCodeManifest.output.fileName;
  }
}
