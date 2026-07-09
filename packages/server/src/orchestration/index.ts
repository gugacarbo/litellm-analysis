import type { AnalyticsDataSource } from "@lite-llm/analytics-service/types";
import type {
  OrchestrationServices,
  RegistryRouteServices,
} from "../types/index";
import { syncGeneratedArtifacts } from "./artifact-service";

export function createOrchestrationServices(
  dataSource: AnalyticsDataSource,
  registry: Pick<
    RegistryRouteServices,
    "registryModelsService" | "settingsService"
  >,
): OrchestrationServices {
  const { registryModelsService, settingsService } = registry;
  return {
    dataSource,
    syncGeneratedArtifacts: () =>
      syncGeneratedArtifacts(registryModelsService, settingsService),
  };
}
