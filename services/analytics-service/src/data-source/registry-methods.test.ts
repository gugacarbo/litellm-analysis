import { describe, expect, it, vi } from "vitest";

const mockPrisma = {
  modelProxyModel: {
    findMany: vi.fn().mockResolvedValue([
      {
        modelName: "gpt-4o",
        enabled: true,
        upstreamModel: "gpt-4o",
        upstreamBaseUrl: "https://api.openai.com/v1",
        credentialName: "openai",
        contextWindowSize: 128000,
        maxOutputTokens: 4096,
        inputCostPerToken: 0.0000025,
        outputCostPerToken: 0.00001,
        requestOptions: null,
      },
    ]),
  },
  modelProxySetting: {
    findUnique: vi.fn().mockResolvedValue({
      value: { model_group_alias: { agent: "gpt-4o" } },
    }),
    upsert: vi.fn(),
    deleteMany: vi.fn(),
  },
  modelProxyCredential: {
    findMany: vi.fn().mockResolvedValue([]),
  },
};

vi.mock("@lite-llm/model-proxy-repository", () => ({
  getModelProxyPrisma: () => mockPrisma,
}));

vi.mock("@lite-llm/agents-manager", () => ({
  createRepositoryClient: vi.fn(() => ({
    read: vi.fn().mockResolvedValue({ agents: { agent: {} }, categories: {} }),
    write: vi.fn(),
  })),
}));

describe("registry delegate", () => {
  it("loads models from model_proxy_models without LiteLLM DB", async () => {
    const { getRegistryModelsImpl } = await import("./registry-methods");
    const models = await getRegistryModelsImpl();
    expect(models).toHaveLength(1);
    expect(models[0]?.modelName).toBe("gpt-4o");
  });

  it("reads routing config from model_proxy_settings", async () => {
    const { getAgentRoutingConfigImpl } = await import("./routing-methods");
    const config = await getAgentRoutingConfigImpl();
    expect(config?.model_group_alias).toBeDefined();
  });
});
