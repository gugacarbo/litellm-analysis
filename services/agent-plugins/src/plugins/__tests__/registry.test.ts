import { randomUUID } from "node:crypto";
import type { IAgentsRepository } from "@lite-llm/agents-repository/repository";
import type { IModelsRepository } from "@lite-llm/models-repository/repository";
import { describe, expect, it, vi } from "vitest";
import type { IPlugin } from "../plugin";
import { PluginRegistry } from "../registry";

function createUniqueOutputDir(): string {
  return `/tmp/test-registry-output-${randomUUID()}`;
}

function createMockRepository(): IAgentsRepository {
  return {
    read: vi.fn().mockResolvedValue({
      version: 2,
      agents: {},
      categories: {},
    }),
    readSync: vi.fn(),
    write: vi.fn(),
    validate: ((_config: unknown): _config is never =>
      true) as IAgentsRepository["validate"],
    exists: vi.fn().mockResolvedValue(true),
    getPath: vi.fn().mockReturnValue("/tmp/test.json"),
    getPluginsPath: vi.fn().mockReturnValue("/mock/plugins.jsonc"),
  };
}

// Create mock plugin - uses type assertion for flexible ID testing
function createMockPlugin(
  overrides: {
    id?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    buildOutput?: (...args: any[]) => any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    validate?: (output: any) => boolean;
  } = {},
): IPlugin {
  return {
    id: overrides.id ?? "test-plugin",
    name: "Test Plugin",
    version: 1,
    getInternalAgents: () => [
      { id: "agent1", displayName: "Agent 1", description: "Test agent" },
    ],
    getConfigSchema: () => [
      { key: "apiKey", type: "string", label: "API Key", required: true },
    ],
    buildOutput: overrides.buildOutput ?? (() => ({ output: true })),
    getOutputFile: () => "test.json",
    validate:
      overrides.validate ??
      ((output: unknown) => typeof output === "object" && output !== null),
  } as unknown as IPlugin;
}

function createMockModelsRepository(
  overrides: Partial<IModelsRepository> = {},
): IModelsRepository {
  return {
    read: vi.fn().mockResolvedValue({
      $schema: "./models.schema.json",
      version: 1,
      provider: {
        litellm: {
          name: "LiteLLM",
          ownedBy: "team",
          baseUrl: "http://localhost:4000/v1",
          apiKey: "sk-test",
        },
      },
      models: {
        "gpt-5": {
          displayName: "GPT-5",
          limits: { length: 200000, maxOutput: 32768 },
        },
      },
    }),
    readSync: vi.fn(),
    write: vi.fn(),
    validate: ((_config: unknown): _config is never =>
      true) as IModelsRepository["validate"],
    exists: vi.fn().mockResolvedValue(true),
    getPath: vi.fn().mockReturnValue("/tmp/models.jsonc"),
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

  describe("getJsonSchema", () => {
    it("should return JSON schema for a known plugin", () => {
      const registry = new PluginRegistry({
        repository: createMockRepository(),
        outputDir: "/tmp",
        allPlugins: [],
      });
      const schema = registry.getJsonSchema("opencode");
      expect(schema).not.toBeNull();
      expect(schema).toHaveProperty("type", "object");
      expect(schema).toHaveProperty("properties");
    });

    it("should return null for an unknown plugin", () => {
      const registry = new PluginRegistry({
        repository: createMockRepository(),
        outputDir: "/tmp",
        allPlugins: [],
      });
      const schema = registry.getJsonSchema("nonexistent");
      expect(schema).toBeNull();
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
        categories: {},
        agents: {
          builder: {
            displayName: "Builder",
            icon: "🔧",
            description: "Build stuff",
            model: "gpt-4",
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
        outputDir: createUniqueOutputDir(),
        allPlugins: [],
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const buildOutputSpy = vi.fn().mockReturnValue({ result: true }) as any;
      const plugin = createMockPlugin({ buildOutput: buildOutputSpy });
      registry.register(plugin);

      await registry.exportOne("test-plugin");

      expect(buildOutputSpy).toHaveBeenCalledOnce();
      const callArgs = buildOutputSpy.mock.calls[0];
      const agents = callArgs[0];
      const routing = callArgs[1];
      expect(agents).toHaveLength(1);
      expect(agents[0].displayName).toBe("Builder");
      expect(routing.enabled).toBe(true);
      expect(routing.outputFile).toBe("test.json");
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

    it("carrega allModels e litellmConfig do models repository", async () => {
      const mockRepo = createMockRepository();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const buildOutputSpy = vi.fn().mockReturnValue({ result: true }) as any;
      const plugin = createMockPlugin({ buildOutput: buildOutputSpy });

      const registry = new PluginRegistry({
        repository: mockRepo,
        modelsRepository: createMockModelsRepository(),
        outputDir: createUniqueOutputDir(),
        allPlugins: [plugin],
      });

      await registry.exportOne("test-plugin");

      const ctx = buildOutputSpy.mock.calls[0][2] as {
        allModels: Record<string, unknown>;
        litellmConfig: { baseUrl: string; apiKey: string };
      };

      expect(Object.keys(ctx.allModels)).toEqual(["gpt-5"]);
      expect(ctx.litellmConfig.baseUrl).toBe("http://localhost:4000/v1");
      expect(ctx.litellmConfig.apiKey).toBe("sk-test");
    });
  });
});
