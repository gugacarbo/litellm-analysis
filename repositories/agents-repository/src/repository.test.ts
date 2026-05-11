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
        "provider": { "litellm": { "name": "LiteLLM", "apiKey": "sk-test" } },
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
    expect(config.provider.litellm.apiKey).toBe("sk-test");
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
    const storage = new MemoryStorage({
      [filePath]: JSON.stringify({
        version: 2,
        provider: { litellm: { name: "LiteLLM", baseUrl: "http://localhost:4000", apiKey: "sk-test" } },
        models: {},
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
    });
    const repository = createRepository({ filePath, storage });

    const config = await repository.read();
    expect(config.agents?.loom?.displayName).toBe("Loom");
    expect(config.agents?.loom?.model).toBe("gpt-4");
  });

  it("validates and writes configuration", async () => {
    const filePath = "/tmp/agents.json";
    const storage = new MemoryStorage({});
    const repository = createRepository({ filePath, storage });

    const config = {
      version: 2,
      provider: { litellm: { name: "LiteLLM", baseUrl: "http://localhost:4000", apiKey: "sk-test" } },
      models: {} as Record<string, { displayName: string; contextLength: number; maxOutput: number }>,
      categories: {} as Record<string, { model: string; modelIdStrategy: "model-name" | "prefix-version"; limits: { context: number; output: number } }>,
      agents: {
        loom: {
          displayName: "Loom",
          icon: "L",
          description: "Agent",
          modelIdStrategy: "model-name" as const,
          limits: { context: 200000, output: 32768 },
          model: "gpt-4",
          fallbackModels: [] as string[],
          config: {} as Record<string, unknown>,
        },
      },
    };

    await repository.write(config);

    const stored = await storage.read(filePath);
    const parsed = JSON.parse(stored);
    expect(parsed.agents.loom.model).toBe("gpt-4");
  });
});
