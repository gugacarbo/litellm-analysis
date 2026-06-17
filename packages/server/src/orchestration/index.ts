import type { AnalyticsDataSource } from "@lite-llm/analytics-service/types";
import type { IModelService } from "@lite-llm/models-service";
import type {
  AgentsManager,
  DbModelSpecLike,
  OrchestrationServices,
  RegistryRouteServices,
} from "../types/index";
import {
  syncGeneratedArtifacts,
  syncModelsDirectlyToDatabase,
} from "./artifact-service";

export {
  syncGeneratedArtifacts,
  syncModelsDirectlyToDatabase,
} from "./artifact-service";
export {
  fromModelProxyRow,
  fromModelRoute,
  type ModelProxyRowWrite,
  type ModelRoute,
  type ModelRouteUpdate,
  toModelProxyRow,
  toModelRoute,
} from "./model-route";
export {
  createRegistryModelFromRoute,
  createRegistryModelFromSpec,
  listRegistryModels,
  listRegistryRoutes,
  mergeRegistryModelFromSpec,
  resolveModelRouteFromBody,
  routeUpdateFromBody,
  updateRegistryModelFromRoute,
} from "./registry-models-bridge";
export {
  buildModelRouteFromSpec,
  coerceRouteParams,
  coerceRouteParamValue,
  coerceStringParamValue,
  getCredentialNameFromParams,
  isRecord,
  mergeModelRouteFromSpec,
  normalizeModelRoute,
  parseDays,
  resolveModelCredential,
  toCostPerToken,
} from "./route-params";
export { updateRouterAliasesInRegistry } from "./router-settings";

export function createOrchestrationServices(
  dataSource: AnalyticsDataSource,
  agentsManager: AgentsManager,
  modelsService: IModelService,
  registry: Pick<
    RegistryRouteServices,
    "registryModelsService" | "settingsService"
  >,
): OrchestrationServices {
  const { registryModelsService, settingsService } = registry;
  return {
    dataSource,
    syncGeneratedArtifacts: () =>
      syncGeneratedArtifacts(
        registryModelsService,
        settingsService,
        agentsManager,
        modelsService,
      ),
    syncModelsDirectlyToDatabase: (models: Record<string, DbModelSpecLike>) =>
      syncModelsDirectlyToDatabase(
        registryModelsService,
        settingsService,
        models,
      ),
  };
}
