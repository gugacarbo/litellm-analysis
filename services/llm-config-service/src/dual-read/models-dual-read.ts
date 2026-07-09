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
    .filter((entry): entry is RegistryModelEntry => entry !== null)
    .sort((left, right) =>
      String(left.modelName).localeCompare(String(right.modelName)),
    );
}

function resolveRegistryModelName(route: ModelRoute): string {
  const candidates = [route.modelId, route.modelName];
  return (
    candidates.find(
      (value): value is string =>
        typeof value === "string" && value.trim() !== "",
    ) ?? ""
  );
}

export function toRegistryEntry(route: ModelRoute): RegistryModelEntry | null {
  const modelName = resolveRegistryModelName(route);
  if (!modelName) {
    return null;
  }
  return {
    modelName,
    modelRoute: {
      ...route,
      modelId: modelName,
    },
  };
}

export async function getModelRoute(
  registryModelsService: IRegistryModelsService,
  modelName: string,
): Promise<ModelRoute | null> {
  return registryModelsService.getRoute(modelName);
}
