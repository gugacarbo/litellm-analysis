import type { AnalyticsDataSource } from "@lite-llm/analytics-service/types";
import type { IModelService } from "@lite-llm/models-service";
import type {
  AgentsManager,
  OrchestrationServices,
  RegistryRouteServices,
} from "../types/index";
import { syncGeneratedArtifacts } from "./artifact-service";

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
  };
}
