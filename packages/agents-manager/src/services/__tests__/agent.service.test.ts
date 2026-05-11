import type { IAgentsRepository } from "@lite-llm/agents-repository/repository";
import type { SystemAgent } from "@lite-llm/agents-repository/schema";
import { describe, expect, it } from "vitest";
import { AgentService } from "../agent.service";

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
    write: async (config: Record<string, unknown>) => Object.assign(data, config),
    readSync: () => data,
    validate: ((_config: unknown): _config is never => true) as IAgentsRepository["validate"],
    exists: async () => true,
    getPath: () => "/tmp/test.json",
  } as unknown as IAgentsRepository;
}

function makeSystemAgent(overrides: Partial<SystemAgent> = {}): SystemAgent {
  return {
    displayName: "Test Agent",
    icon: "🤖",
    description: "Test description",
    versions: [],
    model: "gpt-4",
    fallbackModels: [],
    enabledPlugins: [],
    config: {},
    ...overrides,
  };
}

describe("AgentService", () => {
  describe("getAll", () => {
    it("retorna todos os agentes", async () => {
      const agents: Record<string, SystemAgent> = {
        coder: makeSystemAgent({ model: "gpt-4" }),
        reviewer: makeSystemAgent({ model: "gpt-3.5" }),
      };
      const repo = createMockRepo({ agents });
      const service = new AgentService({ repository: repo });
      const result = await service.getAll();
      expect(result).toEqual(agents);
    });

    it("retorna objeto vazio quando não há agentes", async () => {
      const repo = createMockRepo({ agents: {} });
      const service = new AgentService({ repository: repo });
      expect(await service.getAll()).toEqual({});
    });
  });

  describe("get", () => {
    it("retorna agente específico", async () => {
      const repo = createMockRepo({
        agents: { coder: makeSystemAgent({ model: "gpt-4" }) },
      });
      const service = new AgentService({ repository: repo });
      const result = await service.get("coder");
      expect(result?.model).toBe("gpt-4");
    });

    it("retorna undefined para agente inexistente", async () => {
      const repo = createMockRepo({ agents: {} });
      const service = new AgentService({ repository: repo });
      expect(await service.get("nonexistent")).toBeUndefined();
    });
  });

  describe("create", () => {
    it("adiciona agente ao repositório", async () => {
      const repo = createMockRepo({ agents: {} });
      const service = new AgentService({ repository: repo });
      await service.create("coder", makeSystemAgent({ model: "gpt-4" }));
      const result = await service.get("coder");
      expect(result?.model).toBe("gpt-4");
    });

    it("lança erro se agente já existe", async () => {
      const repo = createMockRepo({
        agents: { coder: makeSystemAgent({ model: "gpt-4" }) },
      });
      const service = new AgentService({ repository: repo });
      await expect(
        service.create("coder", makeSystemAgent({ model: "gpt-4" })),
      ).rejects.toThrow("already exists");
    });
  });

  describe("update", () => {
    it("atualiza agente existente com merge parcial", async () => {
      const repo = createMockRepo({
        agents: { coder: makeSystemAgent({ model: "gpt-4", description: "Code agent" }) },
      });
      const service = new AgentService({ repository: repo });
      await service.update("coder", { model: "gpt-3.5" });
      const result = await service.get("coder");
      expect(result?.model).toBe("gpt-3.5");
      expect(result?.description).toBe("Code agent");
    });

    it("lança erro se agente não existe", async () => {
      const repo = createMockRepo({ agents: {} });
      const service = new AgentService({ repository: repo });
      await expect(
        service.update("nonexistent", makeSystemAgent({ model: "gpt-4" })),
      ).rejects.toThrow("not found");
    });
  });

  describe("upsert", () => {
    it("cria agente se não existe", async () => {
      const repo = createMockRepo({ agents: {} });
      const service = new AgentService({ repository: repo });
      await service.upsert("coder", makeSystemAgent({ model: "gpt-4" }));
      const result = await service.get("coder");
      expect(result?.model).toBe("gpt-4");
    });

    it("atualiza agente se já existe", async () => {
      const repo = createMockRepo({
        agents: { coder: makeSystemAgent({ model: "gpt-4" }) },
      });
      const service = new AgentService({ repository: repo });
      await service.upsert("coder", makeSystemAgent({ model: "gpt-3.5" }));
      const result = await service.get("coder");
      expect(result?.model).toBe("gpt-3.5");
    });
  });

  describe("delete", () => {
    it("remove agente existente", async () => {
      const repo = createMockRepo({
        agents: { coder: makeSystemAgent({ model: "gpt-4" }) },
      });
      const service = new AgentService({ repository: repo });
      await service.delete("coder");
      expect(await service.get("coder")).toBeUndefined();
    });

    it("lança erro se agente não existe", async () => {
      const repo = createMockRepo({ agents: {} });
      const service = new AgentService({ repository: repo });
      await expect(service.delete("nonexistent")).rejects.toThrow("not found");
    });
  });
});
