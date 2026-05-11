import type { IAgentsRepository } from "@lite-llm/agents-repository/repository";
import type { DbConfig } from "@lite-llm/agents-repository/schema";
import { describe, expect, it } from "vitest";
import { RoutingService } from "../routing.service";

function createMockRepository(
  data: Record<string, unknown> = {},
): IAgentsRepository {
  const defaults: Record<string, unknown> = {
    version: 2,
    models: {},
    agents: {},
    routing: { version: 1, plugins: {} },
  };
  let store = { ...defaults, ...data } as DbConfig;

  return {
    read: async () => store,
    write: async (config: DbConfig) => {
      store = config;
    },
  } as IAgentsRepository;
}

describe("RoutingService", () => {
  describe("syncAliases", () => {
    it("retorna false quando syncAliases está ausente", async () => {
      const repo = createMockRepository({
        routing: { version: 1, plugins: {} },
      });
      const service = new RoutingService({ repository: repo });
      const result = await service.getSyncAliases();
      expect(result).toBe(false);
    });

    it("retorna o valor armazenado quando presente", async () => {
      const repo = createMockRepository({
        routing: { version: 1, plugins: {}, syncAliases: true },
      });
      const service = new RoutingService({ repository: repo });
      const result = await service.getSyncAliases();
      expect(result).toBe(true);
    });

    it("persiste o valor com setSyncAliases", async () => {
      const repo = createMockRepository();
      const service = new RoutingService({ repository: repo });
      await service.setSyncAliases(true);
      const result = await service.getSyncAliases();
      expect(result).toBe(true);
      await service.setSyncAliases(false);
      const result2 = await service.getSyncAliases();
      expect(result2).toBe(false);
    });
  });

  describe("pluginConfig", () => {
    it("retorna {} quando plugin não existe", async () => {
      const repo = createMockRepository();
      const service = new RoutingService({ repository: repo });
      const config = await service.getPluginConfig("nonexistent");
      expect(config).toEqual({});
    });

    it("persiste config do plugin", async () => {
      const repo = createMockRepository();
      const service = new RoutingService({ repository: repo });
      await service.savePluginConfig("opencode", { apiKey: "test" });
      const config = await service.getPluginConfig("opencode");
      expect(config).toEqual({ apiKey: "test" });
    });
  });

  describe("agentMappings", () => {
    it("retorna {} quando plugin não existe", async () => {
      const repo = createMockRepository();
      const service = new RoutingService({ repository: repo });
      expect(await service.getAgentMappings("nonexistent")).toEqual({});
    });

    it("persiste agent mappings", async () => {
      const repo = createMockRepository();
      const service = new RoutingService({ repository: repo });
      await service.saveAgentMappings("opencode", { builder: "coder" });
      expect(await service.getAgentMappings("opencode")).toEqual({
        builder: "coder",
      });
    });
  });

  describe("categoryMappings", () => {
    it("toggle alterna entre true e false", async () => {
      const repo = createMockRepository();
      const service = new RoutingService({ repository: repo });
      const result1 = await service.toggleCategoryMapping("opencode", "dev");
      expect(result1).toBe(true);
      const result2 = await service.toggleCategoryMapping("opencode", "dev");
      expect(result2).toBe(false);
    });
  });
});
