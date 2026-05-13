import type { AnalyticsDataSource } from "@lite-llm/analytics/types";
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
): OrchestrationServices {
  return {
    dataSource,
    syncGeneratedArtifacts: () =>
      syncGeneratedArtifacts(dataSource, agentsManager),
    syncModelsDirectlyToDatabase: (models: Record<string, DbModelSpecLike>) =>
      syncModelsDirectlyToDatabase(dataSource, models),
  };
}
