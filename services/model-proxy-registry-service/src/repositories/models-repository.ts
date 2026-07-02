import type {
  ModelProxyModel,
  Prisma,
  PrismaClient,
} from "@lite-llm/model-proxy-repository";
import type {
  ModelProxyModelRecord,
  ModelRoute,
  ModelRouteUpdate,
} from "../types/model-route.js";

function toModelProxyModelRecord(row: ModelProxyModel): ModelProxyModelRecord {
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

function toPrismaModelData(
  route: ModelRouteUpdate,
): Prisma.ModelProxyModelUpdateInput {
  const data: Prisma.ModelProxyModelUpdateInput = {
    ...(route.enabled !== undefined ? { enabled: route.enabled } : {}),
    ...(route.displayName !== undefined
      ? { displayName: route.displayName }
      : {}),
    ...(route.family !== undefined ? { family: route.family } : {}),
    ...(route.ownedBy !== undefined ? { ownedBy: route.ownedBy } : {}),
    ...(route.apiMode !== undefined ? { apiMode: route.apiMode } : {}),
    ...(route.vision !== undefined ? { vision: route.vision } : {}),
    ...(route.contextWindowSize !== undefined
      ? { contextWindowSize: route.contextWindowSize }
      : {}),
    ...(route.maxOutputTokens !== undefined
      ? { maxOutputTokens: route.maxOutputTokens }
      : {}),
    ...(route.inputCostPerToken !== undefined
      ? { inputCostPerToken: route.inputCostPerToken }
      : {}),
    ...(route.outputCostPerToken !== undefined
      ? { outputCostPerToken: route.outputCostPerToken }
      : {}),
    ...(route.upstreamModel !== undefined
      ? { upstreamModel: route.upstreamModel }
      : {}),
    ...(route.upstreamBaseUrl !== undefined
      ? { upstreamBaseUrl: route.upstreamBaseUrl }
      : {}),
    ...(route.providerName !== undefined
      ? { providerName: route.providerName }
      : {}),
    ...(route.secretRef !== undefined ? { secretRef: route.secretRef } : {}),
    ...(route.requestOptions !== undefined
      ? { requestOptions: route.requestOptions as Prisma.InputJsonValue }
      : {}),
    ...(route.metadata !== undefined
      ? { metadata: route.metadata as Prisma.InputJsonValue }
      : {}),
  };
  return data;
}

function toPrismaModelCreate(
  modelName: string,
  route: ModelRouteUpdate = {},
): Prisma.ModelProxyModelCreateInput {
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
    providerName: route.providerName ?? null,
    secretRef: route.secretRef ?? null,
    ...(route.requestOptions !== undefined
      ? {
          requestOptions: route.requestOptions as Prisma.InputJsonValue,
        }
      : {}),
    ...(route.metadata !== undefined
      ? {
          metadata: route.metadata as Prisma.InputJsonValue,
        }
      : {}),
  };
}

export interface ModelsListOptions {
  enabledOnly?: boolean;
}

export class ModelsRepository {
  private readonly prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async findByModelName(
    modelName: string,
  ): Promise<ModelProxyModelRecord | null> {
    const row = await this.prisma.modelProxyModel.findUnique({
      where: { modelName },
    });
    return row ? toModelProxyModelRecord(row) : null;
  }

  async list(
    options: ModelsListOptions = {},
  ): Promise<ModelProxyModelRecord[]> {
    const rows = await this.prisma.modelProxyModel.findMany({
      where: options.enabledOnly ? { enabled: true } : undefined,
      orderBy: { modelName: "asc" },
    });
    return rows.map(toModelProxyModelRecord);
  }

  async create(
    modelName: string,
    route: ModelRouteUpdate = {},
  ): Promise<ModelProxyModelRecord> {
    const row = await this.prisma.modelProxyModel.create({
      data: toPrismaModelCreate(modelName, route),
    });
    return toModelProxyModelRecord(row);
  }

  async update(
    modelName: string,
    route: ModelRouteUpdate,
  ): Promise<ModelProxyModelRecord | null> {
    try {
      const row = await this.prisma.modelProxyModel.update({
        where: { modelName },
        data: toPrismaModelData(route),
      });
      return toModelProxyModelRecord(row);
    } catch (error) {
      if (
        error instanceof Error &&
        "code" in error &&
        (error as { code?: string }).code === "P2025"
      ) {
        return null;
      }
      throw error;
    }
  }

  async upsert(
    modelName: string,
    route: ModelRouteUpdate = {},
  ): Promise<ModelProxyModelRecord> {
    const row = await this.prisma.modelProxyModel.upsert({
      where: { modelName },
      create: toPrismaModelCreate(modelName, route),
      update: toPrismaModelData(route),
    });
    return toModelProxyModelRecord(row);
  }

  async setEnabled(
    modelName: string,
    enabled: boolean,
  ): Promise<ModelProxyModelRecord | null> {
    return this.update(modelName, { enabled });
  }

  async delete(modelName: string): Promise<boolean> {
    try {
      await this.prisma.modelProxyModel.delete({ where: { modelName } });
      return true;
    } catch (error) {
      if (
        error instanceof Error &&
        "code" in error &&
        (error as { code?: string }).code === "P2025"
      ) {
        return false;
      }
      throw error;
    }
  }
}
