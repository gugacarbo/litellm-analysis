import {
  generateLitellmAliases,
  sortAliasesByDefinitionOrder,
} from "@lite-llm/alias-router";
import type { AnalyticsDataSource } from "@lite-llm/analytics/types";
import type { AgentsManager } from "../types/index.js";

export async function buildAliasMapFromDb(
  agentsManager: AgentsManager,
): Promise<Record<string, string>> {
  const { repository } = agentsManager;
  const config = await repository.read();
  const globalFallback = config.globalFallbackModel;

  const mergedAliases: Record<string, string> = {};

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
  agentsManager: AgentsManager,
): Promise<void> {
  const allAliases = await buildAliasMapFromDb(agentsManager);
  await dataSource.updateAgentRoutingConfig(allAliases);
}
