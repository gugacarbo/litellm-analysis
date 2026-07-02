import { createRepositoryClient } from "@lite-llm/agents-manager";
import {
  getRouterSettings,
  type ISettingsService,
  type RouterSettingsValue,
} from "@lite-llm/model-proxy-config-service";
import {
  reconcileManagedAliases,
  sortAliasesByDefinitionOrder,
} from "@lite-llm/models-service";

export const ANALYTICS_META_KEY = "__lite_llm_analytics";
export const MANAGED_ALIAS_KEYS_KEY = "managedModelGroupAliasKeys";
export const MANUAL_ALIAS_KEYS_KEY = "manualModelAliasKeys";

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function readAnalyticsStringArray(
  settings: Record<string, unknown>,
  key: string,
): string[] {
  const metadata = settings[ANALYTICS_META_KEY];
  if (!isRecord(metadata)) {
    return [];
  }

  const values = metadata[key];
  if (!Array.isArray(values)) {
    return [];
  }

  return values.filter((item): item is string => typeof item === "string");
}

function readManagedAliasKeys(settings: Record<string, unknown>): string[] {
  return readAnalyticsStringArray(settings, MANAGED_ALIAS_KEYS_KEY);
}

export function writeAnalyticsStringArray(
  settings: Record<string, unknown>,
  key: string,
  values: readonly string[],
): void {
  const previous = settings[ANALYTICS_META_KEY];
  const metadata = isRecord(previous) ? { ...previous } : {};
  metadata[key] = [...values];
  settings[ANALYTICS_META_KEY] = metadata;
}

function writeManagedAliasKeys(
  settings: Record<string, unknown>,
  managedAliasKeys: readonly string[],
): void {
  writeAnalyticsStringArray(settings, MANAGED_ALIAS_KEYS_KEY, managedAliasKeys);
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
    (await getRouterSettings(settingsService)) ?? ({} as RouterSettingsValue);
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
