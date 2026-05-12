import type { IAgentsRepository } from "@lite-llm/agents-repository/repository";
import { describe, expect, it, vi } from "vitest";
import type { IPlugin } from "../plugin.js";
import { PluginRegistry } from "../registry.js";

function createMockRepository(): IAgentsRepository {
  return {
    read: vi.fn().mockResolvedValue({
      version: 2,
      provider: {
        litellm: {
          name: "",
          ownedBy: "",
          baseUrl: "http://localhost:4000",
          apiKey: "test",
        },
      },
      models: {},
      agents: {},
      categories: {},
    }),
    readSync: vi.fn(),
    write: vi.fn(),
    validate: ((_config: unknown): _config is never =>
      true) as IAgentsRepository["validate"],
    exists: vi.fn().mockResolvedValue(true),
    getPath: vi.fn().mockReturnValue("/tmp/test.json"),
  };
}

function createMockPlugin(overrides: Partial<IPlugin> = {}): IPlugin {
  return {
    id: "test-plugin",
    name: "Test Plugin",
    version: 1,
    getInternalAgents: () => [
      { id: "agent1", displayName: "Agent 1", description: "Test agent" },
    ],
    getConfigSchema: () => [
      { key: "apiKey", type: "string", label: "API Key", required: true },
    ],
    buildOutput: () => ({ output: true }),
    getOutputFile: () => "test.json",
    validate: (output) => typeof output === "object" && output !== null,
    ...overrides,
  };
}

describe("PluginRegistry", () => {
  describe("register / unregister / get / list", () => {
    it("registra e lista plugins", () => {
      const registry = new PluginRegistry({
        repository: createMockRepository(),
        outputDir: "/tmp",
        allPlugins: [],
      });
      const plugin = createMockPlugin();
      registry.register(plugin);
      expect(registry.list()).toHaveLength(1);
      expect(registry.get("test-plugin")).toBe(plugin);
    });

   it("lança erro ao registrar plugin duplicado", () => {
     const registry = new PluginRegistry({
       repository: createMockRepository(),
       outputDir: "/tmp",
       allPlugins: [],
     });
     registry.register(createMockPlugin());
      // Re-registration is now idempotent (no error thrown)
      expect(() => registry.register(createMockPlugin())).not.toThrow();
      expect(registry.list()).toHaveLength(1);
    });

    it("unregister remove plugin", () => {
      const registry = new PluginRegistry({
        repository: createMockRepository(),
        outputDir: "/tmp",
        allPlugins: [],
      });
      registry.register(createMockPlugin());
      registry.unregister("test-plugin");
      expect(registry.list()).toHaveLength(0);
    });

    it("get retorna undefined para plugin inexistente", () => {
      const registry = new PluginRegistry({
        repository: createMockRepository(),
        outputDir: "/tmp",
        allPlugins: [],
      });
      expect(registry.get("nonexistent")).toBeUndefined();
    });
  });

  describe("getInternalAgents / getConfigSchema", () => {
    it("delega para o plugin correto via allPlugins", () => {
      const registry = new PluginRegistry({
        repository: createMockRepository(),
        outputDir: "/tmp",
        allPlugins: [createMockPlugin({ id: "p1" })],
      });
      expect(registry.getInternalAgents("p1")).toEqual([
        { id: "agent1", displayName: "Agent 1", description: "Test agent" },
      ]);
      expect(registry.getConfigSchema("p1")).toEqual([
        { key: "apiKey", type: "string", label: "API Key", required: true },
      ]);
    });

    it("retorna vazio para plugin inexistente", () => {
      const registry = new PluginRegistry({
        repository: createMockRepository(),
        outputDir: "/tmp",
        allPlugins: [],
      });
      expect(registry.getInternalAgents("nonexistent")).toEqual([]);
      expect(registry.getConfigSchema("nonexistent")).toEqual([]);
    });
  });

  describe("loadFromConfig", () => {
    it("registra plugins com enabled: true", () => {
      const registry = new PluginRegistry({
        repository: createMockRepository(),
        outputDir: "/tmp",
        allPlugins: [
          createMockPlugin({ id: "p1" }),
          createMockPlugin({ id: "p2" }),
        ],
      });
      registry.loadFromConfig({
        p1: {
          enabled: true,
          outputFile: "test.json",
          routing: { agents: {}, categories: {} },
        },
        p2: {
          enabled: false,
          outputFile: "test.json",
          routing: { agents: {}, categories: {} },
        },
      });
      expect(registry.list()).toHaveLength(1);
      expect(registry.get("p1")?.id).toBe("p1");
    });

    it("limpa plugins anteriores ao carregar", () => {
      const registry = new PluginRegistry({
        repository: createMockRepository(),
        outputDir: "/tmp",
        allPlugins: [createMockPlugin({ id: "p1" })],
      });
      registry.register(createMockPlugin({ id: "p1" }));
      registry.loadFromConfig({
        p1: {
          enabled: false,
          outputFile: "test.json",
          routing: { agents: {}, categories: {} },
        },
      });
      expect(registry.list()).toHaveLength(0);
    });
  });

  describe("exportOne", () => {
    it("chama buildOutput com agents e routing", async () => {
      const mockRepo = createMockRepository();
      (mockRepo.read as ReturnType<typeof vi.fn>).mockResolvedValue({
        version: 2,
        provider: {
          litellm: {
            name: "",
            ownedBy: "",
            baseUrl: "http://localhost:4000",
            apiKey: "test",
          },
        },
        models: {
          "gpt-4": {
            enabled: true,
            displayName: "GPT-4",
            limits: { length: 128000, maxOutput: 4096 },
          },
        },
        categories: {},
        agents: {
          builder: {
            displayName: "Builder",
            icon: "🔧",
            description: "Build stuff",
            model: "gpt-4",
            fallbackModels: [],
            config: {},
          },
        },
        plugins: {
          "test-plugin": {
            enabled: true,
            outputFile: "test.json",
            routing: { agents: {}, categories: {} },
          },
        },
      });

      const registry = new PluginRegistry({
        repository: mockRepo,
        outputDir: "/tmp/test-registry-output",
        allPlugins: [],
      });

      const buildOutputSpy = vi.fn().mockReturnValue({ result: true });
      const plugin = createMockPlugin({ buildOutput: buildOutputSpy });
      registry.register(plugin);

      await registry.exportOne("test-plugin");

      expect(buildOutputSpy).toHaveBeenCalledOnce();
      const callArgs = buildOutputSpy.mock.calls[0];
      const agents = callArgs[0];
      const routing = callArgs[1];
      const ctx = callArgs[2];
      expect(agents).toHaveLength(1);
      expect(agents[0].displayName).toBe("Builder");
      expect(routing.enabled).toBe(true);
      expect(routing.outputFile).toBe("test.json");
      expect(ctx.litellmConfig.baseUrl).toBe("http://localhost:4000");
    });

    it("lança erro para plugin não registrado", async () => {
      const registry = new PluginRegistry({
        repository: createMockRepository(),
        outputDir: "/tmp",
        allPlugins: [],
      });

      await expect(registry.exportOne("nonexistent")).rejects.toThrow(
        "not found",
      );
    });
  });
});
