import { prisma } from "./client";

const HEALTH_CHECK_SETTINGS_NAME = "general_settings";

export async function getHealthCheckPrompt(): Promise<string | null> {
  const result = await prisma.$queryRawUnsafe<Array<{ param_value: unknown }>>(`
    SELECT "param_value" FROM "LiteLLM_Config"
    WHERE "param_name" = '${HEALTH_CHECK_SETTINGS_NAME}'
    LIMIT 1
  `);

  const row = result[0];
  if (!row?.param_value || typeof row.param_value !== "object") {
    return null;
  }

  const param = row.param_value as Record<string, unknown>;
  const prompt = param.health_check_prompt;
  if (typeof prompt !== "string") {
    return null;
  }

  const normalized = prompt.trim();
  return normalized ? normalized : null;
}
