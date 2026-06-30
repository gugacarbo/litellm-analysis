import type { Prisma } from "@lite-llm/model-proxy-repository";
import { vi } from "vitest";

type SettingRow = {
  id: string;
  key: string;
  value: Prisma.JsonValue;
  createdAt: Date;
  updatedAt: Date;
};

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
  credentialName: string | null;
  secretRef: string | null;
  requestOptions: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
};

type CredentialRow = {
  id: string;
  name: string;
  provider: string | null;
  baseUrl: string | null;
  secretRef: string | null;
  apiKey: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export function createInMemoryPrisma() {
  const settings = new Map<string, SettingRow>();
  const models = new Map<string, ModelRow>();
  const credentials = new Map<string, CredentialRow>();
  const importJobs = new Map<
    string,
    {
      id: string;
      source: string;
      status: string;
      startedAt: Date;
      finishedAt: Date | null;
      summary: Prisma.JsonValue | null;
      error: string | null;
    }
  >();
  let settingId = 1;
  let modelId = 1;
  let credentialId = 1;
  let jobId = 1;

  return {
    modelProxySetting: {
      findUnique: vi.fn(async ({ where }: { where: { key: string } }) => {
        return settings.get(where.key) ?? null;
      }),
      findMany: vi.fn(async () =>
        [...settings.values()].sort((a, b) => a.key.localeCompare(b.key)),
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
          const existing = settings.get(where.key);
          const now = new Date();
          if (existing) {
            const updated = {
              ...existing,
              value: update.value,
              updatedAt: now,
            };
            settings.set(where.key, updated);
            return updated;
          }
          const created: SettingRow = {
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
      findUnique: vi.fn(async ({ where }: { where: { modelName: string } }) => {
        return models.get(where.modelName) ?? null;
      }),
      findMany: vi.fn(async () =>
        [...models.values()].sort((a, b) =>
          a.modelName.localeCompare(b.modelName),
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
          create: Partial<ModelRow> & { modelName: string };
          update: Partial<ModelRow>;
        }) => {
          const existing = models.get(where.modelName);
          const now = new Date();
          if (existing) {
            const updated = { ...existing, ...update, updatedAt: now };
            models.set(where.modelName, updated);
            return updated;
          }
          const row: ModelRow = {
            id: `model_${modelId++}`,
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
            credentialName: create.credentialName ?? null,
            secretRef: create.secretRef ?? null,
            requestOptions:
              (create.requestOptions as Record<string, unknown> | null) ?? null,
            metadata:
              (create.metadata as Record<string, unknown> | null) ?? null,
            createdAt: now,
            updatedAt: now,
          };
          models.set(row.modelName, row);
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
      findUnique: vi.fn(async ({ where }: { where: { name: string } }) => {
        return credentials.get(where.name) ?? null;
      }),
      findMany: vi.fn(async () =>
        [...credentials.values()].sort((a, b) => a.name.localeCompare(b.name)),
      ),
      create: vi.fn(
        async (args: {
          data: {
            name: string;
            provider?: string | null;
            baseUrl?: string | null;
            secretRef: string;
          };
        }) => {
          const now = new Date();
          const row: CredentialRow = {
            id: `cred_${credentialId++}`,
            name: args.data.name,
            provider: args.data.provider ?? null,
            baseUrl: args.data.baseUrl ?? null,
            secretRef: args.data.secretRef,
            apiKey: null,
            createdAt: now,
            updatedAt: now,
          };
          credentials.set(row.name, row);
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
          const existing = credentials.get(where.name);
          if (!existing) {
            const error = new Error("Not found") as Error & { code: string };
            error.code = "P2025";
            throw error;
          }
          const updated = { ...existing, ...data, updatedAt: new Date() };
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
    modelProxyImportJob: {
      create: vi.fn(
        async ({ data }: { data: { source: string; status: string } }) => {
          const row = {
            id: `job_${jobId++}`,
            source: data.source,
            status: data.status,
            startedAt: new Date(),
            finishedAt: null,
            summary: null,
            error: null,
          };
          importJobs.set(row.id, row);
          return row;
        },
      ),
      update: vi.fn(
        async ({
          where,
          data,
        }: {
          where: { id: string };
          data: Partial<{
            status: string;
            finishedAt: Date;
            summary: Prisma.JsonValue;
            error: string;
          }>;
        }) => {
          const existing = importJobs.get(where.id);
          if (!existing) {
            throw new Error("job not found");
          }
          const updated = { ...existing, ...data };
          importJobs.set(where.id, updated);
          return updated;
        },
      ),
    },
    $disconnect: vi.fn(async () => undefined),
  };
}
