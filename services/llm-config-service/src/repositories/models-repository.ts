import type { DatabaseClient } from "@lite-llm/database";

import {
  modelProxyModels,
  modelProxyProviders,
  modelProxyReasoningApis,
} from "@lite-llm/database/schema";
import { and, eq, inArray } from "drizzle-orm";
import { type ModelConfig, ModelConfigSchema } from "../schemas/model.js";
import { type Effort, EffortSchema } from "../schemas/thinking.js";

export type ModelProxyModelRecord = typeof modelProxyModels.$inferSelect;
export type ModelProxyReasoningApiRecord =
  typeof modelProxyReasoningApis.$inferSelect;

export type CreateModelInput = Omit<
  ModelProxyModelRecord,
  "id" | "createdAt" | "updatedAt" | "reasoningApiId"
> & {
  reasoningApiSlug?: string;
};

export type CreateReasoningApiInput = Omit<
  ModelProxyReasoningApiRecord,
  "id" | "createdAt" | "updatedAt" | "providerId"
> & {
  providerName: string;
};

export type UpdateModelInput = Partial<CreateModelInput> & {
  reasoningApiSlug?: string | null;
};

export class ModelsRepository {
  private readonly db: DatabaseClient;

  constructor(db: DatabaseClient) {
    this.db = db;
  }

  private get modelApi():
    | {
        findFirst?: (args: {
          where: { modelId?: string; providerId?: string; id?: string };
        }) => Promise<ModelProxyModelRecord | null>;
        findUnique?: (args: {
          where: { modelId?: string; providerId?: string; id?: string };
        }) => Promise<ModelProxyModelRecord | null>;
        findMany?: (args?: {
          where?: { enabled?: boolean; providerId?: string; id?: string };
        }) => Promise<ModelProxyModelRecord[]>;
        create?: (args: {
          data: Partial<ModelProxyModelRecord> & { modelId: string };
        }) => Promise<ModelProxyModelRecord>;
        update?: (args: {
          where: { id: string };
          data: Partial<ModelProxyModelRecord>;
        }) => Promise<ModelProxyModelRecord | null>;
        upsert?: (args: {
          where: { modelId: string };
          create: Partial<ModelProxyModelRecord> & { modelId: string };
          update: Partial<ModelProxyModelRecord>;
        }) => Promise<ModelProxyModelRecord>;
        delete?: (args: {
          where: { id: string };
        }) => Promise<ModelProxyModelRecord | null>;
      }
    | undefined {
    return (this.db as { modelProxyModel?: unknown }).modelProxyModel as
      | {
          findFirst?: (args: {
            where: { modelId?: string; providerId?: string; id?: string };
          }) => Promise<ModelProxyModelRecord | null>;
          findUnique?: (args: {
            where: { modelId?: string; providerId?: string; id?: string };
          }) => Promise<ModelProxyModelRecord | null>;
          findMany?: (args?: {
            where?: { enabled?: boolean; providerId?: string; id?: string };
          }) => Promise<ModelProxyModelRecord[]>;
          create?: (args: {
            data: Partial<ModelProxyModelRecord> & { modelId: string };
          }) => Promise<ModelProxyModelRecord>;
          update?: (args: {
            where: { id: string };
            data: Partial<ModelProxyModelRecord>;
          }) => Promise<ModelProxyModelRecord | null>;
          upsert?: (args: {
            where: { modelId: string };
            create: Partial<ModelProxyModelRecord> & { modelId: string };
            update: Partial<ModelProxyModelRecord>;
          }) => Promise<ModelProxyModelRecord>;
          delete?: (args: {
            where: { id: string };
          }) => Promise<ModelProxyModelRecord | null>;
        }
      | undefined;
  }

