import type { AnalyticsDataSource } from "@lite-llm/analytics";
import type { OrchestrationServices } from "@lite-llm/server-core/types";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

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

function createMockDataSource(): AnalyticsDataSource {
  return {
    getMetricsSummary: vi.fn().mockResolvedValue({
      total_spend: 0,
      total_tokens: 0,
      active_models: 0,
      error_count: 0,
    }),
    getDailySpendTrend: vi.fn().mockResolvedValue([]),
    getSpendByModel: vi.fn().mockResolvedValue([]),
    getSpendByUser: vi.fn().mockResolvedValue([]),
    getSpendByKey: vi.fn().mockResolvedValue([]),
    getSpendLogsCount: vi.fn().mockResolvedValue(0),
    getSpendLogs: vi.fn().mockResolvedValue({
      logs: [],
      pagination: { total: 0, page: 1, page_size: 50, total_pages: 0 },
    }),
    getTokenDistribution: vi.fn().mockResolvedValue([]),
    getPerformanceMetrics: vi.fn().mockResolvedValue({
      total_requests: 0,
      avg_duration_ms: 0,
      success_rate: 0,
    }),
    getHourlyUsagePatterns: vi.fn().mockResolvedValue([]),
    getApiKeyStats: vi.fn().mockResolvedValue([]),
    getCostEfficiency: vi.fn().mockResolvedValue([]),
    getModelDistribution: vi.fn().mockResolvedValue([]),
    getDailyTokenTrend: vi.fn().mockResolvedValue([]),
    getModelStatistics: vi.fn().mockResolvedValue([]),
    getModels: vi.fn().mockResolvedValue([]),
    getModelDetails: vi.fn().mockResolvedValue([]),
    getErrorLogs: vi.fn().mockResolvedValue([]),
    createModel: vi.fn().mockResolvedValue(undefined),
    updateModel: vi.fn().mockResolvedValue(undefined),
    deleteModel: vi.fn().mockResolvedValue(undefined),
    mergeModels: vi.fn().mockResolvedValue(undefined),
    deleteModelLogs: vi.fn().mockResolvedValue(undefined),
    getAgentRoutingConfig: vi.fn().mockResolvedValue({
      model_group_alias: {
        "sisyphus/gpt-5.5": "openai/gpt-4.1",
      },
    }),
    updateAgentRoutingConfig: vi.fn().mockResolvedValue(undefined),
    getAgentConfigs: vi.fn().mockResolvedValue({}),
    getCategoryConfigs: vi.fn().mockResolvedValue({}),
    updateAgentConfig: vi.fn().mockResolvedValue(undefined),
    updateCategoryConfig: vi.fn().mockResolvedValue(undefined),
    deleteAgentConfig: vi.fn().mockResolvedValue(undefined),
    deleteCategoryConfig: vi.fn().mockResolvedValue(undefined),
  };
}

function createMockOrchestration(
  ds: AnalyticsDataSource,
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
  const mockDs = createMockDataSource();
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
