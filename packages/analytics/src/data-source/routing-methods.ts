import { createAgentsManager } from "@lite-llm/agents-manager";
import {
  generateLitellmAliases,
  sortAliasesByDefinitionOrder,
} from "@lite-llm/alias-router";
import { getRouterSettings, updateRouterSettings } from "../queries/index.js";

export async function getAgentRoutingConfigImpl(): Promise<Record<
  string,
  unknown
> | null> {
  const { repository } = createAgentsManager();
  const config = await repository.read();

  const allAliases: Record<string, string> = {};

  // Read existing aliases from LiteLLM_Config (router_settings)
  try {
    const routerSettings = await getRouterSettings();
    if (routerSettings?.model_group_alias) {
      Object.assign(
        allAliases,
        routerSettings.model_group_alias as Record<string, string>,
      );
    }
  } catch {
    // If LiteLLM_Config table does not exist or query fails,
    // continue without it
  }

  // Merge custom aliases from db.json
  if (config.customAliases) {
    Object.assign(allAliases, config.customAliases);
  }

  // Generate aliases from agents (generated aliases override)
  for (const [key, agent] of Object.entries(config.agents || {})) {
    const agentAliases = generateLitellmAliases(
      key,
      agent.model || "",
      agent.fallbackModels,
      config.globalFallbackModel,
    );
    Object.assign(allAliases, agentAliases);
  }

  // Generate aliases from categories (generated aliases override)
  for (const [key, category] of Object.entries(config.categories || {})) {
    const categoryAliases = generateLitellmAliases(
      key,
      category.model || "",
      category.fallbackModels,
      config.globalFallbackModel,
    );
    Object.assign(allAliases, categoryAliases);
  }

  // Sort aliases by definition order
  const sortedAliases = sortAliasesByDefinitionOrder(allAliases);

  return { model_group_alias: sortedAliases };
}

export async function updateAgentRoutingConfigImpl(
  modelGroupAlias: Record<string, string>,
): Promise<void> {
  const { repository } = createAgentsManager();
  const config = await repository.read();

  // Remove agent/category generated aliases, keep only custom
  const agentKeys = new Set(Object.keys(config.agents || {}));
  const categoryKeys = new Set(Object.keys(config.categories || {}));

  const customAliases: Record<string, string> = {};
  for (const [key, value] of Object.entries(modelGroupAlias)) {
    const prefix = key.includes("/") ? key.split("/")[0] : key;
    if (
      !agentKeys.has(key) &&
      !categoryKeys.has(key) &&
      !agentKeys.has(prefix) &&
      !categoryKeys.has(prefix)
    ) {
      customAliases[key] = value;
    }
  }

  if (Object.keys(customAliases).length > 0) {
    config.customAliases = customAliases;
  } else {
    delete config.customAliases;
  }
  await repository.write(config);

  // Also write to LiteLLM_Config table
  await updateRouterSettings(modelGroupAlias);
}
