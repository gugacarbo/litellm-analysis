import type { IAgentsRepository } from "@lite-llm/agents-repository/repository";
import type { PluginRouting } from "@lite-llm/agents-repository/schemas";
import { describe, expect, it } from "vitest";
import { RoutingService } from "../routing.service";

function createMockRepo(
  initial: Record<string, unknown> = {},
): IAgentsRepository {
  const store: Record<string, unknown> = {
    version: 2,
    provider: { litellm: { name: "", ownedBy: "", baseUrl: "", apiKey: "" } },
    models: {},
    agents: {},
    categories: {},
    plugins: {},
    ...initial,
  };
  return {
    read: async () => store,
    write: async (config: Record<string, unknown>) =>
      Object.assign(store, config),
    readSync: () => store,
    validate: ((_config: unknown): _config is never =>
      true) as IAgentsRepository["validate"],
    exists: async () => true,
    getPath: () => "/tmp/test.json",
  } as unknown as IAgentsRepository;
}

describe("RoutingService", () => {
  describe("getPluginsForAgent", () => {
    it("retorna plugins onde o agent tem routing", async () => {
      const repo = createMockRepo({
        plugins: {
          opencode: {
            enabled: true,
            outputFile: "opencode.json",
            routing: { agents: { loom: "loom" } },
          },
          vscode: {
            enabled: false,
            outputFile: "vscode.json",
            routing: { agents: {} },
          },
        },
      });
      const service = new RoutingService({ repository: repo });
      const result = await service.getPluginsForAgent("loom");
      expect(result).toEqual(["opencode"]);
    });

    it("retorna vazio se nenhum plugin tem routing pro agent", async () => {
      const repo = createMockRepo({
        plugins: {
          opencode: {
            enabled: true,
            outputFile: "opencode.json",
            routing: { agents: {} },
          },
        },
      });
      const service = new RoutingService({ repository: repo });
      const result = await service.getPluginsForAgent("nonexistent");
      expect(result).toEqual([]);
    });
  });

  describe("setPluginsForAgent", () => {
    it("adiciona mapeamento nos plugins especificados", async () => {
      const repo = createMockRepo({});
      const service = new RoutingService({ repository: repo });
      await service.setPluginsForAgent("loom", ["opencode"]);
      const result = await service.getPluginsForAgent("loom");
      expect(result).toEqual(["opencode"]);
    });

    it("remove mapeamento de plugins não listados", async () => {
      const repo = createMockRepo({
        plugins: {
          opencode: {
            enabled: true,
            outputFile: "opencode.json",
            routing: { agents: { loom: "loom" } },
          },
          vscode: {
            enabled: true,
            outputFile: "vscode.json",
            routing: { agents: { loom: "loom" } },
          },
        },
      });
      const service = new RoutingService({ repository: repo });
      await service.setPluginsForAgent("loom", ["opencode"]);
      const result = await service.getPluginsForAgent("loom");
      expect(result).toEqual(["opencode"]);
    });
  });

  describe("toggleAgentPlugin", () => {
    it("ativa routing de agent em plugin", async () => {
      const repo = createMockRepo({});
      const service = new RoutingService({ repository: repo });
      const result = await service.toggleAgentPlugin("opencode", "loom");
      expect(result).toBe(true);
      expect(await service.isPluginEnabled("opencode", "loom")).toBe(true);
    });

    it("desativa routing de agent em plugin", async () => {
      const repo = createMockRepo({
        plugins: {
          opencode: {
            enabled: true,
            outputFile: "opencode.json",
            routing: { agents: { loom: "loom" } },
          },
        },
      });
      const service = new RoutingService({ repository: repo });
      const result = await service.toggleAgentPlugin("opencode", "loom");
      expect(result).toBe(false);
      expect(await service.isPluginEnabled("opencode", "loom")).toBe(false);
    });
  });

  describe("getPluginConfig / savePluginConfig", () => {
    it("retorna undefined para plugin inexistente", async () => {
      const repo = createMockRepo({});
      const service = new RoutingService({ repository: repo });
      const result = await service.getPluginConfig("nonexistent");
      expect(result).toBeUndefined();
    });

    it("salva e recupera config de plugin", async () => {
      const repo = createMockRepo({});
      const service = new RoutingService({ repository: repo });
      const config: PluginRouting = {
        enabled: true,
        outputFile: "test.json",
        routing: { agents: {}, categories: {} },
      };
      await service.savePluginConfig("test-plugin", config);
      const result = await service.getPluginConfig("test-plugin");
      expect(result).toEqual(config);
    });
  });

  describe("getAgentMappings / saveAgentMappings", () => {
    it("retorna mappings vazios para plugin sem routing", async () => {
      const repo = createMockRepo({});
      const service = new RoutingService({ repository: repo });
      const result = await service.getAgentMappings("nonexistent");
      expect(result).toEqual({});
    });

    it("salva e recupera agent mappings", async () => {
      const repo = createMockRepo({});
      const service = new RoutingService({ repository: repo });
      await service.saveAgentMappings("opencode", { loom: "loom" });
      const result = await service.getAgentMappings("opencode");
      expect(result).toEqual({ loom: "loom" });
    });
  });

  describe("getCategoryMappings / saveCategoryMappings / toggleCategoryMapping", () => {
    it("salva e recupera category mappings", async () => {
      const repo = createMockRepo({});
      const service = new RoutingService({ repository: repo });
      await service.saveCategoryMappings("opencode", { dev: true });
      const result = await service.getCategoryMappings("opencode");
      expect(result).toEqual({ dev: true });
    });

    it("toggle ativa e desativa categoria", async () => {
      const repo = createMockRepo({});
      const service = new RoutingService({ repository: repo });
      expect(await service.toggleCategoryMapping("opencode", "dev")).toBe(true);
      expect(await service.toggleCategoryMapping("opencode", "dev")).toBe(
        false,
      );
    });
  });
});
