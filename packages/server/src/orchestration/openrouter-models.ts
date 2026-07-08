import type { OpenRouterModelData } from "@lite-llm/contracts/benchmarks";
import { toMatchKeys } from "./benchmark-helpers";

const OPENROUTER_MODELS_URL = "https://openrouter.ai/api/v1/models";

interface OpenRouterApiModel {
  id: string;
  name: string;
  context_length?: number;
  architecture?: { modality?: string; tokenizer?: string };
  top_provider?: { max_completion_tokens?: number };
  pricing?: { prompt?: string; completion?: string };
  description?: string;
}

function mapToOpenRouterModelData(
  model: OpenRouterApiModel,
): OpenRouterModelData {
  return {
    id: model.id,
    name: model.name,
    context_length: model.context_length ?? null,
    max_output_tokens: model.top_provider?.max_completion_tokens ?? null,
    capabilities: {
      supports_vision: model.architecture?.modality?.includes("image") ?? false,
      supports_tools:
        model.architecture?.modality?.includes("text+image->text") ?? false,
    },
    pricing: model.pricing
      ? {
          prompt: model.pricing.prompt ?? "0",
          completion: model.pricing.completion ?? "0",
        }
      : null,
    family: null,
    description: model.description ?? null,
  };
}

export async function fetchOpenRouterModelData(
  modelName: string,
): Promise<OpenRouterModelData | null> {
  try {
    const res = await fetch(OPENROUTER_MODELS_URL);
    if (!res.ok) {
      return null;
    }
    const json = (await res.json()) as { data?: OpenRouterApiModel[] };
    if (!json.data || !Array.isArray(json.data)) {
      return null;
    }
    const candidateKeys = toMatchKeys(modelName);

    let model = json.data.find(
      (m) =>
        m.id === modelName || m.name?.toLowerCase() === modelName.toLowerCase(),
    );

    if (!model) {
      model = json.data.find((m) => {
        const modelKeys = [...toMatchKeys(m.id), ...toMatchKeys(m.name)];
        return candidateKeys.some((key) => modelKeys.includes(key));
      });
    }
    return model ? mapToOpenRouterModelData(model) : null;
  } catch {
    return null;
  }
}
