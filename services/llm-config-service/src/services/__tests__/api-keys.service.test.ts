import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiKeysRepository } from "../../repositories/api-keys-repository.js";
import { ApiKeysService } from "../api-keys.service.js";

type ApiKeyRow = {
  id: string;
  label: string;
  keyHash: string;
  enabled: boolean;
  lastUsedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

function createApiKeysPrismaMock() {
  const rowsById = new Map<string, ApiKeyRow>();
  const rowsByHash = new Map<string, ApiKeyRow>();
  let idCounter = 1;

  return {
    modelProxyApiKey: {
      findUnique: vi.fn(
        async ({ where }: { where: { id?: string; keyHash?: string } }) => {
          if (where.id) {
            return rowsById.get(where.id) ?? null;
          }
          if (where.keyHash) {
            return rowsByHash.get(where.keyHash) ?? null;
          }
          return null;
        },
      ),
      findMany: vi.fn(
        async ({ where }: { where?: { enabled?: boolean } } = {}) => {
          const all = [...rowsById.values()].sort((a, b) =>
            a.label.localeCompare(b.label),
          );
          if (where?.enabled === undefined) {
            return all;
          }
          return all.filter((row) => row.enabled === where.enabled);
        },
      ),
      create: vi.fn(
        async (args: {
          data: { label: string; keyHash: string; enabled: boolean };
        }) => {
          const now = new Date();
          const row: ApiKeyRow = {
            id: `key_${idCounter++}`,
            label: args.data.label,
            keyHash: args.data.keyHash,
            enabled: args.data.enabled,
            lastUsedAt: null,
            createdAt: now,
            updatedAt: now,
          };
          rowsById.set(row.id, row);
          rowsByHash.set(row.keyHash, row);
          return row;
        },
      ),
      update: vi.fn(
        async ({
          where,
          data,
        }: {
          where: { id: string };
          data: Partial<{ enabled: boolean; lastUsedAt: Date }>;
        }) => {
          const existing = rowsById.get(where.id);
          if (!existing) {
            const error = new Error("Not found") as Error & { code: string };
            error.code = "P2025";
            throw error;
          }
          const updated: ApiKeyRow = {
            ...existing,
            ...data,
            updatedAt: new Date(),
          };
          rowsById.set(where.id, updated);
          rowsByHash.set(updated.keyHash, updated);
          return updated;
        },
      ),
      delete: vi.fn(async ({ where }: { where: { id: string } }) => {
        const existing = rowsById.get(where.id);
        if (!existing) {
          const error = new Error("Not found") as Error & { code: string };
          error.code = "P2025";
          throw error;
        }
        rowsById.delete(where.id);
        rowsByHash.delete(existing.keyHash);
        return existing;
      }),
    },
  };
}

describe("ApiKeysService", () => {
  let service: ApiKeysService;

  beforeEach(() => {
    const prisma = createApiKeysPrismaMock();
    service = new ApiKeysService({
      repository: new ApiKeysRepository(prisma as never),
      hashKey: async (plain) => `hash:${plain}`,
      verifyKey: async (hash, plain) => hash === `hash:${plain}`,
      generateKey: () => "mp_test_generated_key",
    });
  });

  it("creates key with generated plaintext returned once", async () => {
    const created = await service.create({ label: "dev" });
    expect(created.plainKey).toBe("mp_test_generated_key");
    expect(created.record.keyHash).toBe("hash:mp_test_generated_key");
    expect(created.record.label).toBe("dev");
  });

  it("creates key with provided plaintext", async () => {
    const created = await service.create(
      { label: "ci" },
      "mp_custom_plain_key",
    );
    expect(created.plainKey).toBe("mp_custom_plain_key");
    expect(created.record.keyHash).toBe("hash:mp_custom_plain_key");
  });

  it("verifies enabled key and updates lastUsedAt", async () => {
    const created = await service.create({ label: "proxy" }, "mp_verify_me");
    expect(created.record.lastUsedAt).toBeNull();

    const result = await service.verify("mp_verify_me");
    expect(result.valid).toBe(true);
    expect(result.record?.lastUsedAt).toBeInstanceOf(Date);
  });

  it("rejects disabled keys", async () => {
    const created = await service.create({ label: "disabled" }, "mp_disabled");
    await service.disable(created.record.id);

    const result = await service.verify("mp_disabled");
    expect(result.valid).toBe(false);
  });

  it("returns invalid for unknown key", async () => {
    const result = await service.verify("mp_unknown");
    expect(result.valid).toBe(false);
  });

  it("lists and deletes keys", async () => {
    const created = await service.create({ label: "temp" });
    const rows = await service.list();
    expect(rows).toHaveLength(1);
    expect(await service.delete(created.record.id)).toBe(true);
    expect(await service.list()).toHaveLength(0);
  });
});
