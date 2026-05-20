import type { IAgentsRepository } from "@lite-llm/agents-repository/repository";
import type { SystemAgent } from "@lite-llm/agents-repository/schemas";
import { describe, expect, it } from "vitest";
import { AgentCatalogService } from "../agent-catalog.service";

function createMockRepo(
  overrides: Record<string, unknown> = {},
): IAgentsRepository {
  const store: Record<string, unknown> = {
    version: 2,
    provider: { litellm: { name: "", ownedBy: "", baseUrl: "", apiKey: "" } },
    models: {},
    agents: {},
    categories: {},
  };
  const data = { ...store, ...overrides };
  return {
    read: async () => data,
    write: async (config: Record<string, unknown>) =>
      Object.assign(data, config),
    readSync: () => data,
    validate: ((_config: unknown): _config is never =>
      true) as IAgentsRepository["validate"],
    exists: async () => true,
    getPath: () => "/tmp/test.json",
  } as unknown as IAgentsRepository;
}

function makeSystemAgent(overrides: Partial<SystemAgent> = {}): SystemAgent {
  return {
    displayName: "Builder",
    icon: "🔧",
    description: "Build stuff",
    limits: { context: 200000, output: 32768 },
    model: "gpt-4",
    config: {},
    ...overrides,
  };
}

describe("AgentCatalogService", () => {
  describe("getAll", () => {
    it("retorna todos os agents", async () => {
      const agents: Record<string, SystemAgent> = {
        builder: makeSystemAgent({ displayName: "Builder" }),
        reviewer: makeSystemAgent({ displayName: "Reviewer" }),
      };
      const repo = createMockRepo({ agents });
      const service = new AgentCatalogService({ repository: repo });
      const result = await service.getAll();
      expect(result).toEqual(agents);
    });

    it("retorna objeto vazio quando agents é undefined", async () => {
      const repo = createMockRepo({});
      const service = new AgentCatalogService({ repository: repo });
      expect(await service.getAll()).toEqual({});
    });
  });

  describe("get", () => {
    it("retorna systemAgent específico", async () => {
      const repo = createMockRepo({
        agents: { builder: makeSystemAgent() },
      });
      const service = new AgentCatalogService({ repository: repo });
      const result = await service.get("builder");
      expect(result?.displayName).toBe("Builder");
    });

    it("retorna undefined para systemAgent inexistente", async () => {
      const repo = createMockRepo({ agents: {} });
      const service = new AgentCatalogService({ repository: repo });
      expect(await service.get("nonexistent")).toBeUndefined();
    });

    it("retorna undefined quando agents é undefined", async () => {
      const repo = createMockRepo({});
      const service = new AgentCatalogService({ repository: repo });
      expect(await service.get("builder")).toBeUndefined();
    });
  });

  describe("create", () => {
    it("adiciona systemAgent ao repositório", async () => {
      const repo = createMockRepo({ agents: {} });
      const service = new AgentCatalogService({ repository: repo });
      const entry = makeSystemAgent({ displayName: "Builder" });
      await service.create("builder", entry);
      const result = await service.get("builder");
      expect(result?.displayName).toBe("Builder");
    });

    it("inicializa agents como {} se undefined", async () => {
      const repo = createMockRepo({});
      const service = new AgentCatalogService({ repository: repo });
      const entry = makeSystemAgent({ displayName: "Builder" });
      await service.create("builder", entry);
      const result = await service.get("builder");
      expect(result?.displayName).toBe("Builder");
    });

    it("lança erro se systemAgent já existe", async () => {
      const repo = createMockRepo({
        agents: { builder: makeSystemAgent() },
      });
      const service = new AgentCatalogService({ repository: repo });
      await expect(
        service.create("builder", makeSystemAgent()),
      ).rejects.toThrow("already exists");
    });
  });

  describe("update", () => {
    it("atualiza systemAgent existente com merge parcial", async () => {
      const repo = createMockRepo({
        agents: {
          builder: makeSystemAgent({
            model: "gpt-4",
            description: "Build stuff",
          }),
        },
      });
      const service = new AgentCatalogService({ repository: repo });
      await service.update("builder", { model: "gpt-3.5" });
      const result = await service.get("builder");
      expect(result?.model).toBe("gpt-3.5");
      expect(result?.description).toBe("Build stuff");
    });

    it("lança erro se systemAgent não existe", async () => {
      const repo = createMockRepo({ agents: {} });
      const service = new AgentCatalogService({ repository: repo });
      await expect(
        service.update("nonexistent", { model: "gpt-4" }),
      ).rejects.toThrow("not found");
    });
  });

  describe("upsert", () => {
    it("cria systemAgent se não existe", async () => {
      const repo = createMockRepo({ agents: {} });
      const service = new AgentCatalogService({ repository: repo });
      await service.upsert("builder", makeSystemAgent());
      const result = await service.get("builder");
      expect(result?.displayName).toBe("Builder");
    });

    it("atualiza systemAgent se já existe", async () => {
      const repo = createMockRepo({
        agents: { builder: makeSystemAgent() },
      });
      const service = new AgentCatalogService({ repository: repo });
      await service.upsert("builder", makeSystemAgent({ model: "claude-3.5" }));
      const result = await service.get("builder");
      expect(result?.model).toBe("claude-3.5");
    });

    it("inicializa agents como {} se undefined", async () => {
      const repo = createMockRepo({});
      const service = new AgentCatalogService({ repository: repo });
      await service.upsert("builder", makeSystemAgent());
      const result = await service.get("builder");
      expect(result?.displayName).toBe("Builder");
    });
  });

  describe("delete", () => {
    it("remove systemAgent existente", async () => {
      const repo = createMockRepo({
        agents: { builder: makeSystemAgent() },
      });
      const service = new AgentCatalogService({ repository: repo });
      await service.delete("builder");
      expect(await service.get("builder")).toBeUndefined();
    });

    it("lança erro se systemAgent não existe", async () => {
      const repo = createMockRepo({ agents: {} });
      const service = new AgentCatalogService({ repository: repo });
      await expect(service.delete("nonexistent")).rejects.toThrow("not found");
    });
  });
});
