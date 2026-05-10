import type { IAgentsRepository } from "@lite-llm/agents-repository/repository";
import type { SystemAgent } from "@lite-llm/agents-repository/schema";
import { describe, expect, it } from "vitest";
import { AgentCatalogService } from "../agent-catalog.service";

function createMockRepo(
  overrides: Record<string, unknown> = {},
): IAgentsRepository {
  const store: Record<string, unknown> = {
    version: 2,
    litellm: { baseUrl: "", apiKey: "" },
    models: {},
    agents: {},
    categories: {},
  };
  const data = { ...store, ...overrides };
  return {
    read: async () => data,
    write: async (config) => Object.assign(data, config),
    readSync: () => data,
    validate: () => true,
    exists: async () => true,
    getPath: () => "/tmp/test.json",
  } as unknown as IAgentsRepository;
}

function makeSystemAgent(overrides: Partial<SystemAgent> = {}): SystemAgent {
  return {
    id: "builder",
    displayName: "Builder",
    icon: "🔧",
    description: "Build stuff",
    versions: [],
    model: "gpt-4",
    fallbackModels: [],
    enabledPlugins: [],
    config: {},
    ...overrides,
  };
}

describe("AgentCatalogService", () => {
  describe("getAll", () => {
    it("retorna todos os systemAgents", async () => {
      const systemAgents: Record<string, SystemAgent> = {
        builder: makeSystemAgent({ id: "builder", displayName: "Builder" }),
        reviewer: makeSystemAgent({ id: "reviewer", displayName: "Reviewer" }),
      };
      const repo = createMockRepo({ systemAgents });
      const service = new AgentCatalogService({ repository: repo });
      const result = await service.getAll();
      expect(result).toEqual(systemAgents);
    });

    it("retorna objeto vazio quando systemAgents é undefined", async () => {
      const repo = createMockRepo({});
      const service = new AgentCatalogService({ repository: repo });
      expect(await service.getAll()).toEqual({});
    });
  });

  describe("get", () => {
    it("retorna systemAgent específico", async () => {
      const repo = createMockRepo({
        systemAgents: { builder: makeSystemAgent() },
      });
      const service = new AgentCatalogService({ repository: repo });
      expect((await service.get("builder")).displayName).toBe("Builder");
    });

    it("retorna undefined para systemAgent inexistente", async () => {
      const repo = createMockRepo({ systemAgents: {} });
      const service = new AgentCatalogService({ repository: repo });
      expect(await service.get("nonexistent")).toBeUndefined();
    });

    it("retorna undefined quando systemAgents é undefined", async () => {
      const repo = createMockRepo({});
      const service = new AgentCatalogService({ repository: repo });
      expect(await service.get("builder")).toBeUndefined();
    });
  });

  describe("create", () => {
    it("adiciona systemAgent ao repositório", async () => {
      const repo = createMockRepo({ systemAgents: {} });
      const service = new AgentCatalogService({ repository: repo });
      const entry = makeSystemAgent({ id: "builder" });
      await service.create("builder", entry);
      expect((await service.get("builder")).displayName).toBe("Builder");
    });

    it("inicializa systemAgents como {} se undefined", async () => {
      const repo = createMockRepo({});
      const service = new AgentCatalogService({ repository: repo });
      const entry = makeSystemAgent({ id: "builder" });
      await service.create("builder", entry);
      expect((await service.get("builder")).displayName).toBe("Builder");
    });

    it("lança erro se systemAgent já existe", async () => {
      const repo = createMockRepo({
        systemAgents: { builder: makeSystemAgent() },
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
        systemAgents: {
          builder: makeSystemAgent({
            model: "gpt-4",
            description: "Build stuff",
          }),
        },
      });
      const service = new AgentCatalogService({ repository: repo });
      await service.update("builder", { model: "gpt-3.5" });
      const result = await service.get("builder");
      expect(result.model).toBe("gpt-3.5");
      expect(result.description).toBe("Build stuff");
    });

    it("lança erro se systemAgent não existe", async () => {
      const repo = createMockRepo({ systemAgents: {} });
      const service = new AgentCatalogService({ repository: repo });
      await expect(
        service.update("nonexistent", { model: "gpt-4" }),
      ).rejects.toThrow("not found");
    });
  });

  describe("upsert", () => {
    it("cria systemAgent se não existe", async () => {
      const repo = createMockRepo({ systemAgents: {} });
      const service = new AgentCatalogService({ repository: repo });
      await service.upsert("builder", makeSystemAgent());
      expect((await service.get("builder")).displayName).toBe("Builder");
    });

    it("atualiza systemAgent se já existe", async () => {
      const repo = createMockRepo({
        systemAgents: { builder: makeSystemAgent() },
      });
      const service = new AgentCatalogService({ repository: repo });
      await service.upsert("builder", makeSystemAgent({ model: "claude-3.5" }));
      expect((await service.get("builder")).model).toBe("claude-3.5");
    });

    it("inicializa systemAgents como {} se undefined", async () => {
      const repo = createMockRepo({});
      const service = new AgentCatalogService({ repository: repo });
      await service.upsert("builder", makeSystemAgent());
      expect((await service.get("builder")).displayName).toBe("Builder");
    });
  });

  describe("delete", () => {
    it("remove systemAgent existente", async () => {
      const repo = createMockRepo({
        systemAgents: { builder: makeSystemAgent() },
      });
      const service = new AgentCatalogService({ repository: repo });
      await service.delete("builder");
      expect(await service.get("builder")).toBeUndefined();
    });

    it("lança erro se systemAgent não existe", async () => {
      const repo = createMockRepo({ systemAgents: {} });
      const service = new AgentCatalogService({ repository: repo });
      await expect(service.delete("nonexistent")).rejects.toThrow("not found");
    });
  });
});
