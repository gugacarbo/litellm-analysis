import { describe, expect, it, vi } from "vitest";
import type { Provider } from "@lite-llm/models-repository";
import {
  CHATGPT_SUBSCRIPTION_PROVIDER,
  findUpstreamProvider,
  parseProviderModel,
  resolveUpstreamTarget,
} from "./upstream-provider";

function createProviderMap(): Record<string, Provider> {
  return {
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
    updatedAt: new Date("2026-06-16T00:00:00.000Z"),
    ...overrides,
  };
}

function createDatabaseMock(options?: {
  providerRow?: Record<string, unknown> | null;
  rows?: Array<Record<string, unknown>>;
  prefixedRow?: Record<string, unknown> | null;
}) {
  return {
    modelProxyModel: {
      findMany: vi.fn().mockResolvedValue(options?.rows ?? []),
      findFirst: vi.fn().mockResolvedValue(options?.prefixedRow ?? null),
    },
    modelProxyProvider: {
      findUnique: vi.fn().mockResolvedValue(
        options?.providerRow ?? {
          name: "openai-main",
          apiKey: "upstream-secret",
          baseUrl: null,
          secretRef: null,
        },
      ),
    },
  };
}

describe("upstream-provider", () => {
  it("finds upstream provider by model family", () => {
    const provider = findUpstreamProvider(createProviderMap(), {
      enabled: true,
      displayName: "GPT Test",
      family: "openai",
      limits: { length: 128000, maxOutput: 4096 },
    });

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
    const database = createDatabaseMock();

    const target = await resolveUpstreamTarget({
      database: database as never,
      modelName: "gpt-test",
      providers: createProviderMap(),
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
    expect(database.modelProxyModel.findMany).toHaveBeenCalledWith({
      where: { modelName: "gpt-test" },
    });
    expect(database.modelProxyProvider.findUnique).toHaveBeenCalledWith({
      where: { name: "openai-main" },
    });
  });

  it("resolves a bare model name when there is a single database row", async () => {
    const row = createModelRow({
      inputCostPerToken: 0.0000014,
      outputCostPerToken: 0.0000044,
    });
    const database = createDatabaseMock({ rows: [row] });

    const target = await resolveUpstreamTarget({
      database: database as never,
      modelName: "gpt-test",
      providers: createProviderMap(),
      fallbackModels: {},
    });

    expect(target.model).toBe("gpt-test");
    expect(target.upstreamBaseUrl).toBe("https://api.openai.com/v1");
    expect(target.cost).toEqual({
      input: 0.0000014,
      output: 0.0000044,
    });
  });

  it("resolves a bare model name to the default provider row when multiple rows exist", async () => {
    const database = createDatabaseMock({
      rows: [
        createModelRow({ providerName: "deepseek-main", ownedBy: "deepseek" }),
        createModelRow({
          providerName: "openai-main",
          ownedBy: "openai",
          isDefaultProvider: true,
        }),
      ],
    });

    const target = await resolveUpstreamTarget({
      database: database as never,
      modelName: "gpt-test",
      providers: createProviderMap(),
      fallbackModels: {},
    });

    expect(target.ownedBy).toBe("openai");
    expect(database.modelProxyProvider.findUnique).toHaveBeenCalledWith({
      where: { name: "openai-main" },
    });
  });

  it("rejects ambiguous bare model names when no default provider exists", async () => {
    const database = createDatabaseMock({
      rows: [
        createModelRow({ providerName: "openai-main" }),
        createModelRow({ providerName: "deepseek-main", ownedBy: "deepseek" }),
      ],
    });

    await expect(
      resolveUpstreamTarget({
        database: database as never,
        modelName: "gpt-test",
        providers: createProviderMap(),
        fallbackModels: {},
      }),
    ).rejects.toThrow(/Ambiguous model "gpt-test"/);
  });

  it("rejects multiple default providers for the same bare model name", async () => {
    const database = createDatabaseMock({
      rows: [
        createModelRow({
          providerName: "openai-main",
          isDefaultProvider: true,
        }),
        createModelRow({
          providerName: "deepseek-main",
          ownedBy: "deepseek",
          isDefaultProvider: true,
        }),
      ],
    });

    await expect(
      resolveUpstreamTarget({
        database: database as never,
        modelName: "gpt-test",
        providers: createProviderMap(),
        fallbackModels: {},
      }),
    ).rejects.toThrow(/Multiple default providers configured/);
  });

  it("resolves provider/model prefixes to the specific provider row", async () => {
    const row = createModelRow({
      providerName: "deepseek-main",
      ownedBy: "deepseek",
      upstreamBaseUrl: "https://custom.deepseek.example/v1",
      upstreamModel: "deepseek-upstream",
    });
    const database = createDatabaseMock({ prefixedRow: row });

    const target = await resolveUpstreamTarget({
      database: database as never,
      modelName: "deepseek-main/gpt-test",
      providers: createProviderMap(),
      fallbackModels: {},
    });

    expect(database.modelProxyModel.findFirst).toHaveBeenCalledWith({
      where: { modelName: "gpt-test", providerName: "deepseek-main" },
    });
    expect(database.modelProxyModel.findMany).not.toHaveBeenCalled();
    expect(target.model).toBe("deepseek-main/gpt-test");
    expect(target.upstreamModel).toBe("deepseek-upstream");
    expect(target.upstreamBaseUrl).toBe("https://custom.deepseek.example/v1");
  });

  it("returns not found for an unknown provider prefix", async () => {
    const database = createDatabaseMock({ prefixedRow: null });

    await expect(
      resolveUpstreamTarget({
        database: database as never,
        modelName: "unknown/gpt-test",
        providers: createProviderMap(),
        fallbackModels: {},
      }),
    ).rejects.toThrow('Model "unknown/gpt-test" not found');
  });

  it("keeps backward compatibility for NULL-provider rows resolved by bare model name", async () => {
    const database = createDatabaseMock({
      rows: [
        createModelRow({
          providerName: null,
          ownedBy: "openai",
          upstreamBaseUrl: "https://null-provider.example/v1",
        }),
      ],
      providerRow: null,
    });

    const target = await resolveUpstreamTarget({
      database: database as never,
      modelName: "gpt-test",
      providers: createProviderMap(),
      fallbackModels: {},
    });

    expect(target.upstreamBaseUrl).toBe("https://null-provider.example/v1");
    expect(database.modelProxyProvider.findUnique).toHaveBeenCalledWith({
      where: { name: "openai-main" },
    });
  });

  it("rejects disabled rows selected from the database", async () => {
    const database = createDatabaseMock({
      rows: [createModelRow({ enabled: false })],
    });

    await expect(
      resolveUpstreamTarget({
        database: database as never,
        modelName: "gpt-test",
        providers: createProviderMap(),
        fallbackModels: {},
      }),
    ).rejects.toThrow('Model "gpt-test" is disabled');
  });

  it("uses literal secretRef values when the provider stores a raw key", async () => {
    const target = await resolveUpstreamTarget({
      database: {
        modelProxyModel: {
          findMany: vi.fn().mockResolvedValue([]),
          findFirst: vi.fn().mockResolvedValue(null),
        },
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
        modelProxyModel: {
          findMany: vi.fn().mockResolvedValue([]),
          findFirst: vi.fn().mockResolvedValue(null),
        },
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
