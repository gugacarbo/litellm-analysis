import { beforeEach, describe, expect, it, vi } from "vitest";
import { ModelsRepository } from "../../repositories/models-repository.js";
import { RegistryModelsService } from "../registry-models.service.js";

type ModelRow = {
  id: string;
  modelName: string;
  enabled: boolean;
  displayName: string | null;
  family: string | null;
  ownedBy: string | null;
  apiMode: string | null;
  vision: boolean | null;
  contextWindowSize: number | null;
  maxOutputTokens: number | null;
  inputCostPerToken: number | null;
  outputCostPerToken: number | null;
  upstreamModel: string | null;
  upstreamBaseUrl: string | null;
  providerName: string | null;
  secretRef: string | null;
  requestOptions: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
};

function createModelsPrismaMock() {
  const rows = new Map<string, ModelRow>();
  let idCounter = 1;

  const resolveProviderName = (
    data: Partial<ModelRow> & {
      provider?: { connect?: { name: string }; disconnect?: boolean };
    },
    existingProviderName: string | null = null,
  ) => {
    if (data.provider?.disconnect) {
      return null;
    }
    if (data.provider?.connect?.name) {
      return data.provider.connect.name;
    }
    return data.providerName ?? existingProviderName;
  };

  const applyUpdate = (
    existing: ModelRow,
    data: Partial<ModelRow> & {
      provider?: { connect?: { name: string }; disconnect?: boolean };
    },
  ): ModelRow => ({
    ...existing,
    ...data,
    providerName: resolveProviderName(data, existing.providerName),
    updatedAt: new Date(),
  });

  return {
    modelProxyModel: {
      findFirst: vi.fn(async ({ where }: { where: { modelName: string } }) => {
        return rows.get(where.modelName) ?? null;
      }),
      findUnique: vi.fn(async ({ where }: { where: { modelName: string } }) => {
        return rows.get(where.modelName) ?? null;
      }),
      findMany: vi.fn(
        async ({ where }: { where?: { enabled?: boolean } } = {}) => {
          const all = [...rows.values()].sort((a, b) =>
            a.modelName.localeCompare(b.modelName),
          );
          if (where?.enabled === undefined) {
            return all;
          }
          return all.filter((row) => row.enabled === where.enabled);
        },
      ),
      create: vi.fn(
        async ({
          data,
        }: {
          data: Partial<ModelRow> & {
            modelName: string;
            provider?: { connect?: { name: string }; disconnect?: boolean };
          };
        }) => {
          const now = new Date();
          const row: ModelRow = {
            id: `model_${idCounter++}`,
            modelName: data.modelName,
            enabled: data.enabled ?? true,
            displayName: data.displayName ?? null,
            family: data.family ?? null,
            ownedBy: data.ownedBy ?? null,
            apiMode: data.apiMode ?? null,
            vision: data.vision ?? null,
            contextWindowSize: data.contextWindowSize ?? null,
            maxOutputTokens: data.maxOutputTokens ?? null,
            inputCostPerToken: data.inputCostPerToken ?? null,
            outputCostPerToken: data.outputCostPerToken ?? null,
            upstreamModel: data.upstreamModel ?? null,
            upstreamBaseUrl: data.upstreamBaseUrl ?? null,
            providerName: resolveProviderName(data),
            secretRef: data.secretRef ?? null,
            requestOptions:
              (data.requestOptions as Record<string, unknown> | null) ?? null,
            metadata: (data.metadata as Record<string, unknown> | null) ?? null,
            createdAt: now,
            updatedAt: now,
          };
          rows.set(row.modelName, row);
          return row;
        },
      ),
      update: vi.fn(
        async ({
          where,
          data,
        }: {
          where: { id: string };
          data: Partial<ModelRow> & {
            provider?: { connect?: { name: string }; disconnect?: boolean };
          };
        }) => {
          const existing = [...rows.values()].find((row) => row.id === where.id);
          if (!existing) {
            const error = new Error("Not found") as Error & { code: string };
            error.code = "P2025";
            throw error;
          }
          const updated = applyUpdate(existing, data);
          rows.set(existing.modelName, updated);
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
          create: Partial<ModelRow> & {
            modelName: string;
            provider?: { connect?: { name: string }; disconnect?: boolean };
          };
          update: Partial<ModelRow> & {
            provider?: { connect?: { name: string }; disconnect?: boolean };
          };
        }) => {
          const existing = rows.get(where.modelName);
          if (existing) {
            const updated = applyUpdate(existing, update);
            rows.set(where.modelName, updated);
            return updated;
          }
          const now = new Date();
          const row: ModelRow = {
            id: `model_${idCounter++}`,
            modelName: create.modelName,
            enabled: create.enabled ?? true,
            displayName: create.displayName ?? null,
            family: create.family ?? null,
            ownedBy: create.ownedBy ?? null,
            apiMode: create.apiMode ?? null,
            vision: create.vision ?? null,
            contextWindowSize: create.contextWindowSize ?? null,
            maxOutputTokens: create.maxOutputTokens ?? null,
            inputCostPerToken: create.inputCostPerToken ?? null,
            outputCostPerToken: create.outputCostPerToken ?? null,
            upstreamModel: create.upstreamModel ?? null,
            upstreamBaseUrl: create.upstreamBaseUrl ?? null,
            providerName: resolveProviderName(create),
            secretRef: create.secretRef ?? null,
            requestOptions:
              (create.requestOptions as Record<string, unknown> | null) ?? null,
            metadata:
              (create.metadata as Record<string, unknown> | null) ?? null,
            createdAt: now,
            updatedAt: now,
          };
          rows.set(row.modelName, row);
          return row;
        },
      ),
      delete: vi.fn(async ({ where }: { where: { id: string } }) => {
        const existing = [...rows.values()].find((row) => row.id === where.id);
        if (!existing) {
          const error = new Error("Not found") as Error & { code: string };
          error.code = "P2025";
          throw error;
        }
        rows.delete(existing.modelName);
        return existing;
      }),
    },
  };
}

