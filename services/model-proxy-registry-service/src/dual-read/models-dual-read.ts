import type { AnalyticsDataSource } from "@lite-llm/analytics-service/types";
import { fromModelRoute } from "../adapters/litellm-params-adapter.js";
import type { IRegistryModelsService } from "../services/registry-models.service.js";
import type { ModelRoute } from "../types/model-route.js";

export interface LegacyModelEntry {
  modelName: string;
  litellmParams: Record<string, unknown>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function listModelsWithRegistryFirst(
  registryModelsService: IRegistryModelsService,
  dataSource: AnalyticsDataSource,
): Promise<LegacyModelEntry[]> {
  const registryRoutes = await registryModelsService.listRoutes();
  const registryByName = new Map(
    registryRoutes.map((route) => [route.modelName, route]),
  );

  let legacyModels: LegacyModelEntry[] = [];
  try {
    legacyModels = (await dataSource.getModels()).map((model) => ({
      modelName: model.modelName,
      litellmParams: isRecord(model.litellmParams) ? model.litellmParams : {},
    }));
  } catch {
    legacyModels = [];
  }

  const merged = new Map<string, LegacyModelEntry>();

  for (const route of registryRoutes) {
    merged.set(route.modelName, toLegacyEntry(route));
  }

  for (const legacy of legacyModels) {
    if (!merged.has(legacy.modelName)) {
      merged.set(legacy.modelName, legacy);
    }
  }

  return [...merged.values()].sort((left, right) =>
    left.modelName.localeCompare(right.modelName),
  );
}

export function toLegacyEntry(route: ModelRoute): LegacyModelEntry {
  return {
    modelName: route.modelName,
    litellmParams: fromModelRoute(route),
  };
}

export async function getModelRouteWithRegistryFirst(
  registryModelsService: IRegistryModelsService,
  dataSource: AnalyticsDataSource,
  modelName: string,
): Promise<ModelRoute | null> {
  const fromRegistry = await registryModelsService.getRoute(modelName);
  if (fromRegistry) {
    return fromRegistry;
  }

  const legacyModels = await dataSource.getModels();
  const legacy = legacyModels.find((model) => model.modelName === modelName);
  if (!legacy || !isRecord(legacy.litellmParams)) {
    return null;
  }

  const { toModelRoute } = await import(
    "../adapters/litellm-params-adapter.js"
  );
  return toModelRoute(legacy.litellmParams, modelName);
}
