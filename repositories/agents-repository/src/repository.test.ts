import { describe, expect, it } from "vitest";
import { createRepository, resolvePluginsPath } from "./repository";
import type { IStorage } from "./storage";

class MemoryStorage implements IStorage {
  constructor(private readonly files: Record<string, string>) {}

  async read(filePath: string): Promise<string> {
    const value = this.files[filePath];
    if (value === undefined) {
      throw new Error(`File not found: ${filePath}`);
    }
    return value;
  }

  async write(filePath: string, content: string): Promise<void> {
    this.files[filePath] = content;
  }

  async exists(filePath: string): Promise<boolean> {
    return this.files[filePath] !== undefined;
  }
}

describe("AgentsRepository", () => {
  it("reads .jsonc with comments and trailing comma", async () => {
    const filePath = "/tmp/agents.jsonc";
    const storage = new MemoryStorage({
      [filePath]: `{
        // comment
        "version": 2,
        "categories": {},
        "agents": {},
      }`,
    });
    const repository = createRepository({
      filePath,
      storage,
      validateOnRead: false,
    });

    const config = await repository.read();
    expect(config.version).toBe(2);
    expect(config.plugins).toEqual({});
  });

  it("throws a parse error with file path context", async () => {
    const filePath = "/tmp/broken.jsonc";
    const storage = new MemoryStorage({
      [filePath]: `{"version": 2,`,
    });
    const repository = createRepository({
      filePath,
      storage,
      validateOnRead: false,
    });

    await expect(repository.read()).rejects.toThrow(
      "Failed to parse /tmp/broken.jsonc",
    );
  });

  it("reads agent configuration with all fields", async () => {
    const filePath = "/tmp/agents.json";
    const pluginsFilePath = "/tmp/plugins.json";
    const storage = new MemoryStorage({
      [filePath]: JSON.stringify({
        version: 2,
        categories: {},
        agents: {
          loom: {
            displayName: "Loom",
            icon: "L",
            description: "Agent",
            modelIdStrategy: "model-name" as const,
            limits: { context: 200000, output: 32768 },
            model: "gpt-4",
            fallbackModels: [] as string[],
            config: {},
          },
        },
      }),
      [pluginsFilePath]: JSON.stringify({
        version: 2,
        plugins: {
          opencode: {
            enabled: true,
            outputFile: "output.json",
            config: {},
            routing: { agents: {}, categories: {} },
          },
        },
      }),
    });
    const repository = createRepository({
      filePath,
      pluginsFilePath,
      storage,
    });

    const config = await repository.read();
    expect(config.agents?.loom?.displayName).toBe("Loom");
    expect(config.agents?.loom?.model).toBe("gpt-4");
    expect(config.plugins?.opencode?.enabled).toBe(true);
  });

  it("validates and writes configuration to both files", async () => {
    const filePath = "/tmp/agents.json";
    const pluginsFilePath = "/tmp/plugins.json";
    const storage = new MemoryStorage({});
    const repository = createRepository({
      filePath,
      pluginsFilePath,
      storage,
    });

    const config = {
      version: 2,
      categories: {},
      agents: {
        loom: {
          displayName: "Loom",
          icon: "L",
          description: "Agent",
          limits: { context: 200000, output: 32768 },
          model: "gpt-4",
          fallbackModels: [],
          config: {},
        },
      },
      plugins: {},
    };

    await repository.write(config);

    const agentsStored = await storage.read(filePath);
    const agentsParsed = JSON.parse(agentsStored);
    expect(agentsParsed.agents.loom.model).toBe("gpt-4");
    expect(agentsParsed.plugins).toBeUndefined();

    const pluginsStored = await storage.read(pluginsFilePath);
    const pluginsParsed = JSON.parse(pluginsStored);
    expect(pluginsParsed.plugins).toEqual({});
  });

  it("resolves plugins path from agents file path", () => {
    expect(resolvePluginsPath("/config/agents.jsonc")).toBe(
      "/config/plugins.jsonc",
    );
    expect(resolvePluginsPath("/config/agents.json")).toBe(
      "/config/plugins.json",
    );
  });

  it("returns empty plugins when plugins file does not exist", async () => {
    const filePath = "/tmp/agents.json";
    const storage = new MemoryStorage({
      [filePath]: JSON.stringify({
        version: 1,
        categories: {},
        agents: {},
      }),
    });
    const repository = createRepository({
      filePath,
      storage,
      validateOnRead: false,
    });

    const config = await repository.read();
    expect(config.plugins).toEqual({});
  });

  it("reports exists only when both files exist", async () => {
    const filePath = "/tmp/agents.json";
    const pluginsFilePath = "/tmp/plugins.json";
    const storage = new MemoryStorage({
      [filePath]: "{}",
    });
    const repository = createRepository({
      filePath,
      pluginsFilePath,
      storage,
    });

    expect(await repository.exists()).toBe(false);

    await storage.write(pluginsFilePath, "{}");
    expect(await repository.exists()).toBe(true);
  });
});
