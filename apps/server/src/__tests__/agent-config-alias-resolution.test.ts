import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockDataSource } from "./helpers/create-mock-data-source";

const mockUpdateAgentInConfig = vi.fn();
const mockReadConfigFile = vi.fn();
const mockReadDb = vi.fn();
const mockWriteProvidersFile = vi.fn();
const mockWriteVscodeModelsFile = vi.fn();
const mockSyncToLiteLLM = vi.fn();

vi.mock("@lite-llm/agents-manager", () => ({
  updateAgentInConfig: (...args: unknown[]) => mockUpdateAgentInConfig(...args),
  updateCategoryInConfig: vi.fn(),
  readConfigFile: (...args: unknown[]) => mockReadConfigFile(...args),
  readDb: (...args: unknown[]) => mockReadDb(...args),
  writeDb: vi.fn(),
  writeProvidersFile: (...args: unknown[]) => mockWriteProvidersFile(...args),
  writeVscodeModelsFile: (...args: unknown[]) =>
    mockWriteVscodeModelsFile(...args),
  syncToLiteLLM: (...args: unknown[]) => mockSyncToLiteLLM(...args),
  writeFullConfig: vi.fn(),
  syncOutputConfigFile: vi.fn().mockResolvedValue(undefined),
  deleteAgentFromConfig: vi.fn(),
  deleteCategoryFromConfig: vi.fn(),
}));

async function getServer() {
  const { createApiServer } = await import("../runtime/api-server");
  const mockDs = createMockDataSource({
    getAgentRoutingConfig: vi.fn().mockResolvedValue({
      model_group_alias: {
        "sisyphus/gpt-5.5": "openai/gpt-4.1",
        "sisyphus/gpt-5.4": "anthropic/claude-3-7-sonnet",
        "oracle/gpt-5.4": "openai/o3-mini",
      },
    }),
  });
  const orchestration = {
    dataSource: mockDs,
    buildAliasMap: vi.fn().mockResolvedValue({}),
    regenerateAllAliases: vi.fn().mockResolvedValue(undefined),
    syncGeneratedArtifacts: vi.fn().mockResolvedValue(undefined),
    syncModelsDirectlyToDatabase: vi.fn().mockResolvedValue(undefined),
  };
  return {
    app: createApiServer({ dataSource: mockDs, orchestration }),
    dataSource: mockDs,
  };
}

describe("PUT /agent-config/:key alias resolution", () => {
  beforeEach(() => {
    mockUpdateAgentInConfig.mockReset();
    mockReadConfigFile.mockReset();
    mockReadDb.mockReset();
    mockWriteProvidersFile.mockReset();
    mockWriteVscodeModelsFile.mockReset();
    mockSyncToLiteLLM.mockReset();

    mockReadDb.mockResolvedValue({
      agents: {
        sisyphus: {
          model: "openai/gpt-4.1",
          fallbackModels: ["anthropic/claude-3-7-sonnet"],
        },
        oracle: {
          model: "openai/o3-mini",
          fallbackModels: [],
        },
      },
      categories: {},
      globalFallbackModel: "gpt-5.1",
    });
    mockReadConfigFile.mockResolvedValue({ agents: {}, categories: {} });
    mockWriteProvidersFile.mockResolvedValue(undefined);
    mockWriteVscodeModelsFile.mockResolvedValue(undefined);
    mockSyncToLiteLLM.mockResolvedValue(0);
  });

  it("resolves logical gpt aliases to real LiteLLM models before persisting aliases", async () => {
    const { app, dataSource } = await getServer();

    const res = await request(app)
      .put("/agent-config/sisyphus")
      .send({
        type: "agent",
        syncAliases: true,
        config: {
          model: "sisyphus/gpt-5.5",
          fallback_models: ["sisyphus/gpt-5.4"],
          description: "updated",
        },
      });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });

    // With the new design, db.json stores real model names (not aliases)
    // so the resolved real model names are saved
    expect(mockUpdateAgentInConfig).toHaveBeenCalledWith(
      "sisyphus",
      expect.objectContaining({
        model: "openai/gpt-4.1",
        fallback_models: ["anthropic/claude-3-7-sonnet"],
      }),
    );

    expect(dataSource.updateAgentRoutingConfig).toHaveBeenCalledWith({
      "oracle/gpt-5.5": "openai/o3-mini",
      "oracle/gpt-5.4": "gpt-5.1",
      "oracle/gpt-5.3": "gpt-5.1",
      "oracle/gpt-5.2": "gpt-5.1",
      "oracle/gpt-5.1": "gpt-5.1",
      "sisyphus/gpt-5.1": "gpt-5.1",
      "sisyphus/gpt-5.2": "gpt-5.1",
      "sisyphus/gpt-5.3": "gpt-5.1",
      "sisyphus/gpt-5.4": "anthropic/claude-3-7-sonnet",
      "sisyphus/gpt-5.5": "openai/gpt-4.1",
    });
  });
});
