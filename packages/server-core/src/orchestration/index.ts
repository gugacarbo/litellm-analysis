import type { AnalyticsDataSource } from "@lite-llm/analytics/types";
import type { IModelService } from "@lite-llm/models-manager";
import type {
  AgentsManager,
  DbModelSpecLike,
  OrchestrationServices,
} from "../types/index.js";
import {
  syncGeneratedArtifacts,
  syncModelsDirectlyToDatabase,
} from "./artifact-service.js";

export {
  syncGeneratedArtifacts,
  syncModelsDirectlyToDatabase,
} from "./artifact-service.js";
export {
  applyRequiredLiteLLMParams,
  buildLiteLLMParams,
  getLiteLLMCredentialName,
  isRecord,
  parseDays,
  toCostPerToken,
} from "./lite-llm-params.js";

export function createOrchestrationServices(
  dataSource: AnalyticsDataSource,
  agentsManager: AgentsManager,
  modelsService: IModelService,
): OrchestrationServices {
  return {
    dataSource,
    syncGeneratedArtifacts: () =>
      syncGeneratedArtifacts(dataSource, agentsManager, modelsService),
    syncModelsDirectlyToDatabase: (models: Record<string, DbModelSpecLike>) =>
      syncModelsDirectlyToDatabase(dataSource, models),
  };
}
