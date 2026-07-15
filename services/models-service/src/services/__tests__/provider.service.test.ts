import type {
  IModelsRepository,
  ModelsConfig,
} from "@lite-llm/models-repository";
import { beforeEach, describe, expect, it } from "vitest";
import { ProviderService } from "../provider.service";

function createTestRepo(initialConfig: ModelsConfig): IModelsRepository {
  let config = structuredClone(initialConfig);

  return {
    read: async () => structuredClone(config),
    readSync: () => structuredClone(config),
    write: async (nextConfig) => {
      config = structuredClone(nextConfig);
    },
    validate: (value): value is ModelsConfig =>
      typeof value === "object" && value !== null,
    exists: async () => true,
    getPath: () => "memory://models-config",
  };
}

describe("ProviderService", () => {
  let service: ProviderService;

  beforeEach(() => {
    const repo = createTestRepo({
      version: 1,
      provider: {
        "local-proxy": {
          name: "Local Model Proxy",
          ownedBy: "llm-toolbox",
          baseUrl: "http://localhost:3008/v1",
        },
      },
      models: {},
    });
    service = new ProviderService({ repository: repo });
  });

  it("gets all providers", async () => {
    const providers = await service.getAll();
    expect(providers["local-proxy"]).toBeDefined();
    expect(providers["local-proxy"].name).toBe("Local Model Proxy");
  });

  it("gets a specific provider", async () => {
    const provider = await service.get("local-proxy");
    expect(provider?.baseUrl).toBe("http://localhost:3008/v1");
  });

  it("returns undefined for missing provider", async () => {
    const provider = await service.get("nonexistent");
    expect(provider).toBeUndefined();
  });

  it("creates a new provider", async () => {
    await service.create("openai", {
      name: "OpenAI",
      ownedBy: "openai",
      baseUrl: "https://api.openai.com",
    });
    const provider = await service.get("openai");
    expect(provider?.name).toBe("OpenAI");
  });

  it("throws on duplicate create", async () => {
    await expect(
      service.create("local-proxy", {
        name: "Duplicate",
        ownedBy: "",
        baseUrl: "",
      }),
    ).rejects.toThrow(/already exists/);
  });

  it("updates an existing provider", async () => {
    await service.update("local-proxy", {
      name: "Updated Local Model Proxy",
    });
    const provider = await service.get("local-proxy");
    expect(provider?.name).toBe("Updated Local Model Proxy");
    expect(provider?.baseUrl).toBe("http://localhost:3008/v1"); // unchanged
  });

  it("deletes a provider", async () => {
    await service.delete("local-proxy");
    const provider = await service.get("local-proxy");
    expect(provider).toBeUndefined();
  });

  it("throws on delete of missing provider", async () => {
    await expect(service.delete("nonexistent")).rejects.toThrow(/not found/);
  });
});
