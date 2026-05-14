import { describe, expect, it, beforeEach } from "vitest";
import { MemoryStorage } from "@lite-llm/repository-utils";
import { createRepository } from "@lite-llm/models-repository/repository";
import { ProviderService } from "../provider.service.js";

function createTestRepo(files: Record<string, string>) {
  return createRepository({
    filePath: "/test/models.json",
    storage: new MemoryStorage(files),
  });
}

describe("ProviderService", () => {
  let service: ProviderService;

  beforeEach(() => {
    const repo = createTestRepo({
      "/test/models.json": JSON.stringify({
        version: 1,
        provider: {
          litellm: {
            name: "LiteLLM",
            ownedBy: "atplus",
            baseUrl: "http://0.0.0.0:4000",
            apiKey: "sk-123",
          },
        },
        models: {},
      }),
    });
    service = new ProviderService({ repository: repo });
  });

  it("gets all providers", async () => {
    const providers = await service.getAll();
    expect(providers.litellm).toBeDefined();
    expect(providers.litellm.name).toBe("LiteLLM");
  });

  it("gets a specific provider", async () => {
    const provider = await service.get("litellm");
    expect(provider?.baseUrl).toBe("http://0.0.0.0:4000");
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
      apiKey: "sk-key",
    });
    const provider = await service.get("openai");
    expect(provider?.name).toBe("OpenAI");
  });

  it("throws on duplicate create", async () => {
    await expect(
      service.create("litellm", {
        name: "Duplicate",
        ownedBy: "",
        baseUrl: "",
        apiKey: "",
      }),
    ).rejects.toThrow(/already exists/);
  });

  it("updates an existing provider", async () => {
    await service.update("litellm", { name: "Updated LiteLLM" });
    const provider = await service.get("litellm");
    expect(provider?.name).toBe("Updated LiteLLM");
    expect(provider?.baseUrl).toBe("http://0.0.0.0:4000"); // unchanged
  });

  it("deletes a provider", async () => {
    await service.delete("litellm");
    const provider = await service.get("litellm");
    expect(provider).toBeUndefined();
  });

  it("throws on delete of missing provider", async () => {
    await expect(service.delete("nonexistent")).rejects.toThrow(
      /not found/,
    );
  });
});
