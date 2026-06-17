export type AnalyticsDataSourceMode = "litellm" | "model-proxy" | "hybrid";

const DB_ENV_KEYS = [
  "DB_HOST",
  "DB_PORT",
  "DB_NAME",
  "DB_USER",
  "DB_PASSWORD",
] as const;

type DbEnvKey = (typeof DB_ENV_KEYS)[number];

export type AnalyticsDataSourceEnv = {
  ANALYTICS_DATA_SOURCE: AnalyticsDataSourceMode;
  MODEL_PROXY_DATABASE_URL?: string;
} & Partial<Record<DbEnvKey, string | number>>;

function getMissingDbEnvKeys(env: AnalyticsDataSourceEnv): DbEnvKey[] {
  return DB_ENV_KEYS.filter((key) => env[key] === undefined);
}

export function assertAnalyticsDataSourceEnv(
  env: AnalyticsDataSourceEnv,
): void {
  if (env.ANALYTICS_DATA_SOURCE === "model-proxy") {
    if (!env.MODEL_PROXY_DATABASE_URL) {
      throw new Error(
        "MODEL_PROXY_DATABASE_URL is required when ANALYTICS_DATA_SOURCE=model-proxy",
      );
    }
    return;
  }

  const missingDb = getMissingDbEnvKeys(env);
  if (missingDb.length > 0) {
    throw new Error(
      `${missingDb.join(", ")} required when ANALYTICS_DATA_SOURCE=${env.ANALYTICS_DATA_SOURCE}`,
    );
  }

  if (env.ANALYTICS_DATA_SOURCE === "hybrid" && !env.MODEL_PROXY_DATABASE_URL) {
    throw new Error(
      "MODEL_PROXY_DATABASE_URL is required when ANALYTICS_DATA_SOURCE=hybrid",
    );
  }
}
