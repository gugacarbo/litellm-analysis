import { beforeEach, describe, expect, it } from "vitest";
import {
  decryptProviderSecret,
  parseProviderEncryptionKey,
} from "../../lib/provider-secrets.js";
import { ProvidersService } from "../providers.service.js";
import { createProvidersRepositoryMock } from "./in-memory-repositories.js";

describe("ProvidersService", () => {
  let service: ProvidersService;
  let repository: ReturnType<typeof createProvidersRepositoryMock>;
  const encryptionKey = parseProviderEncryptionKey({
    APP_ENCRYPTION_KEY: "a".repeat(32),
  });

  beforeEach(() => {
    repository = createProvidersRepositoryMock();
    service = new ProvidersService({
      repository: repository as never,
      encryptionKey,
    });
  });

  it("creates provider with encrypted apiKey", async () => {
    const record = await service.create({
      name: "openai-main",
      apiKey: "sk-secret-value",
    });
    expect(record.apiKey).not.toBe("sk-secret-value");
    expect(record.apiKey).toMatch(/^enc:v1:/);
  });

  it("requires apiKey on create", async () => {
    await expect(
      service.create({ name: "openai-main", apiKey: "  " }),
    ).rejects.toThrow(/apiKey is required/);
  });

  it("throws on duplicate create", async () => {
    await service.create({
      name: "openai-main",
      apiKey: "sk-secret-value",
    });
    await expect(
      service.create({
        name: "openai-main",
        apiKey: "sk-secret-value",
      }),
    ).rejects.toThrow(/already exists/);
  });

  it("updates provider metadata", async () => {
    await service.create({
      name: "openai-main",
      apiKey: "sk-secret-value",
    });
    const updated = await service.update("openai-main", {
      baseUrl: "https://custom.example/v1",
      apiKey: "sk-updated-value",
    });
    expect(updated.baseUrl).toBe("https://custom.example/v1");
    expect(updated.apiKey).not.toBe("sk-updated-value");
    expect(updated.apiKey).toMatch(/^enc:v1:/);
  });

  it("deletes provider", async () => {
    await service.create({
      name: "openai-main",
      apiKey: "sk-secret-value",
    });
    expect(await service.delete("openai-main")).toBe(true);
    expect(await service.get("openai-main")).toBeNull();
  });

  it("does not double-encrypt an already encrypted apiKey", async () => {
    const first = await service.create({
      name: "openai-main",
      apiKey: "sk-secret-value",
    });
    const updated = await service.update("openai-main", {
      apiKey: first.apiKey ?? undefined,
    });
    expect(updated.apiKey).toBe(first.apiKey);
    expect(
      decryptProviderSecret(updated.apiKey ?? "", encryptionKey),
    ).toBe("sk-secret-value");
  });
});