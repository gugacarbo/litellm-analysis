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
  applyRequiredLiteLLMParams,
  buildLiteLLMParams,
  buildMergedLiteLLMParams,
  coerceLiteLLMParams,
  coerceLiteLLMParamValue,
  coerceStringParamValue,
  isRecord,
  parseDays,
  toCostPerToken,
} from "./lite-llm-params";
export {
  fromModelProxyRow,
  fromModelRoute,
  getCredentialNameFromParams,
  type ModelProxyRowWrite,
  type ModelRoute,
  type ModelRouteUpdate,
  resolveModelCredential,
  toModelProxyRow,
  toModelRoute,
} from "./model-route";
export {
  createRegistryModelFromParams,
  createRegistryModelFromSpec,
  listModelsWithRegistryFirst,
  listRegistryRoutes,
  mergeRegistryModelFromSpec,
  resolveLitellmParamsFromBody,
  routeUpdateFromParams,
  toLegacyEntry,
  toLitellmParamsShim,
  updateRegistryModelFromParams,
} from "./registry-models-bridge";
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
