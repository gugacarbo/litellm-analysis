import { createRepositoryClient } from "@lite-llm/agents-manager";
import { sortAliasesByDefinitionOrder } from "@lite-llm/models-service";
import { getRouterSettings, updateRouterSettings } from "../queries/index";

export async function getAgentRoutingConfigImpl(): Promise<Record<
  string,
  unknown
> | null> {
  const repository = createRepositoryClient();
  const config = await repository.read();

  const aliases: Record<string, string> = {};

  // Agent/category keys in definition order
  const agentKeys = Object.keys(config.agents || {});
  const categoryKeys = Object.keys(config.categories || {});

  // Read existing aliases from LiteLLM_Config (router_settings)
  try {
    const routerSettings = await getRouterSettings();
    const modelGroupAlias = routerSettings?.model_group_alias;
    if (typeof modelGroupAlias === "object" && modelGroupAlias !== null) {
      Object.assign(aliases, modelGroupAlias as Record<string, string>);
    }
  } catch {
    // If LiteLLM_Config table does not exist or query fails,
    // continue without it
  }

  // Sort aliases by definition order
  const sortedAliases = sortAliasesByDefinitionOrder(
    aliases,
    agentKeys,
    categoryKeys,
  );

  return { model_group_alias: sortedAliases };
}

export async function updateAgentRoutingConfigImpl(
  modelGroupAlias: Record<string, string>,
): Promise<void> {
  const repository = createRepositoryClient();
  const config = await repository.read();

  const agentKeysSet = new Set(Object.keys(config.agents || {}));
  const categoryKeysSet = new Set(Object.keys(config.categories || {}));

  await repository.write(config);

  // Also write to LiteLLM_Config table
  await updateRouterSettings(
    modelGroupAlias,
    [...agentKeysSet],
    [...categoryKeysSet],
  );
}
