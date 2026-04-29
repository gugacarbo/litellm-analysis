import type { DbConfig } from "@lite-llm/agents-manager";
import type { RouteOptions } from "@lite-llm/server-core/types";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { createMockDataSource } from "./helpers/create-mock-data-source";

const readDbMock = vi.fn();

vi.mock("@lite-llm/agents-manager", () => ({
  readDb: () => readDbMock(),
}));

async function getServer() {
  const { createApiServer } = await import("../runtime/api-server");
  const mockDs = createMockDataSource();
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

function buildDbFixture(): DbConfig {
  return {
    version: 1,
    litellm: { baseUrl: "http://localhost:4000/v1", apiKey: "sk-test" },
    models: {},
    agents: {
      sisyphus: {
        model: "glm-5",
        description: "Main orchestrator",
      },
      "custom-agent": {
        model: "glm-5",
      },
    },
    categories: {
      writing: {
        model: "glm-5",
        description: "Writing tasks",
      },
      "custom-category": {
        model: "glm-5",
      },
    },
  };
}

describe("GET /agent-definitions", () => {
  it("returns normalized definitions from db entries", async () => {
    readDbMock.mockResolvedValue(buildDbFixture());

    const app = await getServer();
    const res = await request(app).get("/agent-definitions");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      agents: [
        {
          key: "sisyphus",
          name: "Sisyphus",
          description: "Main orchestrator",
          icon: "🔄",
        },
        {
          key: "custom-agent",
          name: "Custom Agent",
          description: "Configuration metadata for Custom Agent.",
          icon: "🤖",
        },
      ],
      categories: [
        {
          key: "writing",
          name: "Writing",
          description: "Writing tasks",
        },
        {
          key: "custom-category",
          name: "Custom Category",
          description: "Configuration metadata for Custom Category.",
        },
      ],
    });
  });

  it("returns 500 when db read fails", async () => {
    readDbMock.mockRejectedValue(new Error("db read failed"));

    const app = await getServer();
    const res = await request(app).get("/agent-definitions");

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "Error: db read failed" });
  });
});