describe("RegistryModelsService", () => {
  let service: RegistryModelsService;

  beforeEach(() => {
    const prisma = createModelsPrismaMock();
    service = new RegistryModelsService({
      repository: new ModelsRepository(prisma as never),
    });
  });

  it("creates and gets model route", async () => {
    await service.create("gpt-test", {
      displayName: "GPT Test",
      inputCostPerToken: 0.000001,
      providerName: "openai-main",
    });
    const route = await service.getRoute("gpt-test");
    expect(route?.displayName).toBe("GPT Test");
    expect(route?.providerName).toBe("openai-main");
  });

  it("throws on duplicate create", async () => {
    await service.create("gpt-test");
    await expect(service.create("gpt-test")).rejects.toThrow(/already exists/);
  });

  it("updates model fields", async () => {
    await service.create("gpt-test", { enabled: true });
    const updated = await service.update("gpt-test", {
      enabled: false,
      maxOutputTokens: 4096,
    });
    expect(updated.enabled).toBe(false);
    expect(updated.maxOutputTokens).toBe(4096);
  });

  it("enables and disables models", async () => {
    await service.create("gpt-test", { enabled: false });
    const enabled = await service.enable("gpt-test");
    expect(enabled.enabled).toBe(true);
    const disabled = await service.disable("gpt-test");
    expect(disabled.enabled).toBe(false);
  });

  it("lists enabled models only", async () => {
    await service.create("enabled-model", { enabled: true });
    await service.create("disabled-model", { enabled: false });
    const enabledOnly = await service.list({ enabledOnly: true });
    expect(enabledOnly.map((row) => row.modelName)).toEqual(["enabled-model"]);
  });

  it("upserts model route", async () => {
    const created = await service.upsert("gpt-test", {
      displayName: "First",
    });
    expect(created.displayName).toBe("First");
    const updated = await service.upsert("gpt-test", {
      displayName: "Second",
    });
    expect(updated.displayName).toBe("Second");
  });

  it("deletes model", async () => {
    await service.create("gpt-test");
    expect(await service.delete("gpt-test")).toBe(true);
    expect(await service.get("gpt-test")).toBeNull();
  });
});
