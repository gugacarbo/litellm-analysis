import { describe, it, expect } from "vitest";
import { RoutingService } from "../routing.service";
import type { IAgentsRepository } from "@lite-llm/agents-repository/repository";
import type { DbConfig } from "@lite-llm/agents-repository/schema";

function createMockRepository(data: Record<string, unknown> = {}): IAgentsRepository {
  const defaults: Record<string, unknown> = {
    version: 2,
    models: {},
    systemAgents: {},
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
});
