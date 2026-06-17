import type { AnalyticsDataSource } from "@lite-llm/analytics-service/types";
import { toModelRoute } from "../adapters/litellm-params-adapter.js";
import type { IRegistryModelsService } from "../services/registry-models.service.js";
import type { ModelRoute } from "../types/model-route.js";

export interface RegistryModelEntry {
  modelName: string;
  modelRoute: ModelRoute;
}

/** @deprecated Use RegistryModelEntry */
export type LegacyModelEntry = RegistryModelEntry;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function resolveModelRoute(
  modelName: string,
  model: {
    modelRoute?: unknown;
    litellmParams?: Record<string, unknown> | null;
  },
): ModelRoute {
  if (isRecord(model.modelRoute)) {
    return {
      ...(model.modelRoute as unknown as ModelRoute),
      modelName,
    };
  }

  if (isRecord(model.litellmParams)) {
    return toModelRoute(model.litellmParams, modelName);
  }

  return { modelName };
}

export async function listModelsWithRegistryFirst(
  registryModelsService: IRegistryModelsService,
  dataSource: AnalyticsDataSource,
): Promise<RegistryModelEntry[]> {
  const registryRoutes = await registryModelsService.listRoutes();
  const registryByName = new Map(
    registryRoutes.map((route) => [route.modelName, route]),
  );

  let legacyModels: RegistryModelEntry[] = [];
  try {
    legacyModels = (await dataSource.getModels()).map((model) => ({
      modelName: model.modelName,
      modelRoute: resolveModelRoute(model.modelName, model),
    }));
  } catch {
    legacyModels = [];
  }

  const merged = new Map<string, RegistryModelEntry>();

  for (const route of registryRoutes) {
    merged.set(route.modelName, toRegistryEntry(route));
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

export function toRegistryEntry(route: ModelRoute): RegistryModelEntry {
  return {
    modelName: route.modelName,
    modelRoute: route,
  };
}

/** @deprecated Use toRegistryEntry */
export const toLegacyEntry = toRegistryEntry;

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
  if (!legacy) {
    return null;
  }

  return resolveModelRoute(modelName, legacy);
}
