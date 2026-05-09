import { describe, expect, it } from "vitest";
import { createRepository } from "./repository.js";
import type { IStorage } from "./storage.js";

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
        "litellm": { "apiKey": "sk-test" },
        "models": {},
        "categories": {},
        "agents": {},
        "routing": {},
      }`,
    });
    const repository = createRepository({
      filePath,
      storage,
      validateOnRead: false,
    });

    const config = await repository.read();
    expect(config.version).toBe(2);
    expect(config.litellm.apiKey).toBe("sk-test");
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

  it("infers system agent id from object key", async () => {
    const filePath = "/tmp/agents.json";
    const storage = new MemoryStorage({
      [filePath]: JSON.stringify({
        version: 2,
        litellm: { baseUrl: "http://localhost:4000", apiKey: "sk-test" },
        models: {},
        agents: {},
        categories: {},
        systemAgents: {
          loom: {
            displayName: "Loom",
            icon: "L",
            description: "Agent",
            versions: [
              {
                id: "v1",
                displayName: "V1",
                modelIdStrategy: "model-name",
                limits: { context: 1, output: 1 },
              },
            ],
            model: "m1",
            fallbackModels: [],
            enabledPlugins: [],
            config: {},
          },
        },
      }),
    });
    const repository = createRepository({ filePath, storage });

    const config = await repository.read();
    expect(config.systemAgents?.loom?.id).toBe("loom");
  });

  it("throws when explicit system agent id conflicts with object key", async () => {
    const filePath = "/tmp/agents.json";
    const storage = new MemoryStorage({
      [filePath]: JSON.stringify({
        version: 2,
        litellm: { baseUrl: "http://localhost:4000", apiKey: "sk-test" },
        models: {},
        agents: {},
        categories: {},
        systemAgents: {
          loom: {
            id: "other",
            displayName: "Loom",
            icon: "L",
            description: "Agent",
            versions: [
              {
                id: "v1",
                displayName: "V1",
                modelIdStrategy: "model-name",
                limits: { context: 1, output: 1 },
              },
            ],
            model: "m1",
            fallbackModels: [],
            enabledPlugins: [],
            config: {},
          },
        },
      }),
    });
    const repository = createRepository({ filePath, storage });

    await expect(repository.read()).rejects.toThrow(
      'Invalid systemAgents.loom.id: expected "loom", received "other"',
    );
  });
});
