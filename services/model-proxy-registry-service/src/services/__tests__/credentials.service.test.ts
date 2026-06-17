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
            secretRef: string;
          };
        }) => {
          const now = new Date();
          const row: CredentialRow = {
            id: `cred_${idCounter++}`,
            name: args.data.name,
            provider: args.data.provider,
            baseUrl: args.data.baseUrl,
            apiKey: null,
            secretRef: args.data.secretRef,
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
            secretRef: string;
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

  beforeEach(() => {
    const prisma = createCredentialsPrismaMock();
    service = new CredentialsService({
      repository: new CredentialsRepository(prisma as never),
    });
  });

  it("creates credential with secretRef only", async () => {
    const record = await service.create({
      name: "openai-main",
      provider: "openai",
      baseUrl: "https://api.openai.com/v1",
      secretRef: "OPENAI_API_KEY",
    });
    expect(record.secretRef).toBe("OPENAI_API_KEY");
    expect(record.apiKey).toBeNull();
  });

  it("rejects raw apiKey on create", async () => {
    await expect(
      service.create({
        name: "bad",
        secretRef: "OPENAI_API_KEY",
        apiKey: "sk-secret",
      } as never),
    ).rejects.toThrow(/Raw apiKey is not allowed/);
  });

  it("rejects raw apiKey on update", async () => {
    await service.create({
      name: "openai-main",
      secretRef: "OPENAI_API_KEY",
    });
    await expect(
      service.update("openai-main", { apiKey: "sk-secret" } as never),
    ).rejects.toThrow(/Raw apiKey is not allowed/);
  });

  it("requires secretRef on create", async () => {
    await expect(
      service.create({ name: "openai-main", secretRef: "  " }),
    ).rejects.toThrow(/secretRef is required/);
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
      secretRef: "CUSTOM_OPENAI_KEY",
    });
    expect(updated.baseUrl).toBe("https://custom.example/v1");
    expect(updated.secretRef).toBe("CUSTOM_OPENAI_KEY");
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
