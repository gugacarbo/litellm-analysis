import {
  getRouterSettings,
  type ISettingsService,
  type RouterSettingsValue,
} from "@lite-llm/model-proxy-config-service";
import {
  ANALYTICS_META_KEY,
  isRecord,
  MANAGED_ALIAS_KEYS_KEY,
  MANUAL_ALIAS_KEYS_KEY,
  readAnalyticsStringArray,
  writeAnalyticsStringArray,
} from "./router-settings";

export interface ManualModelAliasEntry {
  alias: string;
  targetModel: string;
}

function normalizeAliasKeys(aliasKeys: readonly string[]): string[] {
  return Array.from(
    new Set(
      aliasKeys
        .map((aliasKey) => aliasKey.trim())
        .filter((aliasKey) => aliasKey.length > 0),
    ),
  ).sort((left, right) => left.localeCompare(right));
}

function readRouterSettingsRecord(
  settings: RouterSettingsValue | null,
): Record<string, unknown> {
  return settings && isRecord(settings) ? { ...settings } : {};
}

function readAliasRecord(
  settings: Record<string, unknown>,
): Record<string, unknown> {
  const aliases = settings.model_group_alias;
  return isRecord(aliases) ? { ...aliases } : {};
}

function readManualAliasKeys(settings: Record<string, unknown>): string[] {
  const managedAliasKeys = new Set(
    normalizeAliasKeys(
      readAnalyticsStringArray(settings, MANAGED_ALIAS_KEYS_KEY),
    ),
  );
  return normalizeAliasKeys(
    readAnalyticsStringArray(settings, MANUAL_ALIAS_KEYS_KEY).filter(
      (aliasKey) => !managedAliasKeys.has(aliasKey),
    ),
  );
}

function readManualAliasMap(
  settings: Record<string, unknown>,
): Record<string, string> {
  const aliases = readAliasRecord(settings);
  const manualAliasMap: Record<string, string> = {};

  for (const aliasKey of readManualAliasKeys(settings)) {
    const targetModel = aliases[aliasKey];
    if (typeof targetModel === "string" && targetModel.length > 0) {
      manualAliasMap[aliasKey] = targetModel;
    }
  }

  return manualAliasMap;
}

function toEntries(aliasMap: Record<string, string>): ManualModelAliasEntry[] {
  return Object.entries(aliasMap)
    .map(([alias, targetModel]) => ({ alias, targetModel }))
    .sort((left, right) => left.alias.localeCompare(right.alias));
}

async function saveManualAliasMap(
  settingsService: ISettingsService,
  settings: Record<string, unknown>,
  nextManualAliasMap: Record<string, string>,
): Promise<void> {
  const existingAliases = readAliasRecord(settings);
  const previousManualAliasKeys = new Set(readManualAliasKeys(settings));
  const managedAliasKeys = new Set(
    normalizeAliasKeys(
      readAnalyticsStringArray(settings, MANAGED_ALIAS_KEYS_KEY),
    ),
  );
  const nextManualAliasKeys = normalizeAliasKeys(
    Object.keys(nextManualAliasMap),
  ).filter((aliasKey) => !managedAliasKeys.has(aliasKey));
  const mergedAliases = Object.fromEntries(
    Object.entries(existingAliases).filter(
      ([aliasKey]) => !previousManualAliasKeys.has(aliasKey),
    ),
  );

  for (const aliasKey of nextManualAliasKeys) {
    mergedAliases[aliasKey] = nextManualAliasMap[aliasKey];
  }

  settings.model_group_alias = mergedAliases;
  writeAnalyticsStringArray(
    settings,
    MANUAL_ALIAS_KEYS_KEY,
    nextManualAliasKeys,
  );

  const metadata = settings[ANALYTICS_META_KEY];
  if (isRecord(metadata) && Object.keys(metadata).length === 0) {
    delete settings[ANALYTICS_META_KEY];
  }

  await settingsService.setRouterSettings(settings as RouterSettingsValue);
}

export async function listManualModelAliases(
  settingsService: ISettingsService,
): Promise<ManualModelAliasEntry[]> {
  const settings = readRouterSettingsRecord(
    await getRouterSettings(settingsService),
  );
  return toEntries(readManualAliasMap(settings));
}

export async function listManualAliasesForTarget(
  settingsService: ISettingsService,
  targetModel: string,
): Promise<string[]> {
  return (await listManualModelAliases(settingsService))
    .filter((entry) => entry.targetModel === targetModel)
    .map((entry) => entry.alias);
}

export async function replaceManualAliasesForTarget(
  settingsService: ISettingsService,
  targetModel: string,
  aliases: string[],
): Promise<ManualModelAliasEntry[]> {
  const settings = readRouterSettingsRecord(
    await getRouterSettings(settingsService),
  );
  const manualAliasMap = readManualAliasMap(settings);
  const managedAliasKeys = new Set(
    normalizeAliasKeys(
      readAnalyticsStringArray(settings, MANAGED_ALIAS_KEYS_KEY),
    ),
  );
  const nextTargetAliases = normalizeAliasKeys(aliases).filter(
    (aliasKey) => !managedAliasKeys.has(aliasKey),
  );

  for (const [aliasKey, currentTarget] of Object.entries(manualAliasMap)) {
    if (currentTarget === targetModel) {
      delete manualAliasMap[aliasKey];
    }
  }

  for (const aliasKey of nextTargetAliases) {
    manualAliasMap[aliasKey] = targetModel;
  }

  await saveManualAliasMap(settingsService, settings, manualAliasMap);

  return toEntries(manualAliasMap);
}

export async function retargetManualAliases(
  settingsService: ISettingsService,
  previousModelName: string,
  nextModelName: string,
): Promise<void> {
  const settings = readRouterSettingsRecord(
    await getRouterSettings(settingsService),
  );
  const manualAliasMap = readManualAliasMap(settings);
  let changed = false;

  for (const aliasKey of Object.keys(manualAliasMap)) {
    if (manualAliasMap[aliasKey] === previousModelName) {
      manualAliasMap[aliasKey] = nextModelName;
      changed = true;
    }
  }

  if (!changed) {
    return;
  }

  await saveManualAliasMap(settingsService, settings, manualAliasMap);
}

export async function listBlockingManualAliases(
  settingsService: ISettingsService,
  targetModel: string,
): Promise<string[]> {
  return (await listManualModelAliases(settingsService))
    .filter((entry) => entry.targetModel === targetModel)
    .map((entry) => entry.alias);
}
