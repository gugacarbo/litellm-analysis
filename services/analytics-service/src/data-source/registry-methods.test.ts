import { describe, expect, it, vi } from "vitest";

const mockModelRows = [
  {
    id: "model-1",
    modelId: "gpt-4o",
    enabled: true,
    displayName: null,
    family: null,
    canonicalSlug: null,
    description: null,
    contextLength: 128000,
    maxCompletionTokens: 4096,
    knowledgeCutoff: null,
    expirationDate: null,
    architecture: null,
    reasoning: null,
    supportedParameters: null,
    defaultParameters: null,
    perRequestLimits: null,
    pricing: null,
    requestOptions: null,
    providerId: null,
    reasoningApiId: null,
    createdAt: new Date("2026-07-02T00:00:00.000Z"),
    updatedAt: new Date("2026-07-02T00:00:00.000Z"),
  },
];

vi.mock("@lite-llm/database/client", () => ({
  db: {
    select: () => ({
      from: () => ({
        orderBy: () => Promise.resolve(mockModelRows),
        where: () => ({
          limit: () =>
            Promise.resolve([
              {
                id: "setting-1",
                key: "router_settings",
                value: { model_group_alias: { agent: "gpt-4o" } },
              },
            ]),
        }),
      }),
    }),
  },
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
