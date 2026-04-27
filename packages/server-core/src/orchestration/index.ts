import type { AnalyticsDataSource } from '@lite-llm/analytics/types';
import type { OrchestrationServices, DbModelSpecLike } from '../types/index.js';
import { parseDays, toCostPerToken, getLiteLLMCredentialName, isRecord, applyRequiredLiteLLMParams, buildLiteLLMParams } from './lite-llm-params.js';
import { buildAliasMapFromDb, regenerateAllAliases } from './alias-service.js';
import { syncGeneratedArtifacts, syncModelsDirectlyToDatabase } from './artifact-service.js';

export { parseDays, toCostPerToken, getLiteLLMCredentialName, isRecord, applyRequiredLiteLLMParams, buildLiteLLMParams } from './lite-llm-params.js';
export { buildAliasMapFromDb, regenerateAllAliases } from './alias-service.js';
export { syncGeneratedArtifacts, syncModelsDirectlyToDatabase } from './artifact-service.js';

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
