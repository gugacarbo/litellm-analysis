import { sortAliasesByDefinitionOrder } from "@lite-llm/alias-router";
import { sql } from "drizzle-orm";
import { litellmDb } from "./client";
export async function getRouterSettings() {
  const result = await litellmDb.execute(
    sql`SELECT param_value FROM "LiteLLM_Config" WHERE param_name = 'router_settings' LIMIT 1`,
  );
  const row = result.rows[0];
  return row?.param_value ? row.param_value : null;
}
export async function updateRouterSettings(modelGroupAlias) {
  const existing = await getRouterSettings();
  const merged = existing ? { ...existing } : {};
  const existingAliases =
    typeof merged.model_group_alias === "object" &&
    merged.model_group_alias !== null
      ? { ...merged.model_group_alias }
      : {};
  for (const [key, value] of Object.entries(modelGroupAlias)) {
    if (value === "") {
      delete existingAliases[key];
    } else {
      existingAliases[key] = value;
    }
  }
  merged.model_group_alias = sortAliasesByDefinitionOrder(existingAliases);
  await litellmDb.execute(sql`INSERT INTO "LiteLLM_Config" (param_name, param_value) VALUES ('router_settings', ${JSON.stringify(merged)})
			ON CONFLICT (param_name) DO UPDATE SET param_value = EXCLUDED.param_value`);
}
