import { describe, expect, it } from "vitest";
import type { ModelProxyModelRecord, ModelRoute } from "../../types/model-route.js";
import {
  fromModelProxyRow,
  fromModelRoute,
  parseModelRouteFromApi,
  toModelProxyRow,
  toModelRoute,
} from "../model-route-adapter.js";

const MODEL_ALIAS = "gpt-test";

const canonicalRoutePayload = {
  modelName: MODEL_ALIAS,
  contextWindowSize: 128_000,
  maxOutputTokens: 4096,
  inputCostPerToken: 0.000003,
  outputCostPerToken: 0.000015,
  providerName: "openai-main",
} satisfies Record<string, unknown>;

describe("model-route-adapter", () => {
  describe("toModelRoute", () => {
    it("maps the canonical camelCase payload to ModelRoute", () => {
      const route = toModelRoute(canonicalRoutePayload, MODEL_ALIAS);

      expect(route).toEqual({
        modelName: MODEL_ALIAS,
        inputCostPerToken: 0.000003,
        outputCostPerToken: 0.000015,
        contextWindowSize: 128_000,
        maxOutputTokens: 4096,
        providerName: "openai-main",
      });
    });

    it("keeps nested requestOptions and metadata only in their canonical fields", () => {
      const route = toModelRoute({
        ...canonicalRoutePayload,
        requestOptions: {
          temperature: 0.2,
          rpm: 100,
        },
        metadata: {
          reasoning: "medium",
        },
      });

      expect(route.requestOptions).toEqual({
        temperature: 0.2,
        rpm: 100,
      });
      expect(route.metadata).toEqual({
        reasoning: "medium",
      });
      expect(route).not.toHaveProperty("temperature");
    });

    it("uses the fallback model name when the payload omits it", () => {
      const route = toModelRoute(
        {
          maxOutputTokens: 8192,
        },
        MODEL_ALIAS,
      );

      expect(route.modelName).toBe(MODEL_ALIAS);
      expect(route.maxOutputTokens).toBe(8192);
    });

    it("rejects legacy snake_case payload fields", () => {
      expect(() =>
        toModelRoute(
          {
            model_name: MODEL_ALIAS,
            max_tokens: 8192,
          },
          MODEL_ALIAS,
        ),
      ).toThrow(/Legacy model route fields are no longer supported/);
    });

    it("rejects deprecated provider aliases and liteLLM payload wrappers", () => {
      expect(() =>
        parseModelRouteFromApi(
          {
            modelName: MODEL_ALIAS,
            litellm_provider_name: "openai-main",
          },
          MODEL_ALIAS,
        ),
      ).toThrow(/Legacy model route fields are no longer supported/);

      expect(() =>
        parseModelRouteFromApi(
          {
            modelName: MODEL_ALIAS,
            litellm_params: {
              model: MODEL_ALIAS,
            },
          },
          MODEL_ALIAS,
        ),
      ).toThrow(/Legacy model route fields are no longer supported/);
    });
  });

  describe("fromModelRoute", () => {
    it("round-trips first-class fields to the canonical camelCase payload", () => {
      const payload = fromModelRoute({
        ...toModelRoute(canonicalRoutePayload, MODEL_ALIAS),
        ownedBy: "openai",
        upstreamBaseUrl: "https://api.openai.com/v1",
        enabled: true,
      });

      expect(payload).toMatchObject({
        modelName: MODEL_ALIAS,
        enabled: true,
        inputCostPerToken: 0.000003,
        outputCostPerToken: 0.000015,
        contextWindowSize: 128_000,
        maxOutputTokens: 4096,
        providerName: "openai-main",
        upstreamBaseUrl: "https://api.openai.com/v1",
        ownedBy: "openai",
      });
      expect(payload).not.toHaveProperty("model_name");
      expect(payload).not.toHaveProperty("custom_llm_provider");
    });

    it("preserves requestOptions without lifting them to the top level", () => {
      const payload = fromModelRoute({
        modelName: MODEL_ALIAS,
        maxOutputTokens: 4096,
        requestOptions: {
          temperature: 0.5,
        },
      });

      expect(payload.maxOutputTokens).toBe(4096);
      expect(payload.requestOptions).toEqual({ temperature: 0.5 });
      expect(payload).not.toHaveProperty("temperature");
    });
  });

  describe("toModelProxyRow / fromModelProxyRow", () => {
    it("maps ModelRoute to a write shape with null defaults", () => {
      const route: ModelRoute = {
        ...toModelRoute(canonicalRoutePayload, MODEL_ALIAS),
        displayName: "GPT Test",
        family: "openai",
        apiMode: "openai",
        vision: true,
      };
      const row = toModelProxyRow(route);

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
        providerName: "openai-main",
        secretRef: null,
      });
    });

    it("defaults enabled to true when absent", () => {
      const row = toModelProxyRow({ modelName: MODEL_ALIAS });

      expect(row.enabled).toBe(true);
    });

    it("round-trips registry rows to ModelRoute including metadata", () => {
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
        providerName: "openai-main",
        secretRef: "OPENAI_MAIN_API_KEY",
        requestOptions: { temperature: 0.2 },
        metadata: { reasoning: "medium" },
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
        metadata: { reasoning: "medium" },
      });
      expect(row.modelName).toBe(MODEL_ALIAS);
      expect(row.upstreamModel).toBe("gpt-4o");
      expect(row.secretRef).toBe("OPENAI_MAIN_API_KEY");
      expect(row.metadata).toEqual({ reasoning: "medium" });
    });
  });
});
