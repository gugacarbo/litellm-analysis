import {
  readDb,
  updateAgentInConfig,
  updateCategoryInConfig,
  deleteAgentFromConfig,
  deleteCategoryFromConfig,
} from '@lite-llm/agents-manager';

export async function getAgentConfigsImpl(): Promise<
  Record<string, unknown>
> {
  const db = await readDb();
  return db.agents || {};
}

export async function getCategoryConfigsImpl(): Promise<
  Record<string, unknown>
> {
  const db = await readDb();
  return db.categories || {};
}

export async function updateAgentConfigImpl(
  agentKey: string,
  config: Record<string, unknown>,
): Promise<void> {
  await updateAgentInConfig(agentKey, config);
}

export async function updateCategoryConfigImpl(
  categoryKey: string,
  config: Record<string, unknown>,
): Promise<void> {
  await updateCategoryInConfig(categoryKey, config);
}

export async function deleteAgentConfigImpl(
  agentKey: string,
): Promise<void> {
  await deleteAgentFromConfig(agentKey);
}

export async function deleteCategoryConfigImpl(
  categoryKey: string,
): Promise<void> {
  await deleteCategoryFromConfig(categoryKey);
}
