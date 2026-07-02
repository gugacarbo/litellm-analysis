import { db as drizzleDb } from "@lite-llm/database/client";
import { modelProxyModels } from "@lite-llm/database/schema";
import { asc, eq } from "drizzle-orm";
import type {
  ModelProxyModelRecord,
  ModelRoute,
  ModelRouteUpdate,
} from "../types/model-route.js";

function toModelProxyModelRecord(row: {
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
  requestOptions: unknown;
  metadata: unknown;
  createdAt: Date;
  updatedAt: Date;
}): ModelProxyModelRecord {
  return {
    id: row.id,
    modelName: row.modelName,
    enabled: row.enabled,
    displayName: row.displayName,
    family: row.family,
    ownedBy: row.ownedBy,
    apiMode: row.apiMode,
    vision: row.vision,
    contextWindowSize: row.contextWindowSize,
    maxOutputTokens: row.maxOutputTokens,
    inputCostPerToken: row.inputCostPerToken,
    outputCostPerToken: row.outputCostPerToken,
    upstreamModel: row.upstreamModel,
    upstreamBaseUrl: row.upstreamBaseUrl,
    providerName: row.providerName,
    secretRef: row.secretRef,
    requestOptions:
      row.requestOptions === null
        ? null
        : (row.requestOptions as Record<string, unknown>),
    metadata:
      row.metadata === null ? null : (row.metadata as Record<string, unknown>),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function toModelRoute(record: ModelProxyModelRecord): ModelRoute {
  return {
    modelName: record.modelName,
    enabled: record.enabled,
    displayName: record.displayName ?? undefined,
    family: record.family ?? undefined,
    ownedBy: record.ownedBy ?? undefined,
    apiMode:
      record.apiMode === "openai" || record.apiMode === "anthropic"
        ? record.apiMode
        : undefined,
    vision: record.vision ?? undefined,
    contextWindowSize: record.contextWindowSize ?? undefined,
    maxOutputTokens: record.maxOutputTokens ?? undefined,
    inputCostPerToken: record.inputCostPerToken ?? undefined,
    outputCostPerToken: record.outputCostPerToken ?? undefined,
    upstreamModel: record.upstreamModel ?? undefined,
    upstreamBaseUrl: record.upstreamBaseUrl ?? undefined,
    providerName: record.providerName ?? undefined,
    secretRef: record.secretRef ?? undefined,
    requestOptions: record.requestOptions ?? undefined,
  };
}

function toModelUpdateData(
  route: ModelRouteUpdate,
): Record<string, unknown> {
  const data: Record<string, unknown> = {};

  if (route.enabled !== undefined) data.enabled = route.enabled;
  if (route.displayName !== undefined) data.displayName = route.displayName;
  if (route.family !== undefined) data.family = route.family;
  if (route.ownedBy !== undefined) data.ownedBy = route.ownedBy;
  if (route.apiMode !== undefined) data.apiMode = route.apiMode;
  if (route.vision !== undefined) data.vision = route.vision;
  if (route.contextWindowSize !== undefined)
    data.contextWindowSize = route.contextWindowSize;
  if (route.maxOutputTokens !== undefined)
    data.maxOutputTokens = route.maxOutputTokens;
  if (route.inputCostPerToken !== undefined)
    data.inputCostPerToken = route.inputCostPerToken;
  if (route.outputCostPerToken !== undefined)
    data.outputCostPerToken = route.outputCostPerToken;
  if (route.upstreamModel !== undefined)
    data.upstreamModel = route.upstreamModel;
  if (route.upstreamBaseUrl !== undefined)
    data.upstreamBaseUrl = route.upstreamBaseUrl;
  if (route.secretRef !== undefined) data.secretRef = route.secretRef;
  if (route.requestOptions !== undefined)
    data.requestOptions = route.requestOptions;
  if (route.metadata !== undefined) data.metadata = route.metadata;
  if (route.providerName !== undefined) data.providerName = route.providerName;

  return data;
}

function toModelCreateData(
  modelName: string,
  route: ModelRouteUpdate = {},
): Record<string, unknown> {
  return {
    modelName,
    enabled: route.enabled ?? true,
    displayName: route.displayName ?? null,
    family: route.family ?? null,
    ownedBy: route.ownedBy ?? null,
    apiMode: route.apiMode ?? null,
    vision: route.vision ?? null,
    contextWindowSize: route.contextWindowSize ?? null,
    maxOutputTokens: route.maxOutputTokens ?? null,
    inputCostPerToken: route.inputCostPerToken ?? null,
    outputCostPerToken: route.outputCostPerToken ?? null,
    upstreamModel: route.upstreamModel ?? null,
    upstreamBaseUrl: route.upstreamBaseUrl ?? null,
    secretRef: route.secretRef ?? null,
    requestOptions: route.requestOptions ?? null,
    metadata: route.metadata ?? null,
    providerName: route.providerName ?? null,
  };
}

export interface ModelsListOptions {
  enabledOnly?: boolean;
}

export class ModelsRepository {
  private readonly db: typeof drizzleDb;

  constructor(db: typeof drizzleDb) {
    this.db = db;
  }

  async findByModelName(
    modelName: string,
  ): Promise<ModelProxyModelRecord | null> {
    const [row] = await this.db
      .select()
      .from(modelProxyModels)
      .where(eq(modelProxyModels.modelName, modelName))
      .limit(1);
    return row ? toModelProxyModelRecord(row) : null;
  }

  async list(
    options: ModelsListOptions = {},
  ): Promise<ModelProxyModelRecord[]> {
    const rows = await this.db
      .select()
      .from(modelProxyModels)
      .where(
        options.enabledOnly
          ? eq(modelProxyModels.enabled, true)
          : undefined,
      )
      .orderBy(asc(modelProxyModels.modelName));
    return rows.map(toModelProxyModelRecord);
  }

  async create(
    modelName: string,
    route: ModelRouteUpdate = {},
  ): Promise<ModelProxyModelRecord> {
    const [row] = await this.db
      .insert(modelProxyModels)
      .values(toModelCreateData(modelName, route) as never)
      .returning();
    return toModelProxyModelRecord(row);
  }

  async update(
    modelName: string,
    route: ModelRouteUpdate,
  ): Promise<ModelProxyModelRecord | null> {
    const [existing] = await this.db
      .select()
      .from(modelProxyModels)
      .where(eq(modelProxyModels.modelName, modelName))
      .limit(1);
    if (!existing) {
      return null;
    }
    const [row] = await this.db
      .update(modelProxyModels)
      .set({ ...toModelUpdateData(route), updatedAt: new Date() } as never)
      .where(eq(modelProxyModels.id, existing.id))
      .returning();
    return toModelProxyModelRecord(row);
  }

  async upsert(
    modelName: string,
    route: ModelRouteUpdate = {},
  ): Promise<ModelProxyModelRecord> {
    const [existing] = await this.db
      .select()
      .from(modelProxyModels)
      .where(eq(modelProxyModels.modelName, modelName))
      .limit(1);
    if (existing) {
      const [row] = await this.db
        .update(modelProxyModels)
        .set({ ...toModelUpdateData(route), updatedAt: new Date() } as never)
        .where(eq(modelProxyModels.id, existing.id))
        .returning();
      return toModelProxyModelRecord(row);
    }
    const [row] = await this.db
      .insert(modelProxyModels)
      .values(toModelCreateData(modelName, route) as never)
      .returning();
    return toModelProxyModelRecord(row);
  }

  async setEnabled(
    modelName: string,
    enabled: boolean,
  ): Promise<ModelProxyModelRecord | null> {
    return this.update(modelName, { enabled });
  }

  async delete(modelName: string): Promise<boolean> {
    const [existing] = await this.db
      .select()
      .from(modelProxyModels)
      .where(eq(modelProxyModels.modelName, modelName))
      .limit(1);
    if (!existing) {
      return false;
    }
    await this.db
      .delete(modelProxyModels)
      .where(eq(modelProxyModels.id, existing.id));
    return true;
  }
}
