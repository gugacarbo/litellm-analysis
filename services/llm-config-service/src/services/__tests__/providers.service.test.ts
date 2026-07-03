import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProvidersService } from "../providers.service.js";
import {
  createProvidersRepositoryMock,
} from "./in-memory-repositories.js";

describe("ProvidersService", () => {
  let service: ProvidersService;
  let repository: ReturnType<typeof createProvidersRepositoryMock>;

  beforeEach(() => {
    vi.stubEnv("APP_ENCRYPTION_KEY", "01234567890123456789012345678901");
    repository = createProvidersRepositoryMock();
    service = new ProvidersService({
      repository: repository as never,
    });
  });

  it("creates provider with encrypted apiKey storage", async () => {
    const record = await service.create({
      name: "openai-main",
      provider: "openai",
      baseUrl: "https://api.openai.com/v1",
      apiKey: "sk-secret",
    });
    expect(record.secretRef).toBeNull();
    expect(record.apiKey).toBeTruthy();
    expect(record.apiKey).not.toBe("sk-secret");
  });

  it("creates provider with env-based secretRef", async () => {
    const record = await service.create({
      name: "openai-main",
      secretRef: "OPENAI_API_KEY",
    });
    expect(record.secretRef).toBe("OPENAI_API_KEY");
    expect(record.apiKey).toBeNull();
  });

  it("treats non-env secretRef input as an encrypted raw api key", async () => {
    const record = await service.create({
      name: "iproute",
      secretRef: "sk-legacy-secret",
    });
    expect(record.secretRef).toBeNull();
    expect(record.apiKey).toBeTruthy();
    expect(record.apiKey).not.toBe("sk-legacy-secret");
  });

  it("requires apiKey or secretRef on create", async () => {
    await expect(
      service.create({ name: "openai-main", secretRef: "  " }),
    ).rejects.toThrow(/apiKey or secretRef is required/);
  });

  it("rejects passing both apiKey and secretRef", async () => {
    await expect(
      service.create({
        name: "bad",
        secretRef: "OPENAI_API_KEY",
        apiKey: "sk-secret",
      }),
    ).rejects.toThrow(/either apiKey or secretRef, not both/);
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
      apiKey: "sk-replacement",
    });
    expect(updated.baseUrl).toBe("https://custom.example/v1");
    expect(updated.secretRef).toBeNull();
    expect(updated.apiKey).toBeTruthy();
    expect(updated.apiKey).not.toBe("sk-replacement");
  });

  it("migrates legacy literal secretRef values on read", async () => {
    await repository.create({
      name: "legacy",
      provider: "openai",
      baseUrl: "https://example.com/v1",
      secretRef: "sk-legacy-secret",
    });

    const record = await service.get("legacy");
    expect(record?.secretRef).toBeNull();
    expect(record?.apiKey).toBeTruthy();
    expect(record?.apiKey).not.toBe("sk-legacy-secret");
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
