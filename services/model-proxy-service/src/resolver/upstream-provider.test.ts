import { describe, expect, it, vi } from "vitest";
import {
  CHATGPT_SUBSCRIPTION_PROVIDER,
  findUpstreamProvider,
  resolveUpstreamTarget,
} from "./upstream-provider";

describe("upstream-provider", () => {
  it("finds upstream provider by model family", () => {
    const provider = findUpstreamProvider(
      {
        "local-proxy": {
          name: "Local Model Proxy",
          ownedBy: "lite-llm-analytics",
          baseUrl: "http://localhost:3008/v1",
          apiKey: "env:MODEL_PROXY_API_KEY",
          defaultProvider: "router",
        },
        openai: {
          name: "OpenAI",
          adapter: "openai-compatible",
          baseUrl: "https://api.openai.com/v1",
          defaultProvider: "openai-main",
        },
      },
      {
        enabled: true,
        displayName: "GPT Test",
        family: "openai",
        limits: { length: 128000, maxOutput: 4096 },
      },
    );

    expect(provider?.baseUrl).toBe("https://api.openai.com/v1");
    expect(provider?.defaultProvider).toBe("openai-main");
  });

  it("resolves upstream from provider registry without global env", async () => {
    const database = {
      modelProxyProvider: {
        findUnique: vi.fn().mockResolvedValue({
          name: "openai-main",
          apiKey: "upstream-secret",
          baseUrl: null,
          secretRef: null,
        }),
      },
    };

    const target = await resolveUpstreamTarget({
      database: database as never,
      modelName: "gpt-test",
      providers: {
        openai: {
          name: "OpenAI",
          adapter: "openai-compatible",
          baseUrl: "https://api.openai.com/v1",
          defaultProvider: "openai-main",
        },
      },
      fallbackModels: {
        "gpt-test": {
          enabled: true,
          displayName: "GPT Test",
          family: "openai",
          limits: { length: 128000, maxOutput: 4096 },
          cost: { input: 0.000001, output: 0.000002 },
        },
      },
      row: null,
    });

    expect(target.upstreamBaseUrl).toBe("https://api.openai.com/v1");
    expect(target.upstreamHeaders).toEqual({
      authorization: "Bearer upstream-secret",
    });
    expect(database.modelProxyProvider.findUnique).toHaveBeenCalledWith({
      where: { name: "openai-main" },
    });
  });

  it("uses literal secretRef values when the provider stores a raw key", async () => {
    const target = await resolveUpstreamTarget({
      database: {
        modelProxyProvider: {
          findUnique: vi.fn().mockResolvedValue({
            name: "iproute-main",
            apiKey: null,
            baseUrl: "https://llm.iproute.cloud",
            secretRef: "sk-live-literal-secret",
          }),
        },
      } as never,
      modelName: "gpt-test",
      providers: {
        openai: {
          name: "OpenAI",
          adapter: "openai-compatible",
          baseUrl: "https://api.openai.com/v1",
          defaultProvider: "iproute-main",
        },
      },
      fallbackModels: {
        "gpt-test": {
          enabled: true,
          displayName: "GPT Test",
          family: "openai",
          limits: { length: 128000, maxOutput: 4096 },
        },
      },
      row: null,
    });

    expect(target.upstreamHeaders).toEqual({
      authorization: "Bearer sk-live-literal-secret",
    });
  });

  it("resolves chatgpt subscription models without api key", async () => {
    const target = await resolveUpstreamTarget({
      database: {
        modelProxyProvider: {
          findUnique: vi.fn().mockResolvedValue(null),
        },
      } as never,
      modelName: "gpt-5-codex",
      providers: {},
      fallbackModels: {
        "gpt-5-codex": {
          enabled: true,
          displayName: "GPT-5 Codex",
          ownedBy: CHATGPT_SUBSCRIPTION_PROVIDER,
          limits: { length: 200_000, maxOutput: 8_192 },
        },
      },
      row: null,
    });

    expect(target.authMode).toBe("openai-chatgpt-oauth");
    expect(target.upstreamBaseUrl).toBe(
      "https://chatgpt.com/backend-api/codex",
    );
    expect(target.upstreamHeaders).toEqual({});
  });
});
