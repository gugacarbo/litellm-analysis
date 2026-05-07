import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestServer } from "./helpers/create-test-server";

const mockDeleteAgent = vi.hoisted(() => vi.fn());
const mockDeleteCategory = vi.hoisted(() => vi.fn());

vi.mock("@lite-llm/agents-manager", async () => {
  const actual = await vi.importActual("@lite-llm/agents-manager");
  return {
    ...actual,
    createAgentsManager: () => ({
      repository: {
        read: vi.fn().mockResolvedValue({ agents: {}, categories: {} }),
      },
      services: {
        agents: { delete: mockDeleteAgent },
        categories: { delete: mockDeleteCategory },
      },
    }),
  };
});

describe("DELETE /agent-config/:key", () => {
  beforeEach(() => {
    mockDeleteAgent.mockReset();
    mockDeleteAgent.mockResolvedValue(undefined);
    mockDeleteCategory.mockReset();
    mockDeleteCategory.mockResolvedValue(undefined);
  });

  it("deletes agent and calls syncGeneratedArtifacts", async () => {
    const { app, orchestration } = await createTestServer({
      getAgentRoutingConfig: vi.fn().mockResolvedValue({
        model_group_alias: {
          "sisyphus/gpt-5.5": "openai/gpt-4.1",
        },
      }),
    });

    const res = await request(app).delete("/agent-config/sisyphus");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
    expect(mockDeleteAgent).toHaveBeenCalledWith("sisyphus");
    expect(orchestration.syncGeneratedArtifacts).toHaveBeenCalledTimes(1);
  });

  it("deletes category and calls syncGeneratedArtifacts", async () => {
    const { app, orchestration } = await createTestServer({
      getAgentRoutingConfig: vi.fn().mockResolvedValue({
        model_group_alias: {
          "sisyphus/gpt-5.5": "openai/gpt-4.1",
        },
      }),
    });

    const res = await request(app).delete(
      "/agent-config/visual-engineering?type=category",
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
    expect(mockDeleteCategory).toHaveBeenCalledWith("visual-engineering");
    expect(orchestration.syncGeneratedArtifacts).toHaveBeenCalledTimes(1);
  });

  it("rejects deleting global-fallback", async () => {
    const { app, orchestration } = await createTestServer({
      getAgentRoutingConfig: vi.fn().mockResolvedValue({
        model_group_alias: {
          "sisyphus/gpt-5.5": "openai/gpt-4.1",
        },
      }),
    });

    const res = await request(app).delete("/agent-config/global-fallback");

    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      error: "Global fallback cannot be deleted",
    });
    expect(mockDeleteAgent).not.toHaveBeenCalled();
    expect(orchestration.syncGeneratedArtifacts).not.toHaveBeenCalled();
  });
});
