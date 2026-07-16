import {
  modelProxyModels,
  modelProxyProviders,
} from "@lite-llm/database/schema";
import { describe, expect, it } from "vitest";
import { ModelsRepository } from "./models-repository.js";

function createQueryBuilder<T>(result: T) {
  return {
    from(table: unknown) {
      return {
        where() {
          return {
            limit() {
              if (table === modelProxyProviders) {
                return Promise.resolve(result);
              }
              return Promise.resolve([]);
            },
          };
        },
      };
    },
  };
}

describe("ModelsRepository provider persistence", () => {
  it("persists providerId when createModel receives providerName", async () => {
    let inserted:
      | (typeof modelProxyModels.$inferInsert & { modelId: string })
      | undefined;

    const db = {
      select() {
        return createQueryBuilder([{ id: "provider_1" }]);
      },
      insert(table: unknown) {
        expect(table).toBe(modelProxyModels);
        return {
          values(data: typeof modelProxyModels.$inferInsert) {
            inserted = { ...data, modelId: String(data.modelId) };
            return {
              returning() {
                return Promise.resolve([
                  {
                    id: "model_1",
                    modelId: inserted?.modelId ?? "llama-3.3-70b",
                    enabled: inserted?.enabled ?? true,
                    displayName: inserted?.displayName ?? null,
                    family: inserted?.family ?? null,
                    description: inserted?.description ?? null,
                    contextLength: inserted?.contextLength ?? null,
                    maxCompletionTokens: inserted?.maxCompletionTokens ?? null,
                    knowledgeCutoff: inserted?.knowledgeCutoff ?? null,
                    expirationDate: inserted?.expirationDate ?? null,
                    architecture: inserted?.architecture ?? null,
                    reasoning: inserted?.reasoning ?? null,
                    supportedParameters: inserted?.supportedParameters ?? null,
                    defaultParameters: inserted?.defaultParameters ?? null,
                    perRequestLimits: inserted?.perRequestLimits ?? null,
                    pricing: inserted?.pricing ?? null,
                    requestOptions: inserted?.requestOptions ?? null,
                    providerId: inserted?.providerId ?? null,
                    reasoningApiId: inserted?.reasoningApiId ?? null,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                  },
                ]);
              },
            };
          },
        };
      },
    };

    const repository = new ModelsRepository(db as never);
    await repository.createModel("llama-3.3-70b", {
      providerName: "groq-main",
    });

    expect(inserted?.providerId).toBe("provider_1");
  });

  it("updates providerId when updateModel receives providerName", async () => {
    let updated: Partial<typeof modelProxyModels.$inferInsert> | undefined;

    const existingRow = {
      id: "model_1",
      modelId: "llama-3.3-70b",
      enabled: true,
      displayName: null,
      family: null,
      description: null,
      contextLength: null,
      maxCompletionTokens: null,
      knowledgeCutoff: null,
      expirationDate: null,
      architecture: null,
      reasoning: null,
      supportedParameters: null,
      defaultParameters: null,
      perRequestLimits: null,
      pricing: null,
      requestOptions: null,
      providerId: null,
      reasoningApiId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const db = {
      select() {
        let call = 0;
        return {
          from(table: unknown) {
            return {
              where() {
                return {
                  limit() {
                    call += 1;
                    if (table === modelProxyModels && call === 1) {
                      return Promise.resolve([existingRow]);
                    }
                    if (table === modelProxyProviders) {
                      return Promise.resolve([{ id: "provider_2" }]);
                    }
                    return Promise.resolve([]);
                  },
                };
              },
            };
          },
        };
      },
      update(table: unknown) {
        expect(table).toBe(modelProxyModels);
        return {
          set(data: Partial<typeof modelProxyModels.$inferInsert>) {
            updated = data;
            return {
              where() {
                return {
                  returning() {
                    return Promise.resolve([
                      {
                        ...existingRow,
                        ...updated,
                        updatedAt: new Date(),
                      },
                    ]);
                  },
                };
              },
            };
          },
        };
      },
    };

    const repository = new ModelsRepository(db as never);
    await repository.updateModel("llama-3.3-70b", {
      providerName: "groq-main",
    });

    expect(updated?.providerId).toBe("provider_2");
  });
});
