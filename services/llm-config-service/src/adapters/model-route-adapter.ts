import type { ModelConfig, ModelRoute, ModelRouteUpdate } from "../types/index.js";

export interface ModelProxyRowWrite {
  modelName: string;
  enabled?: boolean;
  displayName?: string | null;
  family?: string | null;
  ownedBy?: string | null;
  apiMode?: string | null;
  vision?: boolean | null;
  contextWindowSize?: number | null;
  maxOutputTokens?: number | null;
  inputCostPerToken?: number | null;
  outputCostPerToken?: number | null;
  upstreamModel?: string | null;
  upstreamBaseUrl?: string | null;
  providerName?: string | null;
  requestOptions?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
}

export const fromModelProxyRow = (row: Record<string, unknown>): ModelProxyRowWrite => ({
  modelName: String(row.modelName ?? row.modelId ?? ""),
  enabled: Boolean(row.enabled ?? true),
  displayName: (row.displayName as string) ?? null,
  family: (row.family as string) ?? null,
  ownedBy: (row.ownedBy as string) ?? null,
  apiMode: (row.apiMode as string) ?? null,
  vision: (row.vision as boolean) ?? null,
  contextWindowSize: (row.contextWindowSize as number) ?? null,
  maxOutputTokens: (row.maxOutputTokens as number) ?? null,
  inputCostPerToken: (row.inputCostPerToken as number) ?? null,
  outputCostPerToken: (row.outputCostPerToken as number) ?? null,
  upstreamModel: (row.upstreamModel as string) ?? null,
  upstreamBaseUrl: (row.upstreamBaseUrl as string) ?? null,
  providerName: (row.providerName as string) ?? null,
  requestOptions: (row.requestOptions as Record<string, unknown>) ?? null,
  metadata: (row.metadata as Record<string, unknown>) ?? null,
});

export const toModelProxyRow = (route: ModelProxyRowWrite): Record<string, unknown> => ({
  modelName: route.modelName,
  enabled: route.enabled,
  displayName: route.displayName,
  family: route.family,
  ownedBy: route.ownedBy,
  apiMode: route.apiMode,
  vision: route.vision,
  contextWindowSize: route.contextWindowSize,
  maxOutputTokens: route.maxOutputTokens,
  inputCostPerToken: route.inputCostPerToken,
  outputCostPerToken: route.outputCostPerToken,
  upstreamModel: route.upstreamModel,
  upstreamBaseUrl: route.upstreamBaseUrl,
  providerName: route.providerName,
  requestOptions: route.requestOptions,
  metadata: route.metadata,
});

export const fromModelRoute = (route: ModelRoute): ModelProxyRowWrite => ({
  modelName: route.modelId,
  enabled: route.enabled,
  displayName: route.displayName ?? null,
  family: route.family ?? null,
  ownedBy: null,
  apiMode: null,
  vision: null,
  contextWindowSize: route.contextLength ?? null,
  maxOutputTokens: route.maxCompletionTokens ?? null,
  inputCostPerToken: null,
  outputCostPerToken: null,
  upstreamModel: null,
  upstreamBaseUrl: null,
  providerName: (route as unknown as Record<string, unknown>).providerName as string ?? null,
  requestOptions: (route.requestOptions as Record<string, unknown>) ?? null,
  metadata: null,
});

export const parseModelRouteFromApi = (
  body: Record<string, unknown>,
  modelName: string,
): ModelRoute => ({
  ...(body as Partial<ModelRoute>),
  modelId: modelName,
} as ModelRoute);

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
    input: pricingInput != null ? Number(pricingInput) : undefined,
    output: pricingOutput != null ? Number(pricingOutput) : undefined,
    cacheRead: model.pricing?.input_cache_read != null ? Number(model.pricing.input_cache_read) : undefined,
    image: model.pricing?.image != null ? Number(model.pricing.image) : undefined,
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
    supportedParameters: Array.isArray(model.supportedParameters)
      ? (model.supportedParameters as unknown as ModelRoute["supportedParameters"])
      : null,
    defaultParameters: model.defaultParameters as Record<string, unknown> | null,
    perRequestLimits: model.perRequestLimits as Record<string, unknown> | null,
    pricing,
    requestOptions: undefined,
  };
};