  private get providerApi():
    | {
        findUnique?: (args: { where: { name: string } }) => Promise<{
          id: string;
          name: string;
        } | null>;
        findMany?: () => Promise<
          Array<{
            id: string;
            name: string;
          }>
        >;
      }
    | undefined {
    return (this.db as { modelProxyProvider?: unknown }).modelProxyProvider as
      | {
          findUnique?: (args: { where: { name: string } }) => Promise<{
            id: string;
            name: string;
          } | null>;
          findMany?: () => Promise<
            Array<{
              id: string;
              name: string;
            }>
          >;
        }
      | undefined;
  }

  async findByModelIdAndProviderId(
    modelId: string,
    providerId: string,
  ): Promise<ModelProxyModelRecord | null> {
    const api = this.modelApi;
    if (api?.findFirst) {
      return api.findFirst({ where: { modelId, providerId } });
    }
    const rows = await this.db
      .select()
      .from(modelProxyModels)
      .where(
        and(
          eq(modelProxyModels.modelId, modelId),
          eq(modelProxyModels.providerId, providerId),
        ),
      )
      .limit(1);
    return rows[0] ?? null;
  }

  async findByModelNameAndProviderName(
    modelName: string,
    providerName: string,
  ): Promise<ModelProxyModelRecord | null> {
    const provider = await this.db
      .select({ id: modelProxyProviders.id })
      .from(modelProxyProviders)
      .where(eq(modelProxyProviders.name, providerName))
      .limit(1);
    const providerId = provider[0]?.id;
    if (!providerId) {
      return null;
    }

    return this.findByModelIdAndProviderId(modelName, providerId);
  }

  async findById(id: string): Promise<ModelProxyModelRecord | null> {
    const api = this.modelApi;
    if (api?.findUnique) {
      return api.findUnique({ where: { id } });
    }
    const rows = await this.db
      .select()
      .from(modelProxyModels)
      .where(eq(modelProxyModels.id, id))
      .limit(1);
    return rows[0] ?? null;
  }

  async findByProviderId(providerId: string): Promise<ModelProxyModelRecord[]> {
    const api = this.modelApi;
    if (api?.findMany) {
      const rows = await api.findMany({ where: { providerId } });
      return rows.filter((row) => row.providerId === providerId);
    }
    return this.db
      .select()
      .from(modelProxyModels)
      .where(eq(modelProxyModels.providerId, providerId));
  }

  async findProviderNameById(providerId: string): Promise<string | null> {
    const api = this.providerApi;
    if (api?.findMany) {
      const provider = (await api.findMany()).find(
        (row) => row.id === providerId,
      );
      return provider?.name ?? null;
    }
    const [row] = await this.db
      .select({ name: modelProxyProviders.name })
      .from(modelProxyProviders)
      .where(eq(modelProxyProviders.id, providerId))
      .limit(1);
    return row?.name ?? null;
  }

  async findManyByIds(ids: string[]): Promise<ModelProxyModelRecord[]> {
    if (ids.length === 0) return [];
    const api = this.modelApi;
    if (api?.findMany) {
      const rows = await api.findMany();
      return rows.filter((row) => ids.includes(row.id));
    }
    return this.db
      .select()
      .from(modelProxyModels)
      .where(inArray(modelProxyModels.id, ids));
  }

  async listAll(): Promise<ModelProxyModelRecord[]> {
    const api = this.modelApi;
    if (api?.findMany) {
      return api.findMany();
    }
    return this.db.select().from(modelProxyModels);
  }

  async create(input: CreateModelInput): Promise<ModelProxyModelRecord> {
    const { reasoningApiSlug, ...rest } = input;
    let reasoningApiId: string | null = null;
    if (reasoningApiSlug) {
      const api = await this.findReasoningApiBySlug(reasoningApiSlug);
      reasoningApiId = api?.id ?? null;
    }
    const modelApi = this.modelApi;
    if (modelApi?.create) {
      return modelApi.create({ data: { ...rest, reasoningApiId } });
    }
    const rows = await this.db
      .insert(modelProxyModels)
      .values({ ...rest, reasoningApiId })
      .returning();
    const created = rows[0];
    if (!created) {
      throw new Error("Failed to create model proxy model");
    }
    return created;
  }

