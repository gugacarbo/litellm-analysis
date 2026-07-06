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

  it("creates provider with encrypted secretRef", async () => {
    const record = await service.create({
      name: "openai-main",
      secretRef: "sk-secret-value",
    });
    expect(record.secretRef).not.toBe("sk-secret-value");
    expect(record.secretRef).toMatch(/^enc:v1:/);
  });

  it("requires secretRef on create", async () => {
    await expect(
      service.create({ name: "openai-main", secretRef: "  " }),
    ).rejects.toThrow(/secretRef is required/);
  });

  it("throws on duplicate create", async () => {
    await service.create({
      name: "openai-main",
      secretRef: "sk-secret-value",
    });
    await expect(
      service.create({
        name: "openai-main",
        secretRef: "sk-secret-value",
      }),
    ).rejects.toThrow(/already exists/);
  });

  it("updates provider metadata", async () => {
    await service.create({
      name: "openai-main",
      secretRef: "sk-secret-value",
    });
    const updated = await service.update("openai-main", {
      baseUrl: "https://custom.example/v1",
      secretRef: "sk-updated-value",
    });
    expect(updated.baseUrl).toBe("https://custom.example/v1");
    expect(updated.secretRef).not.toBe("sk-updated-value");
    expect(updated.secretRef).toMatch(/^enc:v1:/);
  });

  it("deletes provider", async () => {
    await service.create({
      name: "openai-main",
      secretRef: "sk-secret-value",
    });
    expect(await service.delete("openai-main")).toBe(true);
    expect(await service.get("openai-main")).toBeNull();
  });

  it("does not double-encrypt an already encrypted secretRef", async () => {
    const first = await service.create({
      name: "openai-main",
      secretRef: "sk-secret-value",
    });
    const updated = await service.update("openai-main", {
      secretRef: first.secretRef ?? undefined,
    });
    expect(updated.secretRef).toBe(first.secretRef);
    expect(
      decryptProviderSecret(updated.secretRef ?? "", encryptionKey),
    ).toBe("sk-secret-value");
  });
});
