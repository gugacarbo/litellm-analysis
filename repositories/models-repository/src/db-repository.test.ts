import {
  modelProxyModels,
  modelProxyProviders,
  modelProxySettings,
} from "@lite-llm/database/schema/model-proxy";
import { SETTING_KEYS } from "@lite-llm/llm-config-service";
import { describe, expect, it, vi } from "vitest";
import { createDbRepository } from "./db-repository";

type InMemoryModelRow = Record<string, unknown> & {
  id: string;
  modelName: string;
  providerName?: string | null;
  updatedAt: Date;
};

function buildModelKey(
  modelName: string,
  providerName?: string | null,
): string {
  return providerName ? `${providerName}/${modelName}` : modelName;
}

function createInMemoryDb() {
  const settings = new Map<
    string,
    {
      id: string;
      key: string;
      value: unknown;
      createdAt: Date;
      updatedAt: Date;
    }
  >();
  const models = new Map<string, InMemoryModelRow>();
  const providers = new Map<string, Record<string, unknown>>();
  const settingId = 1;
  let modelId = 1;
  let providerId = 1;

  function modelData() {
    const all = [...models.values()].sort((a, b) =>
      buildModelKey(
        String(a.modelName),
        (a.providerName as string | null | undefined) ?? null,
      ).localeCompare(
        buildModelKey(
          String(b.modelName),
          (b.providerName as string | null | undefined) ?? null,
        ),
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

  const isModelsTable = (t: unknown) => t === modelProxyModels;
  const isProvidersTable = (t: unknown) => t === modelProxyProviders;
  const isSettingsTable = (t: unknown) => t === modelProxySettings;

  function toThenable<T extends object, R>(
    target: T,
    run: () => Promise<R>,
  ): T & PromiseLike<R> {
    return Object.assign(target, {
      // biome-ignore lint/suspicious/noThenProperty: intentional thenable mock for Drizzle query builder
      then<TResult1 = R, TResult2 = never>(
        onfulfilled?: ((value: R) => TResult1 | PromiseLike<TResult1>) | null,
        onrejected?:
          | ((reason: unknown) => TResult2 | PromiseLike<TResult2>)
          | null,
      ) {
        return run().then(onfulfilled, onrejected);
      },
    });
  }

  function queryForRows(rows: () => unknown[]) {
    const query = toThenable(
      {
        orderBy: vi.fn(async () => rows()),
        where: vi.fn(() => query),
        limit: vi.fn(async (n: number) => rows().slice(0, n)),
      },
      async () => rows(),
    );
    return query;
  }

  const db = {
    select: vi.fn((fields?: unknown) => {
      if (fields && typeof fields === "object" && "count" in fields) {
        const countQuery = toThenable(
          {
            orderBy: vi.fn(async () => [{ count: models.size }]),
            where: vi.fn(() => countQuery),
            limit: vi.fn(async () => [{ count: models.size }]),
          },
          async () => [{ count: models.size }],
        );
        return {
          from: vi.fn(() => countQuery),
        };
      }
      return {
        from: vi.fn((table: unknown) => {
          if (isModelsTable(table)) {
            return queryForRows(modelData);
          }
          if (isSettingsTable(table)) {
            return queryForRows(settingData);
          }
          return queryForRows(providerData);
        }),
      };
    }),
    insert: vi.fn((table: unknown) => ({
      values: vi.fn((data: Record<string, unknown>) => {
        const now = new Date();

        if (isModelsTable(table)) {
          const insertRows = async () => {
            const row: InMemoryModelRow = {
              id: `model_${modelId++}`,
              ...data,
              modelName: String(data.modelName),
              providerName:
                typeof data.providerName === "string"
                  ? data.providerName
                  : null,
              createdAt: now,
              updatedAt: now,
            };
            models.set(buildModelKey(row.modelName, row.providerName), row);
            return [row];
          };

          return toThenable(
            {
              returning: vi.fn(insertRows),
            },
            insertRows,
          );
        }

        if (isProvidersTable(table)) {
          const insertRows = async () => {
            const row: {
              id: string;
              name: string;
              provider: string | null;
              baseUrl: string | null;
              apiKey: string | null;
              createdAt: Date;
              updatedAt: Date;
            } = {
              id: `provider_${providerId++}`,
              name: String(data.name),
              provider:
                typeof data.provider === "string" ? data.provider : null,
              baseUrl: typeof data.baseUrl === "string" ? data.baseUrl : null,
              apiKey:
                typeof data.apiKey === "string" ? data.apiKey : null,
              createdAt: now,
              updatedAt: now,
            };
            providers.set(row.name, row);
            return [row];
          };

          return toThenable(
            {
              returning: vi.fn(insertRows),
            },
            insertRows,
          );
        }

        if (isSettingsTable(table)) {
          const insertOrUpdate = async (setData?: Record<string, unknown>) => {
            const existing = settings.get(String(data.key));
            const row = existing
              ? {
                  ...existing,
                  value: setData?.value ?? data.value,
                  updatedAt:
                    setData?.updatedAt instanceof Date
                      ? setData.updatedAt
                      : now,
                }
              : {
                  id: `setting_${settingId}`,
                  key: String(data.key),
                  value: data.value,
                  createdAt: now,
                  updatedAt: now,
                };
            settings.set(row.key, row);
            return [row];
          };

          return {
            onConflictDoUpdate: vi.fn(
              ({ set }: { set: Record<string, unknown> }) => ({
                returning: vi.fn(() => insertOrUpdate(set)),
              }),
            ),
            returning: vi.fn(() => insertOrUpdate()),
          };
        }

        return toThenable(
          {
            returning: vi.fn(async () => []),
          },
          async () => [],
        );
      }),
    })),
    update: vi.fn((table: unknown) => ({
      set: vi.fn((data: Record<string, unknown>) => ({
        where: vi.fn(() => {
          const run = async () => {
            if (isModelsTable(table)) {
              const existing = [...models.values()][0];
              if (!existing) return [];
              const updated = { ...existing, ...data, updatedAt: new Date() };
              models.delete(
                buildModelKey(existing.modelName, existing.providerName),
              );
              models.set(
                buildModelKey(updated.modelName, updated.providerName),
                updated,
              );
              return [updated];
            }

            if (isProvidersTable(table)) {
              const existing = [...providers.values()][0] as
                | ({
                    name: string;
                  } & Record<string, unknown>)
                | undefined;
              if (!existing) return [];
              const updated = { ...existing, ...data, updatedAt: new Date() };
              providers.delete(String(existing.name));
              providers.set(String(updated.name), updated);
              return [updated];
            }

            if (isSettingsTable(table)) {
              const existing = [...settings.values()][0];
              if (!existing) return [];
              const updated = { ...existing, ...data, updatedAt: new Date() };
              settings.set(String(updated.key), updated);
              return [updated];
            }

            return [];
          };

          return toThenable(
            {
              returning: vi.fn(run),
            },
            run,
          );
        }),
      })),
    })),
    delete: vi.fn((table: unknown) => ({
      where: vi.fn(() => {
        const run = async () => {
          if (isModelsTable(table)) {
            for (const [key] of models) models.delete(key);
            return [];
          }

          if (isSettingsTable(table)) {
            const [existing] = [...settings.values()];
            if (!existing) return [];
            settings.delete(existing.key);
            return [{ id: existing.id }];
          }

          return [];
        };

        return toThenable(
          {
            returning: vi.fn(run),
          },
          run,
        );
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
        },
        openai: {
          name: "OpenAI",
          adapter: "openai-compatible" as const,
          baseUrl: "https://api.openai.com/v1",
          defaultProvider: "openai-main",
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
    const providerRecord = helpers.providers.get("openai-main") as Record<
      string,
      unknown
    >;
    expect(providerRecord?.apiKey).toBeNull();
  });

  it("does not expose upstream provider credentials through provider config reads", async () => {
    const { db, helpers } = createInMemoryDb();
    const repository = createDbRepository({
      db: db as never,
      validateOnRead: false,
    });

    helpers.providers.set("Iproute", {
      name: "Iproute",
      provider: "openai",
      baseUrl: "https://llm.iproute.cloud/",
      apiKey: "sk-live-literal-secret",
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
  });

  it("preserves provider-scoped model keys on read and write", async () => {
    const { db } = createInMemoryDb();
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
