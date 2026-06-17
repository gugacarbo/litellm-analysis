export type AnalyticsDataSourceEnv = {
  MODEL_PROXY_DATABASE_URL?: string;
};

export function assertAnalyticsDataSourceEnv(
  env: AnalyticsDataSourceEnv,
): void {
  if (!env.MODEL_PROXY_DATABASE_URL) {
    throw new Error("MODEL_PROXY_DATABASE_URL is required");
  }
}
