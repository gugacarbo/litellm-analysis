import type {
  AnalyticsCapabilities,
  AnalyticsDataSource,
} from "@lite-llm/analytics";
import { DATABASE_CAPABILITIES } from "@lite-llm/analytics";
import type { RouteOptions } from "@lite-llm/server-core/types";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetRouterSettings = vi.fn();
const mockUpdateRouterSettings = vi.fn();

function createMockDataSource(
  capabilities: AnalyticsCapabilities,
): AnalyticsDataSource {
  return {
    capabilities,
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
    getAgentRoutingConfig: vi
      .fn()
      .mockImplementation(() => mockGetRouterSettings()),
    updateAgentRoutingConfig: vi
      .fn()
      .mockImplementation((config: Record<string, string>) =>
        mockUpdateRouterSettings(config),
      ),
    getAgentConfigs: vi.fn().mockResolvedValue({}),
    getCategoryConfigs: vi.fn().mockResolvedValue({}),
    updateAgentConfig: vi.fn().mockResolvedValue(undefined),
    updateCategoryConfig: vi.fn().mockResolvedValue(undefined),
    deleteAgentConfig: vi.fn().mockResolvedValue(undefined),
    deleteCategoryConfig: vi.fn().mockResolvedValue(undefined),
  };
}

async function getServer(capabilities: AnalyticsCapabilities) {
  const { createApiServer } = await import("../api-server");
  const mockDs = createMockDataSource(capabilities);
  const orchestration = {
    dataSource: mockDs,
    buildAliasMap: vi.fn().mockResolvedValue({}),
    regenerateAllAliases: vi.fn().mockResolvedValue(undefined),
    syncGeneratedArtifacts: vi.fn().mockResolvedValue(undefined),
    syncModelsDirectlyToDatabase: vi.fn().mockResolvedValue(undefined),
  };
  const opts: RouteOptions = { dataSource: mockDs, orchestration };
  return createApiServer(opts);
}

describe("GET /agent-routing", () => {
  beforeEach(() => {
    mockGetRouterSettings.mockClear();
    mockUpdateRouterSettings.mockClear();
  });

  it("returns 200 with current config when exists", async () => {
    const mockConfig = {
      model_group_alias: {
        "litellm/glm-5": "glm-5",
        "kimi-k2.5": "kimi-k2-5",
      },
    };
    mockGetRouterSettings.mockResolvedValue(mockConfig);

    const app = await getServer(DATABASE_CAPABILITIES);
    const res = await request(app).get("/agent-routing");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(mockConfig);
  });

  it("returns 200 with empty object when not exists", async () => {
    mockGetRouterSettings.mockResolvedValue(null);

    const app = await getServer(DATABASE_CAPABILITIES);
    const res = await request(app).get("/agent-routing");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({});
  });

  it("returns 500 when database error occurs", async () => {
    mockGetRouterSettings.mockRejectedValue(
      new Error("Database connection failed"),
    );

    const app = await getServer(DATABASE_CAPABILITIES);
    const res = await request(app).get("/agent-routing");

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "Error: Database connection failed" });
  });
});

describe("PUT /agent-routing", () => {
  beforeEach(() => {
    mockGetRouterSettings.mockClear();
    mockUpdateRouterSettings.mockClear();
  });

  it("returns 200 with success true when saved successfully", async () => {
    const mockConfig = {
      "litellm/glm-5": "glm-5",
      "kimi-k2.5": "kimi-k2-5",
    };
    mockGetRouterSettings.mockResolvedValue({});
    mockUpdateRouterSettings.mockResolvedValue(undefined);

    const app = await getServer(DATABASE_CAPABILITIES);
    const res = await request(app)
      .put("/agent-routing")
      .send({ model_group_alias: mockConfig });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
    expect(mockUpdateRouterSettings).toHaveBeenCalledWith(mockConfig);
  });

  it("returns 400 when model_group_alias is not an object", async () => {
    const app = await getServer(DATABASE_CAPABILITIES);
    const res = await request(app)
      .put("/agent-routing")
      .send({ model_group_alias: "invalid-string" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "model_group_alias object is required" });
    expect(mockUpdateRouterSettings).not.toHaveBeenCalled();
  });

  it("returns 400 when model_group_alias is an array", async () => {
    const app = await getServer(DATABASE_CAPABILITIES);
    const res = await request(app)
      .put("/agent-routing")
      .send({ model_group_alias: ["model1", "model2"] });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "model_group_alias object is required" });
    expect(mockUpdateRouterSettings).not.toHaveBeenCalled();
  });

  it("returns 400 when model_group_alias is null", async () => {
    const app = await getServer(DATABASE_CAPABILITIES);
    const res = await request(app)
      .put("/agent-routing")
      .send({ model_group_alias: null });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "model_group_alias object is required" });
    expect(mockUpdateRouterSettings).not.toHaveBeenCalled();
  });

  it("returns 400 when model_group_alias is missing", async () => {
    const app = await getServer(DATABASE_CAPABILITIES);
    const res = await request(app)
      .put("/agent-routing")
      .send({ otherField: "value" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "model_group_alias object is required" });
    expect(mockUpdateRouterSettings).not.toHaveBeenCalled();
  });

  it("returns 400 when model_group_alias has non-string values", async () => {
    const app = await getServer(DATABASE_CAPABILITIES);
    const res = await request(app)
      .put("/agent-routing")
      .send({ model_group_alias: { "litellm/glm-5": 123 } });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: "model_group_alias values must be strings",
    });
    expect(mockUpdateRouterSettings).not.toHaveBeenCalled();
  });

  it("returns 500 when database error occurs", async () => {
    mockUpdateRouterSettings.mockRejectedValue(new Error("Update failed"));

    const app = await getServer(DATABASE_CAPABILITIES);
    const res = await request(app)
      .put("/agent-routing")
      .send({ model_group_alias: { "litellm/glm-5": "glm-5" } });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "Error: Update failed" });
  });
});
