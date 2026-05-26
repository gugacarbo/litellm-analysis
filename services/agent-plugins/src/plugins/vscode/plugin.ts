import type { PluginDefinition } from "../../sdk";
import type { PluginRouting, SystemAgent } from "../../types";
import {
  type VsCodePluginConfig,
  vsCodePluginConfigSchema,
} from "./plugin.config";
import { type VsCodeModelsOutput, vsCodeManifest } from "./plugin.manifest";
import { vscodeSchema } from "./plugin.schema";

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

        const config = vsCodePluginConfigSchema.parse(
          input.routing.config ?? {},
        );
        const baseUrl = input.context.litellmConfig.baseUrl.replace(
          /\/v1$/,
          "",
        );

        const output: VsCodeModelsOutput = {
          $schema: config.$schema,
          "oaicopilot.commitLanguage": config.commitLanguage,
          "oaicopilot.baseUrl": "",
          "oaicopilot.delay": 0,
          "oaicopilot.readFileLines": 0,
          "oaicopilot.retry": {
            enabled: config.retryEnabled,
            max_attempts: config.maxRetryAttempts,
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
    return createVsCodePlugin().handlers.build({
      agents,
      routing: {
        ...routing,
        config: vsCodePluginConfigSchema.parse(routing.config ?? {}),
      },
      context,
    });
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
