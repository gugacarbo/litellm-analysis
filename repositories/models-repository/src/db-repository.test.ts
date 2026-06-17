import { SETTING_KEYS } from "@lite-llm/model-proxy-registry-service";
import type { Prisma } from "@lite-llm/model-proxy-repository";
import { describe, expect, it, vi } from "vitest";
import { createDbRepository } from "./db-repository";

function createInMemoryPrisma() {
  const settings = new Map<
    string,
    {
      id: string;
      key: string;
      value: Prisma.JsonValue;
      createdAt: Date;
      updatedAt: Date;
    }
  >();
  const models = new Map<string, Record<string, unknown>>();
  const credentials = new Map<string, Record<string, unknown>>();
  let settingId = 1;
  let modelId = 1;
  let credentialId = 1;

  return {
    modelProxySetting: {
      findUnique: vi.fn(
        async ({ where }: { where: { key: string } }) =>
          settings.get(where.key) ?? null,
      ),
      upsert: vi.fn(
        async ({
          where,
          create,
          update,
        }: {
          where: { key: string };
          create: { key: string; value: Prisma.JsonValue };
          update: { value: Prisma.JsonValue };
        }) => {
          const now = new Date();
          const existing = settings.get(where.key);
          if (existing) {
            const updated = {
              ...existing,
              value: update.value,
              updatedAt: now,
            };
            settings.set(where.key, updated);
            return updated;
          }
          const created = {
            id: `setting_${settingId++}`,
            key: create.key,
            value: create.value,
            createdAt: now,
            updatedAt: now,
          };
          settings.set(create.key, created);
          return created;
        },
      ),
      delete: vi.fn(async ({ where }: { where: { key: string } }) => {
        const existing = settings.get(where.key);
        if (!existing) {
          const error = new Error("Not found") as Error & { code: string };
          error.code = "P2025";
          throw error;
        }
        settings.delete(where.key);
        return existing;
      }),
    },
    modelProxyModel: {
      findUnique: vi.fn(
        async ({ where }: { where: { modelName: string } }) =>
          models.get(where.modelName) ?? null,
      ),
      findMany: vi.fn(async () =>
        [...models.values()].sort((a, b) =>
          String(a.modelName).localeCompare(String(b.modelName)),
        ),
      ),
      count: vi.fn(async () => models.size),
      upsert: vi.fn(
        async ({
          where,
          create,
          update,
        }: {
          where: { modelName: string };
          create: Record<string, unknown>;
          update: Record<string, unknown>;
        }) => {
          const now = new Date();
          const existing = models.get(where.modelName);
          if (existing) {
            const updated = { ...existing, ...update, updatedAt: now };
            models.set(where.modelName, updated);
            return updated;
          }
          const row = {
            id: `model_${modelId++}`,
            ...create,
            createdAt: now,
            updatedAt: now,
          };
          models.set(where.modelName, row);
          return row;
        },
      ),
      delete: vi.fn(async ({ where }: { where: { modelName: string } }) => {
        const existing = models.get(where.modelName);
        if (!existing) {
          const error = new Error("Not found") as Error & { code: string };
          error.code = "P2025";
          throw error;
        }
        models.delete(where.modelName);
        return existing;
      }),
    },
    modelProxyCredential: {
      findUnique: vi.fn(
        async ({ where }: { where: { name: string } }) =>
          credentials.get(where.name) ?? null,
      ),
      findMany: vi.fn(async () =>
        [...credentials.values()].sort((a, b) =>
          String(a.name).localeCompare(String(b.name)),
        ),
      ),
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        const now = new Date();
        const row = {
          id: `cred_${credentialId++}`,
          ...data,
          apiKey: null,
          createdAt: now,
          updatedAt: now,
        };
        credentials.set(String(data.name), row);
        return row;
      }),
      update: vi.fn(
        async ({
          where,
          data,
        }: {
          where: { name: string };
          data: Record<string, unknown>;
        }) => {
          const existing = credentials.get(where.name);
          if (!existing) {
            const error = new Error("Not found") as Error & { code: string };
            error.code = "P2025";
            throw error;
          }
          const updated = {
            ...existing,
            ...data,
            name: String(data.name ?? where.name),
            updatedAt: new Date(),
          };
          credentials.set(updated.name, updated);
          return updated;
        },
      ),
      delete: vi.fn(async ({ where }: { where: { name: string } }) => {
        const existing = credentials.get(where.name);
        if (!existing) {
          const error = new Error("Not found") as Error & { code: string };
          error.code = "P2025";
          throw error;
        }
        credentials.delete(where.name);
        return existing;
      }),
    },
  };
}

describe("DbModelsRepository", () => {
  it("round-trips models with thinking metadata", async () => {
    const prisma = createInMemoryPrisma();
    const repository = createDbRepository({
      prisma: prisma as never,
      validateOnRead: false,
    });

    const config = {
      version: 1,
      provider: {
        "local-proxy": {
          name: "Local Model Proxy",
          baseUrl: "http://localhost:3008/v1",
          defaultCredential: "router-main",
          apiKey: "env:MODEL_PROXY_API_KEY",
        },
        openai: {
          name: "OpenAI",
          adapter: "openai-compatible" as const,
          baseUrl: "https://api.openai.com/v1",
          defaultCredential: "openai-main",
          apiKey: "env:OPENAI_API_KEY",
        },
      },
      models: {
        "gpt-4": {
          enabled: true,
          displayName: "GPT-4",
          limits: { length: 128000, maxOutput: 4096 },
          cost: { input: 0.00001, output: 0.00003 },
          thinking: { levels: ["low", "high"] },
        },
      },
    };

    await repository.write(config);
    const readBack = await repository.read();

    expect(readBack.models["gpt-4"]?.displayName).toBe("GPT-4");
    expect(readBack.models["gpt-4"]?.thinking).toEqual({
      levels: ["low", "high"],
    });
    expect(readBack.provider["local-proxy"]?.defaultCredential).toBe(
      "router-main",
    );

    const defaultSetting = await prisma.modelProxySetting.findUnique({
      where: { key: SETTING_KEYS.DEFAULT_CREDENTIAL },
    });
    expect(
      (defaultSetting?.value as { default_credential?: string })
        ?.default_credential,
    ).toBe("router-main");

    const credential = await prisma.modelProxyCredential.findUnique({
      where: { name: "openai-main" },
    });
    expect(credential?.secretRef).toBe("OPENAI_API_KEY");
  });
});
