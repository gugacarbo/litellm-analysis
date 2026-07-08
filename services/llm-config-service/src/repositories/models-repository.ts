import { eq, inArray } from "drizzle-orm";

import {
  modelProxyModels,
  modelProxyProviders,
  modelProxyReasoningApis,
} from "@lite-llm/database/schema";
import type { Database } from "@lite-llm/database";
import { ModelConfigSchema, type ModelConfig } from "@/schemas/model.js";
import { EffortSchema, type Effort } from "@/schemas/thinking.js";

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
  constructor(private readonly db: Database) {}

  async findByModelIdAndProviderId(
    modelId: string,
    providerId: string,
  ): Promise<ModelProxyModelRecord | null> {
    const rows = await this.db
      .select()
      .from(modelProxyModels)
      .where(
        eq(modelProxyModels.modelId, modelId) &&
          eq(modelProxyModels.providerId, providerId),
      )
      .limit(1);
    return rows[0] ?? null;
  }

  async findById(id: string): Promise<ModelProxyModelRecord | null> {
    const rows = await this.db
      .select()
      .from(modelProxyModels)
      .where(eq(modelProxyModels.id, id))
      .limit(1);
    return rows[0] ?? null;
  }

  async findByProviderId(
    providerId: string,
  ): Promise<ModelProxyModelRecord[]> {
    return this.db
      .select()
      .from(modelProxyModels)
      .where(eq(modelProxyModels.providerId, providerId));
  }

  async findManyByIds(ids: string[]): Promise<ModelProxyModelRecord[]> {
    if (ids.length === 0) return [];
    return this.db
      .select()
      .from(modelProxyModels)
      .where(inArray(modelProxyModels.id, ids));
  }

  async listAll(): Promise<ModelProxyModelRecord[]> {
    return this.db.select().from(modelProxyModels);
  }

  async create(input: CreateModelInput): Promise<ModelProxyModelRecord> {
    const { reasoningApiSlug, ...rest } = input;
    let reasoningApiId: string | null = null;
    if (reasoningApiSlug) {
      const api = await this.findReasoningApiBySlug(reasoningApiSlug);
      reasoningApiId = api?.id ?? null;
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

  async delete(id: string): Promise<void> {
    await this.db.delete(modelProxyModels).where(eq(modelProxyModels.id, id));
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
    const reasoningApi = record.reasoningApiId
      ? await this.findReasoningApiById(record.reasoningApiId)
      : null;
    return toModelConfig(record, providerName, reasoningApi);
  }
}

const parseEffort = (value: unknown): Effort | undefined => {
  if (!value || typeof value !== "object") return undefined;
  const effort = (value as { effort?: unknown }).effort;
  if (typeof effort !== "string") return undefined;
  const parsed = EffortSchema.safeParse(effort);
  return parsed.success ? parsed.data : undefined;
};

export const toModelConfig = (
  record: ModelProxyModelRecord,
  providerName: string,
  reasoningApi: ModelProxyReasoningApiRecord | null,
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
