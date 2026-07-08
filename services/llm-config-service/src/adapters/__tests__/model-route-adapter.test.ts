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
    prompt: "0.00003",
    completion: "0.00006",
  },
  ...overrides,
});

describe("toModelRoute", () => {
  it("maps a basic model config into the new ModelRoute shape", () => {
    const route = toModelRoute({
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
      supportedParameters: null,
      defaultParameters: undefined,
      perRequestLimits: undefined,
      pricing: {
        input: 0.00003,
        output: 0.00006,
        cacheRead: undefined,
        image: undefined,
      },
      requestOptions: undefined,
    });
  });

  it("falls back to pricing values when cost is missing", () => {
    const route = toModelRoute({
      model: buildModelConfig({
        cost: undefined,
        pricing: {
          input: "0.0001",
          output: "0.0002",
        },
      }),
    });

    expect(route.pricing).toEqual({
      input: 0.0001,
      output: 0.0002,
      cacheRead: undefined,
      image: undefined,
    });
  });

  it("forwards reasoning effort from the model", () => {
    const route = toModelRoute({
      model: buildModelConfig({ reasoning: { effort: "high" } }),
    });

    expect(route.reasoning).toEqual({ effort: "high" });
  });

  it("merges architecture overrides with the default shape", () => {
    const route = toModelRoute({
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