  async update(
    id: string,
    input: UpdateModelInput,
  ): Promise<ModelProxyModelRecord> {
    const { reasoningApiSlug, ...rest } = input;
    const update: Partial<typeof modelProxyModels.$inferInsert> = { ...rest };
    if (reasoningApiSlug === null) {
      update.reasoningApiId = null;
    } else if (reasoningApiSlug) {
      const api = await this.findReasoningApiBySlug(reasoningApiSlug);
      update.reasoningApiId = api?.id ?? null;
    }
    const modelApi = this.modelApi;
    if (modelApi?.update) {
      const updated = await modelApi.update({ where: { id }, data: update });
      if (!updated) {
        throw new Error(`Model proxy model not found: ${id}`);
      }
      return updated;
    }
    const rows = await this.db
      .update(modelProxyModels)
      .set(update)
      .where(eq(modelProxyModels.id, id))
      .returning();
    const updated = rows[0];
    if (!updated) {
      throw new Error(`Model proxy model not found: ${id}`);
    }
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const api = this.modelApi;
    if (api?.delete) {
      return !!(await api.delete({ where: { id } }));
    }
    const result = await this.db
      .delete(modelProxyModels)
      .where(eq(modelProxyModels.id, id))
      .returning({ id: modelProxyModels.id });
    return result.length > 0;
  }

  async list(
    _options?: Record<string, unknown>,
  ): Promise<ModelProxyModelRecord[]> {
    return this.listAll();
  }

  async findByModelName(
    modelName: string,
  ): Promise<ModelProxyModelRecord | null> {
    const api = this.modelApi;
    if (api?.findFirst) {
      return api.findFirst({ where: { modelId: modelName } });
    }
    const rows = await this.db
      .select()
      .from(modelProxyModels)
      .where(eq(modelProxyModels.modelId, modelName))
      .limit(1);
    return rows[0] ?? null;
  }

  async createModel(
    modelName: string,
    route: Record<string, unknown>,
  ): Promise<ModelProxyModelRecord> {
    const providerId = await this.resolveProviderIdFromRoute(route);
    const existing = providerId
      ? await this.findByModelIdAndProviderId(modelName, providerId)
      : await this.findByModelName(modelName);
    if (existing) {
      throw new Error(`Model "${modelName}" already exists`);
    }
    const api = this.modelApi;
    if (api?.create) {
      return api.create({
        data: {
          modelId: modelName,
          providerId,
          enabled: (route.enabled as boolean) ?? true,
          displayName: (route.displayName as string) ?? null,
          family: (route.family as string) ?? null,
          canonicalSlug: (route.canonicalSlug as string) ?? null,
          description: (route.description as string) ?? null,
          contextLength: (route.contextLength as number) ?? null,
          maxCompletionTokens: (route.maxCompletionTokens as number) ?? null,
          knowledgeCutoff: (route.knowledgeCutoff as string) ?? null,
          expirationDate: (route.expirationDate as string) ?? null,
          architecture: (route.architecture ?? null) as never,
          reasoning: (route.reasoning ?? null) as never,
          supportedParameters: (route.supportedParameters ?? null) as never,
          defaultParameters: (route.defaultParameters ?? null) as never,
          perRequestLimits: (route.perRequestLimits ?? null) as never,
          pricing: (route.pricing ?? null) as never,
          requestOptions: (route.requestOptions ?? null) as never,
        },
      });
    }
    const rows = await this.db
      .insert(modelProxyModels)
      .values({
        modelId: modelName,
        providerId,
        enabled: (route.enabled as boolean) ?? true,
        displayName: (route.displayName as string) ?? null,
        family: (route.family as string) ?? null,
        canonicalSlug: (route.canonicalSlug as string) ?? null,
        description: (route.description as string) ?? null,
        contextLength: (route.contextLength as number) ?? null,
        maxCompletionTokens: (route.maxCompletionTokens as number) ?? null,
        knowledgeCutoff: (route.knowledgeCutoff as string) ?? null,
        expirationDate: (route.expirationDate as string) ?? null,
        architecture: (route.architecture ?? null) as never,
        reasoning: (route.reasoning ?? null) as never,
        supportedParameters: (route.supportedParameters ?? null) as never,
        defaultParameters: (route.defaultParameters ?? null) as never,
        perRequestLimits: (route.perRequestLimits ?? null) as never,
        pricing: (route.pricing ?? null) as never,
        requestOptions: (route.requestOptions ?? null) as never,
      })
      .returning();
    const created = rows[0];
    if (!created) throw new Error(`Failed to create model: ${modelName}`);
    return created;
  }

