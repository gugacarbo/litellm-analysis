import { createRepositoryClient } from "@lite-llm/agents-manager";
import {
  getRouterSettingsWithFallback,
  type ISettingsService,
  type RouterSettingsValue,
} from "@lite-llm/model-proxy-registry-service";
import {
  reconcileManagedAliases,
  sortAliasesByDefinitionOrder,
} from "@lite-llm/models-service";

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

export async function updateRouterAliasesInRegistry(
  settingsService: ISettingsService,
  modelGroupAlias: Record<string, string>,
): Promise<void> {
  const repository = createRepositoryClient();
  const config = await repository.read();
  const agentKeys = Object.keys(config.agents || {});
  const categoryKeys = Object.keys(config.categories || {});

  const existing =
    (await getRouterSettingsWithFallback(settingsService)) ??
    ({} as RouterSettingsValue);
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
    agentKeys,
    categoryKeys,
  );
  writeManagedAliasKeys(merged, managedAliasKeys);

  await settingsService.setRouterSettings(merged as RouterSettingsValue);
}
