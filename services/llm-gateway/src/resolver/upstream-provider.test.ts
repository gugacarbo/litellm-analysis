import type { Provider } from "@lite-llm/models-repository";
import { describe, expect, it, vi } from "vitest";
import {
  CHATGPT_SUBSCRIPTION_PROVIDER,
  findUpstreamProvider,
  parseProviderModel,
  resolveUpstreamTarget,
} from "./upstream-provider";

vi.mock("@lite-llm/database/client", () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() =>
            Promise.resolve([
              {
                name: "openai-main",
                secretRef: "OPENAI_API_KEY",
                baseUrl: null,
              },
            ]),
          ),
        })),
      })),
    })),
  },
}));

function createProviderMap(): Record<string, Provider> {
  return {
    "local-proxy": {
      name: "Local Model Proxy",
      ownedBy: "lite-llm-analytics",
      baseUrl: "http://localhost:3008/v1",
      defaultProvider: "router",
    },
    openai: {
      name: "OpenAI",
      adapter: "openai-compatible",
      baseUrl: "https://api.openai.com/v1",
      defaultProvider: "openai-main",
    },
    deepseek: {
      name: "DeepSeek",
      adapter: "openai-compatible",
      baseUrl: "https://api.deepseek.com/v1",
      defaultProvider: "deepseek-main",
    },
  };
}

function createModelRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "1",
    modelName: "gpt-test",
    enabled: true,
    upstreamBaseUrl: null,
    upstreamModel: null,
    inputCostPerToken: null,
    outputCostPerToken: null,
    ownedBy: "openai",
    family: null,
    displayName: "GPT Test",
    providerName: "openai-main",
    secretRef: null,
    isDefaultProvider: false,
    createdAt: new Date("2026-06-16T00:00:00.000Z"),
    updatedAt: new Date("2026-06-16T00:00:00.000Z"),
    apiMode: null,
    vision: null,
    thinking: null,
    reasoning: null,
    metadata: null,
    contextWindowSize: null,
    maxOutputTokens: null,
    requestOptions: null,
    ...overrides,
  };
}

describe("upstream-provider", () => {
  it("finds upstream provider by model family", () => {
    const provider = findUpstreamProvider(
      createProviderMap(),
      createModelRow({ ownedBy: "openai" }),
    );

    expect(provider?.baseUrl).toBe("https://api.openai.com/v1");
    expect(provider?.defaultProvider).toBe("openai-main");
  });

  it("parses bare model names without a provider prefix", () => {
    expect(parseProviderModel("glm-5.1")).toEqual({
      bareModelName: "glm-5.1",
    });
  });

  it("parses provider/model names using the first slash only", () => {
    expect(parseProviderModel("provider-a/glm-5.1")).toEqual({
      providerPrefix: "provider-a",
      bareModelName: "glm-5.1",
    });
    expect(parseProviderModel("a/b/c")).toEqual({
      providerPrefix: "a",
      bareModelName: "b/c",
    });
  });

  it("treats empty or incomplete prefixes as bare model names", () => {
    expect(parseProviderModel("/model")).toEqual({
      bareModelName: "/model",
    });
    expect(parseProviderModel("provider/")).toEqual({
      bareModelName: "provider/",
    });
  });

  it("resolves upstream from provider registry without global env", async () => {
    process.env.OPENAI_API_KEY = "test-openai-key";

    const target = await resolveUpstreamTarget({
      modelName: "gpt-test",
      providers: createProviderMap(),
      row: createModelRow(),
    });

    delete process.env.OPENAI_API_KEY;

    expect(target.upstreamBaseUrl).toBe("https://api.openai.com/v1");
    expect(target.upstreamHeaders).toEqual({
      authorization: "Bearer test-openai-key",
    });
  });

  it("resolves a bare model name when there is a single database row", async () => {
    process.env.OPENAI_API_KEY = "sk-test-key";
    const target = await resolveUpstreamTarget({
      modelName: "gpt-test",
      providers: createProviderMap(),
      row: createModelRow(),
    });
    delete process.env.OPENAI_API_KEY;

    expect(target.model).toBe("gpt-test");
    expect(target.upstreamBaseUrl).toBe("https://api.openai.com/v1");
    expect(target.cost).toEqual({
      input: undefined,
      output: undefined,
    });
  });

  it("resolves a bare model name to the default provider row when multiple rows exist", async () => {
    process.env.OPENAI_API_KEY = "sk-test-key";
    const target = await resolveUpstreamTarget({
      modelName: "gpt-test",
      providers: createProviderMap(),
      row: createModelRow({
        providerName: "openai-main",
        ownedBy: "openai",
        isDefaultProvider: true,
      }),
    });
    delete process.env.OPENAI_API_KEY;

    expect(target.ownedBy).toBe("openai");
  });

  it("resolves provider/model prefixes to the specific provider row", async () => {
    process.env.OPENAI_API_KEY = "sk-test-key";
    const row = createModelRow({
      providerName: "deepseek-main",
      ownedBy: "deepseek",
      upstreamBaseUrl: "https://custom.deepseek.example/v1",
      upstreamModel: "deepseek-upstream",
    });

    const target = await resolveUpstreamTarget({
      modelName: "deepseek-main/gpt-test",
      providers: createProviderMap(),
      row,
    });
    delete process.env.OPENAI_API_KEY;

    expect(target.model).toBe("deepseek-main/gpt-test");
    expect(target.upstreamModel).toBe("deepseek-upstream");
    expect(target.upstreamBaseUrl).toBe("https://custom.deepseek.example/v1");
  });

  it("keeps backward compatibility for NULL-provider rows resolved by bare model name", async () => {
    process.env.OPENAI_API_KEY = "sk-test-key";
    const target = await resolveUpstreamTarget({
      modelName: "gpt-test",
      providers: createProviderMap(),
      row: createModelRow({
        providerName: null,
        ownedBy: "openai",
        upstreamBaseUrl: "https://null-provider.example/v1",
      }),
    });
    delete process.env.OPENAI_API_KEY;

    expect(target.upstreamBaseUrl).toBe("https://null-provider.example/v1");
  });

  it("rejects disabled rows selected from the database", async () => {
    await expect(
      resolveUpstreamTarget({
        modelName: "gpt-test",
        providers: createProviderMap(),
        row: createModelRow({ enabled: false }),
      }),
    ).rejects.toThrow('Model "gpt-test" is disabled');
  });

  it("uses literal secretRef values when the provider stores a raw key", async () => {
    process.env.OPENAI_API_KEY = "sk-live-literal-secret";
    const target = await resolveUpstreamTarget({
      modelName: "gpt-test",
      providers: {
        openai: {
          name: "OpenAI",
          adapter: "openai-compatible",
          baseUrl: "https://api.openai.com/v1",
          defaultProvider: "iproute-main",
        },
      },
      row: createModelRow(),
    });
    delete process.env.OPENAI_API_KEY;

    expect(target.upstreamHeaders).toEqual({
      authorization: "Bearer sk-live-literal-secret",
    });
  });

  it("resolves chatgpt subscription models without api key", async () => {
    const target = await resolveUpstreamTarget({
      modelName: "gpt-5-codex",
      providers: {},
      row: createModelRow({
        modelName: "gpt-5-codex",
        ownedBy: CHATGPT_SUBSCRIPTION_PROVIDER,
        providerName: null,
      }),
    });

    expect(target.authMode).toBe("openai-chatgpt-oauth");
    expect(target.upstreamBaseUrl).toBe(
      "https://chatgpt.com/backend-api/codex",
    );
    expect(target.upstreamHeaders).toEqual({});
  });
});
