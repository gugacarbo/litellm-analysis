import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestServer } from "./helpers/create-test-server";

const mockUpsertAgent = vi.hoisted(() => vi.fn());
const mockUpsertCategory = vi.hoisted(() => vi.fn());
const mockBuildAliasMap = vi.hoisted(() => vi.fn());
const mockRegenerateAllAliases = vi.hoisted(() => vi.fn());

vi.mock("@lite-llm/agents-manager", async () => {
  const actual = await vi.importActual("@lite-llm/agents-manager");
  return {
    ...actual,
    createAgentsManager: () => ({
      repository: {
        read: vi.fn().mockResolvedValue({ agents: {}, categories: {} }),
      },
      services: {
        agents: { upsert: mockUpsertAgent },
        categories: { upsert: mockUpsertCategory },
      },
    }),
  };
});

vi.mock("@lite-llm/server-core/orchestration", () => ({
  buildAliasMapFromDb: mockBuildAliasMap,
  regenerateAllAliases: mockRegenerateAllAliases,
  syncGeneratedArtifacts: vi.fn().mockResolvedValue(undefined),
  syncModelsDirectlyToDatabase: vi.fn().mockResolvedValue(undefined),
  createOrchestrationServices: vi.fn().mockReturnValue({
    buildAliasMap: vi.fn().mockResolvedValue({}),
    regenerateAllAliases: vi.fn().mockResolvedValue(undefined),
    syncGeneratedArtifacts: vi.fn().mockResolvedValue(undefined),
    syncModelsDirectlyToDatabase: vi.fn().mockResolvedValue(undefined),
    dataSource: {},
  }),
  applyRequiredLiteLLMParams: vi.fn(),
  buildLiteLLMParams: vi.fn(),
  getLiteLLMCredentialName: vi.fn(),
  isRecord: vi.fn(),
  parseDays: vi.fn(),
  toCostPerToken: vi.fn(),
}));

describe("PUT /agent-config/:key alias resolution", () => {
  beforeEach(() => {
    mockUpsertAgent.mockReset();
    mockUpsertAgent.mockResolvedValue(undefined);
    mockUpsertCategory.mockReset();
    mockUpsertCategory.mockResolvedValue(undefined);
    mockBuildAliasMap.mockReset();
    mockBuildAliasMap.mockResolvedValue({
      "sisyphus/gpt-5.5": "openai/gpt-4.1",
      "sisyphus/gpt-5.4": "anthropic/claude-3-7-sonnet",
      "oracle/gpt-5.4": "openai/o3-mini",
    });
    mockRegenerateAllAliases.mockReset();
    mockRegenerateAllAliases.mockResolvedValue(undefined);
  });

  it("resolves logical gpt aliases to real LiteLLM models before persisting", async () => {
    const { app, dataSource } = await createTestServer({
      getAgentRoutingConfig: vi.fn().mockResolvedValue({
        model_group_alias: {
          "sisyphus/gpt-5.5": "openai/gpt-4.1",
          "sisyphus/gpt-5.4": "anthropic/claude-3-7-sonnet",
          "oracle/gpt-5.4": "openai/o3-mini",
        },
      }),
    });

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

    expect(mockUpsertAgent).toHaveBeenCalledWith(
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
