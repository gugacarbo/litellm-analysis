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
  modelId: string;
  providerId?: string | null;
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
        String(a.modelId),
        (a.providerId as string | null | undefined) ?? null,
      ).localeCompare(
        buildModelKey(
          String(b.modelId),
          (b.providerId as string | null | undefined) ?? null,
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

  function extractEqValue(condition: unknown): unknown | null {
    if (!condition) return null;
    const sql = condition as {
      queryChunks?: { value?: unknown; encoder?: unknown }[];
    };
    if (Array.isArray(sql.queryChunks)) {
      for (const chunk of sql.queryChunks) {
        if (
          chunk &&
          typeof chunk === "object" &&
          "value" in chunk &&
          "encoder" in chunk
        ) {
          return chunk.value;
        }
      }
    }
    return null;
  }

  function createEqualityFilter(tableType: "model" | "provider" | "settings") {
    const searchKey =
      tableType === "model"
        ? "model_id"
        : tableType === "provider"
          ? "name"
          : "key";
    return (condition: unknown) => {
      const paramValue = extractEqValue(condition);
      if (paramValue !== null) {
        return paramValue;
      }
      // fallback for older stringified SQL shapes
      const conditionStr = String(condition);
      const match = conditionStr.match(new RegExp(`${searchKey}\\s*=\\s*\\$1`));
      const valueMatch = conditionStr.match(/: ("(?:[^"\\]|\\.)*"|[^,\s}]+)/);
      if (!match || !valueMatch) return null;
      try {
        return JSON.parse(valueMatch[1]);
      } catch {
        return valueMatch[1].replace(/^"|"$/g, "");
      }
    };
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
          let rowsFn: () => unknown[];
          let filterFn: ((condition: unknown) => string | null) | undefined;
          if (isModelsTable(table)) {
            rowsFn = modelData;
            filterFn = createEqualityFilter("model");
          } else if (isSettingsTable(table)) {
            rowsFn = settingData;
            filterFn = createEqualityFilter("settings");
          } else {
            rowsFn = providerData;
            filterFn = createEqualityFilter("provider");
          }

          let currentFilter:
            | ((row: Record<string, unknown>) => boolean)
            | null = null;
          const query = toThenable(
            {
              orderBy: vi.fn(() => query),
              where: vi.fn((condition: unknown) => {
                console.log("[WHERE] condition", typeof condition, condition, Object.getOwnPropertyNames(condition as object));
                const value = filterFn?.(condition);
                console.log("[WHERE] extracted value", value);
                if (value != null) {
                  currentFilter = (row) =>
                    String(
                      row[
                        filterFn === createEqualityFilter("model")
                          ? "modelId"
                          : filterFn === createEqualityFilter("provider")
                            ? "name"
                            : "key"
                      ],
                    ) === String(value);
                }
                return query;
              }),
              limit: vi.fn(async (n: number) => {
                const rows = rowsFn();
                const filtered = currentFilter
                  ? rows.filter((r) =>
                      currentFilter?.(r as Record<string, unknown>),
                    )
                  : rows;
                return filtered.slice(0, n);
              }),
            },
            async () => {
              const rows = rowsFn();
              const filtered = currentFilter
                ? rows.filter((r) =>
                    currentFilter?.(r as Record<string, unknown>),
                  )
                : rows;
              return filtered;
            },
          );
          return query;
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
              modelId: String(data.modelId),
              providerId:
                typeof data.providerId === "string" ? data.providerId : null,
              createdAt: now,
              updatedAt: now,
            };
            models.set(buildModelKey(row.modelId, row.providerId), row);
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
              apiKey: typeof data.apiKey === "string" ? data.apiKey : null,
              createdAt: now,
              updatedAt: now,
            };
            console.log("[DEBUG] create provider", row.name, "id", row.id, "set size before", providers.size);
            providers.set(row.name, row);
            console.log("[DEBUG] set size after", providers.size, "keys", [...providers.keys()]);
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
                buildModelKey(existing.modelId, existing.providerId),
              );
              models.set(
                buildModelKey(updated.modelId, updated.providerId),
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
  it("round-trips models with reasoning metadata", async () => {
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
          contextLength: 128000,
          maxCompletionTokens: 4096,
          pricing: { input: 0.00001, output: 0.00003 },
          reasoning: { effort: "high" as const },
        },
      },
    };

    await repository.write(config);
    const readBack = await repository.read();

    expect(readBack.models["gpt-4"]?.displayName).toBe("GPT-4");
    expect(readBack.models["gpt-4"]?.reasoning).toEqual({
      effort: "high",
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
        },
        "provider-a": {
          name: "provider-a",
          baseUrl: "http://provider-a.example.com/v1",
          defaultProvider: "provider-a",
        },
        "provider-b": {
          name: "provider-b",
          baseUrl: "http://provider-b.example.com/v1",
          defaultProvider: "provider-b",
        },
      },
      models: {
        "provider-a/gpt-4": {
          enabled: true,
          displayName: "GPT-4 A",
          contextLength: 128000,
          maxCompletionTokens: 4096,
        },
        "provider-b/gpt-4": {
          enabled: true,
          displayName: "GPT-4 B",
          contextLength: 64000,
          maxCompletionTokens: 2048,
        },
      },
    });

    // DEBUG
    console.log("after first write providers map keys:", [...helpers.providers.keys()]);
    for (const [k, v] of helpers.providers) {
      console.log("provider", k, "id", v.id);
    }
    console.log("after first write models map keys:", [...helpers.models.keys()]);
    for (const [k, v] of helpers.models) {
      console.log("row", k, "providerId", v.providerId, "modelId", v.modelId, "displayName", v.displayName);
    }

    const readBack = await repository.read();
    console.log("readBack models keys:", Object.keys(readBack.models));
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
