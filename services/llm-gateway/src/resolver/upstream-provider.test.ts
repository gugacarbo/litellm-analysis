
import type { Provider } from "@lite-llm/models-repository";
import { describe, expect, it, vi } from "vitest";
import {
  CHATGPT_SUBSCRIPTION_PROVIDER,
  findUpstreamProvider,
  parseProviderModel,
  resolveUpstreamTarget,
} from "./upstream-provider";

const { dbSelectMock } = vi.hoisted(() => ({
  dbSelectMock: vi.fn(),
}));

vi.mock("@lite-llm/database/client", () => ({
  db: {
    select: dbSelectMock,
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
    id: "00000000-0000-0000-0000-000000000001",
    modelId: "gpt-test",
    enabled: true,
    displayName: "GPT Test",
    family: "openai",
    providerId: null,
    pricing: null,
    canonicalSlug: null,
    description: null,
    contextLength: null,
    maxCompletionTokens: null,
    knowledgeCutoff: null,
    expirationDate: null,
    architecture: null,
    reasoning: null,
    supportedParameters: null,
    defaultParameters: null,
    perRequestLimits: null,
    requestOptions: null,
    reasoningApiId: null,
    createdAt: new Date("2026-06-16T00:00:00.000Z"),
    updatedAt: new Date("2026-06-16T00:00:00.000Z"),
    ...overrides,
  };
}

describe("upstream-provider", () => {
  dbSelectMock.mockReturnValue({
    from: vi.fn(() => ({
      where: vi.fn(() => ({
        limit: vi.fn(() =>
          Promise.resolve([
            {
              name: "openai-main",
              secretRef: process.env.OPENAI_API_KEY ? "OPENAI_API_KEY" : null,
              baseUrl: null,
            },
          ]),
        ),
      })),
    })),
  });

  it("finds upstream provider by model family", () => {
    const provider = findUpstreamProvider(
      createProviderMap(),
      createModelRow({ family: "openai" }),
    );

    expect(provider?.baseUrl).toBe("https://api.openai.com/v1");
    expect(provider?.defaultProvider).toBe("openai-main");
  });

  it("prefers the model provider name over family when resolving the provider", () => {
    const provider = findUpstreamProvider(
      createProviderMap(),
      createModelRow({
        family: "openai",
      }),
      "deepseek-main",
    );

    expect(provider?.baseUrl).toBe("https://api.deepseek.com/v1");
    expect(provider?.defaultProvider).toBe("deepseek-main");
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

  it("resolves a bare model name to the provider-backed default row", async () => {
    process.env.OPENAI_API_KEY = "sk-test-key";
    const target = await resolveUpstreamTarget({
      modelName: "gpt-test",
      providers: createProviderMap(),
      row: createModelRow({
        family: "openai",
      }),
    });
    delete process.env.OPENAI_API_KEY;

    expect(target.ownedBy).toBe("openai");
  });

  it("resolves provider/model prefixes to the specific provider row", async () => {
    process.env.OPENAI_API_KEY = "sk-test-key";
    const row = createModelRow({
      family: "deepseek",
    });

    const target = await resolveUpstreamTarget({
      modelName: "deepseek-main/gpt-test",
      providers: createProviderMap(),
      row,
    });
    delete process.env.OPENAI_API_KEY;

    expect(target.model).toBe("deepseek-main/gpt-test");
    expect(target.upstreamModel).toBe("gpt-test");
    expect(target.upstreamBaseUrl).toBe("https://api.deepseek.com/v1");
  });

  it("keeps backward compatibility for NULL-provider rows resolved by bare model name", async () => {
    process.env.OPENAI_API_KEY = "sk-test-key";
    const target = await resolveUpstreamTarget({
      modelName: "gpt-test",
      providers: createProviderMap(),
      row: createModelRow({
        family: "openai",
      }),
    });
    delete process.env.OPENAI_API_KEY;

    expect(target.upstreamBaseUrl).toBe("https://api.openai.com/v1");
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

  it("rejects a provider with no secretRef configured", async () => {
    dbSelectMock.mockReturnValueOnce({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() =>
            Promise.resolve([
              {
                name: "openai-main",
                secretRef: null,
                baseUrl: "https://api.openai.com/v1",
              },
            ]),
          ),
        })),
      })),
    });

    await expect(
      resolveUpstreamTarget({
        modelName: "gpt-test",
        providers: {
          openai: {
            name: "OpenAI",
            adapter: "openai-compatible",
            baseUrl: "https://api.openai.com/v1",
            defaultProvider: "openai-main",
          },
        },
        row: createModelRow({
          family: "openai",
        }),
      }),
    ).rejects.toThrow('No upstream API key configured for model "gpt-test"');
  });

  it("routes chatgpt-subscription models through OAuth even when they are identified by providerName", async () => {
    const target = await resolveUpstreamTarget({
      modelName: "gpt-5-codex",
      providers: {
        "chatgpt-subscription": {
          name: "OpenAI OAuth",
          ownedBy: CHATGPT_SUBSCRIPTION_PROVIDER,
          baseUrl: "https://chatgpt.com/backend-api/codex",
          defaultProvider: "codex-plan",
        },
      },
      row: createModelRow({
        modelId: "gpt-5-codex",
        family: "chatgpt-subscription",
      }),
    });

    expect(target.authMode).toBe("openai-chatgpt-oauth");
    expect(target.upstreamBaseUrl).toBe(
      "https://chatgpt.com/backend-api/codex",
    );
    expect(target.upstreamHeaders).toEqual({});
  });

  it("resolves API key from secretRef on the provider row", async () => {
    process.env.TEST_OPENAI_API_KEY = "sk-secretref-key";

    dbSelectMock.mockReturnValueOnce({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() =>
            Promise.resolve([
              {
                name: "openai-main",
                secretRef: "TEST_OPENAI_API_KEY",
                baseUrl: "https://api.openai.com/v1",
              },
            ]),
          ),
        })),
      })),
    });

    const target = await resolveUpstreamTarget({
      modelName: "gpt-test",
      providers: {
        openai: {
          name: "OpenAI",
          adapter: "openai-compatible",
          baseUrl: "https://api.openai.com/v1",
          defaultProvider: "openai-main",
        },
      },
      row: createModelRow({
        family: "openai",
      }),
    });

    delete process.env.TEST_OPENAI_API_KEY;

    expect(target.upstreamHeaders).toEqual({
      authorization: "Bearer sk-secretref-key",
    });
    expect(target.upstreamBaseUrl).toBe("https://api.openai.com/v1");
  });

  it("resolves API key from secretRef for a secondary provider", async () => {
    process.env.TEST_IPROUTE_API_KEY = "sk-secretref-iproute-key";

    dbSelectMock.mockReturnValueOnce({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() =>
            Promise.resolve([
              {
                name: "iproute-main",
                secretRef: "TEST_IPROUTE_API_KEY",
                baseUrl: "https://llm.iproute.cloud/v1",
              },
            ]),
          ),
        })),
      })),
    });

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
      row: createModelRow({
        family: "openai",
      }),
    });

    delete process.env.TEST_IPROUTE_API_KEY;

    expect(target.upstreamHeaders).toEqual({
      authorization: "Bearer sk-secretref-iproute-key",
    });
    expect(target.upstreamBaseUrl).toBe("https://llm.iproute.cloud/v1");
  });
});