  async updateModel(
    modelName: string,
    route: Record<string, unknown>,
  ): Promise<ModelProxyModelRecord | null> {
    const providerId = await this.resolveProviderIdFromRoute(route);
    const existing = providerId
      ? await this.findByModelIdAndProviderId(modelName, providerId)
      : await this.findByModelName(modelName);
    if (!existing) return null;
    const api = this.modelApi;
    if (api?.update) {
      const updated = await api.update({
        where: { id: existing.id },
        data: {
          providerId,
          enabled: (route.enabled as boolean) ?? undefined,
          displayName: (route.displayName as string) ?? undefined,
          family: (route.family as string) ?? undefined,
          canonicalSlug: (route.canonicalSlug as string) ?? undefined,
          description: (route.description as string) ?? undefined,
          contextLength: (route.contextLength as number) ?? undefined,
          maxCompletionTokens:
            (route.maxCompletionTokens as number) ?? undefined,
          knowledgeCutoff: (route.knowledgeCutoff as string) ?? undefined,
          expirationDate: (route.expirationDate as string) ?? undefined,
          architecture: (route.architecture ?? undefined) as never,
          reasoning: (route.reasoning ?? undefined) as never,
          supportedParameters: (route.supportedParameters ??
            undefined) as never,
          defaultParameters: (route.defaultParameters ?? undefined) as never,
          perRequestLimits: (route.perRequestLimits ?? undefined) as never,
          pricing: (route.pricing ?? undefined) as never,
          requestOptions: (route.requestOptions ?? undefined) as never,
        },
      });
      return updated ?? null;
    }
    const rows = await this.db
      .update(modelProxyModels)
      .set({
        providerId,
        enabled: (route.enabled as boolean) ?? undefined,
        displayName: (route.displayName as string) ?? undefined,
        family: (route.family as string) ?? undefined,
        canonicalSlug: (route.canonicalSlug as string) ?? undefined,
        description: (route.description as string) ?? undefined,
        contextLength: (route.contextLength as number) ?? undefined,
        maxCompletionTokens: (route.maxCompletionTokens as number) ?? undefined,
        knowledgeCutoff: (route.knowledgeCutoff as string) ?? undefined,
        expirationDate: (route.expirationDate as string) ?? undefined,
        architecture: (route.architecture ?? undefined) as never,
        reasoning: (route.reasoning ?? undefined) as never,
        supportedParameters: (route.supportedParameters ?? undefined) as never,
        defaultParameters: (route.defaultParameters ?? undefined) as never,
        perRequestLimits: (route.perRequestLimits ?? undefined) as never,
        pricing: (route.pricing ?? undefined) as never,
        requestOptions: (route.requestOptions ?? undefined) as never,
      })
      .where(eq(modelProxyModels.id, existing.id))
      .returning();
    return rows[0] ?? null;
  }

