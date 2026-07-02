import { SETTING_KEYS } from "@lite-llm/model-proxy-registry-service";
import type { Prisma } from "@lite-llm/model-proxy-repository";
import { describe, expect, it, vi } from "vitest";
import { createDbRepository } from "./db-repository";

type InMemoryModelRow = Record<string, unknown> & {
  id: string;
  modelName: string;
  providerName?: string | null;
  updatedAt: Date;
};

function buildModelKey(modelName: string, providerName?: string | null): string {
  return providerName ? `${providerName}/${modelName}` : modelName;
}

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
  const models = new Map<string, InMemoryModelRow>();
  const providers = new Map<string, Record<string, unknown>>();
  let settingId = 1;
  let modelId = 1;
  let providerId = 1;

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
      findFirst: vi.fn(
        async ({
          where,
        }: {
          where: { modelName: string; providerName?: string | null };
        }) =>
          [...models.values()].find(
            (row) =>
              row.modelName === where.modelName &&
              (where.providerName === undefined ||
                (row.providerName ?? null) === where.providerName),
          ) ?? null,
      ),
      findMany: vi.fn(async () =>
        [...models.values()].sort((a, b) =>
          buildModelKey(
            String(a.modelName),
            (a.providerName as string | null | undefined) ?? null,
          ).localeCompare(
            buildModelKey(
              String(b.modelName),
              (b.providerName as string | null | undefined) ?? null,
            ),
          ),
        ),
      ),
      count: vi.fn(async () => models.size),
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        const now = new Date();
        const row: InMemoryModelRow = {
          id: `model_${modelId++}`,
          ...(data as Record<string, unknown>),
          modelName: String(data.modelName),
          providerName:
            typeof data.providerName === "string" ? data.providerName : null,
          createdAt: now,
          updatedAt: now,
        };
        models.set(buildModelKey(row.modelName, row.providerName), row);
        return row;
      }),
      update: vi.fn(
        async ({
          where,
          data,
        }: {
          where: { id: string };
          data: Record<string, unknown>;
        }) => {
          const existing = [...models.values()].find(
            (row) => row.id === where.id,
          );
          if (!existing) {
            const error = new Error("Not found") as Error & { code: string };
            error.code = "P2025";
            throw error;
          }
          const updated = {
            ...existing,
            ...data,
            updatedAt: new Date(),
          };
          models.delete(
            buildModelKey(existing.modelName, existing.providerName),
          );
          models.set(
            buildModelKey(updated.modelName, updated.providerName),
            updated,
          );
          return updated;
        },
      ),
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
          const row: InMemoryModelRow = {
            id: `model_${modelId++}`,
            ...(create as Record<string, unknown>),
            modelName: String(create.modelName),
            providerName:
              typeof create.providerName === "string"
                ? create.providerName
                : null,
            createdAt: now,
            updatedAt: now,
          };
          models.set(buildModelKey(row.modelName, row.providerName), row);
          return row;
        },
      ),
      delete: vi.fn(
        async ({
          where,
        }: {
          where: { id?: string; modelName?: string };
        }) => {
          const existing =
            where.id !== undefined
              ? [...models.values()].find((row) => row.id === where.id)
              : where.modelName
                ? models.get(where.modelName)
                : null;
          if (!existing) {
            const error = new Error("Not found") as Error & { code: string };
            error.code = "P2025";
            throw error;
          }
          models.delete(buildModelKey(existing.modelName, existing.providerName));
          return existing;
        },
      ),
    },
    modelProxyProvider: {
      findUnique: vi.fn(
        async ({ where }: { where: { name: string } }) =>
          providers.get(where.name) ?? null,
      ),
      findMany: vi.fn(async () =>
        [...providers.values()].sort((a, b) =>
          String(a.name).localeCompare(String(b.name)),
        ),
      ),
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        const now = new Date();
        const row = {
          id: `cred_${providerId++}`,
          ...data,
          apiKey: null,
          createdAt: now,
          updatedAt: now,
        };
        providers.set(String(data.name), row);
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
          const existing = providers.get(where.name);
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
          providers.set(updated.name, updated);
          return updated;
        },
      ),
      delete: vi.fn(async ({ where }: { where: { name: string } }) => {
        const existing = providers.get(where.name);
        if (!existing) {
          const error = new Error("Not found") as Error & { code: string };
          error.code = "P2025";
          throw error;
        }
        providers.delete(where.name);
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
          defaultProvider: "router-main",
          apiKey: "env:MODEL_PROXY_API_KEY",
        },
        openai: {
          name: "OpenAI",
          adapter: "openai-compatible" as const,
          baseUrl: "https://api.openai.com/v1",
          defaultProvider: "openai-main",
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
    expect(readBack.provider["local-proxy"]?.defaultProvider).toBe(
      "router-main",
    );

    const defaultSetting = await prisma.modelProxySetting.findUnique({
      where: { key: SETTING_KEYS.DEFAULT_PROVIDER },
    });
    expect(
      (defaultSetting?.value as { default_provider?: string })
        ?.default_provider,
    ).toBe("router-main");

    const provider = await prisma.modelProxyProvider.findUnique({
      where: { name: "openai-main" },
    });
    expect(provider?.secretRef).toBe("OPENAI_API_KEY");
  });

  it("does not expose literal provider secrets through provider config reads", async () => {
    const prisma = createInMemoryPrisma();
    const repository = createDbRepository({
      prisma: prisma as never,
      validateOnRead: false,
    });

    await prisma.modelProxyProvider.create({
      data: {
        name: "Iproute",
        provider: "openai",
        baseUrl: "https://llm.iproute.cloud/",
        secretRef: "sk-live-literal-secret",
      },
    });

    const readBack = await repository.read();

    expect(readBack.provider.openai).toMatchObject({
      name: "Iproute",
      baseUrl: "https://llm.iproute.cloud/",
      defaultProvider: "Iproute",
      ownedBy: "openai",
    });
    expect(readBack.provider.openai?.apiKey).toBeUndefined();
  });

  it("preserves provider-scoped model keys on read and write", async () => {
    const prisma = createInMemoryPrisma();
    const repository = createDbRepository({
      prisma: prisma as never,
      validateOnRead: false,
    });

    await repository.write({
      version: 1,
      provider: {
        "local-proxy": {
          name: "Local Model Proxy",
          baseUrl: "http://localhost:3008/v1",
          defaultProvider: "router-main",
          apiKey: "env:MODEL_PROXY_API_KEY",
        },
      },
      models: {
        "provider-a/gpt-4": {
          enabled: true,
          displayName: "GPT-4 A",
          limits: { length: 128000, maxOutput: 4096 },
        },
        "provider-b/gpt-4": {
          enabled: true,
          displayName: "GPT-4 B",
          limits: { length: 64000, maxOutput: 2048 },
        },
      },
    });

    const readBack = await repository.read();

    expect(readBack.models["provider-a/gpt-4"]?.displayName).toBe("GPT-4 A");
    expect(readBack.models["provider-b/gpt-4"]?.displayName).toBe("GPT-4 B");
    expect(readBack.models["gpt-4"]).toBeUndefined();

    await repository.write({
      ...readBack,
      models: {
        ...readBack.models,
        "provider-b/gpt-4": {
          ...readBack.models["provider-b/gpt-4"],
          displayName: "GPT-4 B Updated",
        },
      },
    });

    const updatedReadBack = await repository.read();

    expect(updatedReadBack.models["provider-a/gpt-4"]?.displayName).toBe(
      "GPT-4 A",
    );
    expect(updatedReadBack.models["provider-b/gpt-4"]?.displayName).toBe(
      "GPT-4 B Updated",
    );
  });
});
