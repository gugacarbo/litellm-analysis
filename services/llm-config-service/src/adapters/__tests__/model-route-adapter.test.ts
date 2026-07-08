import { describe, expect, it } from "vitest";

import type { ModelConfig } from "../../schemas/model.js";
import { toModelRoute } from "../model-route-adapter.js";

const buildModelConfig = (overrides: Partial<ModelConfig> = {}): ModelConfig => ({
  name: "gpt-4",
  provider: "openai",
  displayName: "GPT-4",
  family: "gpt-4",
  contextLength: 8192,
  maxCompletionTokens: 4096,
  cost: {
    request: "0",
    image: "0",
    input: "0.00003",
    output: "0.00006",
  },
  ...overrides,
});

describe("toModelRoute", () => {
  it("maps a basic model config into the new ModelRoute shape", () => {
    const route = toModelRoute({
      providerName: "openai",
      model: buildModelConfig(),
    });

    expect(route).toEqual({
      modelId: "gpt-4",
      enabled: true,
      displayName: "GPT-4",
      family: "gpt-4",
      canonicalSlug: undefined,
      description: undefined,
      contextLength: 8192,
      maxCompletionTokens: 4096,
      knowledgeCutoff: undefined,
      expirationDate: undefined,
      architecture: {
        input_modalities: ["text"],
        output_modalities: ["text"],
        tokenizer: "GPT",
        instruct_type: null,
      },
      reasoning: undefined,
      supportedParameters: undefined,
      defaultParameters: undefined,
      perRequestLimits: undefined,
      pricing: {
        request: "0",
        image: "0",
        input: "0.00003",
        output: "0.00006",
        input_cache_read: "0",
        input_cache_write: "0",
        web_search: "0",
        internal_reasoning: "0",
      },
      requestOptions: undefined,
      providerName: "openai",
    });
  });

  it("falls back to pricing values when cost is missing", () => {
    const route = toModelRoute({
      providerName: "openai",
      model: buildModelConfig({
        cost: undefined,
        pricing: {
          request: "0",
          image: "0",
          input: "0.0001",
          output: "0.0002",
          input_cache_read: "0",
          input_cache_write: "0",
          web_search: "0",
          internal_reasoning: "0",
        },
      }),
    });

    expect(route.pricing).toEqual({
      request: "0",
      image: "0",
      input: "0.0001",
      output: "0.0002",
      input_cache_read: "0",
      input_cache_write: "0",
      web_search: "0",
      internal_reasoning: "0",
    });
  });

  it("forwards reasoning effort from the model", () => {
    const route = toModelRoute({
      providerName: "openai",
      model: buildModelConfig({ reasoning: { effort: "high" } }),
    });

    expect(route.reasoning).toEqual({ effort: "high" });
  });

  it("merges architecture overrides with the default shape", () => {
    const route = toModelRoute({
      providerName: "openai",
      model: buildModelConfig({
        architecture: {
          input_modalities: ["text", "image"],
          output_modalities: ["text"],
          tokenizer: "Claude",
          instruct_type: "claude",
        },
      }),
    });

    expect(route.architecture).toEqual({
      input_modalities: ["text", "image"],
      output_modalities: ["text"],
      tokenizer: "Claude",
      instruct_type: "claude",
    });
  });
});
