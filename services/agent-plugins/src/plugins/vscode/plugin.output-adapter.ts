import type { PluginRoutingFor, PluginRuntimeContext } from "../../sdk";
import type { SystemAgent } from "../../types";
import type { VsCodePluginConfig } from "./plugin.config";
import type { VscodeSchemaType } from "./plugin.schema";

export interface BuildVsCodeOutputInput {
  agents: SystemAgent[];
  routing: PluginRoutingFor<VsCodePluginConfig>;
  context: PluginRuntimeContext;
  config: VsCodePluginConfig;
}

export function adaptVsCodeOutput(
  input: BuildVsCodeOutputInput,
): VscodeSchemaType {
  const { context, config } = input;
  const baseUrl = context.litellmConfig.baseUrl.replace(/\/v1$/, "");

  const output: VscodeSchemaType = {
    ...config,
    "oaicopilot.models": [],
  };

  for (const [key, spec] of Object.entries(context.allModels)) {
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
