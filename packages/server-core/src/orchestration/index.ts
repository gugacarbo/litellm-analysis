import type { AnalyticsDataSource } from "@lite-llm/analytics/types";
import type { DbModelSpecLike, OrchestrationServices } from "../types/index.js";
import { buildAliasMapFromDb, regenerateAllAliases } from "./alias-service.js";
import {
  syncGeneratedArtifacts,
  syncModelsDirectlyToDatabase,
} from "./artifact-service.js";
export { buildAliasMapFromDb, regenerateAllAliases } from "./alias-service.js";
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
): OrchestrationServices {
  return {
    dataSource,
    buildAliasMap: () => buildAliasMapFromDb(),
    regenerateAllAliases: () => regenerateAllAliases(dataSource),
    syncGeneratedArtifacts: () => syncGeneratedArtifacts(dataSource),
    syncModelsDirectlyToDatabase: (models: Record<string, DbModelSpecLike>) =>
      syncModelsDirectlyToDatabase(dataSource, models),
  };
}
