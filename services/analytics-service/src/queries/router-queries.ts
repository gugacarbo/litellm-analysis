import {
  reconcileManagedAliases,
  sortAliasesByDefinitionOrder,
} from "@lite-llm/models-service";
import { prisma } from "./client";

const ANALYTICS_META_KEY = "__lite_llm_analytics";
const MANAGED_ALIAS_KEYS_KEY = "managedModelGroupAliasKeys";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
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

export async function getRouterSettings(): Promise<Record<
  string,
  unknown
> | null> {
  const result = await prisma.$queryRawUnsafe<Array<{ param_value: unknown }>>(`
    SELECT "param_value" FROM "LiteLLM_Config"
    WHERE "param_name" = 'router_settings'
    LIMIT 1
  `);
  const row = result[0];
  return row?.param_value ? (row.param_value as Record<string, unknown>) : null;
}

export async function updateRouterSettings(
  modelGroupAlias: Record<string, string>,
  agentKeys: readonly string[] = [],
  categoryKeys: readonly string[] = [],
): Promise<void> {
  const existing = await getRouterSettings();
  const merged: Record<string, unknown> = existing ? { ...existing } : {};
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

  await prisma.$executeRawUnsafe(`
    INSERT INTO "LiteLLM_Config" ("param_name", "param_value")
    VALUES ('router_settings', '${JSON.stringify(merged)}'::jsonb)
    ON CONFLICT ("param_name") DO UPDATE SET "param_value" = EXCLUDED."param_value"
  `);
}
