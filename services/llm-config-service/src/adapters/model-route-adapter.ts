import type { ModelConfig, ModelRoute } from "../types/index.js";

export const toModelRoute = ({
  providerName,
  model,
}: {
  providerName: string;
  model: ModelConfig;
}): ModelRoute => {
  const pricingInput = model.cost?.prompt ?? model.pricing?.input;
  const pricingOutput = model.cost?.completion ?? model.pricing?.output;

  const pricing = {
    request: model.cost?.request ?? model.pricing?.request ?? "0",
    image: model.cost?.image ?? model.pricing?.image ?? "0",
    input: pricingInput ?? model.pricing?.input ?? "0",
    output: pricingOutput ?? model.pricing?.output ?? "0",
    input_cache_read: model.pricing?.input_cache_read ?? "0",
    input_cache_write: model.pricing?.input_cache_write ?? "0",
    web_search: model.pricing?.web_search ?? "0",
    internal_reasoning: model.pricing?.internal_reasoning ?? "0",
  };

  const architecture = {
    input_modalities: ["text"],
    output_modalities: ["text"],
    tokenizer: "GPT",
    instruct_type: null,
    ...(model.architecture ?? {}),
  };

  const reasoning = model.reasoning?.effort
    ? { effort: model.reasoning.effort }
    : undefined;

  return {
    modelId: model.name,
    enabled: true,
    displayName: model.displayName,
    family: model.family,
    canonicalSlug: model.canonicalSlug,
    description: model.description,
    contextLength: model.contextLength,
    maxCompletionTokens: model.maxCompletionTokens,
    knowledgeCutoff: model.knowledgeCutoff,
    expirationDate: model.expirationDate,
    architecture,
    reasoning,
    supportedParameters: model.supportedParameters,
    defaultParameters: model.defaultParameters,
    perRequestLimits: model.perRequestLimits,
    pricing,
    requestOptions: undefined,
    providerName,
  };
};
