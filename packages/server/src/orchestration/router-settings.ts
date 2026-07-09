import {
  getRouterSettings,
  type ISettingsService,
  type RouterSettingsValue,
} from "@lite-llm/llm-config-service";

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
