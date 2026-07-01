import { beforeEach, describe, expect, it, vi } from "vitest";
import { CredentialsRepository } from "../../repositories/credentials-repository.js";
import { CredentialsService } from "../credentials.service.js";

type CredentialRow = {
  id: string;
  name: string;
  provider: string | null;
  baseUrl: string | null;
  apiKey: string | null;
  secretRef: string | null;
  createdAt: Date;
  updatedAt: Date;
};

function createCredentialsPrismaMock() {
  const rows = new Map<string, CredentialRow>();
  let idCounter = 1;

  return {
    rows,
    modelProxyCredential: {
      findUnique: vi.fn(async ({ where }: { where: { name: string } }) => {
        return rows.get(where.name) ?? null;
      }),
      findMany: vi.fn(async () =>
        [...rows.values()].sort((a, b) => a.name.localeCompare(b.name)),
      ),
      create: vi.fn(
        async (args: {
          data: {
            name: string;
            provider: string | null;
            baseUrl: string | null;
            apiKey?: string | null;
            secretRef?: string | null;
          };
        }) => {
          const now = new Date();
          const row: CredentialRow = {
            id: `cred_${idCounter++}`,
            name: args.data.name,
            provider: args.data.provider,
            baseUrl: args.data.baseUrl,
            apiKey: args.data.apiKey ?? null,
            secretRef: args.data.secretRef ?? null,
            createdAt: now,
            updatedAt: now,
          };
          rows.set(row.name, row);
          return row;
        },
      ),
      update: vi.fn(
        async ({
          where,
          data,
        }: {
          where: { name: string };
          data: Partial<{
            name: string;
            provider: string | null;
            baseUrl: string | null;
            apiKey: string | null;
            secretRef: string | null;
          }>;
        }) => {
          const existing = rows.get(where.name);
          if (!existing) {
            const error = new Error("Not found") as Error & { code: string };
            error.code = "P2025";
            throw error;
          }
          const updated: CredentialRow = {
            ...existing,
            ...data,
            updatedAt: new Date(),
          };
          if (data.name && data.name !== where.name) {
            rows.delete(where.name);
            rows.set(data.name, updated);
          } else {
            rows.set(where.name, updated);
          }
          return updated;
        },
      ),
      delete: vi.fn(async ({ where }: { where: { name: string } }) => {
        const existing = rows.get(where.name);
        if (!existing) {
          const error = new Error("Not found") as Error & { code: string };
          error.code = "P2025";
          throw error;
        }
        rows.delete(where.name);
        return existing;
      }),
    },
  };
}

describe("CredentialsService", () => {
  let service: CredentialsService;
  let prisma: ReturnType<typeof createCredentialsPrismaMock>;

  beforeEach(() => {
    vi.stubEnv(
      "MODEL_PROXY_OAUTH_ENCRYPTION_KEY",
      "01234567890123456789012345678901",
    );
    prisma = createCredentialsPrismaMock();
    service = new CredentialsService({
      repository: new CredentialsRepository(prisma as never),
    });
  });

  it("creates credential with encrypted apiKey storage", async () => {
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

  it("creates credential with env-based secretRef", async () => {
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

  it("updates credential metadata", async () => {
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
    await prisma.modelProxyCredential.create({
      data: {
        name: "legacy",
        provider: "openai",
        baseUrl: "https://example.com/v1",
        secretRef: "sk-legacy-secret",
      },
    });

    const record = await service.get("legacy");
    expect(record?.secretRef).toBeNull();
    expect(record?.apiKey).toBeTruthy();
    expect(record?.apiKey).not.toBe("sk-legacy-secret");
  });

  it("deletes credential", async () => {
    await service.create({
      name: "openai-main",
      secretRef: "OPENAI_API_KEY",
    });
    expect(await service.delete("openai-main")).toBe(true);
    expect(await service.get("openai-main")).toBeNull();
  });
});