  async upsertModel(
    modelName: string,
    route: Record<string, unknown>,
  ): Promise<ModelProxyModelRecord> {
    const providerId = await this.resolveProviderIdFromRoute(route);
    const existing = providerId
      ? await this.findByModelIdAndProviderId(modelName, providerId)
      : await this.findByModelName(modelName);
    if (existing) {
      const updated = await this.updateModel(modelName, route);
      if (!updated) {
        throw new Error(`Model proxy model not found: ${modelName}`);
      }
      return updated;
    }
    const api = this.modelApi;
    if (api?.upsert) {
      return api.upsert({
        where: { modelId: modelName },
        create: {
          modelId: modelName,
          providerId,
          enabled: (route.enabled as boolean) ?? true,
          displayName: (route.displayName as string) ?? null,
          family: (route.family as string) ?? null,
          canonicalSlug: (route.canonicalSlug as string) ?? null,
          description: (route.description as string) ?? null,
          contextLength: (route.contextLength as number) ?? null,
          maxCompletionTokens: (route.maxCompletionTokens as number) ?? null,
          knowledgeCutoff: (route.knowledgeCutoff as string) ?? null,
          expirationDate: (route.expirationDate as string) ?? null,
          architecture: (route.architecture ?? null) as never,
          reasoning: (route.reasoning ?? null) as never,
          supportedParameters: (route.supportedParameters ?? null) as never,
          defaultParameters: (route.defaultParameters ?? null) as never,
          perRequestLimits: (route.perRequestLimits ?? null) as never,
          pricing: (route.pricing ?? null) as never,
          requestOptions: (route.requestOptions ?? null) as never,
        },
        update: {
          providerId,
          enabled: (route.enabled as boolean) ?? undefined,
          displayName: (route.displayName as string) ?? undefined,
          family: (route.family as string) ?? undefined,
          canonicalSlug: (route.canonicalSlug as string) ?? undefined,
          description: (route.description as string) ?? undefined,
          contextLength: (route.contextLength as number) ?? undefined,
          maxCompletionTokens:
            (route.maxCompletionTokens as number) ?? undefined,
          knowledgeCutoff: (route.knowledgeCutoff as string) ?? undefined,
          expirationDate: (route.expirationDate as string) ?? undefined,
          architecture: (route.architecture ?? undefined) as never,
          reasoning: (route.reasoning ?? undefined) as never,
          supportedParameters: (route.supportedParameters ??
            undefined) as never,
          defaultParameters: (route.defaultParameters ?? undefined) as never,
          perRequestLimits: (route.perRequestLimits ?? undefined) as never,
          pricing: (route.pricing ?? undefined) as never,
          requestOptions: (route.requestOptions ?? undefined) as never,
        },
      });
    }
    return this.createModel(modelName, route);
  }

  async setEnabled(
    modelName: string,
    enabled: boolean,
  ): Promise<ModelProxyModelRecord | null> {
    const existing = await this.findByModelName(modelName);
    if (!existing) return null;
    const api = this.modelApi;
    if (api?.update) {
      const updated = await api.update({
        where: { id: existing.id },
        data: { enabled },
      });
      return updated ?? null;
    }
    const rows = await this.db
      .update(modelProxyModels)
      .set({ enabled })
      .where(eq(modelProxyModels.id, existing.id))
      .returning();
    return rows[0] ?? null;
  }

  async findReasoningApiBySlug(
    slug: string,
  ): Promise<ModelProxyReasoningApiRecord | null> {
    const rows = await this.db
      .select()
      .from(modelProxyReasoningApis)
      .where(eq(modelProxyReasoningApis.slug, slug))
      .limit(1);
    return rows[0] ?? null;
  }

  async findReasoningApiById(
    id: string,
  ): Promise<ModelProxyReasoningApiRecord | null> {
    const rows = await this.db
      .select()
      .from(modelProxyReasoningApis)
      .where(eq(modelProxyReasoningApis.id, id))
      .limit(1);
    return rows[0] ?? null;
  }

  async listReasoningApis(): Promise<ModelProxyReasoningApiRecord[]> {
    return this.db.select().from(modelProxyReasoningApis);
  }

  async listReasoningApisByProviderId(
    providerId: string,
  ): Promise<ModelProxyReasoningApiRecord[]> {
    return this.db
      .select()
      .from(modelProxyReasoningApis)
      .where(eq(modelProxyReasoningApis.providerId, providerId));
  }

