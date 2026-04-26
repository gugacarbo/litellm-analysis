import { sql } from "drizzle-orm";
import { sortAliasesByDefinitionOrder } from "../../services/alias-generator.js";
import { db } from "../client";

export async function getRouterSettings(): Promise<Record<
  string,
  unknown
> | null> {
  const result = await db.execute(
    sql`SELECT param_value FROM "LiteLLM_Config" WHERE param_name = 'router_settings' LIMIT 1`,
  );
  const row = result.rows[0] as { param_value: unknown } | undefined;
  return row?.param_value ? (row.param_value as Record<string, unknown>) : null;
}

export async function updateRouterSettings(
  modelGroupAlias: Record<string, string>,
): Promise<void> {
  const existing = await getRouterSettings();
  const merged: Record<string, unknown> = existing ? { ...existing } : {};
  const existingAliases =
    typeof merged.model_group_alias === "object" &&
    merged.model_group_alias !== null
      ? ({ ...merged.model_group_alias } as Record<string, string>)
      : {};

  // Empty string signals deletion
  for (const [key, value] of Object.entries(modelGroupAlias)) {
    if (value === "") {
      delete existingAliases[key];
    } else {
      existingAliases[key] = value;
    }
  }
  merged.model_group_alias = sortAliasesByDefinitionOrder(existingAliases);

  await db.execute(
    sql`INSERT INTO "LiteLLM_Config" (param_name, param_value) VALUES ('router_settings', ${JSON.stringify(merged)})
			ON CONFLICT (param_name) DO UPDATE SET param_value = EXCLUDED.param_value`,
  );
}
