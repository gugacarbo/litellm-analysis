import { encryptProviderSecret } from "@lite-llm/llm-config-service";
import type { Provider } from "@lite-llm/models-repository";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  CHATGPT_SUBSCRIPTION_PROVIDER,
  findUpstreamProvider,
  parseProviderModel,
  resolveUpstreamTarget,
} from "./upstream-provider";

const { dbSelectMock } = vi.hoisted(() => ({
  dbSelectMock: vi.fn(),
}));

const TEST_ENCRYPTION_KEY = "12345678901234567890123456789012";

function encryptedCredential(secret = "test-openai-key"): string {
  return encryptProviderSecret(secret, Buffer.from(TEST_ENCRYPTION_KEY));
}

vi.mock("@lite-llm/database/client", () => ({
  db: {
    select: dbSelectMock,
  },
}));

function createProviderMap(): Record<string, Provider> {
  return {
    "local-proxy": {
      name: "Local Model Proxy",
      ownedBy: "llm-toolbox",
      baseUrl: "http://localhost:3008/v1",
    },
    openai: {
      name: "OpenAI",
      adapter: "openai-compatible",
      baseUrl: "https://api.openai.com/v1",
    },
    deepseek: {
      name: "DeepSeek",
      adapter: "openai-compatible",
      baseUrl: "https://api.deepseek.com/v1",
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
    providerId: "00000000-0000-0000-0000-000000000002",
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
    revision: 1,
    createdAt: new Date("2026-06-16T00:00:00.000Z"),
    updatedAt: new Date("2026-06-16T00:00:00.000Z"),
    ...overrides,
  };
}

describe("upstream-provider", () => {
  beforeEach(() => {
    process.env.APP_ENCRYPTION_KEY = TEST_ENCRYPTION_KEY;
    dbSelectMock.mockReset();
    dbSelectMock.mockReturnValue({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() =>
            Promise.resolve([
              {
                name: "openai-main",
                credentialEnvelope: encryptedCredential(),
                baseUrl: null,
              },
            ]),
          ),
        })),
      })),
    });
  });

  afterEach(() => {
    delete process.env.APP_ENCRYPTION_KEY;
    delete process.env.OPENAI_API_KEY;
    delete process.env.TEST_OPENAI_API_KEY;
    delete process.env.TEST_IPROUTE_API_KEY;
  });

  it("finds upstream provider by model family", () => {
    const provider = findUpstreamProvider(
      createProviderMap(),
      createModelRow({ family: "openai" }),
    );

    expect(provider?.baseUrl).toBe("https://api.openai.com/v1");
  });

  it("prefers the model provider name over family when resolving the provider", () => {
    const provider = findUpstreamProvider(
      createProviderMap(),
      createModelRow({
        family: "openai",
      }),
      "deepseek",
    );

    expect(provider?.baseUrl).toBe("https://api.deepseek.com/v1");
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

  it("resolves upstream from the encrypted provider envelope", async () => {
    const target = await resolveUpstreamTarget({
      modelName: "gpt-test",
      providers: createProviderMap(),
      row: createModelRow(),
    });

    expect(target.upstreamBaseUrl).toBe("https://api.openai.com/v1");
    expect(target.upstreamHeaders).toEqual({
      authorization: "Bearer test-openai-key",
    });
  });

  it("resolves a bare model name when there is a single database row", async () => {
    const target = await resolveUpstreamTarget({
      modelName: "gpt-test",
      providers: createProviderMap(),
      row: createModelRow(),
    });
    expect(target.model).toBe("gpt-test");
    expect(target.upstreamBaseUrl).toBe("https://api.openai.com/v1");
    expect(target.cost).toEqual({
      input: undefined,
      output: undefined,
    });
  });

  it("resolves a bare model name to the provider-backed default row", async () => {
    const target = await resolveUpstreamTarget({
      modelName: "gpt-test",
      providers: createProviderMap(),
      row: createModelRow({
        family: "openai",
      }),
    });
    expect(target.ownedBy).toBe("openai");
  });

  it("resolves provider/model prefixes to the specific provider row", async () => {
    dbSelectMock.mockReturnValueOnce({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() =>
            Promise.resolve([
              {
                name: "deepseek-main",
                credentialEnvelope: encryptedCredential(),
                baseUrl: "https://api.deepseek.com/v1",
              },
            ]),
          ),
        })),
      })),
    });

    const row = createModelRow({
      family: "deepseek",
    });

    const target = await resolveUpstreamTarget({
      modelName: "deepseek-main/gpt-test",
      providers: createProviderMap(),
      row,
    });
    expect(target.model).toBe("deepseek-main/gpt-test");
    expect(target.upstreamModel).toBe("gpt-test");
    expect(target.upstreamBaseUrl).toBe("https://api.deepseek.com/v1");
  });

  it("resolves a provider-backed row by bare model name", async () => {
    const target = await resolveUpstreamTarget({
      modelName: "gpt-test",
      providers: createProviderMap(),
      row: createModelRow({
        family: "openai",
      }),
    });
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

  it("fails closed when a provider has no credential envelope", async () => {
    dbSelectMock
      .mockReturnValueOnce({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(() =>
              Promise.resolve([
                {
                  name: "openai-main",
                  baseUrl: "https://api.openai.com/v1",
                },
              ]),
            ),
          })),
        })),
      })
      .mockReturnValueOnce({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve([])),
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
          },
        },
        row: createModelRow({
          family: "openai",
        }),
      }),
    ).rejects.toThrow("Stored provider credential cannot be decrypted");
  });

  it("routes chatgpt-subscription models through OAuth even when they are identified by providerName", async () => {
    const target = await resolveUpstreamTarget({
      modelName: "gpt-5-codex",
      providers: {
        "chatgpt-subscription": {
          name: "OpenAI OAuth",
          ownedBy: CHATGPT_SUBSCRIPTION_PROVIDER,
          baseUrl: "https://chatgpt.com/backend-api/codex",
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

  it("fails closed when the credential envelope is corrupt", async () => {
    dbSelectMock
      .mockReturnValueOnce({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(() =>
              Promise.resolve([
                {
                  name: "openai-main",
                  baseUrl: "https://api.openai.com/v1",
                },
              ]),
            ),
          })),
        })),
      })
      .mockReturnValueOnce({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(() =>
              Promise.resolve([{ credentialEnvelope: "enc:v1:not-json" }]),
            ),
          })),
        })),
      });

    await expect(
      resolveUpstreamTarget({
        modelName: "gpt-test",
        providers: createProviderMap(),
        row: createModelRow(),
      }),
    ).rejects.toThrow("Stored provider credential cannot be decrypted");
  });

  it("does not fall back to environment variables when an envelope is missing", async () => {
    process.env.OPENAI_API_KEY = "environment-secret";

    dbSelectMock
      .mockReturnValueOnce({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(() =>
              Promise.resolve([
                {
                  name: "openai-main",
                  baseUrl: "https://api.openai.com/v1",
                },
              ]),
            ),
          })),
        })),
      })
      .mockReturnValueOnce({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve([])),
          })),
        })),
      });

    await expect(
      resolveUpstreamTarget({
        modelName: "gpt-test",
        providers: createProviderMap(),
        row: createModelRow(),
      }),
    ).rejects.toThrow("Stored provider credential cannot be decrypted");
  });
});
