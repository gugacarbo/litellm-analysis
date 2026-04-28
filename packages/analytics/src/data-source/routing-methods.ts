import {
  generateLitellmAliases,
  sortAliasesByDefinitionOrder,
} from '@lite-llm/alias-router';
import {
  readDb,
} from '@lite-llm/agents-manager';
import {
  getRouterSettings,
  updateRouterSettings,
} from '../queries/index.js';

export async function getAgentRoutingConfigImpl(): Promise<Record<
  string,
  unknown
> | null> {
  const db = await readDb();
  const allAliases: Record<string, string> = {};

  // Read existing aliases from LiteLLM_Config (router_settings)
  try {
    const routerSettings = await getRouterSettings();
    if (routerSettings?.model_group_alias) {
      Object.assign(
        allAliases,
        routerSettings.model_group_alias as Record<
          string,
          string
        >,
      );
    }
  } catch {
    // If LiteLLM_Config table does not exist or query fails,
    // continue without it
  }

  // Merge custom aliases from db.json
  if (db.customAliases) {
    Object.assign(allAliases, db.customAliases);
  }

  // Generate aliases from agents (generated aliases override)
  for (const [key, agent] of Object.entries(
    db.agents || {},
  )) {
    const agentAliases = generateLitellmAliases(
      key,
      agent.model || '',
      agent.fallbackModels,
      db.globalFallbackModel,
    );
    Object.assign(allAliases, agentAliases);
  }

  // Generate aliases from categories (generated aliases override)
  for (const [key, category] of Object.entries(
    db.categories || {},
  )) {
    const categoryAliases = generateLitellmAliases(
      key,
      category.model || '',
      category.fallbackModels,
      db.globalFallbackModel,
    );
    Object.assign(allAliases, categoryAliases);
  }

  // Sort aliases by definition order
  const sortedAliases =
    sortAliasesByDefinitionOrder(allAliases);

  return { model_group_alias: sortedAliases };
}

export async function updateAgentRoutingConfigImpl(
  modelGroupAlias: Record<string, string>,
): Promise<void> {
  const { writeDb, readDb: readDbDynamic } = await import(
    '@lite-llm/agents-manager'
  );
  const db = await readDbDynamic();

  // Remove agent/category generated aliases, keep only custom
  const agentKeys = new Set(Object.keys(db.agents || {}));
  const categoryKeys = new Set(
    Object.keys(db.categories || {}),
  );

  const customAliases: Record<string, string> = {};
  for (const [key, value] of Object.entries(modelGroupAlias)) {
    const prefix = key.includes('/') ? key.split('/')[0] : key;
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
    db.customAliases = customAliases;
  } else {
    delete db.customAliases;
  }
  await writeDb(db);

  // Also write to LiteLLM_Config table
  await updateRouterSettings(modelGroupAlias);
}
