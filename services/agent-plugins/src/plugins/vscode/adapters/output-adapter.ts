import type { PluginRoutingFor, PluginRuntimeContext } from "../../../sdk";
import type { SystemAgent } from "../../../types";
import type { VsCodePluginConfig } from "../config/config";
import type { VscodeSchemaType } from "../schema/schema";

export interface BuildVsCodeOutputInput {
  agents: SystemAgent[];
  routing: PluginRoutingFor<VsCodePluginConfig>;
  context: PluginRuntimeContext;
  config: VsCodePluginConfig;
}

function modelAdapter(
  modelId: string,
  model: PluginRuntimeContext["allModels"][string],
  baseUrl: string,
): VscodeSchemaType["oaicopilot.models"][number] {
  return {
    name: model.displayName,
    id: modelId,
    baseUrl,
    "request-options": {
      headers: {
        Authorization: "Bearer {env:LITELLM_API_KEY}",
      },
    },
    "model-settings": {
      "max-tokens": model.limits.maxOutput,
    },
  };
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
    output["oaicopilot.models"].push(modelAdapter(key, spec, baseUrl));
  }

  return output;
}
