import { prisma } from "./client";

const DEFAULT_CREDENTIAL_SETTING_NAME = "default_credential";

export async function getDefaultCredential(): Promise<string | null> {
  const result = await prisma.$queryRawUnsafe<Array<{ param_value: unknown }>>(`
    SELECT "param_value" FROM "LiteLLM_Config"
    WHERE "param_name" = '${DEFAULT_CREDENTIAL_SETTING_NAME}'
    LIMIT 1
  `);
  const row = result[0];
  if (!row?.param_value) return null;
  const param = row.param_value as Record<string, unknown>;
  return (param.default_credential as string) || null;
}

export async function setDefaultCredential(
  credentialAlias: string | null,
): Promise<void> {
  if (credentialAlias === null) {
    await prisma.$executeRawUnsafe(`
      DELETE FROM "LiteLLM_Config"
      WHERE "param_name" = '${DEFAULT_CREDENTIAL_SETTING_NAME}'
    `);
    return;
  }

  const setting = JSON.stringify({
    default_credential: credentialAlias,
  });

  await prisma.$executeRawUnsafe(`
    INSERT INTO "LiteLLM_Config" ("param_name", "param_value")
    VALUES ('${DEFAULT_CREDENTIAL_SETTING_NAME}', '${setting}'::jsonb)
    ON CONFLICT ("param_name") DO UPDATE SET "param_value" = EXCLUDED."param_value"
  `);
}
