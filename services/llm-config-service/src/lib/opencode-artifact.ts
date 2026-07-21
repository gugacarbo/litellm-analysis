import type {
  CodingAgentArtifact,
  CodingAgentConnectionMode,
  CodingAgentModelRow,
  CodingAgentProviderRow,
} from "../types/coding-agents.js";
import {
  buildHeboCatalogKeys,
  toEnvironmentVariable,
  toOpenCodeProviderId,
} from "./coding-agent-catalog.js";

type ArtifactInput = {
  mode: CodingAgentConnectionMode;
  providers: CodingAgentProviderRow[];
  models: CodingAgentModelRow[];
  publicBaseUrl?: string;
};

type OpenCodeProvider = {
  npm: string;
  name: string;
  options: Record<string, string>;
  models: Record<string, unknown>;
};

function modelDefinition(model: CodingAgentModelRow) {
  const definition: Record<string, unknown> = {
    name: model.displayName ?? model.modelId,
  };
  const limit: Record<string, number> = {};
  if (model.contextLength) limit.context = model.contextLength;
  if (model.maxCompletionTokens) limit.output = model.maxCompletionTokens;
  if (Object.keys(limit).length > 0) definition.limit = limit;
  const cost: Record<string, number> = {};
  if (model.pricing?.input !== undefined)
    cost.input = model.pricing.input * 1_000_000;
  if (model.pricing?.output !== undefined)
    cost.output = model.pricing.output * 1_000_000;
  if (model.pricing?.cacheRead !== undefined)
    cost.cache_read = model.pricing.cacheRead * 1_000_000;
  if (Object.keys(cost).length > 0) definition.cost = cost;
  return definition;
}

function ensureOpenAiBaseUrl(rawUrl: string, adapter: string | null): string {
  const trimmed = rawUrl.replace(/\/+$/, "");
  return adapter === "ollama" && !trimmed.endsWith("/v1")
    ? `${trimmed}/v1`
    : trimmed;
}

export function generateOpenCodeArtifact(
  input: ArtifactInput,
): CodingAgentArtifact {
  const providerById = new Map(input.providers.map((item) => [item.id, item]));
  const warnings: string[] = [];
  const configProviders: Record<string, OpenCodeProvider> = {};

  if (input.mode === "hebo") {
    if (!input.publicBaseUrl) {
      throw new Error(
        "MODEL_PROXY_PUBLIC_BASE_URL is required to export with Hebo",
      );
    }
    const rows = input.models.map((model) => ({
      model,
      modelId: model.modelId,
      providerName: providerById.get(model.providerId)?.name ?? "provider",
      isDefault: providerById.get(model.providerId)?.isDefault ?? false,
    }));
    const keys = buildHeboCatalogKeys(rows);
    const models: Record<string, unknown> = {};
    for (const row of rows) {
      for (const key of keys.get(row) ?? [])
        models[key] = modelDefinition(row.model);
    }
    configProviders["llm-toolbox"] = {
      npm: "@ai-sdk/openai-compatible",
      name: "llm-toolbox",
      options: {
        baseURL: ensureOpenAiBaseUrl(input.publicBaseUrl, "openai-compatible"),
        apiKey: "{env:MODEL_PROXY_API_KEY}",
      },
      models: Object.fromEntries(
        Object.entries(models).sort(([a], [b]) => a.localeCompare(b)),
      ),
    };
  } else {
    for (const provider of input.providers) {
      if (!provider.baseUrl) {
        warnings.push(`Skipped ${provider.name}: Base URL is not configured.`);
        continue;
      }
      const models = input.models.filter(
        (model) => model.providerId === provider.id,
      );
      if (models.length === 0) continue;
      const options: Record<string, string> = {
        baseURL: ensureOpenAiBaseUrl(provider.baseUrl, provider.provider),
      };
      if (provider.provider !== "ollama") {
        options.apiKey = `{env:${toEnvironmentVariable(provider.name)}}`;
      }
      configProviders[toOpenCodeProviderId(provider.name)] = {
        npm: "@ai-sdk/openai-compatible",
        name: provider.name,
        options,
        models: Object.fromEntries(
          models
            .map((model): [string, Record<string, unknown>] => [
              model.modelId,
              modelDefinition(model),
            ])
            .sort(([a], [b]) => a.localeCompare(b)),
        ),
      };
    }
    warnings.unshift(
      "This file connects directly to configured providers and bypasses Hebo routing and usage logging.",
    );
  }

  const modelCount = Object.values(configProviders).reduce(
    (total, provider) => total + Object.keys(provider.models).length,
    0,
  );
  if (modelCount === 0)
    throw new Error("No enabled models are available for this configuration");
  return {
    fileName:
      input.mode === "hebo" ? "hebo.opencode.json" : "providers.opencode.json",
    content: `${JSON.stringify({ $schema: "https://opencode.ai/config.json", provider: configProviders }, null, 2)}\n`,
    mediaType: "application/json",
    modelCount,
    warnings,
  };
}
