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
        Authorization: "Bearer {env:LITELLM_API_KEY}",
      },
    },
    "model-settings": {
      "max-tokens": model.limits.maxOutput,
    },
    context_length: model.limits.length,
    max_tokens: model.limits.maxOutput,
  };

  if (model.displayName) {
    entry.displayName = model.displayName;
  }
  if (model.ownedBy) {
    entry.owned_by = model.ownedBy;
  }

  if (model.apiMode) {
    entry.apiMode = model.apiMode;
  }
  if (model.vision === true) {
    entry.vision = true;
  }
  if (model.reasoning?.effort) {
    entry.reasoning_effort = model.reasoning.effort;
  }
  if (model.reasoning?.enableThinking !== undefined) {
    entry.enable_thinking = model.reasoning.enableThinking;
  }
  if (model.reasoning?.includeReasoningInRequest !== undefined) {
    entry.include_reasoning_in_request =
      model.reasoning.includeReasoningInRequest;
  }

  return entry;
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
