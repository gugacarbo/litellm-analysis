import { describe, expect, it, vi } from "vitest";
import {
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
          defaultCredential: "router",
        },
        openai: {
          name: "OpenAI",
          adapter: "openai-compatible",
          baseUrl: "https://api.openai.com/v1",
          defaultCredential: "openai-main",
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
    expect(provider?.defaultCredential).toBe("openai-main");
  });

  it("resolves upstream from provider registry without global env", async () => {
    const database = {
      modelProxyCredential: {
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
          defaultCredential: "openai-main",
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
    expect(database.modelProxyCredential.findUnique).toHaveBeenCalledWith({
      where: { name: "openai-main" },
    });
  });
});
