import type { AnalyticsDataSource } from '@lite-llm/analytics/types';
import {
	readDb,
	readConfigFile,
	syncOutputConfigFile,
	syncToLiteLLM,
	writeProvidersFile,
	writeVscodeModelsFile,
} from '@lite-llm/agents-manager';
import { buildLiteLLMParams } from './lite-llm-params.js';
import type { DbModelSpecLike } from '../types/index.js';

export async function syncModelsDirectlyToDatabase(
	dataSource: AnalyticsDataSource,
	models: Record<string, DbModelSpecLike>,
): Promise<void> {
	if (
		!dataSource.capabilities.models ||
		!dataSource.capabilities.updateModel
	) {
		return;
	}

	const desiredEntries = Object.entries(models || {});
	const desiredNames = new Set(desiredEntries.map(([name]) => name));
	const existing = await dataSource.getModels();

	const existingCounts = new Map<string, number>();
	for (const item of existing) {
		existingCounts.set(
			item.modelName,
			(existingCounts.get(item.modelName) || 0) + 1,
		);
	}

	if (dataSource.capabilities.deleteModel) {
		const namesToDelete = new Set<string>();

		for (const modelName of existingCounts.keys()) {
			if (!desiredNames.has(modelName)) {
				namesToDelete.add(modelName);
			}
		}

		for (const [modelName, count] of existingCounts.entries()) {
			if (count > 1) {
				namesToDelete.add(modelName);
			}
		}

		for (const modelName of namesToDelete) {
			await dataSource.deleteModel(modelName);
			existingCounts.delete(modelName);
		}
	}

	for (const [modelName, spec] of desiredEntries) {
		const litellmParams = buildLiteLLMParams(modelName, spec);

		if (existingCounts.has(modelName)) {
			await dataSource.updateModel(modelName, { litellmParams });
			continue;
		}

		if (dataSource.capabilities.createModel) {
			await dataSource.createModel({ modelName, litellmParams });
			existingCounts.set(modelName, 1);
			continue;
		}

		await dataSource.updateModel(modelName, { litellmParams });
	}
}

export async function syncGeneratedArtifacts(
	dataSource: AnalyticsDataSource,
): Promise<void> {
	if (
		dataSource.capabilities.models &&
		dataSource.capabilities.updateModel &&
		dataSource.capabilities.createModel
	) {
		// In database mode, write directly to LiteLLM_ProxyModelTable
		// to avoid API-level duplicate model creation.
		const db = await readDb();
		await syncModelsDirectlyToDatabase(dataSource, db.models || {});
	} else {
		// Fallback for non-database modes.
		await syncToLiteLLM();
	}

	const config = await readConfigFile();
	const models = dataSource.capabilities.models
		? await dataSource.getModels()
		: [];

	await writeProvidersFile(config, models);
	await writeVscodeModelsFile(models);
	await syncOutputConfigFile();
}
