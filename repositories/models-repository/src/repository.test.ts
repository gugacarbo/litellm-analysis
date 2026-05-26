import { describe, expect, it } from "vitest";
import { createRepository } from "./repository";
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

const validProvider = {
  name: "LiteLLM",
  ownedBy: "atplus",
  baseUrl: "http://localhost:4000",
  apiKey: "sk-test",
  defaultCredential: "",
};

const validModel = {
  enabled: true,
  displayName: "Test Model",
  family: "test",
  limits: { length: 200000, maxOutput: 32768 },
  cost: { input: 1.0, output: 3.2 },
};

describe("ModelsRepository", () => {
  describe("JSONC parsing", () => {
    it("reads .jsonc with comments and trailing commas", async () => {
      const filePath = "/tmp/models.jsonc";
      const storage = new MemoryStorage({
        [filePath]: `{
          // comment
          "version": 1,
          "provider": {
            "litellm": {
              "name": "LiteLLM",
              "ownedBy": "atplus",
              "baseUrl": "http://0.0.0.0:4000",
              "apiKey": "sk-test"
            }
          },
          "models": {
            "glm-5": {
              // inline comment
              "displayName": "GLM 5",
              "limits": {
                "length": 200000,
                "maxOutput": 128000,
              },
            },
          },
        }`,
      });
      const repository = createRepository({
        filePath,
        storage,
        validateOnRead: false,
      });

      const config = await repository.read();
      expect(config.version).toBe(1);
      expect(config.provider.litellm.name).toBe("LiteLLM");
      expect(config.models["glm-5"].displayName).toBe("GLM 5");
      expect(config.models["glm-5"].limits.maxOutput).toBe(128000);
    });

    it("throws a parse error with file path context", async () => {
      const filePath = "/tmp/broken.jsonc";
      const storage = new MemoryStorage({
        [filePath]: `{"version": 1,`,
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
  });

  describe("schema validation", () => {
    it("rejects malformed provider (missing required fields)", async () => {
      const filePath = "/tmp/bad-provider.json";
      const storage = new MemoryStorage({
        [filePath]: JSON.stringify({
          version: 1,
          provider: {
            litellm: {
              name: "LiteLLM",
            },
          },
          models: {},
        }),
      });
      const repository = createRepository({ filePath, storage });

      await expect(repository.read()).rejects.toThrow(
        "Invalid config at /tmp/bad-provider.json",
      );
    });

    it("rejects malformed model (missing displayName)", async () => {
      const filePath = "/tmp/bad-model.json";
      const storage = new MemoryStorage({
        [filePath]: JSON.stringify({
          version: 1,
          provider: {},
          models: {
            "test-model": {
              enabled: true,
              limits: { length: 200000, maxOutput: 32768 },
            },
          },
        }),
      });
      const repository = createRepository({ filePath, storage });

      await expect(repository.read()).rejects.toThrow(
        "Invalid config at /tmp/bad-model.json",
      );
    });

    it("rejects malformed model (missing limits)", async () => {
      const filePath = "/tmp/bad-model2.json";
      const storage = new MemoryStorage({
        [filePath]: JSON.stringify({
          version: 1,
          provider: {},
          models: {
            "test-model": {
              displayName: "Test",
            },
          },
        }),
      });
      const repository = createRepository({ filePath, storage });

      await expect(repository.read()).rejects.toThrow(
        "Invalid config at /tmp/bad-model2.json",
      );
    });

    describe("model thinking config", () => {
      it("rejects thinking with non-array levels", async () => {
        const filePath = "/tmp/bad-thinking.json";
        const storage = new MemoryStorage({});
        const repo = createRepository({ filePath, storage });

        await expect(
          repo.write({
            $schema: "",
            version: 1,
            provider: {},
            models: {
              test: {
                enabled: true,
                displayName: "Test Model",
                limits: { length: 4096, maxOutput: 1024 },
                thinking: { levels: "not-an-array" as never },
              },
            },
          } as never),
        ).rejects.toThrow();
      });

      it("accepts model without thinking (uses default)", async () => {
        const filePath = "/tmp/no-thinking.json";
        const storage = new MemoryStorage({});
        const repo = createRepository({ filePath, storage });

        await repo.write({
          $schema: "",
          version: 1,
          provider: {},
          models: {
            test: {
              enabled: true,
              displayName: "Test Model",
              limits: { length: 4096, maxOutput: 1024 },
            },
          },
        });

        const config = await repo.read();
        expect(config.models.test?.thinking).toEqual({
          levels: [],
        });
      });

      it("accepts model with thinking levels configured", async () => {
        const filePath = "/tmp/thinking-levels.json";
        const storage = new MemoryStorage({});
        const repo = createRepository({ filePath, storage });

        await repo.write({
          $schema: "",
          version: 1,
          provider: {},
          models: {
            test: {
              enabled: true,
              displayName: "Test Model",
              limits: { length: 4096, maxOutput: 1024 },
              thinking: { levels: ["low", "medium", "high"] },
            },
          },
        });

        const config = await repo.read();
        expect(config.models.test?.thinking).toEqual({
          levels: ["low", "medium", "high"],
        });
      });
    });

    it("rejects unknown top-level fields (strict schema)", async () => {
      const filePath = "/tmp/extra-field.json";
      const storage = new MemoryStorage({
        [filePath]: JSON.stringify({
          version: 1,
          provider: {},
          models: {},
          unknownField: "should fail",
        }),
      });
      const repository = createRepository({ filePath, storage });

      await expect(repository.read()).rejects.toThrow(
        "Invalid config at /tmp/extra-field.json",
      );
    });
  });

  describe("read/write roundtrip", () => {
    it("writes and reads back a valid config", async () => {
      const filePath = "/tmp/roundtrip.json";
      const storage = new MemoryStorage({});
      const repository = createRepository({ filePath, storage });

      const config = {
        version: 1,
        provider: {
          litellm: validProvider,
        },
        models: {
          "gpt-4": validModel,
        },
      };

      await repository.write(config);

      const stored = await storage.read(filePath);
      const parsed = JSON.parse(stored);
      expect(parsed.models["gpt-4"].displayName).toBe("Test Model");
      expect(parsed.models["gpt-4"].limits.length).toBe(200000);

      const readBack = await repository.read();
      expect(readBack.models["gpt-4"].displayName).toBe("Test Model");
      expect(readBack.provider.litellm.apiKey).toBe("sk-test");
    });

    it("validates on write, rejecting invalid config", async () => {
      const filePath = "/tmp/write-invalid.json";
      const storage = new MemoryStorage({});
      const repository = createRepository({ filePath, storage });

      await expect(
        repository.write({
          version: 1,
          provider: {
            bad: { name: "Missing fields" },
          },
          models: {},
        } as never),
      ).rejects.toThrow("Invalid config:");
    });
  });

  describe("validate", () => {
    it("returns true for valid config", () => {
      const repository = createRepository({
        filePath: "/tmp/validate.json",
      });

      expect(
        repository.validate({
          version: 1,
          provider: {
            litellm: validProvider,
          },
          models: {
            "test-model": validModel,
          },
        }),
      ).toBe(true);
    });

    it("returns false for invalid config", () => {
      const repository = createRepository({
        filePath: "/tmp/validate.json",
      });

      expect(repository.validate({ version: "not-a-number" })).toBe(false);
    });
  });

  describe("exists", () => {
    it("returns true when file exists", async () => {
      const filePath = "/tmp/exists-test.json";
      const storage = new MemoryStorage({
        [filePath]: "{}",
      });
      const repository = createRepository({ filePath, storage });

      expect(await repository.exists()).toBe(true);
    });

    it("returns false when file does not exist", async () => {
      const storage = new MemoryStorage({});
      const repository = createRepository({
        filePath: "/tmp/nonexistent.json",
        storage,
      });

      expect(await repository.exists()).toBe(false);
    });
  });

  describe("getPath", () => {
    it("returns the configured file path", () => {
      const repository = createRepository({
        filePath: "/custom/path/models.jsonc",
      });

      expect(repository.getPath()).toBe("/custom/path/models.jsonc");
    });
  });
});