  async createReasoningApi(
    input: CreateReasoningApiInput,
  ): Promise<ModelProxyReasoningApiRecord> {
    const { providerName, ...rest } = input;
    const provider = await this.db
      .select({ id: modelProxyProviders.id })
      .from(modelProxyProviders)
      .where(eq(modelProxyProviders.name, providerName))
      .limit(1);
    const providerId = provider[0]?.id;
    if (!providerId) {
      throw new Error(`Provider not found: ${providerName}`);
    }
    const rows = await this.db
      .insert(modelProxyReasoningApis)
      .values({ ...rest, providerId })
      .returning();
    const created = rows[0];
    if (!created) {
      throw new Error("Failed to create reasoning api");
    }
    return created;
  }

  async deleteReasoningApi(id: string): Promise<void> {
    await this.db
      .delete(modelProxyReasoningApis)
      .where(eq(modelProxyReasoningApis.id, id));
  }

  async toModelConfig(
    record: ModelProxyModelRecord,
    providerName: string,
  ): Promise<ModelConfig> {
    return toModelConfig(record, providerName);
  }

  private async resolveProviderIdFromRoute(
    route: Record<string, unknown>,
  ): Promise<string> {
    if ("providerId" in route) {
      const providerId = route.providerId;
      if (typeof providerId === "string" && providerId.trim()) {
        return providerId;
      }
      throw new Error("Model route requires a non-empty providerId");
    }

    const providerName =
      typeof route.providerName === "string" ? route.providerName.trim() : "";
    if (!providerName) {
      const [defaultProvider] = await this.db
        .select({ id: modelProxyProviders.id })
        .from(modelProxyProviders)
        .where(eq(modelProxyProviders.isDefault, true))
        .limit(1);
      if (defaultProvider) {
        return defaultProvider.id;
      }
      throw new Error(
        "Model route requires providerName or a default provider",
      );
    }

    const providerApi = this.providerApi;
    if (providerApi?.findUnique) {
      const provider = await providerApi.findUnique({
        where: { name: providerName },
      });
      if (provider) {
        return provider.id;
      }
      throw new Error(`Provider not found: ${providerName}`);
    }
    if (providerApi?.findMany) {
      const provider = (await providerApi.findMany()).find(
        (row) => row.name === providerName,
      );
      if (provider) {
        return provider.id;
      }
      throw new Error(`Provider not found: ${providerName}`);
    }

    const provider = await this.db
      .select({ id: modelProxyProviders.id })
      .from(modelProxyProviders)
      .where(eq(modelProxyProviders.name, providerName))
      .limit(1);

    const providerId = provider[0]?.id;
    if (!providerId) {
      throw new Error(`Provider not found: ${providerName}`);
    }

    return providerId;
  }
}

const parseEffort = (value: unknown): Effort | undefined => {
  if (!value || typeof value !== "object") return undefined;
  const effort = (value as { effort?: unknown }).effort;
  if (typeof effort !== "string") return undefined;
  const parsed = EffortSchema.safeParse(effort);
  return parsed.success ? parsed.data : undefined;
};

const toModelConfig = (
  record: ModelProxyModelRecord,
  providerName: string,
): ModelConfig => {
  const effort = parseEffort(record.reasoning);
  return ModelConfigSchema.parse({
    name: record.modelId,
    provider: providerName,
    displayName: record.displayName ?? undefined,
    family: record.family ?? undefined,
    canonicalSlug: record.canonicalSlug ?? undefined,
    description: record.description ?? undefined,
    contextLength: record.contextLength ?? undefined,
    maxCompletionTokens: record.maxCompletionTokens ?? undefined,
    knowledgeCutoff: record.knowledgeCutoff ?? undefined,
    expirationDate: record.expirationDate ?? undefined,
    architecture: record.architecture ?? undefined,
    reasoning: effort ? { effort } : undefined,
    supportedParameters: record.supportedParameters ?? undefined,
    defaultParameters: record.defaultParameters ?? undefined,
    perRequestLimits: record.perRequestLimits ?? undefined,
    pricing: record.pricing ?? undefined,
    requestOptions: undefined,
  });
};
