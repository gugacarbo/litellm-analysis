import type { DbConfig, DbModelSpec } from "../../types/index.js";
import type { LiteLLMModelConfig, OpenCodeProviders } from "./types.js";

const MODEL_NAMES = [
  "gpt-5.5",
  "gpt-5.4",
  "gpt-5.3",
  "gpt-5.2",
  "gpt-5.1",
] as const;

export function capitalize(str: string): string {
  return str
    .split(/[_-]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function buildLiteLLMProviderConfig(
  models: Record<string, DbModelSpec>,
  litellmConfig: DbConfig["litellm"],
): OpenCodeProviders["provider"]["litellm"] {
  const liteLLMModels: Record<string, LiteLLMModelConfig> = {};

  for (const [modelId, spec] of Object.entries(models)) {
    const modelConfig: LiteLLMModelConfig = {
      id: modelId,
      name: spec.displayName || capitalize(modelId),
    };

    modelConfig.limit = {
      context: spec.contextLength,
      output: spec.maxOutput,
    };

    if (spec.cost?.input !== undefined || spec.cost?.output !== undefined) {
      modelConfig.cost = {
        input: spec.cost.input,
        output: spec.cost.output,
      };
    }

    liteLLMModels[modelId] = modelConfig;
  }

  return {
    name: "LiteLLM",
    npm: "@ai-sdk/openai-compatible",
    options: {
      baseURL: litellmConfig.baseUrl,
      apiKey: litellmConfig.apiKey,
    },
    models: liteLLMModels,
  };
}

export function buildAgentModels(
  providerKey: string,
  fallbackCount: number,
): Record<string, LiteLLMModelConfig> {
  const models: Record<string, LiteLLMModelConfig> = {};
  const totalSlots = 1 + Math.min(fallbackCount, 3);

  for (let i = 0; i < totalSlots; i++) {
    const modelName = MODEL_NAMES[i];
    const displayName =
      i === 0 ? capitalize(providerKey) : `${capitalize(providerKey)} ${i + 1}`;
    models[modelName] = {
      id: `${providerKey}/${modelName}`,
      name: displayName,
      limit: {
        output: 32768,
        context: 200000,
      },
    };
  }

  return models;
}
