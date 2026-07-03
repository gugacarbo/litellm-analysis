import { beforeEach, describe, expect, it } from "vitest";
import { ProvidersService } from "../providers.service.js";
import {
  createProvidersRepositoryMock,
} from "./in-memory-repositories.js";

describe("ProvidersService", () => {
  let service: ProvidersService;
  let repository: ReturnType<typeof createProvidersRepositoryMock>;

  beforeEach(() => {
    repository = createProvidersRepositoryMock();
    service = new ProvidersService({
      repository: repository as never,
    });
  });

  it("creates provider with env-based secretRef", async () => {
    const record = await service.create({
      name: "openai-main",
      secretRef: "OPENAI_API_KEY",
    });
    expect(record.secretRef).toBe("OPENAI_API_KEY");
    expect(record.apiKey).toBeNull();
  });

  it("requires secretRef on create", async () => {
    await expect(
      service.create({ name: "openai-main", secretRef: "  " }),
    ).rejects.toThrow(/secretRef is required/);
  });

  it("rejects literal secretRef input", async () => {
    await expect(
      service.create({
        name: "bad",
        secretRef: "sk-secret",
      }),
    ).rejects.toThrow(/environment variable name/);
  });

  it("throws on duplicate create", async () => {
    await service.create({
      name: "openai-main",
      secretRef: "OPENAI_API_KEY",
    });
    await expect(
      service.create({
        name: "openai-main",
        secretRef: "OPENAI_API_KEY",
      }),
    ).rejects.toThrow(/already exists/);
  });

  it("updates provider metadata", async () => {
    await service.create({
      name: "openai-main",
      secretRef: "OPENAI_API_KEY",
    });
    const updated = await service.update("openai-main", {
      baseUrl: "https://custom.example/v1",
      secretRef: "CUSTOM_OPENAI_API_KEY",
    });
    expect(updated.baseUrl).toBe("https://custom.example/v1");
    expect(updated.secretRef).toBe("CUSTOM_OPENAI_API_KEY");
  });

  it("leaves legacy apiKey rows untouched on read", async () => {
    await repository.create({
      name: "legacy",
      provider: "openai",
      baseUrl: "https://example.com/v1",
      apiKey: "sk-legacy-secret",
    });

    const record = await service.get("legacy");
    expect(record?.secretRef).toBeNull();
    expect(record?.apiKey).toBe("sk-legacy-secret");
  });

  it("deletes provider", async () => {
    await service.create({
      name: "openai-main",
      secretRef: "OPENAI_API_KEY",
    });
    expect(await service.delete("openai-main")).toBe(true);
    expect(await service.get("openai-main")).toBeNull();
  });
});
