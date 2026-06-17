import { describe, expect, it } from "vitest";
import type { ModelProxyModelRecord } from "../../types/model-route.js";
import {
  fromModelProxyRow,
  fromModelRoute,
  toModelProxyRow,
  toModelRoute,
} from "../model-route-adapter.js";

const MODEL_ALIAS = "gpt-test";

const builtParams = {
  model: MODEL_ALIAS,
  model_name: MODEL_ALIAS,
  custom_llm_provider: "litellm_proxy",
  context_window_size: 128_000,
  max_tokens: 4096,
  input_cost_per_token: 0.000003,
  output_cost_per_token: 0.000015,
  credential_name: "openai-main",
};

describe("model-route-adapter", () => {
  describe("toModelRoute", () => {
    it("maps buildLiteLLMParams output to ModelRoute", () => {
      const route = toModelRoute(builtParams, MODEL_ALIAS);

      expect(route).toEqual({
        modelName: MODEL_ALIAS,
        inputCostPerToken: 0.000003,
        outputCostPerToken: 0.000015,
        contextWindowSize: 128_000,
        maxOutputTokens: 4096,
        credentialName: "openai-main",
      });
    });

    it("puts non-reserved keys in requestOptions", () => {
      const route = toModelRoute({
        ...builtParams,
        temperature: "0.2",
        rpm: "100",
      });

      expect(route.requestOptions).toMatchObject({
        temperature: 0.2,
        rpm: 100,
      });
      expect(route).not.toHaveProperty("temperature");
    });

    it("coerces string booleans and numbers via adapter fixtures", () => {
      const route = toModelRoute({
        model_name: MODEL_ALIAS,
        enabled: false,
        max_tokens: 8192,
      });

      expect(route.enabled).toBe(false);
      expect(route.maxOutputTokens).toBe(8192);
    });

    it("sets upstreamModel when model differs from alias", () => {
      const route = toModelRoute(
        {
          model: "gpt-4o",
          model_name: MODEL_ALIAS,
          custom_llm_provider: "openai",
        },
        MODEL_ALIAS,
      );

      expect(route.modelName).toBe(MODEL_ALIAS);
      expect(route.upstreamModel).toBe("gpt-4o");
      expect(route.ownedBy).toBe("openai");
    });

    it("ignores litellm_proxy sentinel for ownedBy", () => {
      const route = toModelRoute(
        {
          model: MODEL_ALIAS,
          model_name: MODEL_ALIAS,
          custom_llm_provider: "litellm_proxy",
          use_litellm_proxy: false,
          use_in_pass_through: false,
          merge_reasoning_content_in_choices: false,
        },
        MODEL_ALIAS,
      );

      expect(route.ownedBy).toBeUndefined();
      expect(route.requestOptions?.custom_llm_provider).toBeUndefined();
    });
  });

  describe("fromModelRoute", () => {
    it("round-trips first-class fields to snake_case litellmParams", () => {
      const route = toModelRoute(builtParams, MODEL_ALIAS);
      const legacy = fromModelRoute({
        ...route,
        ownedBy: "openai",
        upstreamBaseUrl: "https://api.openai.com/v1",
        enabled: true,
      });

      expect(legacy).toMatchObject({
        model: MODEL_ALIAS,
        model_name: MODEL_ALIAS,
        enabled: true,
        input_cost_per_token: 0.000003,
        output_cost_per_token: 0.000015,
        context_window_size: 128_000,
        max_tokens: 4096,
        credential_name: "openai-main",
        api_base: "https://api.openai.com/v1",
        custom_llm_provider: "openai",
      });
    });

    it("emits upstream model id in model when it differs from alias", () => {
      const legacy = fromModelRoute({
        modelName: MODEL_ALIAS,
        upstreamModel: "gpt-4o",
        ownedBy: "openai",
      });

      expect(legacy.model).toBe("gpt-4o");
      expect(legacy.model_name).toBe(MODEL_ALIAS);
    });

    it("does not let requestOptions override first-class fields", () => {
      const legacy = fromModelRoute({
        modelName: MODEL_ALIAS,
        maxOutputTokens: 4096,
        requestOptions: {
          max_tokens: 999,
          temperature: 0.5,
        },
      });

      expect(legacy.max_tokens).toBe(4096);
      expect(legacy.temperature).toBe(0.5);
    });
  });

  describe("toModelProxyRow / fromModelProxyRow", () => {
    it("maps ModelRoute to Prisma write shape with null defaults", () => {
      const route = toModelRoute(builtParams, MODEL_ALIAS);
      const row = toModelProxyRow({
        ...route,
        displayName: "GPT Test",
        family: "openai",
        apiMode: "openai",
        vision: true,
      });

      expect(row).toEqual({
        modelName: MODEL_ALIAS,
        enabled: true,
        displayName: "GPT Test",
        family: "openai",
        ownedBy: null,
        apiMode: "openai",
        vision: true,
        contextWindowSize: 128_000,
        maxOutputTokens: 4096,
        inputCostPerToken: 0.000003,
        outputCostPerToken: 0.000015,
        upstreamModel: null,
        upstreamBaseUrl: null,
        credentialName: "openai-main",
        secretRef: null,
      });
    });

    it("defaults enabled to true when absent", () => {
      const row = toModelProxyRow({ modelName: MODEL_ALIAS });

      expect(row.enabled).toBe(true);
    });

    it("round-trips registry row to ModelRoute", () => {
      const now = new Date("2026-06-16T12:00:00.000Z");
      const record: ModelProxyModelRecord = {
        id: "row-1",
        modelName: MODEL_ALIAS,
        enabled: true,
        displayName: "GPT Test",
        family: "openai",
        ownedBy: "openai",
        apiMode: "openai",
        vision: true,
        contextWindowSize: 128_000,
        maxOutputTokens: 4096,
        inputCostPerToken: 0.000003,
        outputCostPerToken: 0.000015,
        upstreamModel: "gpt-4o",
        upstreamBaseUrl: "https://api.openai.com/v1",
        credentialName: "openai-main",
        secretRef: "OPENAI_MAIN_API_KEY",
        requestOptions: { temperature: 0.2 },
        createdAt: now,
        updatedAt: now,
      };

      const route = fromModelProxyRow(record);
      const row = toModelProxyRow(route);

      expect(route).toMatchObject({
        modelName: MODEL_ALIAS,
        displayName: "GPT Test",
        family: "openai",
        ownedBy: "openai",
        apiMode: "openai",
        vision: true,
        upstreamModel: "gpt-4o",
        secretRef: "OPENAI_MAIN_API_KEY",
        requestOptions: { temperature: 0.2 },
      });
      expect(row.modelName).toBe(MODEL_ALIAS);
      expect(row.upstreamModel).toBe("gpt-4o");
      expect(row.secretRef).toBe("OPENAI_MAIN_API_KEY");
    });
  });
});
