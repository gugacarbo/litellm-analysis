import type { IRegistryModelsService } from "../services/registry-models.service.js";
import type { ModelRoute } from "../types/model-route.js";

export interface RegistryModelEntry {
  modelName: string;
  modelRoute: ModelRoute;
}

export async function listRegistryModels(
  registryModelsService: IRegistryModelsService,
): Promise<RegistryModelEntry[]> {
  const registryRoutes = await registryModelsService.listRoutes();
  return registryRoutes
    .map((route) => toRegistryEntry(route))
    .sort((left, right) => left.modelName.localeCompare(right.modelName));
}

export function toRegistryEntry(route: ModelRoute): RegistryModelEntry {
  return {
    modelName: route.modelName,
    modelRoute: route,
  };
}

export async function getModelRoute(
  registryModelsService: IRegistryModelsService,
  modelName: string,
): Promise<ModelRoute | null> {
  return registryModelsService.getRoute(modelName);
}
