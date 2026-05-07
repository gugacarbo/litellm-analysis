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
export function createOrchestrationServices(dataSource) {
  return {
    dataSource,
    buildAliasMap: () => buildAliasMapFromDb(),
    regenerateAllAliases: () => regenerateAllAliases(dataSource),
    syncGeneratedArtifacts: () => syncGeneratedArtifacts(dataSource),
    syncModelsDirectlyToDatabase: (models) =>
      syncModelsDirectlyToDatabase(dataSource, models),
  };
}
