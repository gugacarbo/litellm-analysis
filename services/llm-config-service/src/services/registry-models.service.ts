import type { DatabaseClient } from "@lite-llm/database/client";
import { toModelRoute } from "../adapters/model-route-adapter.js";
import { ModelsRepository } from "../repositories/models-repository.js";
import type { ModelConfig } from "../schemas/model.js";
import type {
  ModelProxyModelRecord,
  ModelRoute,
  ModelRouteUpdate,
} from "../types/model-route.js";

export type ModelsListOptions = Record<string, unknown>;

export interface RegistryModelsServiceOptions {
  db?: DatabaseClient;
  repository?: ModelsRepository;
}

export interface IRegistryModelsService {
  list(options?: ModelsListOptions): Promise<ModelProxyModelRecord[]>;
  listRoutes(options?: ModelsListOptions): Promise<ModelRoute[]>;
  get(modelName: string): Promise<ModelProxyModelRecord | null>;
  getRoute(modelName: string): Promise<ModelRoute | null>;
  create(
    modelName: string,
    route?: ModelRouteUpdate,
  ): Promise<ModelProxyModelRecord>;
  update(
    modelName: string,
    route: ModelRouteUpdate,
  ): Promise<ModelProxyModelRecord>;
  upsert(
    modelName: string,
    route?: ModelRouteUpdate,
  ): Promise<ModelProxyModelRecord>;
  enable(modelName: string): Promise<ModelProxyModelRecord>;
  disable(modelName: string): Promise<ModelProxyModelRecord>;
  delete(modelName: string): Promise<boolean>;
}

export class RegistryModelsService implements IRegistryModelsService {
  private readonly repository: ModelsRepository;

  constructor(options: RegistryModelsServiceOptions = {}) {
    this.repository =
      options.repository ??
      new ModelsRepository(
        options.db ??
          (() => {
            throw new Error("RegistryModelsService requires db or repository");
          })(),
      );
  }

  async list(options?: ModelsListOptions): Promise<ModelProxyModelRecord[]> {
    return this.repository.list(options);
  }

  async listRoutes(_options?: ModelsListOptions): Promise<ModelRoute[]> {
    const records = await this.repository.list();
    return records
      .filter(
        (record) =>
          typeof record.modelId === "string" && record.modelId.trim() !== "",
      )
      .map((record) =>
        toModelRoute({
          model: toModelConfig(record),
        }),
      );
  }

  async get(modelName: string): Promise<ModelProxyModelRecord | null> {
    return this.repository.findByModelName(modelName);
  }

  async getRoute(modelName: string): Promise<ModelRoute | null> {
    const record = await this.repository.findByModelName(modelName);
    return record
      ? toModelRoute({
          model: toModelConfig(record),
        })
      : null;
  }

  async create(
    modelName: string,
    route: ModelRouteUpdate = {},
  ): Promise<ModelProxyModelRecord> {
    const trimmed = modelName.trim();
    if (!trimmed) {
      throw new Error("modelName must be a non-empty string");
    }

    const existing = await this.repository.findByModelName(trimmed);
    if (existing) {
      throw new Error(`Model "${trimmed}" already exists`);
    }

    return this.repository.createModel(
      trimmed,
      route as Record<string, unknown>,
    );
  }

  async update(
    modelName: string,
    route: ModelRouteUpdate,
  ): Promise<ModelProxyModelRecord> {
    const updated = await this.repository.updateModel(
      modelName,
      route as Record<string, unknown>,
    );
    if (!updated) {
      throw new Error(`Model "${modelName}" not found`);
    }
    return updated;
  }

  async upsert(
    modelName: string,
    route: ModelRouteUpdate = {},
  ): Promise<ModelProxyModelRecord> {
    const trimmed = modelName.trim();
    if (!trimmed) {
      throw new Error("modelName must be a non-empty string");
    }
    return this.repository.upsertModel(
      trimmed,
      route as Record<string, unknown>,
    );
  }

  async enable(modelName: string): Promise<ModelProxyModelRecord> {
    const updated = await this.repository.setEnabled(modelName, true);
    if (!updated) {
      throw new Error(`Model "${modelName}" not found`);
    }
    return updated;
  }

  async disable(modelName: string): Promise<ModelProxyModelRecord> {
    const updated = await this.repository.setEnabled(modelName, false);
    if (!updated) {
      throw new Error(`Model "${modelName}" not found`);
    }
    return updated;
  }

  async delete(modelName: string): Promise<boolean> {
    const existing = await this.repository.findByModelName(modelName);
    if (!existing) return false;
    return this.repository.delete(existing.id);
  }
}

function toModelConfig(record: ModelProxyModelRecord): ModelConfig {
  return {
    name: record.modelId,
    provider: String(record.providerId ?? ""),
    displayName: record.displayName ?? undefined,
    family: record.family ?? undefined,
    canonicalSlug: record.canonicalSlug ?? undefined,
    description: record.description ?? undefined,
    contextLength: record.contextLength ?? undefined,
    maxCompletionTokens: record.maxCompletionTokens ?? undefined,
    knowledgeCutoff: record.knowledgeCutoff ?? undefined,
    expirationDate: record.expirationDate ?? undefined,
    architecture: record.architecture ?? undefined,
    reasoning: record.reasoning ?? undefined,
    supportedParameters: record.supportedParameters ?? undefined,
    defaultParameters: record.defaultParameters ?? undefined,
    perRequestLimits: record.perRequestLimits ?? undefined,
    pricing: record.pricing ?? undefined,
    requestOptions: record.requestOptions ?? undefined,
  } as unknown as ModelConfig;
}
