import { sql } from "drizzle-orm";
import { litellmDb } from "./client";

const DEFAULT_CREDENTIAL_SETTING_NAME = "default_credential";
export async function getDefaultCredential() {
  const result = await litellmDb.execute(
    sql`SELECT param_value FROM "LiteLLM_Config" WHERE param_name = ${DEFAULT_CREDENTIAL_SETTING_NAME} LIMIT 1`,
  );
  const row = result.rows[0];
  if (!row?.param_value) return null;
  const param = row.param_value;
  return param.default_credential || null;
}
export async function setDefaultCredential(credentialAlias) {
  if (credentialAlias === null) {
    // Remove the setting
    await litellmDb.execute(
      sql`DELETE FROM "LiteLLM_Config" WHERE param_name = ${DEFAULT_CREDENTIAL_SETTING_NAME}`,
    );
    return;
  }
  const setting = JSON.stringify({
    default_credential: credentialAlias,
  });
  await litellmDb.execute(sql`INSERT INTO "LiteLLM_Config" (param_name, param_value) VALUES (${DEFAULT_CREDENTIAL_SETTING_NAME}, ${setting})
      ON CONFLICT (param_name) DO UPDATE SET param_value = EXCLUDED.param_value`);
}
