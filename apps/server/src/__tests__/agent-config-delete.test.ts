import type { OrchestrationServices } from "@lite-llm/server-core/types";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockDataSource } from "./helpers/create-mock-data-source";

// Mocks must be hoisted
const mockDeleteAgentFromConfig = vi.hoisted(() => vi.fn());
const mockDeleteCategoryFromConfig = vi.hoisted(() => vi.fn());
const mockSyncOutputConfigFile = vi.hoisted(() =>
  vi.fn().mockResolvedValue(undefined),
);
const mockReadConfigFile = vi.hoisted(() => vi.fn());
const mockWriteProvidersFile = vi.hoisted(() => vi.fn());
const mockWriteVscodeModelsFile = vi.hoisted(() => vi.fn());
const mockSyncToLiteLLM = vi.hoisted(() => vi.fn());

// Mock the entire module to intercept dynamic imports
vi.mock("@lite-llm/agents-manager", async () => {
  const actual = await vi.importActual("@lite-llm/agents-manager");
  return {
    ...actual,
    deleteAgentFromConfig: mockDeleteAgentFromConfig,
    deleteCategoryFromConfig: mockDeleteCategoryFromConfig,
    readConfigFile: mockReadConfigFile,
    writeProvidersFile: mockWriteProvidersFile,
    writeVscodeModelsFile: mockWriteVscodeModelsFile,
    syncOutputConfigFile: mockSyncOutputConfigFile,
    syncToLiteLLM: mockSyncToLiteLLM,
  };
});

function createMockOrchestration(
  ds: ReturnType<typeof createMockDataSource>,
): OrchestrationServices {
  return {
    dataSource: ds,
    buildAliasMap: vi.fn().mockResolvedValue({}),
    regenerateAllAliases: vi.fn().mockResolvedValue(undefined),
    syncGeneratedArtifacts: vi.fn().mockResolvedValue(undefined),
    syncModelsDirectlyToDatabase: vi.fn().mockResolvedValue(undefined),
  };
}

async function getServer() {
  const { createApiServer } = await import("../api-server");
  const mockDs = createMockDataSource({
    getAgentRoutingConfig: vi.fn().mockResolvedValue({
      model_group_alias: {
        "sisyphus/gpt-5.5": "openai/gpt-4.1",
      },
    }),
  });
  const mockOrch = createMockOrchestration(mockDs);
  return {
    app: createApiServer({ dataSource: mockDs, orchestration: mockOrch }),
    dataSource: mockDs,
    orchestration: mockOrch,
  };
}

describe("DELETE /agent-config/:key", () => {
  beforeEach(() => {
    mockDeleteAgentFromConfig.mockReset();
    mockDeleteAgentFromConfig.mockResolvedValue(undefined);
    mockDeleteCategoryFromConfig.mockReset();
    mockDeleteCategoryFromConfig.mockResolvedValue(undefined);
    mockReadConfigFile.mockReset();
    mockReadConfigFile.mockResolvedValue({ agents: {}, categories: {} });
    mockWriteProvidersFile.mockReset();
    mockWriteProvidersFile.mockResolvedValue(undefined);
    mockWriteVscodeModelsFile.mockReset();
    mockWriteVscodeModelsFile.mockResolvedValue(undefined);
    mockSyncOutputConfigFile.mockReset();
    mockSyncOutputConfigFile.mockResolvedValue(undefined);
    mockSyncToLiteLLM.mockReset();
    mockSyncToLiteLLM.mockResolvedValue(0);
  });

  it("deletes agent and calls syncGeneratedArtifacts", async () => {
    const { app, orchestration } = await getServer();

    const res = await request(app).delete("/agent-config/sisyphus");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
    expect(mockDeleteAgentFromConfig).toHaveBeenCalledWith("sisyphus");
    // syncGeneratedArtifacts should be called AFTER deletion
    expect(orchestration.syncGeneratedArtifacts).toHaveBeenCalledTimes(1);
  });

  it("deletes category and calls syncGeneratedArtifacts", async () => {
    const { app, orchestration } = await getServer();

    const res = await request(app).delete(
      "/agent-config/visual-engineering?type=category",
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
    expect(mockDeleteCategoryFromConfig).toHaveBeenCalledWith(
      "visual-engineering",
    );
    expect(orchestration.syncGeneratedArtifacts).toHaveBeenCalledTimes(1);
  });

  it("rejects deleting global-fallback", async () => {
    const { app } = await getServer();

    const res = await request(app).delete("/agent-config/global-fallback");

    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      error: "Global fallback cannot be deleted",
    });
    expect(mockDeleteAgentFromConfig).not.toHaveBeenCalled();
    expect(mockSyncOutputConfigFile).not.toHaveBeenCalled();
  });
});
