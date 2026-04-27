import type { AnalyticsDataSource } from '@lite-llm/analytics/types';
import { readDb } from '@lite-llm/agents-manager';
import {
	generateLitellmAliases,
	sortAliasesByDefinitionOrder,
} from '@lite-llm/alias-router';

export async function buildAliasMapFromDb(): Promise<
	Record<string, string>
> {
	const db = await readDb();
	const globalFallback = db.globalFallbackModel;

	const mergedAliases: Record<string, string> = {
		...(db.customAliases || {}),
	};

	for (const [key, agent] of Object.entries(db.agents || {})) {
		Object.assign(
			mergedAliases,
			generateLitellmAliases(
				key,
				agent.model || '',
				agent.fallbackModels,
				globalFallback,
			),
		);
	}

	for (const [key, category] of Object.entries(
		db.categories || {},
	)) {
		Object.assign(
			mergedAliases,
			generateLitellmAliases(
				key,
				category.model || '',
				category.fallbackModels,
				globalFallback,
			),
		);
	}

	return sortAliasesByDefinitionOrder(mergedAliases);
}

export async function regenerateAllAliases(
	dataSource: AnalyticsDataSource,
): Promise<void> {
	const allAliases = await buildAliasMapFromDb();
	await dataSource.updateAgentRoutingConfig(allAliases);
}
