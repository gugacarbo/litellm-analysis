import { describe, expect, it } from "vitest";
import {
  buildConfigFromFormData,
  type ModelConfigFormData,
  modelToFormData,
} from "./use-model-config-form";

function createFormData(
  overrides: Partial<ModelConfigFormData> = {},
): ModelConfigFormData {
  return {
    displayName: "GPT 4.1",
    family: "gpt-4.1",
    ownedBy: "openai",
    aliases: [],
    apiMode: "openai",
    vision: true,
    enabled: true,
    thinkingLevels: ["low", "medium"],
    reasoning: {
      enabled: true,
      effort: "medium",
      apiMode: "openai",
      enableThinking: true,
      includeReasoningInRequest: true,
    },
    apiBase: "https://api.openai.com/v1",
    providerName: "openai",
    inputCostPerToken: "0.1",
    outputCostPerToken: "0.2",
    extraParams: {},
    ...overrides,
  };
}

describe("use-model-config-form", () => {
  it("hydrates ownedBy from the saved model config", () => {
    const formData = modelToFormData({
      modelName: "gpt-4.1",
      modelRoute: {
        modelName: "gpt-4.1",
      },
      status: "synced",
      config: {
        displayName: "GPT 4.1",
        family: "gpt-4.1",
        ownedBy: "openai",
      },
    });

    expect(formData.ownedBy).toBe("openai");
  });

  it("keeps ownedBy in the config payload when saving", () => {
    expect(buildConfigFromFormData(createFormData())).toMatchObject({
      displayName: "GPT 4.1",
      family: "gpt-4.1",
      ownedBy: "openai",
    });
  });

  it("omits ownedBy from the config payload when the field is blank", () => {
    expect(
      buildConfigFromFormData(createFormData({ ownedBy: "" })),
    ).not.toHaveProperty("ownedBy");
  });
});
