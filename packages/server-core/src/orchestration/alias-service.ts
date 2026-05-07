import { createAgentsManager } from "@lite-llm/agents-manager";
import {
  generateLitellmAliases,
  sortAliasesByDefinitionOrder,
} from "@lite-llm/alias-router";
import type { AnalyticsDataSource } from "@lite-llm/analytics/types";

export async function buildAliasMapFromDb(): Promise<Record<string, string>> {
  const { repository } = createAgentsManager();
  const config = await repository.read();
  const globalFallback = config.globalFallbackModel;

  const mergedAliases: Record<string, string> = {
    ...(config.customAliases || {}),
  };

  for (const [key, agent] of Object.entries(config.agents || {})) {
    Object.assign(
      mergedAliases,
      generateLitellmAliases(
        key,
        agent.model || "",
        agent.fallbackModels,
        globalFallback,
      ),
    );
  }

  for (const [key, category] of Object.entries(config.categories || {})) {
    Object.assign(
      mergedAliases,
      generateLitellmAliases(
        key,
        category.model || "",
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
