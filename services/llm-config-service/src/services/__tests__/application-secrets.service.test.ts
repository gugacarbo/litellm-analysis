import { describe, expect, it } from "vitest";
import { encryptProviderSecret } from "../../lib/provider-secrets.js";
import { ApplicationSecretsRepository } from "../../repositories/application-secrets-repository.js";
import {
  type ApplicationSecretsRepositoryPort,
  ApplicationSecretsService,
} from "../application-secrets.service.js";

const encryptionKey = Buffer.alloc(32, 7);

function createRepository(): ApplicationSecretsRepositoryPort {
  const rows = new Map<
    string,
    {
      key: "artificial_analysis_api_key" | "openrouter_api_key";
      credentialEnvelope: string;
      createdAt: Date;
      updatedAt: Date;
    }
  >();

  return {
    async findByKey(key) {
      return rows.get(key) ?? null;
    },
    async upsert(input) {
      const existing = rows.get(input.key);
      const now = new Date();
      const row = {
        key: input.key,
        credentialEnvelope: input.credentialEnvelope,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      };
      rows.set(input.key, row);
      return row;
    },
    async deleteByKey(key) {
      return rows.delete(key);
    },
  };
}

describe("ApplicationSecretsService", () => {
  it("encrypts a replacement and returns public metadata only", async () => {
    let persistedEnvelope: string | undefined;
    const repository = createRepository();
    const upsert = repository.upsert.bind(repository);
    repository.upsert = async (input) => {
      persistedEnvelope = input.credentialEnvelope;
      return upsert(input);
    };
    const service = new ApplicationSecretsService({
      repository,
      encryptionKey,
    });

    const result = await service.replace(
      "artificial_analysis_api_key",
      "aa-live-secret",
    );

    expect(result).toEqual({
      key: "artificial_analysis_api_key",
      isConfigured: true,
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
    });
    expect(JSON.stringify(result)).not.toContain("aa-live-secret");
    expect(persistedEnvelope).toMatch(/^enc:v1:/);
    expect(persistedEnvelope).not.toContain("aa-live-secret");
    expect(await service.resolve("artificial_analysis_api_key")).toBe(
      "aa-live-secret",
    );
  });

  it("lists both allowlisted keys without exposing stored values", async () => {
    const service = new ApplicationSecretsService({
      repository: createRepository(),
      encryptionKey,
    });
    await service.replace("openrouter_api_key", "or-live-secret");

    expect(await service.list()).toEqual([
      {
        key: "artificial_analysis_api_key",
        isConfigured: false,
        createdAt: null,
        updatedAt: null,
      },
      {
        key: "openrouter_api_key",
        isConfigured: true,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      },
    ]);
  });

  it("rejects non-allowlisted and blank values", async () => {
    const service = new ApplicationSecretsService({
      repository: createRepository(),
      encryptionKey,
    });

    await expect(
      service.replace("unexpected_key" as never, "value"),
    ).rejects.toThrow(/unsupported/i);
    await expect(service.replace("openrouter_api_key", "   ")).rejects.toThrow(
      /non-empty/i,
    );
  });

  it("rejects a non-allowlisted key at the repository write boundary", async () => {
    const repository = new ApplicationSecretsRepository({
      insert: () => {
        throw new Error("the database write must not be reached");
      },
    } as never);

    await expect(
      repository.upsert({
        key: "unexpected_key" as never,
        credentialEnvelope: "enc:v1:invalid",
      }),
    ).rejects.toThrow(/unsupported/i);
  });

  it("fails closed for missing, malformed, or undecryptable persisted values", async () => {
    const repository = createRepository();
    const service = new ApplicationSecretsService({
      repository,
      encryptionKey,
    });

    expect(await service.resolve("openrouter_api_key")).toBeNull();
    await repository.upsert({
      key: "openrouter_api_key",
      credentialEnvelope: "not-an-envelope",
    });
    expect(await service.resolve("openrouter_api_key")).toBeNull();
    await repository.upsert({
      key: "openrouter_api_key",
      credentialEnvelope: encryptProviderSecret(
        "encrypted-with-another-key",
        Buffer.alloc(32, 9),
      ),
    });
    expect(await service.resolve("openrouter_api_key")).toBeNull();
  });

  it("removes idempotently and returns only unconfigured public metadata", async () => {
    const service = new ApplicationSecretsService({
      repository: createRepository(),
      encryptionKey,
    });

    await service.replace("openrouter_api_key", "or-live-secret");

    await expect(service.remove("openrouter_api_key")).resolves.toEqual({
      key: "openrouter_api_key",
      isConfigured: false,
      createdAt: null,
      updatedAt: null,
    });
    await expect(service.remove("openrouter_api_key")).resolves.toEqual({
      key: "openrouter_api_key",
      isConfigured: false,
      createdAt: null,
      updatedAt: null,
    });
  });
});
