import type { AnalyticsDataSource } from "@lite-llm/analytics-service/types";
import {
  type IRegistryModelsService,
  listRegistryModels,
  type ModelRoute,
  type ModelRouteUpdate,
  parseModelRouteFromApi,
  type RouteParams,
} from "@lite-llm/llm-config-service";
import type { DbModelSpecLike } from "../types/index";
import {
  buildModelRouteFromSpec,
  isRecord,
  mergeModelRouteFromSpec,
  normalizeModelRoute,
} from "./route-params";

export { listRegistryModels };

export function resolveModelRouteFromBody(body: {
  modelRoute?: unknown;
  modelName?: string;
  modelId?: string;
}): ModelRoute {
  if (!isRecord(body.modelRoute) || Object.keys(body.modelRoute).length === 0) {
    throw new Error("modelRoute is required");
  }

  const modelName =
    typeof body.modelRoute.modelName === "string" &&
    body.modelRoute.modelName.trim()
      ? body.modelRoute.modelName.trim()
      : typeof body.modelRoute.modelId === "string" &&
          body.modelRoute.modelId.trim()
        ? body.modelRoute.modelId.trim()
        : typeof body.modelName === "string"
          ? body.modelName.trim()
          : typeof body.modelId === "string"
            ? body.modelId.trim()
            : "";

  if (!modelName) {
    throw new Error("modelName is required");
  }

  return parseModelRouteFromApi(body.modelRoute, modelName);
}

// @knipignore
export async function createRegistryModelFromSpec(
  registryModelsService: IRegistryModelsService,
  modelName: string,
  spec: DbModelSpecLike,
  providerName: string | null,
): Promise<void> {
  const route = buildModelRouteFromSpec(modelName, spec, providerName);
  await registryModelsService.upsert(modelName, route);
}

// @knipignore
export async function mergeRegistryModelFromSpec(
  registryModelsService: IRegistryModelsService,
  modelName: string,
  spec: DbModelSpecLike,
  providerName: string | null,
  existingRoute: ModelRoute,
): Promise<void> {
  const route = mergeModelRouteFromSpec(
    modelName,
    spec,
    existingRoute,
    providerName,
  );
  await registryModelsService.upsert(modelName, route);
}

export async function createRegistryModelFromRoute(
  registryModelsService: IRegistryModelsService,
  modelName: string,
  route: ModelRoute,
  providerName: string | null,
): Promise<void> {
  const normalized = normalizeModelRoute(modelName, route, providerName);
  await registryModelsService.create(modelName, normalized);
}

export async function updateRegistryModelFromRoute(
  registryModelsService: IRegistryModelsService,
  modelName: string,
  route: ModelRoute,
  providerName: string | null,
  newModelName?: string,
): Promise<void> {
  const targetName = newModelName ?? modelName;
  const normalized = normalizeModelRoute(targetName, route, providerName);

  if (newModelName && newModelName !== modelName) {
    await registryModelsService.create(newModelName, normalized);
    await registryModelsService.delete(modelName);
    return;
  }

  try {
    await registryModelsService.update(modelName, normalized);
  } catch {
    await registryModelsService.create(modelName, normalized);
  }
}

export function routeUpdateFromBody(
  route: RouteParams,
  modelName: string,
): ModelRouteUpdate {
  return parseModelRouteFromApi(route, modelName);
}

// @knipignore
export async function listRegistryRoutes(
  registryModelsService: IRegistryModelsService,
  _dataSource: AnalyticsDataSource,
): Promise<ModelRoute[]> {
  const models = await listRegistryModels(registryModelsService);
  return models.map((model) => model.modelRoute);
}
