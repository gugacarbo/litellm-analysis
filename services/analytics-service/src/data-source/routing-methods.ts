import { createRepositoryClient } from "@lite-llm/agents-manager";
import type { Prisma } from "@lite-llm/model-proxy-repository";
import { getModelProxyPrisma } from "@lite-llm/model-proxy-repository";
import {
  reconcileManagedAliases,
  sortAliasesByDefinitionOrder,
} from "@lite-llm/models-service";

const ROUTER_SETTINGS_KEY = "router_settings";
const ANALYTICS_META_KEY = "__lite_llm_analytics";
const MANAGED_ALIAS_KEYS_KEY = "managedModelGroupAliasKeys";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readManagedAliasKeys(settings: Record<string, unknown>): string[] {
  const metadata = settings[ANALYTICS_META_KEY];
  if (!isRecord(metadata)) {
    return [];
  }

  const managedKeys = metadata[MANAGED_ALIAS_KEYS_KEY];
  if (!Array.isArray(managedKeys)) {
    return [];
  }

  return managedKeys.filter((item): item is string => typeof item === "string");
}

function writeManagedAliasKeys(
  settings: Record<string, unknown>,
  managedAliasKeys: readonly string[],
): void {
  const previous = settings[ANALYTICS_META_KEY];
  const metadata = isRecord(previous) ? { ...previous } : {};
  metadata[MANAGED_ALIAS_KEYS_KEY] = [...managedAliasKeys];
  settings[ANALYTICS_META_KEY] = metadata;
}

export async function getAgentRoutingConfigImpl(): Promise<Record<
  string,
  unknown
> | null> {
  const repository = createRepositoryClient();
  const config = await repository.read();

  const aliases: Record<string, string> = {};
  const agentKeys = Object.keys(config.agents || {});
  const categoryKeys = Object.keys(config.categories || {});

  const prisma = getModelProxyPrisma();
  const row = await prisma.modelProxySetting.findUnique({
    where: { key: ROUTER_SETTINGS_KEY },
  });
  if (row?.value && isRecord(row.value)) {
    const modelGroupAlias = row.value.model_group_alias;
    if (typeof modelGroupAlias === "object" && modelGroupAlias !== null) {
      Object.assign(aliases, modelGroupAlias as Record<string, string>);
    }
  }

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

  const prisma = getModelProxyPrisma();
  const existingRow = await prisma.modelProxySetting.findUnique({
    where: { key: ROUTER_SETTINGS_KEY },
  });
  const existing =
    existingRow?.value && isRecord(existingRow.value) ? existingRow.value : {};
  const merged: Record<string, unknown> = { ...existing };
  const existingAliases =
    typeof merged.model_group_alias === "object" &&
    merged.model_group_alias !== null
      ? ({ ...merged.model_group_alias } as Record<string, string>)
      : {};
  const previousManagedAliasKeys = readManagedAliasKeys(merged);
  const { aliases: reconciledAliases, managedAliasKeys } =
    reconcileManagedAliases(
      existingAliases,
      modelGroupAlias,
      previousManagedAliasKeys,
    );

  merged.model_group_alias = sortAliasesByDefinitionOrder(
    reconciledAliases,
    [...agentKeysSet],
    [...categoryKeysSet],
  );
  writeManagedAliasKeys(merged, managedAliasKeys);

  const jsonValue = merged as Prisma.InputJsonValue;
  await prisma.modelProxySetting.upsert({
    where: { key: ROUTER_SETTINGS_KEY },
    create: { key: ROUTER_SETTINGS_KEY, value: jsonValue },
    update: { value: jsonValue },
  });
}
