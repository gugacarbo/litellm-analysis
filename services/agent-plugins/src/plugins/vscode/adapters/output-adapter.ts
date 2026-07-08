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
  const entry: VscodeSchemaType["oaicopilot.models"][number] = {
    name: model.displayName,
    id: modelId,
    baseUrl,
    "request-options": {
      headers: {
        Authorization: "Bearer {env:MODEL_PROXY_API_KEY}",
      },
    },
    "model-settings": {
      "max-tokens": model.maxCompletionTokens,
    },
    context_length: model.contextLength,
    max_tokens: model.maxCompletionTokens,
  };

  if (model.displayName) {
    entry.displayName = model.displayName;
  }

  if (model.reasoning?.effort) {
    entry.reasoning_effort = model.reasoning.effort;
  }
  if (model.reasoning != null) {
    entry.enable_thinking = true;
    entry.include_reasoning_in_request = true;
  }

  return entry;
}

export function adaptVsCodeOutput(
  input: BuildVsCodeOutputInput,
): VscodeSchemaType {
  const { context, config } = input;
  const baseUrl = context.modelProxyConfig.baseUrl.replace(/\/v1$/, "");

  const output: VscodeSchemaType = {
    ...config,
    "oaicopilot.models": [],
  };

  for (const [key, spec] of Object.entries(context.allModels)) {
    output["oaicopilot.models"].push(modelAdapter(key, spec, baseUrl));
  }

  return output;
}
