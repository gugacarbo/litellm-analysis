import { SETTING_KEYS } from "@lite-llm/llm-config-service";
import { modelProxyModels } from "@lite-llm/database/schema/model-proxy";
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

function createInMemoryDb() {
  const settings = new Map<
    string,
    { id: string; key: string; value: unknown; createdAt: Date; updatedAt: Date }
  >();
  const models = new Map<string, InMemoryModelRow>();
  const providers = new Map<string, Record<string, unknown>>();
  let settingId = 1;
  let modelId = 1;
  let providerId = 1;

  function modelData() {
    const all = [...models.values()].sort((a, b) =>
      buildModelKey(String(a.modelName), (a.providerName as string | null | undefined) ?? null).localeCompare(
        buildModelKey(String(b.modelName), (b.providerName as string | null | undefined) ?? null),
      ),
    );
    return all;
  }

  function providerData() {
    return [...providers.values()].sort((a, b) =>
      String(a.name).localeCompare(String(b.name)),
    );
  }

  function settingData() {
    return [...settings.values()];
  }

  function buildSelect(fromData: () => unknown[]) {
    return {
      from: vi.fn(() => ({
        orderBy: vi.fn(async () => fromData()),
        where: vi.fn(async () => fromData()),
        limit: vi.fn(async (n: number) => fromData().slice(0, n)),
      })),
    };
  }

  // Track which table references were passed to help mock implementation
  const isModelsTable = (t: unknown) => t === modelProxyModels;

  const db = {
    select: vi.fn((fields?: unknown) => {
      if (fields && typeof fields === "object" && "count" in fields) {
        return {
          from: vi.fn(() => ({
            orderBy: vi.fn(async () => [{ count: models.size }]),
            where: vi.fn(async () => [{ count: models.size }]),
            limit: vi.fn(async () => [{ count: models.size }]),
            then: vi.fn(async (onfulfilled: (v: [{ count: number }]) => unknown) =>
              onfulfilled([{ count: models.size }]),
            ),
          })),
        };
      }
      return {
        from: vi.fn((table: unknown) => {
          if (isModelsTable(table)) {
            return {
              orderBy: vi.fn(async () => modelData()),
              where: vi.fn(async () => modelData()),
              limit: vi.fn(async (n: number) => modelData().slice(0, n)),
            };
          }
          return {
            orderBy: vi.fn(async () => providerData()),
            where: vi.fn(async () => providerData()),
            limit: vi.fn(async (n: number) => providerData().slice(0, n)),
          };
        }),
      };
    }),
    insert: vi.fn((table: unknown) => ({
      values: vi.fn(async (data: Record<string, unknown>) => {
        const now = new Date();
        const row: InMemoryModelRow = {
          id: `model_${modelId++}`,
          ...data,
          modelName: String(data.modelName),
          providerName: typeof data.providerName === "string" ? data.providerName : null,
          createdAt: now,
          updatedAt: now,
        };
        models.set(buildModelKey(row.modelName, row.providerName), row);
        return [row];
      }),
    })),
    update: vi.fn((table: unknown) => ({
      set: vi.fn((data: Record<string, unknown>) => ({
        where: vi.fn(async () => {
          const existing = [...models.values()][0];
          if (!existing) return [];
          const updated = { ...existing, ...data, updatedAt: new Date() };
          models.delete(buildModelKey(existing.modelName, existing.providerName));
          models.set(buildModelKey(updated.modelName, updated.providerName), updated);
          return [updated];
        }),
      })),
    })),
    delete: vi.fn((table: unknown) => ({
      where: vi.fn(async () => {
        for (const [key] of models) models.delete(key);
      }),
    })),
  };

  return {
    db,
    helpers: {
      settings,
      models,
      providers,
      settingId: () => settingId,
      modelId: () => modelId,
      providerId: () => providerId,
    },
  };
}

describe("DbModelsRepository", () => {
  it("round-trips models with thinking metadata", async () => {
    const { db, helpers } = createInMemoryDb();
    const repository = createDbRepository({
      db: db as never,
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

    expect(helpers.models.size).toBe(1);
    expect(helpers.settings.has(SETTING_KEYS.DEFAULT_PROVIDER)).toBe(true);
    expect(helpers.providers.has("openai-main")).toBe(true);
    const providerRecord = helpers.providers.get("openai-main") as Record<string, unknown>;
    expect(providerRecord?.secretRef).toBe("OPENAI_API_KEY");
  });

  it("does not expose literal provider secrets through provider config reads", async () => {
    const { db, helpers } = createInMemoryDb();
    const repository = createDbRepository({
      db: db as never,
      validateOnRead: false,
    });

    helpers.providers.set("Iproute", {
      name: "Iproute",
      provider: "openai",
      baseUrl: "https://llm.iproute.cloud/",
      secretRef: "sk-live-literal-secret",
      apiKey: null,
      createdAt: new Date(),
      updatedAt: new Date(),
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
    const { db, helpers } = createInMemoryDb();
    const repository = createDbRepository({
      db: db as never,
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
