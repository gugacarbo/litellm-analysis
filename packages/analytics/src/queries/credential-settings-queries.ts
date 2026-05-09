import { sql } from "drizzle-orm";
import { litellmDb } from "./client";

const DEFAULT_CREDENTIAL_SETTING_NAME = "default_credential";

interface DefaultCredentialSetting {
  defaultCredential: string | null;
}

export async function getDefaultCredential(): Promise<string | null> {
  const result = await litellmDb.execute(
    sql`SELECT param_value FROM "LiteLLM_Config" WHERE param_name = ${DEFAULT_CREDENTIAL_SETTING_NAME} LIMIT 1`,
  );
  const row = result.rows[0] as { param_value: unknown } | undefined;
  if (!row?.param_value) return null;
  const param = row.param_value as Record<string, unknown>;
  return (param.default_credential as string) || null;
}

export async function setDefaultCredential(
  credentialAlias: string | null,
): Promise<void> {
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

  await litellmDb.execute(
    sql`INSERT INTO "LiteLLM_Config" (param_name, param_value) VALUES (${DEFAULT_CREDENTIAL_SETTING_NAME}, ${setting})
      ON CONFLICT (param_name) DO UPDATE SET param_value = EXCLUDED.param_value`,
  );
}
