import { describe, expect, it, vi } from "vitest";

const mockModelRows = [
  {
    id: "model-1",
    modelName: "gpt-4o",
    enabled: true,
    upstreamModel: "gpt-4o",
    upstreamBaseUrl: "https://api.openai.com/v1",
    providerName: "openai",
    contextWindowSize: 128000,
    maxOutputTokens: 4096,
    inputCostPerToken: 0.0000025,
    outputCostPerToken: 0.00001,
    requestOptions: null,
    displayName: null,
    family: null,
    ownedBy: null,
    apiMode: null,
    vision: null,
    metadata: null,
    createdAt: new Date("2026-07-02T00:00:00.000Z"),
    updatedAt: new Date("2026-07-02T00:00:00.000Z"),
  },
];

vi.mock("@lite-llm/database/client", () => ({
  db: {
    select: () => ({
      from: (table: unknown) => {
        if (
          typeof table === "object" &&
          table !== null &&
          "modelName" in table
        ) {
          return {
            orderBy: vi.fn().mockResolvedValue(mockModelRows),
          };
        }

        return {
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([
              {
                id: "setting-1",
                key: "router_settings",
                value: { model_group_alias: { agent: "gpt-4o" } },
              },
            ]),
          }),
        };
      },
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
